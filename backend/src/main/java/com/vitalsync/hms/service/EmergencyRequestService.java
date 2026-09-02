package com.vitalsync.hms.service;

import com.vitalsync.hms.dto.EmergencyRequestDto;
import com.vitalsync.hms.dto.EmergencyStatsDto;

import java.util.List;

public interface EmergencyRequestService {
    EmergencyRequestDto createRequest(EmergencyRequestDto dto, String currentUsername, String clientIp);
    EmergencyRequestDto recordHospitalCall(Long id, String currentUsername, String clientIp);
    EmergencyRequestDto recordAmbulanceCall(Long id, String currentUsername, String clientIp);
    List<EmergencyRequestDto> getAllRequests(String search, String status, String emergencyType, String contactMethod);
    List<EmergencyRequestDto> getMyRequests(String currentUsername);
    EmergencyRequestDto getRequestById(Long id, String currentUsername, String role);
    EmergencyRequestDto updateStatus(Long id, String newStatus, String notes, String currentUsername, String role);
    EmergencyStatsDto getEmergencyStats();
}