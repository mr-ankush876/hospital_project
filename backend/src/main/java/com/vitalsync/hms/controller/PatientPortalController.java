package com.vitalsync.hms.controller;

import com.vitalsync.hms.dto.*;
import com.vitalsync.hms.service.PatientPortalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patient")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('PATIENT', 'ADMIN')")
public class PatientPortalController {

    private final PatientPortalService patientPortalService;

    @GetMapping("/dashboard")
    public ResponseEntity<PatientDashboardDto> getDashboard(Authentication authentication) {
        return ResponseEntity.ok(patientPortalService.getDashboard(authentication.getName()));
    }

    @GetMapping("/profile")
    public ResponseEntity<PatientDto> getProfile(Authentication authentication) {
        return ResponseEntity.ok(patientPortalService.getProfile(authentication.getName()));
    }

    @PutMapping("/profile")
    public ResponseEntity<PatientDto> updateProfile(
            Authentication authentication,
            @Valid @RequestBody PatientDto dto) {
        return ResponseEntity.ok(patientPortalService.updateProfile(authentication.getName(), dto));
    }

    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentDto>> getAppointments(
            Authentication authentication,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(patientPortalService.getMyAppointments(authentication.getName(), status));
    }

    @PostMapping("/appointments")
    public ResponseEntity<AppointmentDto> bookAppointment(
            Authentication authentication,
            @Valid @RequestBody AppointmentDto dto) {
        AppointmentDto created = patientPortalService.bookAppointment(authentication.getName(), dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PatchMapping("/appointments/{id}/cancel")
    public ResponseEntity<AppointmentDto> cancelAppointment(
            Authentication authentication,
            @PathVariable Long id) {
        return ResponseEntity.ok(patientPortalService.cancelAppointment(authentication.getName(), id));
    }

    @GetMapping("/prescriptions")
    public ResponseEntity<List<PrescriptionDto>> getPrescriptions(Authentication authentication) {
        return ResponseEntity.ok(patientPortalService.getMyPrescriptions(authentication.getName()));
    }

    @GetMapping("/prescriptions/{id}")
    public ResponseEntity<PrescriptionDto> getPrescriptionById(
            Authentication authentication,
            @PathVariable Long id) {
        return ResponseEntity.ok(patientPortalService.getMyPrescriptionById(authentication.getName(), id));
    }

    @GetMapping("/reports")
    public ResponseEntity<List<MedicalReportDto>> getReports(Authentication authentication) {
        return ResponseEntity.ok(patientPortalService.getMyReports(authentication.getName()));
    }

    @GetMapping("/reports/{id}")
    public ResponseEntity<MedicalReportDto> getReportById(
            Authentication authentication,
            @PathVariable Long id) {
        return ResponseEntity.ok(patientPortalService.getMyReportById(authentication.getName(), id));
    }

    @GetMapping("/bills")
    public ResponseEntity<List<BillDto>> getBills(Authentication authentication) {
        return ResponseEntity.ok(patientPortalService.getMyBills(authentication.getName()));
    }

    @GetMapping("/bills/{id}")
    public ResponseEntity<BillDto> getBillById(
            Authentication authentication,
            @PathVariable Long id) {
        return ResponseEntity.ok(patientPortalService.getMyBillById(authentication.getName(), id));
    }

    @GetMapping("/bed-reservations")
    public ResponseEntity<List<BedReservationDto>> getBedReservations(Authentication authentication) {
        return ResponseEntity.ok(patientPortalService.getMyBedReservations(authentication.getName()));
    }

    @PostMapping("/bed-reservations")
    public ResponseEntity<BedReservationDto> bookBedReservation(
            Authentication authentication,
            @Valid @RequestBody BedReservationDto dto) {
        BedReservationDto created = patientPortalService.bookBedReservation(authentication.getName(), dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }
}
