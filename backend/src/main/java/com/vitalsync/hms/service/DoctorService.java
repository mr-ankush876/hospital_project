package com.vitalsync.hms.service;

import com.vitalsync.hms.dto.DoctorAvailabilityDto;
import com.vitalsync.hms.dto.DoctorDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface DoctorService {
    List<DoctorDto> getAll(String search, String specialization, String status);
    Page<DoctorDto> getAllPaged(String search, String specialization, String status, Pageable pageable);
    DoctorDto getById(Long id);
    DoctorAvailabilityDto getDoctorAvailability(Long id, LocalDate date);
    DoctorDto create(DoctorDto dto);
    DoctorDto update(Long id, DoctorDto dto);
    void delete(Long id);
}
