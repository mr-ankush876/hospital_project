package com.vitalsync.hms.service.impl;

import com.vitalsync.hms.dto.MedicalReportDto;
import com.vitalsync.hms.entity.Doctor;
import com.vitalsync.hms.entity.MedicalReport;
import com.vitalsync.hms.entity.Patient;
import com.vitalsync.hms.exception.ResourceNotFoundException;
import com.vitalsync.hms.repository.DoctorRepository;
import com.vitalsync.hms.repository.MedicalReportRepository;
import com.vitalsync.hms.repository.PatientRepository;
import com.vitalsync.hms.service.MedicalReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MedicalReportServiceImpl implements MedicalReportService {

    private final MedicalReportRepository medicalReportRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    @Override
    @Transactional(readOnly = true)
    public List<MedicalReportDto> getAll(Long patientId, Long doctorId, String reportType, String status, LocalDate date, String search) {
        String cleanType = (reportType != null && !reportType.trim().isEmpty()) ? reportType.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty()) ? status.trim() : null;
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        return medicalReportRepository.filterReports(patientId, doctorId, cleanType, cleanStatus, date, cleanSearch)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MedicalReportDto> getAllPaged(Long patientId, Long doctorId, String reportType, String status, LocalDate date, String search, Pageable pageable) {
        String cleanType = (reportType != null && !reportType.trim().isEmpty()) ? reportType.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty()) ? status.trim() : null;
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        return medicalReportRepository.filterReportsPaged(patientId, doctorId, cleanType, cleanStatus, date, cleanSearch, pageable)
                .map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public MedicalReportDto getById(Long id) {
        MedicalReport report = medicalReportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medical report not found with ID: " + id));
        return mapToDto(report);
    }

    @Override
    @Transactional
    public MedicalReportDto create(MedicalReportDto dto) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + dto.getPatientId()));

        Doctor doctor = null;
        if (dto.getDoctorId() != null) {
            doctor = doctorRepository.findById(dto.getDoctorId()).orElse(null);
        }

        long count = medicalReportRepository.count();
        String reportCode = String.format("REP-%04d", 7000 + count + 1);

        MedicalReport report = MedicalReport.builder()
                .reportCode(reportCode)
                .patient(patient)
                .doctor(doctor)
                .departmentName(dto.getDepartmentName())
                .reportType(dto.getReportType())
                .reportDate(dto.getReportDate() != null ? dto.getReportDate() : LocalDate.now())
                .symptoms(dto.getSymptoms())
                .diagnosis(dto.getDiagnosis())
                .testResults(dto.getTestResults())
                .doctorNotes(dto.getDoctorNotes())
                .status(dto.getStatus() != null ? dto.getStatus() : "Final")
                .build();

        MedicalReport saved = medicalReportRepository.save(report);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public MedicalReportDto update(Long id, MedicalReportDto dto) {
        MedicalReport report = medicalReportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medical report not found with ID: " + id));

        if (dto.getDoctorId() != null) {
            Doctor doctor = doctorRepository.findById(dto.getDoctorId()).orElse(null);
            report.setDoctor(doctor);
        }

        if (dto.getPatientId() != null) {
            Patient patient = patientRepository.findById(dto.getPatientId()).orElse(null);
            if (patient != null) {
                report.setPatient(patient);
            }
        }

        report.setDepartmentName(dto.getDepartmentName());
        report.setReportType(dto.getReportType());
        if (dto.getReportDate() != null) report.setReportDate(dto.getReportDate());
        report.setSymptoms(dto.getSymptoms());
        report.setDiagnosis(dto.getDiagnosis());
        report.setTestResults(dto.getTestResults());
        report.setDoctorNotes(dto.getDoctorNotes());
        if (dto.getStatus() != null) report.setStatus(dto.getStatus());

        MedicalReport updated = medicalReportRepository.save(report);
        return mapToDto(updated);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        MedicalReport report = medicalReportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medical report not found with ID: " + id));
        medicalReportRepository.delete(report);
    }

    private MedicalReportDto mapToDto(MedicalReport r) {
        return MedicalReportDto.builder()
                .id(r.getId())
                .reportCode(r.getReportCode())
                .patientId(r.getPatient() != null ? r.getPatient().getId() : null)
                .patientName(r.getPatient() != null ? r.getPatient().getFullName() : null)
                .patientCode(r.getPatient() != null ? r.getPatient().getPatientCode() : null)
                .doctorId(r.getDoctor() != null ? r.getDoctor().getId() : null)
                .doctorName(r.getDoctor() != null ? r.getDoctor().getFullName() : null)
                .departmentName(r.getDepartmentName())
                .reportType(r.getReportType())
                .reportDate(r.getReportDate())
                .symptoms(r.getSymptoms())
                .diagnosis(r.getDiagnosis())
                .testResults(r.getTestResults())
                .doctorNotes(r.getDoctorNotes())
                .status(r.getStatus())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
