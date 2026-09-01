package com.vitalsync.hms.service;

import com.vitalsync.hms.dto.AuditLogDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AuditLogService {
    void logAction(String username, String role, String action, String entityName, String entityId, String details, String ipAddress);
    List<AuditLogDto> getAll(String username, String role, String action, String search);
    Page<AuditLogDto> getAllPaged(String username, String role, String action, String search, Pageable pageable);
}
