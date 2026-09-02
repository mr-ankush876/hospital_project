package com.vitalsync.hms.controller;

import com.vitalsync.hms.dto.EmergencyRequestDto;
import com.vitalsync.hms.dto.EmergencyStatsDto;
import com.vitalsync.hms.dto.EmergencyStatusUpdateDto;
import com.vitalsync.hms.service.EmergencyRequestService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/emergencies")
@RequiredArgsConstructor
public class EmergencyController {

    private final EmergencyRequestService emergencyRequestService;

    @Value("${app.emergency.hospital-number:8797254899}")
    private String hospitalEmergencyNumber;

    @Value("${app.emergency.ambulance-number:7888834943}")
    private String ambulanceEmergencyNumber;

    @GetMapping("/contacts")
    public ResponseEntity<Map<String, String>> getEmergencyContacts() {
        Map<String, String> contacts = new HashMap<>();
        contacts.put("hospital", hospitalEmergencyNumber);
        contacts.put("ambulance", ambulanceEmergencyNumber);
        contacts.put("hospitalTelUri", "tel:" + hospitalEmergencyNumber);
        contacts.put("ambulanceTelUri", "tel:" + ambulanceEmergencyNumber);
        contacts.put("hospitalDisplay", "+91 " + hospitalEmergencyNumber);
        contacts.put("ambulanceDisplay", "+91 " + ambulanceEmergencyNumber);
        return ResponseEntity.ok(contacts);
    }

    @PostMapping
    public ResponseEntity<EmergencyRequestDto> createEmergencyRequest(
            @Valid @RequestBody EmergencyRequestDto dto,
            Authentication authentication,
            HttpServletRequest request
    ) {
        String username = authentication != null ? authentication.getName() : null;
        String clientIp = request.getRemoteAddr();
        EmergencyRequestDto created = emergencyRequestService.createRequest(dto, username, clientIp);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/{id}/call/hospital")
    public ResponseEntity<EmergencyRequestDto> recordHospitalCall(
            @PathVariable Long id,
            Authentication authentication,
            HttpServletRequest request
    ) {
        String username = authentication != null ? authentication.getName() : null;
        String clientIp = request.getRemoteAddr();
        return ResponseEntity.ok(emergencyRequestService.recordHospitalCall(id, username, clientIp));
    }

    @PostMapping("/{id}/call/ambulance")
    public ResponseEntity<EmergencyRequestDto> recordAmbulanceCall(
            @PathVariable Long id,
            Authentication authentication,
            HttpServletRequest request
    ) {
        String username = authentication != null ? authentication.getName() : null;
        String clientIp = request.getRemoteAddr();
        return ResponseEntity.ok(emergencyRequestService.recordAmbulanceCall(id, username, clientIp));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<List<EmergencyRequestDto>> getMyEmergencyRequests(Authentication authentication) {
        return ResponseEntity.ok(emergencyRequestService.getMyRequests(authentication.getName()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST')")
    public ResponseEntity<List<EmergencyRequestDto>> getAllEmergencyRequests(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String emergencyType,
            @RequestParam(required = false) String contactMethod
    ) {
        return ResponseEntity.ok(emergencyRequestService.getAllRequests(search, status, emergencyType, contactMethod));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST')")
    public ResponseEntity<EmergencyStatsDto> getEmergencyStats() {
        return ResponseEntity.ok(emergencyRequestService.getEmergencyStats());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<EmergencyRequestDto> getEmergencyRequestById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String role = authentication.getAuthorities().stream()
                .findFirst()
                .map(Object::toString)
                .orElse("ROLE_PATIENT");
        return ResponseEntity.ok(emergencyRequestService.getRequestById(id, authentication.getName(), role));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST')")
    public ResponseEntity<EmergencyRequestDto> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody EmergencyStatusUpdateDto updateDto,
            Authentication authentication
    ) {
        String role = authentication.getAuthorities().stream()
                .findFirst()
                .map(Object::toString)
                .orElse("ROLE_ADMIN");
        return ResponseEntity.ok(emergencyRequestService.updateStatus(
                id,
                updateDto.getStatus(),
                updateDto.getNotes(),
                authentication.getName(),
                role
        ));
    }
}