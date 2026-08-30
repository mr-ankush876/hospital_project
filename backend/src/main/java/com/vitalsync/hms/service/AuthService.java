package com.vitalsync.hms.service;

import com.vitalsync.hms.dto.AuthRequest;
import com.vitalsync.hms.dto.AuthResponse;
import com.vitalsync.hms.dto.UserDto;

public interface AuthService {
    AuthResponse login(AuthRequest request);
    UserDto getCurrentUser(String username);
}
