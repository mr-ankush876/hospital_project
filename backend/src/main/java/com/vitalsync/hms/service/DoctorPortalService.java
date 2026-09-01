package com.vitalsync.hms.service;

import com.vitalsync.hms.dto.AppointmentDto;
import com.vitalsync.hms.dto.DoctorDashboardDto;
import com.vitalsync.hms.dto.DoctorDto;
import com.vitalsync.hms.dto.PatientDto;

import java.time.LocalDate;
import java.util.List;

public interface DoctorPortalService {
    DoctorDashboardDto getDashboard(String username);
    List<AppointmentDto> getMyAppointments(String username, String status, LocalDate date);
    List<PatientDto> getMyPatients(String username);
    DoctorDto getMyProfile(String username);
    DoctorDto updateMyProfile(String username, DoctorDto dto);
}
