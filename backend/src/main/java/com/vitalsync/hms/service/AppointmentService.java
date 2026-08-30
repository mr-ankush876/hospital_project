package com.vitalsync.hms.service;

import com.vitalsync.hms.dto.AppointmentDto;

import java.time.LocalDate;
import java.util.List;

public interface AppointmentService {
    List<AppointmentDto> getAll(Long doctorId, Long patientId, String status, LocalDate date, String search);
    AppointmentDto getById(Long id);
    AppointmentDto create(AppointmentDto dto);
    AppointmentDto update(Long id, AppointmentDto dto);
    AppointmentDto updateStatus(Long id, String status);
    void delete(Long id);
}
