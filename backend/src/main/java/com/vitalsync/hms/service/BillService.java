package com.vitalsync.hms.service;

import com.vitalsync.hms.dto.BillDto;

import java.time.LocalDate;
import java.util.List;

public interface BillService {
    List<BillDto> getAll(Long patientId, String status, LocalDate date, String search);
    BillDto getById(Long id);
    BillDto create(BillDto dto);
    BillDto update(Long id, BillDto dto);
    BillDto updateStatus(Long id, String status, String paymentMethod);
    void delete(Long id);
}
