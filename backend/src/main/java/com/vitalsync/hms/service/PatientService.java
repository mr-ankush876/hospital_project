package com.vitalsync.hms.service;

import com.vitalsync.hms.dto.PatientDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PatientService {
    List<PatientDto> getAll(String search, String status, String gender, String bloodGroup);
    Page<PatientDto> getAllPaged(String search, String status, String gender, String bloodGroup, Pageable pageable);
    PatientDto getById(Long id);
    PatientDto create(PatientDto dto);
    PatientDto update(Long id, PatientDto dto);
    void delete(Long id);
}
