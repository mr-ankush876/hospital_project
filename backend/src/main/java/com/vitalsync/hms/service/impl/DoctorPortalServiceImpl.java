package com.vitalsync.hms.service.impl;

import com.vitalsync.hms.dto.AppointmentDto;
import com.vitalsync.hms.dto.DoctorDashboardDto;
import com.vitalsync.hms.dto.DoctorDto;
import com.vitalsync.hms.dto.PatientDto;
import com.vitalsync.hms.entity.Appointment;
import com.vitalsync.hms.entity.Doctor;
import com.vitalsync.hms.entity.Patient;
import com.vitalsync.hms.entity.User;
import com.vitalsync.hms.exception.ResourceNotFoundException;
import com.vitalsync.hms.repository.AppointmentRepository;
import com.vitalsync.hms.repository.DoctorRepository;
import com.vitalsync.hms.repository.PrescriptionRepository;
import com.vitalsync.hms.repository.UserRepository;
import com.vitalsync.hms.service.AuditLogService;
import com.vitalsync.hms.service.DoctorPortalService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorPortalServiceImpl implements DoctorPortalService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final AuditLogService auditLogService;
    private final com.vitalsync.hms.service.PhoneValidationService phoneValidationService;

    private Doctor resolveCurrentDoctor(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        return doctorRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    // Fallback to match by email
                    return doctorRepository.findByEmail(user.getEmail())
                            .orElseThrow(() -> new ResourceNotFoundException("No doctor profile linked to account: " + username));
                });
    }

    @Override
    @Transactional(readOnly = true)
    public DoctorDashboardDto getDashboard(String username) {
        Doctor doctor = resolveCurrentDoctor(username);
        Long docId = doctor.getId();

        LocalDate today = LocalDate.now();
        List<Appointment> allApts = appointmentRepository.findByDoctorId(docId);

        long todayApts = allApts.stream().filter(a -> today.equals(a.getAppointmentDate())).count();
        long upcomingApts = allApts.stream()
                .filter(a -> a.getAppointmentDate().isAfter(today) && !"Cancelled".equalsIgnoreCase(a.getStatus()))
                .count();
        long completedApts = allApts.stream()
                .filter(a -> "Completed".equalsIgnoreCase(a.getStatus()))
                .count();

        // Unique patients
        long totalPatients = allApts.stream()
                .map(Appointment::getPatient)
                .filter(p -> p != null)
                .map(Patient::getId)
                .distinct()
                .count();

        List<Appointment> todayList = allApts.stream()
                .filter(a -> today.equals(a.getAppointmentDate()))
                .limit(10)
                .collect(Collectors.toList());

        List<Appointment> upcomingList = allApts.stream()
                .filter(a -> a.getAppointmentDate().isAfter(today) && !"Cancelled".equalsIgnoreCase(a.getStatus()))
                .limit(10)
                .collect(Collectors.toList());

        DoctorDto doctorDto = mapToDoctorDto(doctor);

        return DoctorDashboardDto.builder()
                .doctor(doctorDto)
                .todayAppointmentsCount(todayApts)
                .upcomingAppointmentsCount(upcomingApts)
                .completedAppointmentsCount(completedApts)
                .totalPatientsAssigned(totalPatients)
                .pendingPrescriptionsCount(0)
                .todayAppointments(todayList.stream().map(this::mapToAppointmentDto).collect(Collectors.toList()))
                .upcomingAppointments(upcomingList.stream().map(this::mapToAppointmentDto).collect(Collectors.toList()))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentDto> getMyAppointments(String username, String status, LocalDate date) {
        Doctor doctor = resolveCurrentDoctor(username);
        return appointmentRepository.filterAppointments(doctor.getId(), null, status, date, null)
                .stream()
                .map(this::mapToAppointmentDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PatientDto> getMyPatients(String username) {
        Doctor doctor = resolveCurrentDoctor(username);
        List<Appointment> appointments = appointmentRepository.findByDoctorId(doctor.getId());

        return appointments.stream()
                .map(Appointment::getPatient)
                .filter(p -> p != null)
                .filter(distinctByKey(Patient::getId))
                .map(this::mapToPatientDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DoctorDto getMyProfile(String username) {
        Doctor doctor = resolveCurrentDoctor(username);
        return mapToDoctorDto(doctor);
    }

    @Override
    @Transactional
    public DoctorDto updateMyProfile(String username, DoctorDto dto) {
        Doctor doctor = resolveCurrentDoctor(username);

                if (dto.getPhone() != null && !dto.getPhone().trim().isEmpty()) {
            String norm = phoneValidationService.validateAndNormalize(dto.getPhone());
            doctor.setPhone(norm);
            if (doctor.getUser() != null) {
                doctor.getUser().setPhone(norm);
            }
        }
        if (dto.getExperience() != null) doctor.setExperience(dto.getExperience());
        if (dto.getAvailableDays() != null) doctor.setAvailableDays(dto.getAvailableDays());
        if (dto.getAvailableTime() != null) doctor.setAvailableTime(dto.getAvailableTime());
        if (dto.getStatus() != null) doctor.setStatus(dto.getStatus());
        if (dto.getImageUrl() != null) doctor.setImageUrl(dto.getImageUrl());

        Doctor saved = doctorRepository.save(doctor);
        auditLogService.logAction(username, "DOCTOR", "UPDATE_PROFILE", "Doctor", saved.getId().toString(), "Doctor updated profile schedule/info", null);
        return mapToDoctorDto(saved);
    }

    private static <T> Predicate<T> distinctByKey(Function<? super T, ?> keyExtractor) {
        Map<Object, Boolean> seen = new ConcurrentHashMap<>();
        return t -> seen.putIfAbsent(keyExtractor.apply(t), Boolean.TRUE) == null;
    }

    private DoctorDto mapToDoctorDto(Doctor d) {
        return DoctorDto.builder()
                .id(d.getId())
                .doctorCode(d.getDoctorCode())
                .userId(d.getUser() != null ? d.getUser().getId() : null)
                .username(d.getUser() != null ? d.getUser().getUsername() : null)
                .departmentId(d.getDepartment() != null ? d.getDepartment().getId() : null)
                .departmentName(d.getDepartment() != null ? d.getDepartment().getName() : (d.getSpecialization() != null ? d.getSpecialization() : "General"))
                .fullName(d.getFullName())
                .email(d.getEmail())
                .phone(d.getPhone())
                .specialization(d.getSpecialization())
                .qualification(d.getQualification())
                .experience(d.getExperience())
                .availableDays(d.getAvailableDays())
                .availableTime(d.getAvailableTime())
                .consultationFee(d.getConsultationFee())
                .status(d.getStatus())
                .imageUrl(d.getImageUrl())
                .createdAt(d.getCreatedAt())
                .build();
    }

    private PatientDto mapToPatientDto(Patient p) {
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

    private AppointmentDto mapToAppointmentDto(Appointment a) {
        return AppointmentDto.builder()
                .id(a.getId())
                .appointmentCode(a.getAppointmentCode())
                .patientId(a.getPatient() != null ? a.getPatient().getId() : null)
                .patientName(a.getPatient() != null ? a.getPatient().getFullName() : null)
                .patientCode(a.getPatient() != null ? a.getPatient().getPatientCode() : null)
                .patient(a.getPatient() != null ? mapToPatientDto(a.getPatient()) : null)
                .doctorId(a.getDoctor() != null ? a.getDoctor().getId() : null)
                .doctorName(a.getDoctor() != null ? a.getDoctor().getFullName() : null)
                .doctorSpecialization(a.getDoctor() != null ? a.getDoctor().getSpecialization() : null)
                .appointmentDate(a.getAppointmentDate())
                .appointmentTime(a.getAppointmentTime())
                .reason(a.getReason())
                .notes(a.getNotes())
                .status(a.getStatus())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
