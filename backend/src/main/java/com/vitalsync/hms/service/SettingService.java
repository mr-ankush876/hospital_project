package com.vitalsync.hms.service;

import com.vitalsync.hms.dto.ChangePasswordRequest;
import com.vitalsync.hms.dto.HospitalSettingDto;
import com.vitalsync.hms.dto.UserDto;
import com.vitalsync.hms.dto.UserProfileUpdateRequest;

public interface SettingService {
    HospitalSettingDto getHospitalProfile();
    HospitalSettingDto updateHospitalProfile(HospitalSettingDto dto);
    UserDto getUserProfile(String username);
    UserDto updateUserProfile(String username, UserProfileUpdateRequest request);
    void changePassword(String username, ChangePasswordRequest request);
}
