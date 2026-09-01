package com.vitalsync.hms.service;

import com.vitalsync.hms.dto.MedicalReportDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface MedicalReportService {
    List<MedicalReportDto> getAll(Long patientId, Long doctorId, String reportType, String status, LocalDate date, String search);
    Page<MedicalReportDto> getAllPaged(Long patientId, Long doctorId, String reportType, String status, LocalDate date, String search, Pageable pageable);
    MedicalReportDto getById(Long id);
    MedicalReportDto create(MedicalReportDto dto);
    MedicalReportDto update(Long id, MedicalReportDto dto);
    void delete(Long id);
}
