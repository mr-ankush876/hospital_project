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
public class NotificationResultDto {
    private boolean success;
    private String status; // "SENT", "INVALID_PHONE_NUMBER", "PROVIDER_NOT_CONFIGURED", "ERROR"
    private String recipientE164;
    private String recipientName;
    private String channel; // "SMS", "WHATSAPP", "IN_APP"
    private String message;
    private LocalDateTime timestamp;
    private String details;
}