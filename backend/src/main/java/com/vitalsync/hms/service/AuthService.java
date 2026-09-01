package com.vitalsync.hms.service;

import com.vitalsync.hms.dto.*;

import java.util.Map;

public interface AuthService {
    AuthResponse login(AuthRequest request);
    AuthResponse registerPatient(RegisterPatientRequest request);
    Map<String, String> forgotPassword(ForgotPasswordRequest request);
    Map<String, String> resetPassword(ResetPasswordRequest request);
    UserDto getCurrentUser(String username);
}
