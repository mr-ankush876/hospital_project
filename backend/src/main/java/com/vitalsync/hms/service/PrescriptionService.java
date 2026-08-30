package com.vitalsync.hms.service;

import com.vitalsync.hms.dto.PrescriptionDto;

import java.time.LocalDate;
import java.util.List;

public interface PrescriptionService {
    List<PrescriptionDto> getAll(Long patientId, Long doctorId, LocalDate date, String search);
    PrescriptionDto getById(Long id);
    PrescriptionDto create(PrescriptionDto dto);
    PrescriptionDto update(Long id, PrescriptionDto dto);
    void delete(Long id);
}
