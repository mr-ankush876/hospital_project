package com.vitalsync.hms.controller;

import com.vitalsync.hms.dto.BedDto;
import com.vitalsync.hms.dto.BedReservationDto;
import com.vitalsync.hms.service.BedService;
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
@RequestMapping("/api/beds")
@RequiredArgsConstructor
public class BedController {

    private final BedService bedService;
    private final com.vitalsync.hms.service.PublicService publicService;

    @GetMapping("/stats")
    public ResponseEntity<?> getBedStats() {
        return ResponseEntity.ok(publicService.getPublicBedAvailability());
    }

    @GetMapping
    public ResponseEntity<?> getAllBeds(
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String bedType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        if (page != null && size != null) {
            Page<BedDto> paged = bedService.getAllBedsPaged(
                    departmentId, bedType, status, search,
                    PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "bedNumber"))
            );
            return ResponseEntity.ok(paged);
        }

        List<BedDto> list = bedService.getAllBeds(departmentId, bedType, status, search);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BedDto> getBedById(@PathVariable Long id) {
        return ResponseEntity.ok(bedService.getBedById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<BedDto> createBed(@Valid @RequestBody BedDto dto) {
        BedDto created = bedService.createBed(dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<BedDto> updateBed(@PathVariable Long id, @Valid @RequestBody BedDto dto) {
        BedDto updated = bedService.updateBed(id, dto);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<BedDto> updateBedStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        String status = (String) body.get("status");
        Long patientId = body.get("patientId") != null ? Long.valueOf(body.get("patientId").toString()) : null;
        BedDto updated = bedService.updateBedStatus(id, status, patientId);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteBed(@PathVariable Long id) {
        bedService.deleteBed(id);
        return ResponseEntity.ok(Map.of("message", "Bed record deleted successfully"));
    }

    // Bed Reservations
    @GetMapping("/reservations")
    public ResponseEntity<?> getAllReservations(
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String bedType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        if (page != null && size != null) {
            Page<BedReservationDto> paged = bedService.getAllReservationsPaged(
                    patientId, departmentId, bedType, status, search,
                    PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"))
            );
            return ResponseEntity.ok(paged);
        }

        List<BedReservationDto> list = bedService.getAllReservations(patientId, departmentId, bedType, status, search);
        return ResponseEntity.ok(list);
    }

    @PostMapping("/reservations")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<BedReservationDto> createReservation(@Valid @RequestBody BedReservationDto dto) {
        BedReservationDto created = bedService.createReservation(dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PatchMapping("/reservations/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<BedReservationDto> updateReservationStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        String notes = body.get("notes");
        BedReservationDto updated = bedService.updateReservationStatus(id, status, notes);
        return ResponseEntity.ok(updated);
    }
}
