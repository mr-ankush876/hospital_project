package com.vitalsync.hms.service.impl;

import com.vitalsync.hms.dto.DepartmentDto;
import com.vitalsync.hms.dto.HospitalSettingDto;
import com.vitalsync.hms.dto.PublicBedStatsDto;
import com.vitalsync.hms.dto.PublicDoctorDto;
import com.vitalsync.hms.entity.Doctor;
import com.vitalsync.hms.entity.HospitalSetting;
import com.vitalsync.hms.exception.ResourceNotFoundException;
import com.vitalsync.hms.repository.BedRepository;
import com.vitalsync.hms.repository.DepartmentRepository;
import com.vitalsync.hms.repository.DoctorRepository;
import com.vitalsync.hms.repository.HospitalSettingRepository;
import com.vitalsync.hms.service.DepartmentService;
import com.vitalsync.hms.service.PublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PublicServiceImpl implements PublicService {

    private final DoctorRepository doctorRepository;
    private final DepartmentRepository departmentRepository;
    private final BedRepository bedRepository;
    private final HospitalSettingRepository hospitalSettingRepository;
    private final DepartmentService departmentService;

    @Override
    @Transactional(readOnly = true)
    public List<PublicDoctorDto> getPublicDoctors() {
        return doctorRepository.findAll().stream()
                .filter(d -> !"Inactive".equalsIgnoreCase(d.getStatus()))
                .map(this::mapToPublicDoctorDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PublicDoctorDto getPublicDoctorById(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + id));
        return mapToPublicDoctorDto(doctor);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentDto> getPublicDepartments() {
        return departmentService.getAll(null, "Active");
    }

    @Override
    @Transactional(readOnly = true)
    public PublicBedStatsDto getPublicBedAvailability() {
        long totalBeds = bedRepository.count();
        long availableBeds = bedRepository.countByStatus("AVAILABLE");
        long occupiedBeds = bedRepository.countByStatus("OCCUPIED");

        long totalIcu = bedRepository.countByBedType("ICU");
        long availableIcu = bedRepository.countByBedTypeAndStatus("ICU", "AVAILABLE");

        long totalEmg = bedRepository.countByBedType("EMERGENCY");
        long availableEmg = bedRepository.countByBedTypeAndStatus("EMERGENCY", "AVAILABLE");

        long totalGen = bedRepository.countByBedType("GENERAL");
        long availableGen = bedRepository.countByBedTypeAndStatus("GENERAL", "AVAILABLE");

        Map<String, Long> availableByType = new HashMap<>();
        availableByType.put("ICU", availableIcu);
        availableByType.put("EMERGENCY", availableEmg);
        availableByType.put("GENERAL", availableGen);
        availableByType.put("PRIVATE", bedRepository.countByBedTypeAndStatus("PRIVATE", "AVAILABLE"));
        availableByType.put("SEMI_PRIVATE", bedRepository.countByBedTypeAndStatus("SEMI_PRIVATE", "AVAILABLE"));

        Map<String, Long> totalByType = new HashMap<>();
        totalByType.put("ICU", totalIcu);
        totalByType.put("EMERGENCY", totalEmg);
        totalByType.put("GENERAL", totalGen);
        totalByType.put("PRIVATE", bedRepository.countByBedType("PRIVATE"));
        totalByType.put("SEMI_PRIVATE", bedRepository.countByBedType("SEMI_PRIVATE"));

        return PublicBedStatsDto.builder()
                .totalBeds(totalBeds)
                .availableBeds(availableBeds)
                .occupiedBeds(occupiedBeds)
                .totalIcuBeds(totalIcu)
                .availableIcuBeds(availableIcu)
                .totalEmergencyBeds(totalEmg)
                .availableEmergencyBeds(availableEmg)
                .totalGeneralBeds(totalGen)
                .availableGeneralBeds(availableGen)
                .availableByType(availableByType)
                .totalByType(totalByType)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public HospitalSettingDto getPublicHospitalInfo() {
        HospitalSetting setting = hospitalSettingRepository.findFirstByOrderByIdAsc()
                .orElse(null);

        if (setting == null) {
            return HospitalSettingDto.builder()
                    .hospitalName("VitalSync Multi-Specialty Hospital")
                    .phone("+91 (800) 123-4567")
                    .email("info@vitalsync.com")
                    .address("Medical Center Road, Healthcare City, MH 400001")
                    .registrationNumber("VS-HOSP-2026-IND")
                    .build();
        }

        return HospitalSettingDto.builder()
                .id(setting.getId())
                .hospitalName(setting.getHospitalName())
                .phone(setting.getPhone())
                .email(setting.getEmail())
                .address(setting.getAddress())
                .registrationNumber(setting.getRegistrationNumber())
                .build();
    }

    private PublicDoctorDto mapToPublicDoctorDto(Doctor d) {
        return PublicDoctorDto.builder()
                .id(d.getId())
                .doctorCode(d.getDoctorCode())
                .fullName(d.getFullName())
                .specialization(d.getSpecialization())
                .qualification(d.getQualification())
                .experience(d.getExperience())
                .departmentName(d.getDepartment() != null ? d.getDepartment().getName() : (d.getSpecialization() != null ? d.getSpecialization() : "General"))
                .availableDays(d.getAvailableDays())
                .availableTime(d.getAvailableTime())
                .consultationFee(d.getConsultationFee())
                .status(d.getStatus())
                .imageUrl(d.getImageUrl())
                .build();
    }
}
