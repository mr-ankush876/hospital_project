package com.vitalsync.hms.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillDto {
    private Long id;
    private String billCode;

    @NotNull(message = "Patient ID is required")
    private Long patientId;
    private String patientName;
    private String patientCode;
    private PatientDto patient;

    private Long doctorId;
    private String doctorName;
    private DoctorDto doctor;

    @NotNull(message = "Bill date is required")
    private LocalDate billDate;

    private BigDecimal consultationFee;
    private BigDecimal medicineCharges;
    private BigDecimal otherCharges;
    private BigDecimal discount;
    private BigDecimal tax;
    private BigDecimal totalAmount;

    private String paymentMethod;
    private String paymentStatus;
    private LocalDateTime createdAt;
}
