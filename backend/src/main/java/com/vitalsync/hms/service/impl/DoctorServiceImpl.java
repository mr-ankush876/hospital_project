package com.vitalsync.hms.service.impl;

import com.vitalsync.hms.dto.DoctorDto;
import com.vitalsync.hms.entity.Doctor;
import com.vitalsync.hms.exception.ConflictException;
import com.vitalsync.hms.exception.ResourceNotFoundException;
import com.vitalsync.hms.repository.AppointmentRepository;
import com.vitalsync.hms.repository.DoctorRepository;
import com.vitalsync.hms.repository.PrescriptionRepository;
import com.vitalsync.hms.service.DoctorService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorServiceImpl implements DoctorService {

    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final com.vitalsync.hms.service.PhoneValidationService phoneValidationService;
    private final PrescriptionRepository prescriptionRepository;

    @Override
    public List<DoctorDto> getAll(String search, String specialization, String status) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanSpec = (specialization != null && !specialization.trim().isEmpty()) ? specialization.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty()) ? status.trim() : null;

        return doctorRepository.searchDoctors(cleanSearch, cleanSpec, cleanStatus)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public Page<DoctorDto> getAllPaged(String search, String specialization, String status, Pageable pageable) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanSpec = (specialization != null && !specialization.trim().isEmpty()) ? specialization.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty()) ? status.trim() : null;

        return doctorRepository.searchDoctorsPaged(cleanSearch, cleanSpec, cleanStatus, pageable)
                .map(this::mapToDto);
    }

    @Override
    public DoctorDto getById(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + id));
        return mapToDto(doctor);
    }

    @Override
    public com.vitalsync.hms.dto.DoctorAvailabilityDto getDoctorAvailability(Long id, java.time.LocalDate date) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + id));

        java.time.LocalDate queryDate = date != null ? date : java.time.LocalDate.now();
        boolean isWorkingOnDay = com.vitalsync.hms.util.DoctorScheduleUtil.isDoctorAvailableOnDate(doctor, queryDate);

        List<String> allSlots = com.vitalsync.hms.util.DoctorScheduleUtil.generateTimeSlots(doctor.getAvailableTime());
        List<com.vitalsync.hms.entity.Appointment> existingApts = appointmentRepository.findByDoctorIdAndAppointmentDate(id, queryDate);
        java.util.Set<String> bookedSlotSet = existingApts.stream()
                .filter(a -> !"Cancelled".equalsIgnoreCase(a.getStatus()))
                .map(com.vitalsync.hms.entity.Appointment::getAppointmentTime)
                .collect(Collectors.toSet());

        List<String> bookedSlots = allSlots.stream()
                .filter(bookedSlotSet::contains)
                .collect(Collectors.toList());

        List<String> availableSlots = isWorkingOnDay
                ? allSlots.stream().filter(s -> !bookedSlotSet.contains(s)).collect(Collectors.toList())
                : java.util.Collections.emptyList();

        String friendlyDate = com.vitalsync.hms.util.DoctorScheduleUtil.formatFriendlyDate(queryDate);
        String docName = com.vitalsync.hms.util.DoctorScheduleUtil.formatDoctorName(doctor.getFullName());
        String message;
        if (!isWorkingOnDay) {
            message = docName + " is not available on " + friendlyDate + ".";
        } else if (availableSlots.isEmpty()) {
            message = docName + " has no remaining appointment slots on " + friendlyDate + ".";
        } else {
            message = docName + " is available on " + friendlyDate + ".";
        }

        List<String> activeDayNames = com.vitalsync.hms.util.DoctorScheduleUtil.parseAvailableDays(doctor.getAvailableDays())
                .stream().map(java.time.DayOfWeek::name).collect(Collectors.toList());

        return com.vitalsync.hms.dto.DoctorAvailabilityDto.builder()
                .doctorId(doctor.getId())
                .doctorCode(doctor.getDoctorCode())
                .doctorName(doctor.getFullName())
                .specialization(doctor.getSpecialization())
                .availableDays(doctor.getAvailableDays())
                .activeWorkingDays(activeDayNames)
                .availableTime(doctor.getAvailableTime())
                .consultationFee(doctor.getConsultationFee())
                .status(doctor.getStatus())
                .selectedDate(queryDate)
                .available(isWorkingOnDay && !availableSlots.isEmpty())
                .message(message)
                .allTimeSlots(allSlots)
                .availableSlots(availableSlots)
                .bookedSlots(bookedSlots)
                .build();
    }

    @Override
    @Transactional
    public DoctorDto create(DoctorDto dto) {
        doctorRepository.findByEmail(dto.getEmail()).ifPresent(d -> {
            throw new ConflictException("Doctor with email " + dto.getEmail() + " already exists");
        });

        Doctor doctor = new Doctor();
        doctor.setFullName(dto.getFullName());
        doctor.setEmail(dto.getEmail());
        doctor.setPhone(phoneValidationService.validateAndNormalize(dto.getPhone()));
        doctor.setSpecialization(dto.getSpecialization());
        doctor.setQualification(dto.getQualification());
        doctor.setExperience(dto.getExperience());
        doctor.setAvailableDays(dto.getAvailableDays() != null ? dto.getAvailableDays() : "Mon, Wed, Fri");
        doctor.setAvailableTime(dto.getAvailableTime() != null ? dto.getAvailableTime() : "09:00 AM - 05:00 PM");
        doctor.setStatus(dto.getStatus() != null ? dto.getStatus() : "Available");
        doctor.setImageUrl(dto.getImageUrl());

        long count = doctorRepository.count();
        doctor.setDoctorCode(String.format("DOC-%04d", 3000 + count + (System.currentTimeMillis() % 9000)));

        Doctor saved = doctorRepository.save(doctor);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public DoctorDto update(Long id, DoctorDto dto) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + id));

        doctor.setFullName(dto.getFullName());
        doctor.setEmail(dto.getEmail());
        doctor.setPhone(phoneValidationService.validateAndNormalize(dto.getPhone()));
        doctor.setSpecialization(dto.getSpecialization());
        doctor.setQualification(dto.getQualification());
        doctor.setExperience(dto.getExperience());
        doctor.setAvailableDays(dto.getAvailableDays());
        doctor.setAvailableTime(dto.getAvailableTime());
        if (dto.getStatus() != null) {
            doctor.setStatus(dto.getStatus());
        }
        doctor.setImageUrl(dto.getImageUrl());

        if (doctor.getUser() != null) {
            doctor.getUser().setPhone(doctor.getPhone());
            doctor.getUser().setFullName(doctor.getFullName());
        }
        Doctor updated = doctorRepository.save(doctor);
        return mapToDto(updated);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + id));

        boolean hasAppointments = appointmentRepository.existsByDoctorId(id);
        boolean hasPrescriptions = prescriptionRepository.existsByDoctorId(id);

        if (hasAppointments || hasPrescriptions) {
            doctor.setStatus("Unavailable");
            doctorRepository.save(doctor);
        } else {
            doctorRepository.delete(doctor);
        }
    }

    private DoctorDto mapToDto(Doctor d) {
        return DoctorDto.builder()
                .id(d.getId())
                .doctorCode(d.getDoctorCode())
                .fullName(d.getFullName())
                .email(d.getEmail())
                .phone(d.getPhone())
                .specialization(d.getSpecialization())
                .qualification(d.getQualification())
                .experience(d.getExperience())
                .availableDays(d.getAvailableDays())
                .availableTime(d.getAvailableTime())
                .status(d.getStatus())
                .imageUrl(d.getImageUrl())
                .createdAt(d.getCreatedAt())
                .build();
    }
}
