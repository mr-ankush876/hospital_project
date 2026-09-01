package com.vitalsync.hms.service.impl;

import com.vitalsync.hms.dto.DepartmentDto;
import com.vitalsync.hms.entity.Department;
import com.vitalsync.hms.exception.ConflictException;
import com.vitalsync.hms.exception.ResourceNotFoundException;
import com.vitalsync.hms.repository.BedRepository;
import com.vitalsync.hms.repository.DepartmentRepository;
import com.vitalsync.hms.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final BedRepository bedRepository;

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentDto> getAll(String search, String status) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty()) ? status.trim() : null;

        return departmentRepository.searchDepartments(cleanSearch, cleanStatus)
                .stream()
                .map(this::mapToDtoWithRealBedCounts)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DepartmentDto> getAllPaged(String search, String status, Pageable pageable) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty()) ? status.trim() : null;

        return departmentRepository.searchDepartmentsPaged(cleanSearch, cleanStatus, pageable)
                .map(this::mapToDtoWithRealBedCounts);
    }

    @Override
    @Transactional(readOnly = true)
    public DepartmentDto getById(Long id) {
        Department dep = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + id));
        return mapToDtoWithRealBedCounts(dep);
    }

    @Override
    @Transactional
    public DepartmentDto create(DepartmentDto dto) {
        if (departmentRepository.findByName(dto.getName()).isPresent()) {
            throw new ConflictException("Department already exists with name: " + dto.getName());
        }

        long count = departmentRepository.count();
        String code = dto.getDepartmentCode();
        if (code == null || code.trim().isEmpty()) {
            code = String.format("DEP-%03d", count + 1);
        }

        Department department = Department.builder()
                .departmentCode(code)
                .name(dto.getName())
                .description(dto.getDescription())
                .headDoctorName(dto.getHeadDoctorName())
                .totalBeds(dto.getTotalBeds() != null ? dto.getTotalBeds() : 0)
                .availableBeds(dto.getAvailableBeds() != null ? dto.getAvailableBeds() : 0)
                .occupiedBeds(dto.getOccupiedBeds() != null ? dto.getOccupiedBeds() : 0)
                .status(dto.getStatus() != null ? dto.getStatus() : "Active")
                .build();

        Department saved = departmentRepository.save(department);
        return mapToDtoWithRealBedCounts(saved);
    }

    @Override
    @Transactional
    public DepartmentDto update(Long id, DepartmentDto dto) {
        Department dep = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + id));

        dep.setName(dto.getName());
        dep.setDescription(dto.getDescription());
        dep.setHeadDoctorName(dto.getHeadDoctorName());
        if (dto.getStatus() != null) dep.setStatus(dto.getStatus());

        Department updated = departmentRepository.save(dep);
        return mapToDtoWithRealBedCounts(updated);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Department dep = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + id));
        departmentRepository.delete(dep);
    }

    private DepartmentDto mapToDtoWithRealBedCounts(Department dep) {
        long totalBedsInDept = bedRepository.countByDepartmentId(dep.getId());
        long availableBedsInDept = bedRepository.countByDepartmentIdAndStatus(dep.getId(), "AVAILABLE");
        long occupiedBedsInDept = bedRepository.countByDepartmentIdAndStatus(dep.getId(), "OCCUPIED");

        // Fallback to entity numbers if no specific bed records exist yet
        int total = totalBedsInDept > 0 ? (int) totalBedsInDept : (dep.getTotalBeds() != null ? dep.getTotalBeds() : 0);
        int available = totalBedsInDept > 0 ? (int) availableBedsInDept : (dep.getAvailableBeds() != null ? dep.getAvailableBeds() : 0);
        int occupied = totalBedsInDept > 0 ? (int) occupiedBedsInDept : (dep.getOccupiedBeds() != null ? dep.getOccupiedBeds() : 0);

        return DepartmentDto.builder()
                .id(dep.getId())
                .departmentCode(dep.getDepartmentCode())
                .name(dep.getName())
                .description(dep.getDescription())
                .headDoctorName(dep.getHeadDoctorName())
                .totalBeds(total)
                .availableBeds(available)
                .occupiedBeds(occupied)
                .status(dep.getStatus())
                .createdAt(dep.getCreatedAt())
                .updatedAt(dep.getUpdatedAt())
                .build();
    }
}
