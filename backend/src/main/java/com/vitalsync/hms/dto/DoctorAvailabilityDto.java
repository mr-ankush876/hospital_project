package com.vitalsync.hms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorAvailabilityDto {
    private Long doctorId;
    private String doctorCode;
    private String doctorName;
    private String specialization;
    private String availableDays;
    private List<String> activeWorkingDays;
    private String availableTime;
    private BigDecimal consultationFee;
    private String status;
    private LocalDate selectedDate;
    private boolean available;
    private String message;
    private List<String> allTimeSlots;
    private List<String> availableSlots;
    private List<String> bookedSlots;
}
