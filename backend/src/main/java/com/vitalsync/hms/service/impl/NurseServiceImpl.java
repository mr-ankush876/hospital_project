package com.vitalsync.hms.service.impl;

import com.vitalsync.hms.dto.CreateNurseRequest;
import com.vitalsync.hms.dto.NurseDto;
import com.vitalsync.hms.dto.UpdateNurseRequest;
import com.vitalsync.hms.entity.Department;
import com.vitalsync.hms.entity.Nurse;
import com.vitalsync.hms.entity.User;
import com.vitalsync.hms.exception.BadRequestException;
import com.vitalsync.hms.exception.ConflictException;
import com.vitalsync.hms.exception.ResourceNotFoundException;
import com.vitalsync.hms.repository.DepartmentRepository;
import com.vitalsync.hms.repository.NurseRepository;
import com.vitalsync.hms.repository.UserRepository;
import com.vitalsync.hms.service.AuditLogService;
import com.vitalsync.hms.service.NurseService;
import com.vitalsync.hms.service.PhoneValidationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NurseServiceImpl implements NurseService {

    private final NurseRepository nurseRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;
    private final PhoneValidationService phoneValidationService;

    @Override
    @Transactional(readOnly = true)
    public List<NurseDto> getAllNurses(Long departmentId, String status, String shift, String search) {
        String cleanStatus = (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) ? status.trim() : null;
        String cleanShift = (shift != null && !shift.trim().isEmpty() && !"ALL".equalsIgnoreCase(shift)) ? shift.trim() : null;
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        return nurseRepository.searchNurses(departmentId, cleanStatus, cleanShift, cleanSearch)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NurseDto> getAllNursesPaged(Long departmentId, String status, String shift, String search, Pageable pageable) {
        String cleanStatus = (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) ? status.trim() : null;
        String cleanShift = (shift != null && !shift.trim().isEmpty() && !"ALL".equalsIgnoreCase(shift)) ? shift.trim() : null;
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        return nurseRepository.searchNursesPaged(departmentId, cleanStatus, cleanShift, cleanSearch, pageable)
                .map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public NurseDto getNurseById(Long id) {
        Nurse nurse = nurseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nurse profile not found with ID: " + id));
        return mapToDto(nurse);
    }

    @Override
    @Transactional
    public NurseDto createNurse(CreateNurseRequest request, String adminUsername) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        String username = request.getUsername() != null ? request.getUsername().trim() : "";

        if (userRepository.existsByUsername(username)) {
            throw new ConflictException("Username '" + username + "' is already registered.");
        }
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email '" + email + "' is already registered.");
        }
        if (nurseRepository.existsByEmail(email)) {
            throw new ConflictException("Nurse profile already exists for email: " + email);
        }

        String validatedPhone = phoneValidationService.validateAndNormalize(request.getPhone());

        // 1. Create linked User account with ROLE_NURSE
        User user = User.builder()
                .username(username)
                .password(passwordEncoder.encode(request.getPassword()))
                .email(email)
                .fullName(request.getFullName().trim())
                .phone(validatedPhone)
                .role("NURSE")
                .status("ACTIVE")
                .build();

        User savedUser = userRepository.save(user);

        // 2. Generate Nurse Code NUR-XXXX
        long count = nurseRepository.count();
        String nurseCode = String.format("NUR-%04d", 3000 + count + 1);

        Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId()).orElse(null);
        }

        // 3. Create Nurse Profile
        Nurse nurse = Nurse.builder()
                .nurseCode(nurseCode)
                .user(savedUser)
                .department(department)
                .fullName(request.getFullName().trim())
                .email(email)
                .phone(validatedPhone)
                .dob(request.getDob())
                .gender(request.getGender() != null ? request.getGender() : "Female")
                .bloodGroup(request.getBloodGroup() != null ? request.getBloodGroup() : "O+")
                .address(request.getAddress())
                .qualification(request.getQualification() != null ? request.getQualification() : "B.Sc Nursing")
                .experience(request.getExperience() != null ? request.getExperience() : "3 Years")
                .licenseNumber(request.getLicenseNumber() != null ? request.getLicenseNumber() : "RN-" + (100000 + count + 1))
                .joiningDate(request.getJoiningDate() != null ? request.getJoiningDate() : LocalDate.now())
                .shift(request.getShift() != null ? request.getShift() : "Day Shift")
                .status("Active")
                .build();

        Nurse savedNurse = nurseRepository.save(nurse);

        auditLogService.logAction(adminUsername, "ADMIN", "CREATE_NURSE", "Nurse", savedNurse.getId().toString(),
                "Admin created nurse account and profile for " + savedNurse.getFullName() + " (" + nurseCode + ")", null);

        return mapToDto(savedNurse);
    }

    @Override
    @Transactional
    public NurseDto updateNurse(Long id, UpdateNurseRequest request, String adminUsername) {
        Nurse nurse = nurseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nurse profile not found with ID: " + id));

        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            nurse.setFullName(request.getFullName().trim());
        }
        if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
            nurse.setPhone(phoneValidationService.validateAndNormalize(request.getPhone()));
        }
        if (request.getDob() != null) {
            nurse.setDob(request.getDob());
        }
        if (request.getGender() != null) {
            nurse.setGender(request.getGender());
        }
        if (request.getBloodGroup() != null) {
            nurse.setBloodGroup(request.getBloodGroup());
        }
        if (request.getAddress() != null) {
            nurse.setAddress(request.getAddress());
        }
        if (request.getQualification() != null) {
            nurse.setQualification(request.getQualification());
        }
        if (request.getExperience() != null) {
            nurse.setExperience(request.getExperience());
        }
        if (request.getLicenseNumber() != null) {
            nurse.setLicenseNumber(request.getLicenseNumber());
        }
        if (request.getJoiningDate() != null) {
            nurse.setJoiningDate(request.getJoiningDate());
        }
        if (request.getShift() != null) {
            nurse.setShift(request.getShift());
        }
        if (request.getStatus() != null) {
            nurse.setStatus(request.getStatus());
        }

        if (request.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(request.getDepartmentId()).orElse(null);
            nurse.setDepartment(dept);
        }

        Nurse savedNurse = nurseRepository.save(nurse);

        // Sync linked user account
        if (nurse.getUser() != null) {
            User user = nurse.getUser();
            user.setFullName(savedNurse.getFullName());
            user.setPhone(savedNurse.getPhone());
            if ("Active".equalsIgnoreCase(savedNurse.getStatus())) {
                user.setStatus("ACTIVE");
            } else if ("Inactive".equalsIgnoreCase(savedNurse.getStatus())) {
                user.setStatus("INACTIVE");
            }
            if (request.getPassword() != null && request.getPassword().length() >= 6) {
                user.setPassword(passwordEncoder.encode(request.getPassword()));
            }
            userRepository.save(user);
        }

        auditLogService.logAction(adminUsername, "ADMIN", "UPDATE_NURSE", "Nurse", savedNurse.getId().toString(),
                "Admin updated nurse profile for " + savedNurse.getFullName(), null);

        return mapToDto(savedNurse);
    }

    @Override
    @Transactional
    public NurseDto updateNurseStatus(Long id, String status, String adminUsername) {
        Nurse nurse = nurseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nurse profile not found with ID: " + id));

        nurse.setStatus(status);
        Nurse savedNurse = nurseRepository.save(nurse);

        if (nurse.getUser() != null) {
            User user = nurse.getUser();
            if ("Active".equalsIgnoreCase(status)) {
                user.setStatus("ACTIVE");
            } else {
                user.setStatus("INACTIVE");
            }
            userRepository.save(user);
        }

        auditLogService.logAction(adminUsername, "ADMIN", "UPDATE_NURSE_STATUS", "Nurse", savedNurse.getId().toString(),
                "Admin updated nurse status of " + savedNurse.getFullName() + " to " + status, null);

        return mapToDto(savedNurse);
    }

    @Override
    @Transactional
    public void deleteNurse(Long id, String adminUsername) {
        Nurse nurse = nurseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nurse profile not found with ID: " + id));

        User user = nurse.getUser();
        nurseRepository.delete(nurse);
        if (user != null) {
            userRepository.delete(user);
        }

        auditLogService.logAction(adminUsername, "ADMIN", "DELETE_NURSE", "Nurse", id.toString(),
                "Admin deleted nurse account and profile " + nurse.getNurseCode(), null);
    }

    private NurseDto mapToDto(Nurse n) {
        return NurseDto.builder()
                .id(n.getId())
                .nurseCode(n.getNurseCode())
                .userId(n.getUser() != null ? n.getUser().getId() : null)
                .username(n.getUser() != null ? n.getUser().getUsername() : null)
                .departmentId(n.getDepartment() != null ? n.getDepartment().getId() : null)
                .departmentName(n.getDepartment() != null ? n.getDepartment().getName() : "General Nursing")
                .fullName(n.getFullName())
                .email(n.getEmail())
                .phone(n.getPhone())
                .dob(n.getDob())
                .gender(n.getGender())
                .bloodGroup(n.getBloodGroup())
                .address(n.getAddress())
                .qualification(n.getQualification())
                .experience(n.getExperience())
                .licenseNumber(n.getLicenseNumber())
                .joiningDate(n.getJoiningDate())
                .shift(n.getShift())
                .status(n.getStatus())
                .createdAt(n.getCreatedAt())
                .updatedAt(n.getUpdatedAt())
                .build();
    }
}
