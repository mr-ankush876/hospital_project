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
import com.vitalsync.hms.repository.NurseRepository;
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
    private final com.vitalsync.hms.service.PhoneValidationService phoneValidationService;

    private final NurseRepository nurseRepository;

    private static final List<String> VALID_STATUSES = Arrays.asList("ACTIVE", "INACTIVE", "PENDING", "SUSPENDED");
    private static final List<String> VALID_ROLES = Arrays.asList("ADMIN", "DOCTOR", "RECEPTIONIST", "NURSE", "PATIENT");

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
        if (!Arrays.asList("DOCTOR", "RECEPTIONIST", "NURSE", "ADMIN").contains(role)) {
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
                .phone(phoneValidationService.validateAndNormalize(request.getPhone()))
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
                    .phone(phoneValidationService.validateAndNormalize(request.getPhone()))
                    .specialization(request.getSpecialization() != null ? request.getSpecialization() : "General Medicine")
                    .qualification(request.getQualification() != null ? request.getQualification() : "MD / MBBS")
                    .experience(request.getExperience() != null ? request.getExperience() : "5 Years")
                    .availableDays(request.getAvailableDays() != null ? request.getAvailableDays() : "Mon - Fri")
                    .availableTime(request.getAvailableTime() != null ? request.getAvailableTime() : "09:00 AM - 05:00 PM")
                    .consultationFee(request.getConsultationFee() != null ? request.getConsultationFee() : new BigDecimal("100.00"))
                    .status("Available")
                    .build();

            doctorRepository.save(doctor);
        } else if ("NURSE".equals(role)) {
            long count = nurseRepository.count();
            String nurseCode = String.format("NUR-%04d", 3000 + count + 1);

            Department department = null;
            if (request.getDepartmentId() != null) {
                department = departmentRepository.findById(request.getDepartmentId()).orElse(null);
            }

            com.vitalsync.hms.entity.Nurse nurse = com.vitalsync.hms.entity.Nurse.builder()
                    .nurseCode(nurseCode)
                    .user(savedUser)
                    .department(department)
                    .fullName(request.getFullName())
                    .email(request.getEmail())
                    .phone(phoneValidationService.validateAndNormalize(request.getPhone()))
                    .qualification("B.Sc Nursing")
                    .experience("3 Years")
                    .licenseNumber("RN-" + (100000 + count + 1))
                    .joiningDate(java.time.LocalDate.now())
                    .shift("Day Shift")
                    .status("Active")
                    .build();

            nurseRepository.save(nurse);
        }

        auditLogService.logAction(adminUsername, "ADMIN", "CREATE_STAFF_ACCOUNT", "User", savedUser.getId().toString(),
                "Admin created staff account " + savedUser.getUsername() + " with role " + role, null);

        return mapToDto(savedUser);
    }

    @Override
    @Transactional
    public UserDto updateUser(Long id, java.util.Map<String, Object> updates, String adminUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));

        if (updates.containsKey("fullName") && updates.get("fullName") != null) {
            user.setFullName(updates.get("fullName").toString().trim());
        }

        if (updates.containsKey("username") && updates.get("username") != null) {
            String newUsername = updates.get("username").toString().trim();
            if (!newUsername.equalsIgnoreCase(user.getUsername())) {
                if (userRepository.existsByUsername(newUsername)) {
                    throw new BadRequestException("Username '" + newUsername + "' is already taken");
                }
                user.setUsername(newUsername);
            }
        }

        if (updates.containsKey("email") && updates.get("email") != null) {
            String newEmail = updates.get("email").toString().trim();
            if (!newEmail.equalsIgnoreCase(user.getEmail())) {
                if (userRepository.existsByEmail(newEmail)) {
                    throw new BadRequestException("Email '" + newEmail + "' is already registered");
                }
                user.setEmail(newEmail);
            }
        }

        if (updates.containsKey("phone") && updates.get("phone") != null) {
            String rawPhone = updates.get("phone").toString().trim();
            if (!rawPhone.isEmpty()) {
                user.setPhone(phoneValidationService.validateAndNormalize(rawPhone));
            } else {
                user.setPhone(null);
            }
        }

        if (updates.containsKey("role") && updates.get("role") != null) {
            String newRole = updates.get("role").toString().trim().toUpperCase();
            if (VALID_ROLES.contains(newRole)) {
                user.setRole(newRole);
            }
        }

        if (updates.containsKey("status") && updates.get("status") != null) {
            String newStatus = updates.get("status").toString().trim().toUpperCase();
            if (VALID_STATUSES.contains(newStatus)) {
                user.setStatus(newStatus);
            }
        }

        if (updates.containsKey("password") && updates.get("password") != null) {
            String newPassword = updates.get("password").toString();
            if (newPassword.length() >= 6) {
                user.setPassword(passwordEncoder.encode(newPassword));
            }
        }

        User saved = userRepository.save(user);

        // Sync linked doctor if applicable
        if ("DOCTOR".equalsIgnoreCase(saved.getRole())) {
            doctorRepository.findByUserId(saved.getId()).ifPresent(doc -> {
                doc.setPhone(saved.getPhone());
                doc.setFullName(saved.getFullName());
                doc.setEmail(saved.getEmail());
                doctorRepository.save(doc);
            });
        }

        auditLogService.logAction(adminUsername, "ADMIN", "UPDATE_USER_ACCOUNT", "User", saved.getId().toString(),
                "Admin updated account details for " + saved.getUsername(), null);

        return mapToDto(saved);
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
