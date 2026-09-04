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
    private long totalNurses;
    private long totalStaff;
    private long activeUsers;

    // Appointments Breakdown
    private long todayAppointments;
    private long pendingAppointments;
    private long completedAppointments;
    private long totalAppointments;

    // Financial Metrics
    private long pendingBills;
    private long paidBills;
    private long totalBills;
    private long totalInvoices;
    private BigDecimal totalRevenue;

    // Prescriptions & Reports
    private long totalPrescriptions;
    private long emergencyCases;
    private long medicalReports;
    private long departments;

    // Bed & ICU live metrics
    private long totalBeds;
    private long availableBeds;
    private long occupiedBeds;
    private long reservedBeds;
    private long maintenanceBeds;
    private long totalIcuBeds;
    private long availableIcuBeds;
    private long totalEmergencyBeds;
    private long availableEmergencyBeds;
}
