package com.vitalsync.hms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyStatsDto {
    private long totalRequests;
    private long activeEmergencies;
    private long ambulanceContacts;
    private long resolvedEmergencies;
}