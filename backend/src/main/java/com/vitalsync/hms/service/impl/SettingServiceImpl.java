package com.vitalsync.hms.service.impl;

import com.vitalsync.hms.dto.ChangePasswordRequest;
import com.vitalsync.hms.dto.HospitalSettingDto;
import com.vitalsync.hms.dto.UserDto;
import com.vitalsync.hms.dto.UserProfileUpdateRequest;
import com.vitalsync.hms.entity.HospitalSetting;
import com.vitalsync.hms.entity.User;
import com.vitalsync.hms.exception.BadRequestException;
import com.vitalsync.hms.exception.ResourceNotFoundException;
import com.vitalsync.hms.repository.HospitalSettingRepository;
import com.vitalsync.hms.repository.UserRepository;
import com.vitalsync.hms.service.SettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SettingServiceImpl implements SettingService {

    private final HospitalSettingRepository hospitalSettingRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public HospitalSettingDto getHospitalProfile() {
        HospitalSetting setting = hospitalSettingRepository.findFirstByOrderByIdAsc()
                .orElseGet(() -> {
                    HospitalSetting defaultSetting = new HospitalSetting();
                    return hospitalSettingRepository.save(defaultSetting);
                });

        return mapToDto(setting);
    }

    @Override
    @Transactional
    public HospitalSettingDto updateHospitalProfile(HospitalSettingDto dto) {
        HospitalSetting setting = hospitalSettingRepository.findFirstByOrderByIdAsc()
                .orElseGet(HospitalSetting::new);

        setting.setHospitalName(dto.getHospitalName());
        setting.setPhone(dto.getPhone());
        setting.setEmail(dto.getEmail());
        setting.setAddress(dto.getAddress());
        setting.setRegistrationNumber(dto.getRegistrationNumber());
        setting.setInvoiceFooter(dto.getInvoiceFooter());
        setting.setUpdatedAt(LocalDateTime.now());

        HospitalSetting saved = hospitalSettingRepository.save(setting);
        return mapToDto(saved);
    }

    @Override
    public UserDto getUserProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));

        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public UserDto updateUserProfile(String username, UserProfileUpdateRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());

        User updated = userRepository.save(user);
        return UserDto.builder()
                .id(updated.getId())
                .username(updated.getUsername())
                .email(updated.getEmail())
                .fullName(updated.getFullName())
                .role(updated.getRole())
                .createdAt(updated.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password verification failed. Please check your existing password.");
        }

        if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
            throw new BadRequestException("New password must be at least 6 characters in length");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private HospitalSettingDto mapToDto(HospitalSetting s) {
        return HospitalSettingDto.builder()
                .id(s.getId())
                .hospitalName(s.getHospitalName())
                .phone(s.getPhone())
                .email(s.getEmail())
                .address(s.getAddress())
                .registrationNumber(s.getRegistrationNumber())
                .invoiceFooter(s.getInvoiceFooter())
                .updatedAt(s.getUpdatedAt())
                .build();
    }
}
