package com.vitalsync.hms.service;

import com.vitalsync.hms.dto.CreateStaffRequest;
import com.vitalsync.hms.dto.UserDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface UserManagementService {
    List<UserDto> getAllUsers(String role, String status, String search);
    Page<UserDto> getAllUsersPaged(String role, String status, String search, Pageable pageable);
    UserDto getUserById(Long id);
    UserDto createStaffAccount(CreateStaffRequest request, String adminUsername);
    UserDto updateUser(Long id, java.util.Map<String, Object> updates, String adminUsername);
    UserDto updateUserStatus(Long id, String status, String adminUsername);
    void resetUserPassword(Long id, String newPassword, String adminUsername);
}
