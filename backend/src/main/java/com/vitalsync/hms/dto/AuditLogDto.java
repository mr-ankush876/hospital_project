package com.vitalsync.hms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogDto {
    private Long id;
    private String username;
    private String role;
    private String action;
    private String entityName;
    private String entityId;
    private String details;
    private String ipAddress;
    private LocalDateTime timestamp;
}
