package com.vitalsync.hms.service;

import com.vitalsync.hms.dto.DepartmentDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface DepartmentService {
    List<DepartmentDto> getAll(String search, String status);
    Page<DepartmentDto> getAllPaged(String search, String status, Pageable pageable);
    DepartmentDto getById(Long id);
    DepartmentDto create(DepartmentDto dto);
    DepartmentDto update(Long id, DepartmentDto dto);
    void delete(Long id);
}
