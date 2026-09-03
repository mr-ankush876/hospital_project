package com.vitalsync.hms.service.impl;

import com.vitalsync.hms.dto.*;
import com.vitalsync.hms.entity.PasswordResetToken;
import com.vitalsync.hms.entity.Patient;
import com.vitalsync.hms.entity.User;
import com.vitalsync.hms.exception.BadRequestException;
import com.vitalsync.hms.exception.ConflictException;
import com.vitalsync.hms.exception.ForbiddenException;
import com.vitalsync.hms.exception.ResourceNotFoundException;
import com.vitalsync.hms.repository.PasswordResetTokenRepository;
import com.vitalsync.hms.repository.PatientRepository;
import com.vitalsync.hms.repository.UserRepository;
import com.vitalsync.hms.security.JwtUtil;
import com.vitalsync.hms.service.AuditLogService;
import com.vitalsync.hms.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;
    private final com.vitalsync.hms.service.PhoneValidationService phoneValidationService;

    @Override
    @Transactional
    public AuthResponse login(AuthRequest request) {
        String identifier = request.getUsername() != null ? request.getUsername().trim() : "";
        String rawPassword = request.getPassword() != null ? request.getPassword() : "";

        // Resolve user by username or email (case-insensitive)
        User user = userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier))
                .or(() -> userRepository.findByUsernameIgnoreCase(identifier))
                .or(() -> userRepository.findByEmailIgnoreCase(identifier))
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username or email: " + identifier));

        // Authenticate with real password verification via Spring Security using canonical username
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        user.getUsername(),
                        rawPassword
                )
        );

        // Check account status
        if ("INACTIVE".equalsIgnoreCase(user.getStatus()) || "SUSPENDED".equalsIgnoreCase(user.getStatus())) {
            throw new ForbiddenException("Account is " + user.getStatus() + ". Please contact hospital administration.");
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

        auditLogService.logAction(user.getUsername(), user.getRole(), "USER_LOGIN", "User", user.getId().toString(),
                "Successful authentication from " + user.getUsername(), null);

        UserDto userDto = UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole())
                .status(user.getStatus())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();

        return AuthResponse.builder()
                .token(token)
                .user(userDto)
                .build();
    }

    @Override
    @Transactional
    public AuthResponse registerPatient(RegisterPatientRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ConflictException("Username is already taken. Please choose another username.");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email is already registered. Please sign in or use another email.");
        }

        // Security enforcement: ALWAYS force role = PATIENT regardless of request
        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .fullName(request.getFullName())
                .phone(phoneValidationService.validateAndNormalize(request.getPhone()))
                .role("PATIENT")
                .status("ACTIVE")
                .lastLoginAt(LocalDateTime.now())
                .build();

        User savedUser = userRepository.save(user);

        // Generate patient code PT-XXXX
        long count = patientRepository.count();
        String patientCode = String.format("PT-%04d", 1000 + count + 1);

        LocalDate dob = request.getDob() != null ? request.getDob() : LocalDate.of(1995, 1, 1);
        int age = request.getAge() != null ? request.getAge() : Period.between(dob, LocalDate.now()).getYears();
        if (age <= 0) age = 25;

        String validatedPhone = phoneValidationService.validateAndNormalize(request.getPhone());
        String validatedEmergencyContact = validatedPhone;
        if (request.getEmergencyContact() != null && !request.getEmergencyContact().trim().isEmpty()) {
            try {
                validatedEmergencyContact = phoneValidationService.validateAndNormalize(request.getEmergencyContact());
            } catch (Exception ignored) {
                validatedEmergencyContact = validatedPhone;
            }
        }

        Patient patient = Patient.builder()
                .patientCode(patientCode)
                .user(savedUser)
                .fullName(request.getFullName())
                .dob(dob)
                .age(age)
                .gender(request.getGender() != null ? request.getGender() : "Not Specified")
                .bloodGroup(request.getBloodGroup() != null ? request.getBloodGroup() : "O+")
                .phone(validatedPhone)
                .email(request.getEmail())
                .address(request.getAddress() != null && !request.getAddress().trim().isEmpty() ? request.getAddress() : "Hospital Region")
                .emergencyContact(validatedEmergencyContact)
                .medicalHistory(request.getMedicalHistory())
                .allergies(request.getAllergies())
                .status("Active")
                .build();

        patientRepository.save(patient);

        String token = jwtUtil.generateToken(savedUser.getUsername(), savedUser.getRole());

        auditLogService.logAction(savedUser.getUsername(), "PATIENT", "PATIENT_REGISTER", "Patient", patient.getId().toString(),
                "New patient self-registered: " + savedUser.getUsername() + " (" + patientCode + ")", null);

        UserDto userDto = UserDto.builder()
                .id(savedUser.getId())
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .fullName(savedUser.getFullName())
                .phone(savedUser.getPhone())
                .role(savedUser.getRole())
                .status(savedUser.getStatus())
                .lastLoginAt(savedUser.getLastLoginAt())
                .createdAt(savedUser.getCreatedAt())
                .updatedAt(savedUser.getUpdatedAt())
                .build();

        return AuthResponse.builder()
                .token(token)
                .user(userDto)
                .build();
    }

    @Override
    @Transactional
    public Map<String, String> forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("No account registered with email: " + request.getEmail()));

        String tokenString = UUID.randomUUID().toString().replace("-", "") + System.currentTimeMillis();

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(tokenString)
                .user(user)
                .expiryDate(LocalDateTime.now().plusMinutes(30))
                .used(false)
                .build();

        passwordResetTokenRepository.save(resetToken);

        auditLogService.logAction(user.getUsername(), user.getRole(), "FORGOT_PASSWORD_REQUEST", "PasswordResetToken",
                resetToken.getId().toString(), "Password reset requested for email " + user.getEmail(), null);

        return Map.of(
                "message", "Password reset instructions generated successfully. Token is valid for 30 minutes.",
                "resetToken", tokenString
        );
    }

    @Override
    @Transactional
    public Map<String, String> resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenAndUsedFalse(request.getToken())
                .orElseThrow(() -> new BadRequestException("Invalid or already used password reset token"));

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Password reset token has expired. Please request a new reset link.");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        auditLogService.logAction(user.getUsername(), user.getRole(), "PASSWORD_RESET_SUCCESS", "User",
                user.getId().toString(), "Password reset successfully completed for user " + user.getUsername(), null);

        return Map.of("message", "Password has been reset successfully. You can now login with your new password.");
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));

        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole())
                .status(user.getStatus())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
