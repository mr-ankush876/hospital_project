package com.vitalsync.hms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentDto {
    private Long id;
    private String appointmentCode;

    private Long patientId;
    private String patientName;
    private String patientCode;
    private PatientDto patient;

    @NotNull(message = "Doctor ID is required")
    private Long doctorId;
    private String doctorName;
    private String doctorSpecialization;
    private DoctorDto doctor;

    @NotNull(message = "Appointment date is required")
    private LocalDate appointmentDate;

    @NotBlank(message = "Appointment time is required")
    private String appointmentTime;

    private String reason;
    private String notes;
    private String status;
    private LocalDateTime createdAt;
}
