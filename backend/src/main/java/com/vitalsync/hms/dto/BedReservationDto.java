package com.vitalsync.hms.dto;

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
public class BedReservationDto {
    private Long id;
    private String reservationCode;

    private Long bedId;
    private String bedNumber;

    private Long patientId;
    private String patientName;
    private String patientCode;

    private Long departmentId;
    private String departmentName;

    @NotNull(message = "Bed type is required")
    private String bedType; // GENERAL, ICU, EMERGENCY, PRIVATE, SEMI_PRIVATE

    private LocalDate reservationDate;
    private LocalDate admissionDate;
    private String reason;
    private String status; // PENDING, CONFIRMED, CANCELLED, EXPIRED
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
