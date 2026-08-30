package com.vitalsync.hms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportSummaryDto {
    private long totalPatients;
    private long totalDoctors;
    private long totalAppointments;
    private long totalBills;
    private BigDecimal totalRevenue;
    private BigDecimal pendingRevenue;
    private Map<String, Long> appointmentsByStatus;
    private Map<String, Long> billsByStatus;
    private List<DoctorWorkloadDto> doctorWorkloads;
    private List<PatientDto> recentRegistrations;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DoctorWorkloadDto {
        private Long id;
        private String name;
        private String specialization;
        private long totalAppointments;
        private long completedAppointments;
        private String status;
    }
}
