package com.vitalsync.hms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HospitalSettingDto {
    private Long id;

    @NotBlank(message = "Hospital name is required")
    private String hospitalName;

    private String phone;
    private String emergencyNumber;
    private String ambulanceNumber;
    private String helpCenterNumber;
    private String email;
    private String address;
    private String registrationNumber;
    private String invoiceFooter;
    private LocalDateTime updatedAt;
}