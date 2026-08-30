package com.vitalsync.hms.controller;

import com.vitalsync.hms.dto.BillDto;
import com.vitalsync.hms.dto.BillStatusUpdateRequest;
import com.vitalsync.hms.service.BillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bills")
@RequiredArgsConstructor
public class BillController {

    private final BillService billService;

    @GetMapping
    public ResponseEntity<List<BillDto>> getAll(
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String search) {

        List<BillDto> bills = billService.getAll(patientId, status, date, search);
        return ResponseEntity.ok(bills);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BillDto> getById(@PathVariable Long id) {
        BillDto bill = billService.getById(id);
        return ResponseEntity.ok(bill);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<BillDto> create(@Valid @RequestBody BillDto dto) {
        BillDto created = billService.create(dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<BillDto> update(@PathVariable Long id, @Valid @RequestBody BillDto dto) {
        BillDto updated = billService.update(id, dto);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<BillDto> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody BillStatusUpdateRequest request) {
        BillDto updated = billService.updateStatus(id, request.getStatus(), request.getPaymentMethod());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        billService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Bill record removed successfully"));
    }
}
