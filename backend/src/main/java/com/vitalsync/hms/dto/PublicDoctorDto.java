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
public class PublicDoctorDto {
    private Long id;
    private String doctorCode;
    private String fullName;
    private String specialization;
    private String qualification;
    private String experience;
    private String departmentName;
    private String availableDays;
    private String availableTime;
    private BigDecimal consultationFee;
    private String status;
    private String imageUrl;
}
