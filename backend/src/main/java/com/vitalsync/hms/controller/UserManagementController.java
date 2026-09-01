package com.vitalsync.hms.controller;

import com.vitalsync.hms.dto.AuditLogDto;
import com.vitalsync.hms.dto.CreateStaffRequest;
import com.vitalsync.hms.dto.UserDto;
import com.vitalsync.hms.service.AuditLogService;
import com.vitalsync.hms.service.UserManagementService;
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
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserManagementController {

    private final UserManagementService userManagementService;
    private final AuditLogService auditLogService;

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        if (page != null && size != null) {
            Page<UserDto> paged = userManagementService.getAllUsersPaged(
                    role, status, search,
                    PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"))
            );
            return ResponseEntity.ok(paged);
        }

        List<UserDto> list = userManagementService.getAllUsers(role, status, search);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userManagementService.getUserById(id));
    }

    @PostMapping("/users")
    public ResponseEntity<UserDto> createStaffAccount(
            Authentication authentication,
            @Valid @RequestBody CreateStaffRequest request) {
        UserDto created = userManagementService.createStaffAccount(request, authentication.getName());
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<UserDto> updateUser(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody Map<String, Object> updates) {
        UserDto updated = userManagementService.updateUser(id, updates, authentication.getName());
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<UserDto> updateUserStatus(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        UserDto updated = userManagementService.updateUserStatus(id, status, authentication.getName());
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/users/{id}/reset-password")
    public ResponseEntity<Map<String, String>> resetUserPassword(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String newPassword = body.get("newPassword");
        userManagementService.resetUserPassword(id, newPassword, authentication.getName());
        return ResponseEntity.ok(Map.of("message", "User password reset successfully"));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<?> getAuditLogs(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        if (page != null && size != null) {
            Page<AuditLogDto> paged = auditLogService.getAllPaged(
                    username, role, action, search,
                    PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"))
            );
            return ResponseEntity.ok(paged);
        }

        List<AuditLogDto> list = auditLogService.getAll(username, role, action, search);
        return ResponseEntity.ok(list);
    }
}
