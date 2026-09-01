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
public class DoctorDashboardDto {
    private DoctorDto doctor;
    private long todayAppointmentsCount;
    private long upcomingAppointmentsCount;
    private long completedAppointmentsCount;
    private long totalPatientsAssigned;
    private long pendingPrescriptionsCount;
    private List<AppointmentDto> todayAppointments;
    private List<AppointmentDto> upcomingAppointments;
}
