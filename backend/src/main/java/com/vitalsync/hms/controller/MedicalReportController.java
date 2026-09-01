package com.vitalsync.hms.controller;

import com.vitalsync.hms.dto.MedicalReportDto;
import com.vitalsync.hms.service.MedicalReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/medical-reports")
@RequiredArgsConstructor
public class MedicalReportController {

    private final MedicalReportService medicalReportService;

    @GetMapping
    public ResponseEntity<?> getAll(
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) String reportType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        if (page != null && size != null) {
            Page<MedicalReportDto> paged = medicalReportService.getAllPaged(
                    patientId, doctorId, reportType, status, date, search,
                    PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"))
            );
            return ResponseEntity.ok(paged);
        }

        List<MedicalReportDto> list = medicalReportService.getAll(patientId, doctorId, reportType, status, date, search);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MedicalReportDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(medicalReportService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<MedicalReportDto> create(@Valid @RequestBody MedicalReportDto dto) {
        MedicalReportDto created = medicalReportService.create(dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<MedicalReportDto> update(@PathVariable Long id, @Valid @RequestBody MedicalReportDto dto) {
        MedicalReportDto updated = medicalReportService.update(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        medicalReportService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Medical report deleted successfully"));
    }
}
