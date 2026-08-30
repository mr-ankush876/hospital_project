package com.vitalsync.hms.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionDto {
    private Long id;
    private String prescriptionCode;

    @NotNull(message = "Patient ID is required")
    private Long patientId;
    private String patientName;
    private String patientCode;
    private PatientDto patient;

    @NotNull(message = "Doctor ID is required")
    private Long doctorId;
    private String doctorName;
    private DoctorDto doctor;

    @NotNull(message = "Prescription date is required")
    private LocalDate prescriptionDate;

    private String symptoms;

    @NotBlank(message = "Diagnosis is required")
    private String diagnosis;

    private String instructions;
    private LocalDate followUpDate;

    @NotEmpty(message = "At least one medicine is required")
    @Valid
    @Builder.Default
    private List<PrescriptionMedicineDto> medicines = new ArrayList<>();

    private LocalDateTime createdAt;
}
