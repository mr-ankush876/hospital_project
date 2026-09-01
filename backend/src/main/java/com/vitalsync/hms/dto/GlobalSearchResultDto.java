package com.vitalsync.hms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GlobalSearchResultDto {
    private String query;
    @Builder.Default
    private List<UserDto> users = new ArrayList<>();
    @Builder.Default
    private List<DoctorDto> doctors = new ArrayList<>();
    @Builder.Default
    private List<PatientDto> patients = new ArrayList<>();
    @Builder.Default
    private List<AppointmentDto> appointments = new ArrayList<>();
    @Builder.Default
    private List<PrescriptionDto> prescriptions = new ArrayList<>();
    @Builder.Default
    private List<BillDto> bills = new ArrayList<>();
    @Builder.Default
    private List<DepartmentDto> departments = new ArrayList<>();
}
