package com.vitalsync.hms.controller;

import com.vitalsync.hms.dto.CreateNurseRequest;
import com.vitalsync.hms.dto.NurseDto;
import com.vitalsync.hms.dto.UpdateNurseRequest;
import com.vitalsync.hms.service.NurseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/nurses")
@RequiredArgsConstructor
public class NurseController {

    private final NurseService nurseService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE')")
    public ResponseEntity<?> getAllNurses(
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String shift,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        if (page != null && size != null) {
            Page<NurseDto> paged = nurseService.getAllNursesPaged(
                    departmentId, status, shift, search,
                    PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"))
            );
            return ResponseEntity.ok(paged);
        }

        List<NurseDto> list = nurseService.getAllNurses(departmentId, status, shift, search);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE')")
    public ResponseEntity<NurseDto> getNurseById(@PathVariable Long id) {
        return ResponseEntity.ok(nurseService.getNurseById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NurseDto> createNurse(
            Authentication authentication,
            @Valid @RequestBody CreateNurseRequest request) {
        NurseDto created = nurseService.createNurse(request, authentication.getName());
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NurseDto> updateNurse(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody UpdateNurseRequest request) {
        NurseDto updated = nurseService.updateNurse(id, request, authentication.getName());
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NurseDto> updateNurseStatus(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        NurseDto updated = nurseService.updateNurseStatus(id, status, authentication.getName());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteNurse(
            Authentication authentication,
            @PathVariable Long id) {
        nurseService.deleteNurse(id, authentication.getName());
        return ResponseEntity.ok(Map.of("message", "Nurse profile and linked account deleted successfully."));
    }
}
