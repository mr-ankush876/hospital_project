package com.vitalsync.hms.controller;

import com.vitalsync.hms.dto.DoctorDto;
import com.vitalsync.hms.service.DoctorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;

    @GetMapping
    public ResponseEntity<?> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String specialization,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        if (page != null && size != null) {
            Page<DoctorDto> paged = doctorService.getAllPaged(
                    search, specialization, status,
                    PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"))
            );
            return ResponseEntity.ok(paged);
        }

        List<DoctorDto> doctors = doctorService.getAll(search, specialization, status);
        return ResponseEntity.ok(doctors);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DoctorDto> getById(@PathVariable Long id) {
        DoctorDto doctor = doctorService.getById(id);
        return ResponseEntity.ok(doctor);
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<com.vitalsync.hms.dto.DoctorAvailabilityDto> getAvailability(
            @PathVariable Long id,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate date) {
        return ResponseEntity.ok(doctorService.getDoctorAvailability(id, date));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<DoctorDto> create(@Valid @RequestBody DoctorDto dto) {
        DoctorDto created = doctorService.create(dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<DoctorDto> update(@PathVariable Long id, @Valid @RequestBody DoctorDto dto) {
        DoctorDto updated = doctorService.update(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        doctorService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Doctor record processed successfully"));
    }
}
