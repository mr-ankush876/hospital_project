package com.vitalsync.hms.service.impl;

import com.vitalsync.hms.dto.BedDto;
import com.vitalsync.hms.dto.BedReservationDto;
import com.vitalsync.hms.entity.Bed;
import com.vitalsync.hms.entity.BedReservation;
import com.vitalsync.hms.entity.Department;
import com.vitalsync.hms.entity.Patient;
import com.vitalsync.hms.exception.BadRequestException;
import com.vitalsync.hms.exception.ConflictException;
import com.vitalsync.hms.exception.ResourceNotFoundException;
import com.vitalsync.hms.repository.BedRepository;
import com.vitalsync.hms.repository.BedReservationRepository;
import com.vitalsync.hms.repository.DepartmentRepository;
import com.vitalsync.hms.repository.PatientRepository;
import com.vitalsync.hms.service.BedService;
import com.vitalsync.hms.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BedServiceImpl implements BedService {

    private final BedRepository bedRepository;
    private final BedReservationRepository bedReservationRepository;
    private final DepartmentRepository departmentRepository;
    private final PatientRepository patientRepository;
    private final NotificationService notificationService;

    private static final List<String> VALID_STATUSES = Arrays.asList("AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE");
    private static final List<String> VALID_RESERVATION_STATUSES = Arrays.asList("PENDING", "CONFIRMED", "CANCELLED", "EXPIRED");

    @Override
    @Transactional(readOnly = true)
    public List<BedDto> getAllBeds(Long departmentId, String bedType, String status, String search) {
        String cleanType = (bedType != null && !bedType.trim().isEmpty()) ? bedType.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty()) ? status.trim() : null;
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        return bedRepository.searchBeds(departmentId, cleanType, cleanStatus, cleanSearch)
                .stream()
                .map(this::mapToBedDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BedDto> getAllBedsPaged(Long departmentId, String bedType, String status, String search, Pageable pageable) {
        String cleanType = (bedType != null && !bedType.trim().isEmpty()) ? bedType.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty()) ? status.trim() : null;
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        return bedRepository.searchBedsPaged(departmentId, cleanType, cleanStatus, cleanSearch, pageable)
                .map(this::mapToBedDto);
    }

    @Override
    @Transactional(readOnly = true)
    public BedDto getBedById(Long id) {
        Bed bed = bedRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bed not found with ID: " + id));
        return mapToBedDto(bed);
    }

    @Override
    @Transactional
    public BedDto createBed(BedDto dto) {
        if (bedRepository.findByBedNumber(dto.getBedNumber()).isPresent()) {
            throw new ConflictException("Bed already exists with bed number: " + dto.getBedNumber());
        }

        Department department = departmentRepository.findById(dto.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + dto.getDepartmentId()));

        Bed bed = Bed.builder()
                .bedNumber(dto.getBedNumber())
                .department(department)
                .bedType(dto.getBedType().toUpperCase())
                .dailyCharge(dto.getDailyCharge())
                .status(dto.getStatus() != null && VALID_STATUSES.contains(dto.getStatus().toUpperCase())
                        ? dto.getStatus().toUpperCase() : "AVAILABLE")
                .notes(dto.getNotes())
                .build();

        Bed saved = bedRepository.save(bed);
        return mapToBedDto(saved);
    }

    @Override
    @Transactional
    public BedDto updateBed(Long id, BedDto dto) {
        Bed bed = bedRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bed not found with ID: " + id));

        Department department = departmentRepository.findById(dto.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + dto.getDepartmentId()));

        bed.setBedNumber(dto.getBedNumber());
        bed.setDepartment(department);
        bed.setBedType(dto.getBedType().toUpperCase());
        bed.setDailyCharge(dto.getDailyCharge());
        if (dto.getStatus() != null && VALID_STATUSES.contains(dto.getStatus().toUpperCase())) {
            bed.setStatus(dto.getStatus().toUpperCase());
        }
        bed.setNotes(dto.getNotes());

        Bed updated = bedRepository.save(bed);
        return mapToBedDto(updated);
    }

    @Override
    @Transactional
    public BedDto updateBedStatus(Long id, String status, Long patientId) {
        Bed bed = bedRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bed not found with ID: " + id));

        String upperStatus = status.toUpperCase();
        if (!VALID_STATUSES.contains(upperStatus)) {
            throw new BadRequestException("Invalid bed status: " + status + ". Allowed: " + VALID_STATUSES);
        }

        bed.setStatus(upperStatus);

        if ("OCCUPIED".equals(upperStatus)) {
            if (patientId != null) {
                Patient patient = patientRepository.findById(patientId)
                        .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + patientId));
                bed.setCurrentPatient(patient);
            }
            if (bed.getAdmissionDate() == null) {
                bed.setAdmissionDate(LocalDateTime.now());
            }
            bed.setDischargeDate(null);
        } else if ("AVAILABLE".equals(upperStatus)) {
            if (bed.getCurrentPatient() != null && bed.getAdmissionDate() != null) {
                bed.setDischargeDate(LocalDateTime.now());
            }
            bed.setCurrentPatient(null);
        }

        Bed updated = bedRepository.save(bed);
        return mapToBedDto(updated);
    }

    @Override
    @Transactional
    public void deleteBed(Long id) {
        Bed bed = bedRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bed not found with ID: " + id));
        bedRepository.delete(bed);
    }

    // Reservations
    @Override
    @Transactional(readOnly = true)
    public List<BedReservationDto> getAllReservations(Long patientId, Long departmentId, String bedType, String status, String search) {
        return bedReservationRepository.filterReservations(patientId, departmentId, bedType, status, search)
                .stream()
                .map(this::mapToReservationDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BedReservationDto> getAllReservationsPaged(Long patientId, Long departmentId, String bedType, String status, String search, Pageable pageable) {
        return bedReservationRepository.filterReservationsPaged(patientId, departmentId, bedType, status, search, pageable)
                .map(this::mapToReservationDto);
    }

    @Override
    @Transactional(readOnly = true)
    public BedReservationDto getReservationById(Long id) {
        BedReservation res = bedReservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bed reservation not found with ID: " + id));
        return mapToReservationDto(res);
    }

    @Override
    @Transactional
    public BedReservationDto createReservation(BedReservationDto dto) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + dto.getPatientId()));

        Bed bed = null;
        if (dto.getBedId() != null) {
            bed = bedRepository.findById(dto.getBedId())
                    .orElseThrow(() -> new ResourceNotFoundException("Bed not found with ID: " + dto.getBedId()));

            if (!"AVAILABLE".equalsIgnoreCase(bed.getStatus())) {
                throw new ConflictException("Bed " + bed.getBedNumber() + " is currently " + bed.getStatus() + " and cannot be reserved");
            }

            boolean hasConflict = bedReservationRepository.existsActiveReservationForBed(bed.getId(), null);
            if (hasConflict) {
                throw new ConflictException("Bed " + bed.getBedNumber() + " already has an active reservation");
            }
            bed.setStatus("RESERVED");
            bedRepository.save(bed);
        } else {
            // Auto-assign an available bed in department matching bed type if available
            Long deptId = dto.getDepartmentId();
            String requestedBedType = dto.getBedType() != null ? dto.getBedType().toUpperCase() : null;
            List<Bed> availBeds = bedRepository.searchBeds(deptId, requestedBedType, "AVAILABLE", null);
            if (!availBeds.isEmpty()) {
                bed = availBeds.get(0);
                bed.setStatus("RESERVED");
                bedRepository.save(bed);
            }
        }

        Department department = null;
        if (dto.getDepartmentId() != null) {
            department = departmentRepository.findById(dto.getDepartmentId()).orElse(null);
        } else if (bed != null) {
            department = bed.getDepartment();
        }

        long count = bedReservationRepository.count();
        String resCode = String.format("RES-%04d", 5000 + count + 1);

        BedReservation reservation = BedReservation.builder()
                .reservationCode(resCode)
                .bed(bed)
                .patient(patient)
                .department(department)
                .bedType(dto.getBedType() != null ? dto.getBedType().toUpperCase() : (bed != null ? bed.getBedType() : "GENERAL"))
                .reservationDate(dto.getReservationDate())
                .admissionDate(dto.getAdmissionDate())
                .reason(dto.getReason())
                .status("PENDING")
                .notes(dto.getNotes())
                .build();

        BedReservation saved = bedReservationRepository.save(reservation);
        return mapToReservationDto(saved);
    }

    @Override
    @Transactional
    public BedReservationDto updateReservationStatus(Long id, String status, String notes) {
        BedReservation res = bedReservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with ID: " + id));

        String upperStatus = status.toUpperCase();
        if (!VALID_RESERVATION_STATUSES.contains(upperStatus)) {
            throw new BadRequestException("Invalid reservation status: " + status + ". Allowed: " + VALID_RESERVATION_STATUSES);
        }

        res.setStatus(upperStatus);
        if (notes != null) res.setNotes(notes);

        if ("CANCELLED".equals(upperStatus) || "EXPIRED".equals(upperStatus)) {
            if (res.getBed() != null && ("RESERVED".equals(res.getBed().getStatus()) || "OCCUPIED".equals(res.getBed().getStatus()))) {
                res.getBed().setStatus("AVAILABLE");
                res.getBed().setCurrentPatient(null);
                bedRepository.save(res.getBed());
            }
        } else if ("CONFIRMED".equals(upperStatus)) {
            if (res.getBed() == null) {
                Long deptId = res.getDepartment() != null ? res.getDepartment().getId() : null;
                String bedType = res.getBedType();
                List<Bed> availBeds = bedRepository.searchBeds(deptId, bedType, "AVAILABLE", null);
                if (!availBeds.isEmpty()) {
                    res.setBed(availBeds.get(0));
                }
            }
            if (res.getBed() != null) {
                res.getBed().setStatus("OCCUPIED");
                res.getBed().setCurrentPatient(res.getPatient());
                if (res.getBed().getAdmissionDate() == null) {
                    res.getBed().setAdmissionDate(LocalDateTime.now());
                }
                bedRepository.save(res.getBed());
            }

            try {
                notificationService.notifyBedReservationConfirmation(res);
            } catch (Exception e) {
                // Log and swallow so status update succeeds even if notification dispatch encounters network issue
            }
        }

        BedReservation updated = bedReservationRepository.save(res);
        return mapToReservationDto(updated);
    }

    private BedDto mapToBedDto(Bed b) {
        return BedDto.builder()
                .id(b.getId())
                .bedNumber(b.getBedNumber())
                .departmentId(b.getDepartment() != null ? b.getDepartment().getId() : null)
                .departmentName(b.getDepartment() != null ? b.getDepartment().getName() : null)
                .bedType(b.getBedType())
                .dailyCharge(b.getDailyCharge())
                .status(b.getStatus())
                .currentPatientId(b.getCurrentPatient() != null ? b.getCurrentPatient().getId() : null)
                .currentPatientName(b.getCurrentPatient() != null ? b.getCurrentPatient().getFullName() : null)
                .currentPatientCode(b.getCurrentPatient() != null ? b.getCurrentPatient().getPatientCode() : null)
                .admissionDate(b.getAdmissionDate())
                .dischargeDate(b.getDischargeDate())
                .notes(b.getNotes())
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .build();
    }

    private BedReservationDto mapToReservationDto(BedReservation r) {
        return BedReservationDto.builder()
                .id(r.getId())
                .reservationCode(r.getReservationCode())
                .bedId(r.getBed() != null ? r.getBed().getId() : null)
                .bedNumber(r.getBed() != null ? r.getBed().getBedNumber() : null)
                .patientId(r.getPatient() != null ? r.getPatient().getId() : null)
                .patientName(r.getPatient() != null ? r.getPatient().getFullName() : null)
                .patientCode(r.getPatient() != null ? r.getPatient().getPatientCode() : null)
                .departmentId(r.getDepartment() != null ? r.getDepartment().getId() : null)
                .departmentName(r.getDepartment() != null ? r.getDepartment().getName() : null)
                .bedType(r.getBedType())
                .reservationDate(r.getReservationDate())
                .admissionDate(r.getAdmissionDate())
                .reason(r.getReason())
                .status(r.getStatus())
                .notes(r.getNotes())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
