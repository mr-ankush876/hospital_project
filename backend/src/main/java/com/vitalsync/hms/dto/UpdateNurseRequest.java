package com.vitalsync.hms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateNurseRequest {
    private String fullName;
    private String email;
    private String phone;
    private LocalDate dob;
    private String gender;
    private String bloodGroup;
    private String address;
    private Long departmentId;
    private String qualification;
    private String experience;
    private String licenseNumber;
    private LocalDate joiningDate;
    private String shift;
    private String status;
    private String password;
}
