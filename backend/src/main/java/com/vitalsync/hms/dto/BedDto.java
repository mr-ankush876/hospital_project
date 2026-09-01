package com.vitalsync.hms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BedDto {
    private Long id;

    @NotBlank(message = "Bed number is required")
    private String bedNumber;

    @NotNull(message = "Department ID is required")
    private Long departmentId;
    private String departmentName;

    @NotBlank(message = "Bed type is required")
    private String bedType; // GENERAL, ICU, EMERGENCY, PRIVATE, SEMI_PRIVATE

    private BigDecimal dailyCharge;
    private String status; // AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE

    private Long currentPatientId;
    private String currentPatientName;
    private String currentPatientCode;

    private LocalDateTime admissionDate;
    private LocalDateTime dischargeDate;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
