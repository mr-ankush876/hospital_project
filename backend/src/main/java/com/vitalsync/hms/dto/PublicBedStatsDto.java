package com.vitalsync.hms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicBedStatsDto {
    private long totalBeds;
    private long availableBeds;
    private long occupiedBeds;
    private long totalIcuBeds;
    private long availableIcuBeds;
    private long totalEmergencyBeds;
    private long availableEmergencyBeds;
    private long totalGeneralBeds;
    private long availableGeneralBeds;
    private Map<String, Long> availableByType;
    private Map<String, Long> totalByType;
}
