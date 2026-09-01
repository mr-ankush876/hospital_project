package com.vitalsync.hms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientDashboardDto {
    private PatientDto patient;
    private long totalAppointments;
    private long upcomingAppointments;
    private long completedAppointments;
    private long totalPrescriptions;
    private long totalReports;
    private long pendingBills;
    private AppointmentDto nextAppointment;
    private List<AppointmentDto> recentAppointments;
    private List<PrescriptionDto> recentPrescriptions;
    private List<MedicalReportDto> recentReports;
    private List<BillDto> recentBills;
}
