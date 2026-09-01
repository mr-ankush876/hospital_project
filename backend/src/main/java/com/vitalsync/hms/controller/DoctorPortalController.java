package com.vitalsync.hms.controller;

import com.vitalsync.hms.dto.AppointmentDto;
import com.vitalsync.hms.dto.DoctorDashboardDto;
import com.vitalsync.hms.dto.DoctorDto;
import com.vitalsync.hms.dto.PatientDto;
import com.vitalsync.hms.service.DoctorPortalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/doctor")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
public class DoctorPortalController {

    private final DoctorPortalService doctorPortalService;

    @GetMapping("/dashboard")
    public ResponseEntity<DoctorDashboardDto> getDashboard(Authentication authentication) {
        return ResponseEntity.ok(doctorPortalService.getDashboard(authentication.getName()));
    }

    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentDto>> getAppointments(
            Authentication authentication,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(doctorPortalService.getMyAppointments(authentication.getName(), status, date));
    }

    @GetMapping("/patients")
    public ResponseEntity<List<PatientDto>> getPatients(Authentication authentication) {
        return ResponseEntity.ok(doctorPortalService.getMyPatients(authentication.getName()));
    }

    @GetMapping("/profile")
    public ResponseEntity<DoctorDto> getProfile(Authentication authentication) {
        return ResponseEntity.ok(doctorPortalService.getMyProfile(authentication.getName()));
    }

    @PutMapping("/profile")
    public ResponseEntity<DoctorDto> updateProfile(
            Authentication authentication,
            @Valid @RequestBody DoctorDto dto) {
        return ResponseEntity.ok(doctorPortalService.updateMyProfile(authentication.getName(), dto));
    }
}
