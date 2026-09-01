package com.vitalsync.hms.controller;

import com.vitalsync.hms.dto.*;
import com.vitalsync.hms.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping("/search")
    public ResponseEntity<GlobalSearchResultDto> globalSearch(
            @RequestParam(required = false, defaultValue = "") String query,
            Authentication authentication) {
        return ResponseEntity.ok(searchService.globalSearch(query, authentication));
    }

    @GetMapping("/users/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDto>> searchUsers(
            @RequestParam(required = false, defaultValue = "") String query) {
        return ResponseEntity.ok(searchService.searchUsers(query));
    }

    @GetMapping("/patients/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST')")
    public ResponseEntity<List<PatientDto>> searchPatients(
            @RequestParam(required = false, defaultValue = "") String query) {
        return ResponseEntity.ok(searchService.searchPatients(query));
    }

    @GetMapping("/doctors/search")
    public ResponseEntity<List<DoctorDto>> searchDoctors(
            @RequestParam(required = false, defaultValue = "") String query) {
        return ResponseEntity.ok(searchService.searchDoctors(query));
    }

    @GetMapping("/appointments/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST')")
    public ResponseEntity<List<AppointmentDto>> searchAppointments(
            @RequestParam(required = false, defaultValue = "") String query) {
        return ResponseEntity.ok(searchService.searchAppointments(query));
    }

    @GetMapping("/prescriptions/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST')")
    public ResponseEntity<List<PrescriptionDto>> searchPrescriptions(
            @RequestParam(required = false, defaultValue = "") String query) {
        return ResponseEntity.ok(searchService.searchPrescriptions(query));
    }

    @GetMapping("/bills/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<List<BillDto>> searchBills(
            @RequestParam(required = false, defaultValue = "") String query) {
        return ResponseEntity.ok(searchService.searchBills(query));
    }
}
