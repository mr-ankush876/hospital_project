package com.vitalsync.hms.service.impl;

import com.vitalsync.hms.dto.AuditLogDto;
import com.vitalsync.hms.entity.AuditLog;
import com.vitalsync.hms.repository.AuditLogRepository;
import com.vitalsync.hms.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Override
    @Transactional
    public void logAction(String username, String role, String action, String entityName, String entityId, String details, String ipAddress) {
        try {
            AuditLog log = AuditLog.builder()
                    .username(username != null ? username : "ANONYMOUS")
                    .role(role)
                    .action(action)
                    .entityName(entityName)
                    .entityId(entityId)
                    .details(details)
                    .ipAddress(ipAddress)
                    .timestamp(LocalDateTime.now())
                    .build();
            auditLogRepository.save(log);
        } catch (Exception e) {
            // Silently log error so audit failure doesn't break primary transactions
            System.err.println("Audit logging failed: " + e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogDto> getAll(String username, String role, String action, String search) {
        String cleanRole = (role != null && !role.trim().isEmpty() && !"ALL".equalsIgnoreCase(role)) ? role.trim().toUpperCase() : null;
        String cleanUsername = (username != null && !username.trim().isEmpty()) ? username.trim() : null;
        String cleanAction = (action != null && !action.trim().isEmpty() && !"ALL".equalsIgnoreCase(action)) ? action.trim() : null;
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        return auditLogRepository.filterLogs(cleanUsername, cleanRole, cleanAction, cleanSearch)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogDto> getAllPaged(String username, String role, String action, String search, Pageable pageable) {
        String cleanRole = (role != null && !role.trim().isEmpty() && !"ALL".equalsIgnoreCase(role)) ? role.trim().toUpperCase() : null;
        String cleanUsername = (username != null && !username.trim().isEmpty()) ? username.trim() : null;
        String cleanAction = (action != null && !action.trim().isEmpty() && !"ALL".equalsIgnoreCase(action)) ? action.trim() : null;
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        return auditLogRepository.filterLogsPaged(cleanUsername, cleanRole, cleanAction, cleanSearch, pageable)
                .map(this::mapToDto);
    }

    private AuditLogDto mapToDto(AuditLog log) {
        return AuditLogDto.builder()
                .id(log.getId())
                .username(log.getUsername())
                .role(log.getRole())
                .action(log.getAction())
                .entityName(log.getEntityName())
                .entityId(log.getEntityId())
                .details(log.getDetails())
                .ipAddress(log.getIpAddress())
                .timestamp(log.getTimestamp())
                .build();
    }
}
