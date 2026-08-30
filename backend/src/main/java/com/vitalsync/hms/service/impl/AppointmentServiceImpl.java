package com.vitalsync.hms.service.impl;

import com.vitalsync.hms.dto.AppointmentDto;
import com.vitalsync.hms.dto.DoctorDto;
import com.vitalsync.hms.dto.PatientDto;
import com.vitalsync.hms.entity.Appointment;
import com.vitalsync.hms.entity.Doctor;
import com.vitalsync.hms.entity.Patient;
import com.vitalsync.hms.exception.BadRequestException;
import com.vitalsync.hms.exception.ConflictException;
import com.vitalsync.hms.exception.ResourceNotFoundException;
import com.vitalsync.hms.repository.AppointmentRepository;
import com.vitalsync.hms.repository.DoctorRepository;
import com.vitalsync.hms.repository.PatientRepository;
import com.vitalsync.hms.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    private static final List<String> VALID_STATUSES = Arrays.asList(
            "Scheduled", "Confirmed", "In Progress", "Urgent", "Completed", "Cancelled"
    );

    @Override
    public List<AppointmentDto> getAll(Long doctorId, Long patientId, String status, LocalDate date, String search) {
        String cleanStatus = (status != null && !status.trim().isEmpty()) ? status.trim() : null;
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        return appointmentRepository.filterAppointments(doctorId, patientId, cleanStatus, date, cleanSearch)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public AppointmentDto getById(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + id));
        return mapToDto(appointment);
    }

    @Override
    @Transactional
    public AppointmentDto create(AppointmentDto dto) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + dto.getPatientId()));

        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + dto.getDoctorId()));

        if ("Unavailable".equalsIgnoreCase(doctor.getStatus())) {
            throw new BadRequestException("Doctor " + doctor.getFullName() + " is currently marked as Unavailable");
        }

        // Check for conflicting booking for the doctor at the same date and time
        boolean hasConflict = appointmentRepository.existsConflictingAppointment(
                doctor.getId(),
                dto.getAppointmentDate(),
                dto.getAppointmentTime(),
                null
        );

        if (hasConflict) {
            throw new ConflictException("Doctor " + doctor.getFullName() + " already has an active appointment scheduled on "
                    + dto.getAppointmentDate() + " at " + dto.getAppointmentTime());
        }

        String initialStatus = (dto.getStatus() != null && VALID_STATUSES.contains(dto.getStatus()))
                ? dto.getStatus() : "Scheduled";

        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setAppointmentDate(dto.getAppointmentDate());
        appointment.setAppointmentTime(dto.getAppointmentTime());
        appointment.setReason(dto.getReason());
        appointment.setNotes(dto.getNotes());
        appointment.setStatus(initialStatus);

        long count = appointmentRepository.count();
        appointment.setAppointmentCode(String.format("APT-%04d", 3000 + count + (System.currentTimeMillis() % 9000)));

        Appointment saved = appointmentRepository.save(appointment);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public AppointmentDto update(Long id, AppointmentDto dto) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + id));

        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + dto.getPatientId()));

        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + dto.getDoctorId()));

        // Conflict check excluding current appointment
        boolean hasConflict = appointmentRepository.existsConflictingAppointment(
                doctor.getId(),
                dto.getAppointmentDate(),
                dto.getAppointmentTime(),
                id
        );

        if (hasConflict) {
            throw new ConflictException("Doctor " + doctor.getFullName() + " already has an active appointment scheduled on "
                    + dto.getAppointmentDate() + " at " + dto.getAppointmentTime());
        }

        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setAppointmentDate(dto.getAppointmentDate());
        appointment.setAppointmentTime(dto.getAppointmentTime());
        appointment.setReason(dto.getReason());
        appointment.setNotes(dto.getNotes());

        if (dto.getStatus() != null && VALID_STATUSES.contains(dto.getStatus())) {
            appointment.setStatus(dto.getStatus());
        }

        Appointment updated = appointmentRepository.save(appointment);
        return mapToDto(updated);
    }

    @Override
    @Transactional
    public AppointmentDto updateStatus(Long id, String status) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + id));

        if (!VALID_STATUSES.contains(status)) {
            throw new BadRequestException("Invalid appointment status: " + status + ". Allowed: " + VALID_STATUSES);
        }

        appointment.setStatus(status);
        Appointment updated = appointmentRepository.save(appointment);
        return mapToDto(updated);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + id));
        appointmentRepository.delete(appointment);
    }

    private AppointmentDto mapToDto(Appointment a) {
        Patient p = a.getPatient();
        Doctor d = a.getDoctor();

        PatientDto patientDto = (p != null) ? PatientDto.builder()
                .id(p.getId())
                .patientCode(p.getPatientCode())
                .fullName(p.getFullName())
                .phone(p.getPhone())
                .email(p.getEmail())
                .gender(p.getGender())
                .bloodGroup(p.getBloodGroup())
                .dob(p.getDob())
                .age(p.getAge())
                .status(p.getStatus())
                .build() : null;

        DoctorDto doctorDto = (d != null) ? DoctorDto.builder()
                .id(d.getId())
                .doctorCode(d.getDoctorCode())
                .fullName(d.getFullName())
                .email(d.getEmail())
                .phone(d.getPhone())
                .specialization(d.getSpecialization())
                .qualification(d.getQualification())
                .status(d.getStatus())
                .imageUrl(d.getImageUrl())
                .build() : null;

        return AppointmentDto.builder()
                .id(a.getId())
                .appointmentCode(a.getAppointmentCode())
                .patientId(p != null ? p.getId() : null)
                .patientName(p != null ? p.getFullName() : null)
                .patientCode(p != null ? p.getPatientCode() : null)
                .patient(patientDto)
                .doctorId(d != null ? d.getId() : null)
                .doctorName(d != null ? d.getFullName() : null)
                .doctorSpecialization(d != null ? d.getSpecialization() : null)
                .doctor(doctorDto)
                .appointmentDate(a.getAppointmentDate())
                .appointmentTime(a.getAppointmentTime())
                .reason(a.getReason())
                .notes(a.getNotes())
                .status(a.getStatus())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
