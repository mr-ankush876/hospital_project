package com.vitalsync.hms.controller;

import com.vitalsync.hms.dto.ChangePasswordRequest;
import com.vitalsync.hms.dto.HospitalSettingDto;
import com.vitalsync.hms.dto.UserDto;
import com.vitalsync.hms.dto.UserProfileUpdateRequest;
import com.vitalsync.hms.service.SettingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingController {

    private final SettingService settingService;

    @GetMapping("/hospital")
    public ResponseEntity<HospitalSettingDto> getHospitalProfile() {
        HospitalSettingDto setting = settingService.getHospitalProfile();
        return ResponseEntity.ok(setting);
    }

    @PutMapping("/hospital")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<HospitalSettingDto> updateHospitalProfile(@Valid @RequestBody HospitalSettingDto dto) {
        HospitalSettingDto updated = settingService.updateHospitalProfile(dto);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/user")
    public ResponseEntity<UserDto> getUserProfile(Authentication authentication) {
        UserDto user = settingService.getUserProfile(authentication.getName());
        return ResponseEntity.ok(user);
    }

    @RequestMapping(value = "/user", method = {RequestMethod.PUT, RequestMethod.PATCH, RequestMethod.POST})
    public ResponseEntity<UserDto> updateUserProfile(
            Authentication authentication,
            @Valid @RequestBody UserProfileUpdateRequest request) {
        UserDto updated = settingService.updateUserProfile(authentication.getName(), request);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request) {
        settingService.changePassword(authentication.getName(), request);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
}
