package com.vitalsync.hms.dto;

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
public class NurseDto {
    private Long id;
    private String nurseCode;
    private Long userId;
    private String username;
    private Long departmentId;
    private String departmentName;
    private String fullName;
    private String email;
    private String phone;
    private LocalDate dob;
    private String gender;
    private String bloodGroup;
    private String address;
    private String qualification;
    private String experience;
    private String licenseNumber;
    private LocalDate joiningDate;
    private String shift;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
