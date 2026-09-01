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
public class MedicalReportDto {
    private Long id;
    private String reportCode;

    @NotNull(message = "Patient ID is required")
    private Long patientId;
    private String patientName;
    private String patientCode;

    private Long doctorId;
    private String doctorName;

    private String departmentName;

    @NotBlank(message = "Report type is required")
    private String reportType;

    private LocalDate reportDate;
    private String symptoms;
    private String diagnosis;
    private String testResults;
    private String doctorNotes;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
