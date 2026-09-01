package com.vitalsync.hms.service;

import com.vitalsync.hms.dto.DepartmentDto;
import com.vitalsync.hms.dto.HospitalSettingDto;
import com.vitalsync.hms.dto.PublicBedStatsDto;
import com.vitalsync.hms.dto.PublicDoctorDto;

import java.util.List;

public interface PublicService {
    List<PublicDoctorDto> getPublicDoctors();
    PublicDoctorDto getPublicDoctorById(Long id);
    List<DepartmentDto> getPublicDepartments();
    PublicBedStatsDto getPublicBedAvailability();
    HospitalSettingDto getPublicHospitalInfo();
}
