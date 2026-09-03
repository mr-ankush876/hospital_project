package com.vitalsync.hms.service.impl;

import com.vitalsync.hms.dto.PatientDto;
import com.vitalsync.hms.entity.*;
import com.vitalsync.hms.exception.BadRequestException;
import com.vitalsync.hms.exception.ResourceNotFoundException;
import com.vitalsync.hms.repository.*;
import com.vitalsync.hms.service.AuditLogService;
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
    private final com.vitalsync.hms.service.PhoneValidationService phoneValidationService;
    private final AppointmentRepository appointmentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final BillRepository billRepository;
    private final BedReservationRepository bedReservationRepository;
    private final MedicalReportRepository medicalReportRepository;
    private final EmergencyRequestRepository emergencyRequestRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

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
        patient.setPhone(phoneValidationService.validateAndNormalize(dto.getPhone()));
        patient.setEmail(dto.getEmail());
        patient.setAddress(dto.getAddress());
                if (dto.getEmergencyContact() != null && !dto.getEmergencyContact().trim().isEmpty()) {
            patient.setEmergencyContact(phoneValidationService.validateAndNormalize(dto.getEmergencyContact()));
        } else {
            patient.setEmergencyContact(null);
        }
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
        patient.setPhone(phoneValidationService.validateAndNormalize(dto.getPhone()));
        patient.setEmail(dto.getEmail());
        patient.setAddress(dto.getAddress());
                if (dto.getEmergencyContact() != null && !dto.getEmergencyContact().trim().isEmpty()) {
            patient.setEmergencyContact(phoneValidationService.validateAndNormalize(dto.getEmergencyContact()));
        } else {
            patient.setEmergencyContact(null);
        }
        patient.setMedicalHistory(dto.getMedicalHistory());
        patient.setAllergies(dto.getAllergies());
        if (dto.getStatus() != null) {
            patient.setStatus(dto.getStatus());
        }
        patient.setUpdatedAt(LocalDateTime.now());

        if (patient.getUser() != null) {
            patient.getUser().setPhone(patient.getPhone());
            patient.getUser().setFullName(patient.getFullName());
        }
        Patient updated = patientRepository.save(patient);
        return mapToDto(updated);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + id));

        // 1. Clinical Lock: Active appointments check
        // A patient record CANNOT be deleted if there are any appointments that are not cancelled or completed
        List<Appointment> appointments = appointmentRepository.findByPatientId(id);
        long uncancelledAppointments = appointments.stream()
                .filter(a -> a.getStatus() != null &&
                        !a.getStatus().equalsIgnoreCase("Cancelled") &&
                        !a.getStatus().equalsIgnoreCase("Completed"))
                .count();

        if (uncancelledAppointments > 0) {
            throw new BadRequestException("Cannot delete patient record: Patient has " + uncancelledAppointments +
                    " active appointment(s). All appointments must be cancelled or completed before deleting this record.");
        }

        // 2. Clinical Lock: Bed reservations / Inpatient admission check
        List<BedReservation> bedReservations = bedReservationRepository.findByPatientId(id);
        long activeBeds = bedReservations.stream()
                .filter(b -> b.getStatus() != null &&
                        (b.getStatus().equalsIgnoreCase("CONFIRMED") ||
                         b.getStatus().equalsIgnoreCase("PENDING") ||
                         b.getStatus().equalsIgnoreCase("ADMITTED")))
                .count();

        if (activeBeds > 0) {
            throw new BadRequestException("Cannot delete patient record: Patient currently has an active bed reservation. " +
                    "Please discharge the patient and cancel the bed reservation before deleting this record.");
        }

        // 3. Clinical Lock: Pending or unfinalized medical diagnostic reports check
        List<MedicalReport> medicalReports = medicalReportRepository.findByPatientId(id);
        long pendingReports = medicalReports.stream()
                .filter(r -> r.getStatus() != null &&
                        !r.getStatus().equalsIgnoreCase("Final") &&
                        !r.getStatus().equalsIgnoreCase("Completed"))
                .count();

        if (pendingReports > 0) {
            throw new BadRequestException("Cannot delete patient record: Patient has " + pendingReports +
                    " medical report(s) that are still pending. Final medical reports must be generated before deleting this record.");
        }

        // --- All Clinical Safety Checks Passed! Proceed with Clean Deletion ---
        // Clean up all child entities to prevent foreign key referential integrity constraint violations:

        // A. Delete Bed Reservations
        if (!bedReservations.isEmpty()) {
            bedReservationRepository.deleteAll(bedReservations);
        }

        // B. Delete Appointments
        if (!appointments.isEmpty()) {
            appointmentRepository.deleteAll(appointments);
        }

        // C. Delete Prescriptions
        List<Prescription> prescriptions = prescriptionRepository.findByPatientId(id);
        if (!prescriptions.isEmpty()) {
            prescriptionRepository.deleteAll(prescriptions);
        }

        // D. Delete Medical Reports
        if (!medicalReports.isEmpty()) {
            medicalReportRepository.deleteAll(medicalReports);
        }

        // E. Delete Bills
        List<Bill> bills = billRepository.findByPatientId(id);
        if (!bills.isEmpty()) {
            billRepository.deleteAll(bills);
        }

        // F. Unlink Emergency Requests
        List<EmergencyRequest> emergencies = emergencyRequestRepository.findByPatientIdOrderByCreatedAtDesc(id);
        for (EmergencyRequest er : emergencies) {
            er.setPatient(null);
            emergencyRequestRepository.save(er);
        }

        // G. Unlink / Clean up Patient User account if registered
        User linkedUser = patient.getUser();
        if (linkedUser != null) {
            patient.setUser(null);
            patientRepository.save(patient);
            if ("PATIENT".equalsIgnoreCase(linkedUser.getRole())) {
                userRepository.delete(linkedUser);
            }
        }

        // H. Delete Patient record
        patientRepository.delete(patient);

        // I. Audit Log
        String adminUsername = "ADMIN";
        try {
            var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getName() != null) {
                adminUsername = auth.getName();
            }
        } catch (Exception ignored) {}

        auditLogService.logAction(adminUsername, "ADMIN", "DELETE_PATIENT", "Patient", id.toString(),
                "Permanently removed patient " + patient.getFullName() + " (" + patient.getPatientCode() + ") after verifying clinical locks.", null);
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
