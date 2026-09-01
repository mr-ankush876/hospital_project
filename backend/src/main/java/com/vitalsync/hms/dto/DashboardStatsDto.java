package com.vitalsync.hms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDto {
    private long totalPatients;
    private long totalDoctors;
    private long totalUsers;
    private long totalReceptionists;
    private long todayAppointments;
    private long pendingAppointments;
    private long pendingBills;
    private BigDecimal totalRevenue;

    // Bed & ICU live metrics
    private long totalBeds;
    private long availableBeds;
    private long occupiedBeds;
    private long totalIcuBeds;
    private long availableIcuBeds;
    private long totalEmergencyBeds;
    private long availableEmergencyBeds;
    private long activeUsers;
}
