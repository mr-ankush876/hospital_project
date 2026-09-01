package com.vitalsync.hms.service.impl;

import com.vitalsync.hms.dto.CreateStaffRequest;
import com.vitalsync.hms.dto.UserDto;
import com.vitalsync.hms.entity.Department;
import com.vitalsync.hms.entity.Doctor;
import com.vitalsync.hms.entity.User;
import com.vitalsync.hms.exception.BadRequestException;
import com.vitalsync.hms.exception.ConflictException;
import com.vitalsync.hms.exception.ResourceNotFoundException;
import com.vitalsync.hms.repository.DepartmentRepository;
import com.vitalsync.hms.repository.DoctorRepository;
import com.vitalsync.hms.repository.UserRepository;
import com.vitalsync.hms.service.AuditLogService;
import com.vitalsync.hms.service.UserManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserManagementServiceImpl implements UserManagementService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    private static final List<String> VALID_STATUSES = Arrays.asList("ACTIVE", "INACTIVE", "PENDING", "SUSPENDED");

    @Override
    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers(String role, String status, String search) {
        String cleanRole = (role != null && !role.trim().isEmpty() && !"ALL".equalsIgnoreCase(role)) ? role.trim().toUpperCase() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) ? status.trim().toUpperCase() : null;
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        return userRepository.searchUsers(cleanRole, cleanStatus, cleanSearch)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserDto> getAllUsersPaged(String role, String status, String search, Pageable pageable) {
        String cleanRole = (role != null && !role.trim().isEmpty() && !"ALL".equalsIgnoreCase(role)) ? role.trim().toUpperCase() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) ? status.trim().toUpperCase() : null;
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        return userRepository.searchUsersPaged(cleanRole, cleanStatus, cleanSearch, pageable)
                .map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));
        return mapToDto(user);
    }

    @Override
    @Transactional
    public UserDto createStaffAccount(CreateStaffRequest request, String adminUsername) {
        String role = request.getRole() != null ? request.getRole().toUpperCase() : "DOCTOR";
        if (!Arrays.asList("DOCTOR", "RECEPTIONIST", "ADMIN").contains(role)) {
            throw new BadRequestException("Invalid staff role: " + role);
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ConflictException("Username is already taken: " + request.getUsername());
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email is already registered: " + request.getEmail());
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(role)
                .status("ACTIVE")
                .build();

        User savedUser = userRepository.save(user);

        // If creating a DOCTOR, automatically create linked Doctor entity
        if ("DOCTOR".equals(role)) {
            long count = doctorRepository.count();
            String docCode = String.format("DOC-%04d", 2000 + count + 1);

            Department department = null;
            if (request.getDepartmentId() != null) {
                department = departmentRepository.findById(request.getDepartmentId()).orElse(null);
            }

            Doctor doctor = Doctor.builder()
                    .doctorCode(docCode)
                    .user(savedUser)
                    .department(department)
                    .fullName(request.getFullName())
                    .email(request.getEmail())
                    .phone(request.getPhone())
                    .specialization(request.getSpecialization() != null ? request.getSpecialization() : "General Medicine")
                    .qualification(request.getQualification() != null ? request.getQualification() : "MD / MBBS")
                    .experience(request.getExperience() != null ? request.getExperience() : "5 Years")
                    .availableDays(request.getAvailableDays() != null ? request.getAvailableDays() : "Mon - Fri")
                    .availableTime(request.getAvailableTime() != null ? request.getAvailableTime() : "09:00 AM - 05:00 PM")
                    .consultationFee(request.getConsultationFee() != null ? request.getConsultationFee() : new BigDecimal("100.00"))
                    .status("Available")
                    .build();

            doctorRepository.save(doctor);
        }

        auditLogService.logAction(adminUsername, "ADMIN", "CREATE_STAFF_ACCOUNT", "User", savedUser.getId().toString(),
                "Admin created staff account " + savedUser.getUsername() + " with role " + role, null);

        return mapToDto(savedUser);
    }

    @Override
    @Transactional
    public UserDto updateUserStatus(Long id, String status, String adminUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));

        String upperStatus = status.toUpperCase();
        if (!VALID_STATUSES.contains(upperStatus)) {
            throw new BadRequestException("Invalid user status: " + status + ". Allowed: " + VALID_STATUSES);
        }

        user.setStatus(upperStatus);
        User saved = userRepository.save(user);

        auditLogService.logAction(adminUsername, "ADMIN", "UPDATE_USER_STATUS", "User", saved.getId().toString(),
                "Admin changed account status of " + saved.getUsername() + " to " + upperStatus, null);

        return mapToDto(saved);
    }

    @Override
    @Transactional
    public void resetUserPassword(Long id, String newPassword, String adminUsername) {
        if (newPassword == null || newPassword.length() < 6) {
            throw new BadRequestException("Password must be at least 6 characters long");
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        auditLogService.logAction(adminUsername, "ADMIN", "RESET_USER_PASSWORD", "User", user.getId().toString(),
                "Admin reset password for user " + user.getUsername(), null);
    }

    private UserDto mapToDto(User u) {
        return UserDto.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .phone(u.getPhone())
                .role(u.getRole())
                .status(u.getStatus())
                .lastLoginAt(u.getLastLoginAt())
                .createdAt(u.getCreatedAt())
                .updatedAt(u.getUpdatedAt())
                .build();
    }
}
