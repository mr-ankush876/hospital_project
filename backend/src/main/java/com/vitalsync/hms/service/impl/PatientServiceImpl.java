package com.vitalsync.hms.service.impl;

import com.vitalsync.hms.dto.PatientDto;
import com.vitalsync.hms.entity.Patient;
import com.vitalsync.hms.exception.BadRequestException;
import com.vitalsync.hms.exception.ResourceNotFoundException;
import com.vitalsync.hms.repository.AppointmentRepository;
import com.vitalsync.hms.repository.BillRepository;
import com.vitalsync.hms.repository.PatientRepository;
import com.vitalsync.hms.repository.PrescriptionRepository;
import com.vitalsync.hms.service.PatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientServiceImpl implements PatientService {

    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final BillRepository billRepository;

    @Override
    public List<PatientDto> getAll(String search, String status, String gender, String bloodGroup) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty()) ? status.trim() : null;
        String cleanGender = (gender != null && !gender.trim().isEmpty()) ? gender.trim() : null;
        String cleanBlood = (bloodGroup != null && !bloodGroup.trim().isEmpty()) ? bloodGroup.trim() : null;

        return patientRepository.searchPatients(cleanSearch, cleanStatus, cleanGender, cleanBlood)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public Page<PatientDto> getAllPaged(String search, String status, String gender, String bloodGroup, Pageable pageable) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty()) ? status.trim() : null;
        String cleanGender = (gender != null && !gender.trim().isEmpty()) ? gender.trim() : null;
        String cleanBlood = (bloodGroup != null && !bloodGroup.trim().isEmpty()) ? bloodGroup.trim() : null;

        return patientRepository.searchPatientsPaged(cleanSearch, cleanStatus, cleanGender, cleanBlood, pageable)
                .map(this::mapToDto);
    }

    @Override
    public PatientDto getById(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + id));
        return mapToDto(patient);
    }

    @Override
    @Transactional
    public PatientDto create(PatientDto dto) {
        Patient patient = new Patient();
        patient.setFullName(dto.getFullName());
        patient.setDob(dto.getDob());

        if (dto.getDob() != null) {
            patient.setAge(Period.between(dto.getDob(), LocalDate.now()).getYears());
        } else {
            patient.setAge(dto.getAge() != null ? dto.getAge() : 0);
        }

        patient.setGender(dto.getGender());
        patient.setBloodGroup(dto.getBloodGroup());
        patient.setPhone(dto.getPhone());
        patient.setEmail(dto.getEmail());
        patient.setAddress(dto.getAddress());
        patient.setEmergencyContact(dto.getEmergencyContact());
        patient.setMedicalHistory(dto.getMedicalHistory());
        patient.setAllergies(dto.getAllergies());
        patient.setStatus(dto.getStatus() != null ? dto.getStatus() : "Active");

        long count = patientRepository.count();
        patient.setPatientCode(String.format("PT-%04d", 3000 + count + (System.currentTimeMillis() % 9000)));

        Patient saved = patientRepository.save(patient);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public PatientDto update(Long id, PatientDto dto) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + id));

        patient.setFullName(dto.getFullName());
        patient.setDob(dto.getDob());

        if (dto.getDob() != null) {
            patient.setAge(Period.between(dto.getDob(), LocalDate.now()).getYears());
        } else if (dto.getAge() != null) {
            patient.setAge(dto.getAge());
        }

        patient.setGender(dto.getGender());
        patient.setBloodGroup(dto.getBloodGroup());
        patient.setPhone(dto.getPhone());
        patient.setEmail(dto.getEmail());
        patient.setAddress(dto.getAddress());
        patient.setEmergencyContact(dto.getEmergencyContact());
        patient.setMedicalHistory(dto.getMedicalHistory());
        patient.setAllergies(dto.getAllergies());
        if (dto.getStatus() != null) {
            patient.setStatus(dto.getStatus());
        }
        patient.setUpdatedAt(LocalDateTime.now());

        Patient updated = patientRepository.save(patient);
        return mapToDto(updated);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + id));

        // If linked records exist, safely deactivate instead of breaking database foreign keys
        boolean hasAppointments = appointmentRepository.existsByPatientId(id);
        boolean hasPrescriptions = prescriptionRepository.existsByPatientId(id);
        boolean hasBills = billRepository.existsByPatientId(id);

        if (hasAppointments || hasPrescriptions || hasBills) {
            patient.setStatus("Inactive");
            patientRepository.save(patient);
        } else {
            patientRepository.delete(patient);
        }
    }

    private PatientDto mapToDto(Patient p) {
        return PatientDto.builder()
                .id(p.getId())
                .patientCode(p.getPatientCode())
                .fullName(p.getFullName())
                .dob(p.getDob())
                .age(p.getAge())
                .gender(p.getGender())
                .bloodGroup(p.getBloodGroup())
                .phone(p.getPhone())
                .email(p.getEmail())
                .address(p.getAddress())
                .emergencyContact(p.getEmergencyContact())
                .medicalHistory(p.getMedicalHistory())
                .allergies(p.getAllergies())
                .status(p.getStatus())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
