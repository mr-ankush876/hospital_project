package com.vitalsync.hms.service.impl;

import com.vitalsync.hms.dto.EmergencyRequestDto;
import com.vitalsync.hms.dto.EmergencyStatsDto;
import com.vitalsync.hms.entity.EmergencyRequest;
import com.vitalsync.hms.entity.Patient;
import com.vitalsync.hms.entity.User;
import com.vitalsync.hms.exception.BadRequestException;
import com.vitalsync.hms.exception.ResourceNotFoundException;
import com.vitalsync.hms.exception.UnauthorizedException;
import com.vitalsync.hms.repository.EmergencyRequestRepository;
import com.vitalsync.hms.repository.PatientRepository;
import com.vitalsync.hms.repository.UserRepository;
import com.vitalsync.hms.service.AuditLogService;
import com.vitalsync.hms.service.EmergencyRequestService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmergencyRequestServiceImpl implements EmergencyRequestService {

    private static final Logger log = LoggerFactory.getLogger(EmergencyRequestServiceImpl.class);

    private final EmergencyRequestRepository emergencyRequestRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final com.vitalsync.hms.service.PhoneValidationService phoneValidationService;
    private final com.vitalsync.hms.service.NotificationService notificationService;

    @Value("${app.emergency.hospital-number:8797254899}")
    private String defaultHospitalNumber;

    @Value("${app.emergency.ambulance-number:7888834943}")
    private String defaultAmbulanceNumber;

    private static final Set<String> VALID_STATUSES = Set.of(
            "REQUESTED",
            "ACKNOWLEDGED",
            "HOSPITAL_CONTACTED",
            "AMBULANCE_CONTACTED",
            "IN_PROGRESS",
            "RESOLVED",
            "CANCELLED"
    );

    @Override
    @Transactional
    public EmergencyRequestDto createRequest(EmergencyRequestDto dto, String currentUsername, String clientIp) {
        Patient linkedPatient = null;
        String patientName = dto.getPatientNameSnapshot();
        String contactNumber = dto.getPatientPhoneSnapshot();

        if (currentUsername != null && !currentUsername.isBlank() && !"anonymousUser".equalsIgnoreCase(currentUsername)) {
            User user = userRepository.findByUsername(currentUsername).orElse(null);
            if (user != null) {
                linkedPatient = patientRepository.findByUserId(user.getId()).orElse(null);
                if (linkedPatient != null) {
                    if (patientName == null || patientName.isBlank()) {
                        patientName = linkedPatient.getFullName();
                    }
                    if (contactNumber == null || contactNumber.isBlank()) {
                        contactNumber = linkedPatient.getPhone();
                    }
                } else {
                    if (patientName == null || patientName.isBlank()) {
                        patientName = user.getFullName();
                    }
                    if (contactNumber == null || contactNumber.isBlank()) {
                        contactNumber = user.getPhone();
                    }
                }
            }
        }

        if (patientName == null || patientName.isBlank()) {
            patientName = "Emergency Caller";
        }
        if (contactNumber == null || contactNumber.isBlank()) {
            contactNumber = defaultHospitalNumber;
        } else if (!contactNumber.equals(defaultHospitalNumber)) {
            try {
                contactNumber = phoneValidationService.validateAndNormalize(contactNumber);
            } catch (Exception ignored) {
                contactNumber = contactNumber.trim();
            }
        }

        String requestCode = generateSafeRequestCode();

        String method = dto.getContactMethod() != null && !dto.getContactMethod().isBlank()
                ? dto.getContactMethod() : "HOSPITAL_EMERGENCY";

        String initialStatus = "REQUESTED";
        LocalDateTime hospitalCallAt = null;
        LocalDateTime ambulanceCallAt = null;

        if ("HOSPITAL_EMERGENCY".equalsIgnoreCase(method)) {
            hospitalCallAt = LocalDateTime.now();
            initialStatus = "HOSPITAL_CONTACTED";
        } else if ("AMBULANCE".equalsIgnoreCase(method)) {
            ambulanceCallAt = LocalDateTime.now();
            initialStatus = "AMBULANCE_CONTACTED";
        }

        if (dto.getStatus() != null && VALID_STATUSES.contains(dto.getStatus().toUpperCase())) {
            initialStatus = dto.getStatus().toUpperCase();
        }

        EmergencyRequest request = EmergencyRequest.builder()
                .requestCode(requestCode)
                .patient(linkedPatient)
                .patientNameSnapshot(patientName)
                .patientPhoneSnapshot(contactNumber)
                .emergencyType(dto.getEmergencyType())
                .description(dto.getDescription())
                .location(dto.getLocation() != null && !dto.getLocation().isBlank() ? dto.getLocation() : "Verbal on phone")
                .peopleAffected(dto.getPeopleAffected() != null ? dto.getPeopleAffected() : 1)
                .status(initialStatus)
                .contactMethod(method)
                .hospitalEmergencyNumber(defaultHospitalNumber)
                .ambulanceNumber(defaultAmbulanceNumber)
                .emergencyCallInitiatedAt(hospitalCallAt)
                .ambulanceCallInitiatedAt(ambulanceCallAt)
                .priority(dto.getPriority() != null ? dto.getPriority() : "CRITICAL")
                .notes(dto.getNotes())
                .build();

        EmergencyRequest saved = emergencyRequestRepository.save(request);

        try {
            notificationService.notifyEmergencyAlert(saved);
        } catch (Exception ignored) {
        }

        String usernameForAudit = currentUsername != null ? currentUsername : "anonymous_caller";
        try {
            auditLogService.logAction(
                    usernameForAudit,
                    linkedPatient != null ? "PATIENT" : "PUBLIC",
                    "EMERGENCY_CREATED",
                    "EmergencyRequest",
                    requestCode,
                    "Emergency created: " + method + " (" + dto.getEmergencyType() + ") by " + patientName,
                    clientIp != null ? clientIp : "127.0.0.1"
            );
        } catch (Exception e) {
            log.warn("Failed to write audit log for emergency create: {}", e.getMessage());
        }

        return mapToDto(saved);
    }

    @Override
    @Transactional
    public EmergencyRequestDto recordHospitalCall(Long id, String currentUsername, String clientIp) {
        EmergencyRequest request = emergencyRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency request not found with ID: " + id));

        request.setContactMethod("HOSPITAL_EMERGENCY");
        request.setEmergencyCallInitiatedAt(LocalDateTime.now());
        if ("REQUESTED".equalsIgnoreCase(request.getStatus())) {
            request.setStatus("HOSPITAL_CONTACTED");
        }

        EmergencyRequest updated = emergencyRequestRepository.save(request);

        try {
            auditLogService.logAction(
                    currentUsername != null ? currentUsername : "caller",
                    "PATIENT",
                    "HOSPITAL_CALL_INITIATED",
                    "EmergencyRequest",
                    request.getRequestCode(),
                    "Hospital emergency call initiated to " + request.getHospitalEmergencyNumber(),
                    clientIp != null ? clientIp : "127.0.0.1"
            );
        } catch (Exception e) {
            log.warn("Failed to write audit log for hospital call initiation: {}", e.getMessage());
        }

        return mapToDto(updated);
    }

    @Override
    @Transactional
    public EmergencyRequestDto recordAmbulanceCall(Long id, String currentUsername, String clientIp) {
        EmergencyRequest request = emergencyRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency request not found with ID: " + id));

        request.setContactMethod("AMBULANCE");
        request.setAmbulanceCallInitiatedAt(LocalDateTime.now());
        if ("REQUESTED".equalsIgnoreCase(request.getStatus()) || "HOSPITAL_CONTACTED".equalsIgnoreCase(request.getStatus())) {
            request.setStatus("AMBULANCE_CONTACTED");
        }

        EmergencyRequest updated = emergencyRequestRepository.save(request);

        try {
            auditLogService.logAction(
                    currentUsername != null ? currentUsername : "caller",
                    "PATIENT",
                    "AMBULANCE_CALL_INITIATED",
                    "EmergencyRequest",
                    request.getRequestCode(),
                    "Ambulance call initiated to " + request.getAmbulanceNumber(),
                    clientIp != null ? clientIp : "127.0.0.1"
            );
        } catch (Exception e) {
            log.warn("Failed to write audit log for ambulance call initiation: {}", e.getMessage());
        }

        return mapToDto(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmergencyRequestDto> getAllRequests(String search, String status, String emergencyType, String contactMethod) {
        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        String cleanStatus = (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) ? status.trim() : null;
        String cleanType = (emergencyType != null && !emergencyType.isBlank() && !"ALL".equalsIgnoreCase(emergencyType)) ? emergencyType.trim() : null;
        String cleanMethod = (contactMethod != null && !contactMethod.isBlank() && !"ALL".equalsIgnoreCase(contactMethod)) ? contactMethod.trim() : null;

        List<EmergencyRequest> list;
        if (cleanSearch == null && cleanStatus == null && cleanType == null && cleanMethod == null) {
            list = emergencyRequestRepository.findAllByOrderByCreatedAtDesc();
        } else {
            list = emergencyRequestRepository.searchEmergencies(cleanSearch, cleanStatus, cleanType, cleanMethod);
        }

        return list.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmergencyRequestDto> getMyRequests(String currentUsername) {
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUsername));

        Patient patient = patientRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not linked to user: " + currentUsername));

        return emergencyRequestRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public EmergencyRequestDto getRequestById(Long id, String currentUsername, String role) {
        EmergencyRequest request = emergencyRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency request not found with ID: " + id));

        if ("ROLE_PATIENT".equalsIgnoreCase(role) || "PATIENT".equalsIgnoreCase(role)) {
            User user = userRepository.findByUsername(currentUsername).orElse(null);
            Patient patient = user != null ? patientRepository.findByUserId(user.getId()).orElse(null) : null;
            if (request.getPatient() == null || patient == null || !request.getPatient().getId().equals(patient.getId())) {
                throw new UnauthorizedException("You are not authorized to view another patient's emergency request");
            }
        }

        return mapToDto(request);
    }

    @Override
    @Transactional
    public EmergencyRequestDto updateStatus(Long id, String newStatus, String notes, String currentUsername, String role) {
        if (newStatus == null || !VALID_STATUSES.contains(newStatus.toUpperCase())) {
            throw new BadRequestException("Invalid emergency status. Must be one of: " + VALID_STATUSES);
        }

        String normalizedStatus = newStatus.toUpperCase();

        EmergencyRequest request = emergencyRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency request not found with ID: " + id));

        String oldStatus = request.getStatus();

        // Validate status transitions
        validateStatusTransition(oldStatus, normalizedStatus);

        request.setStatus(normalizedStatus);
        if (notes != null && !notes.isBlank()) {
            String existingNotes = request.getNotes() != null ? request.getNotes() + "\n" : "";
            request.setNotes(existingNotes + "[" + currentUsername + "]: " + notes);
        }
        request.setAcknowledgedBy(currentUsername);

        EmergencyRequest updated = emergencyRequestRepository.save(request);

        try {
            auditLogService.logAction(
                    currentUsername,
                    role,
                    "STATUS_CHANGED",
                    "EmergencyRequest",
                    request.getRequestCode(),
                    "Status changed from '" + oldStatus + "' to '" + normalizedStatus + "'",
                    "127.0.0.1"
            );
        } catch (Exception e) {
            log.warn("Failed to write audit log for status update: {}", e.getMessage());
        }

        return mapToDto(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public EmergencyStatsDto getEmergencyStats() {
        long total = emergencyRequestRepository.count();
        long active = emergencyRequestRepository.countByStatusNotIn(List.of("RESOLVED", "CANCELLED"));
        long ambulance = emergencyRequestRepository.countByAmbulanceCallInitiatedAtIsNotNull();
        long resolved = emergencyRequestRepository.countByStatus("RESOLVED");

        return EmergencyStatsDto.builder()
                .totalRequests(total)
                .activeEmergencies(active)
                .ambulanceContacts(ambulance)
                .resolvedEmergencies(resolved)
                .build();
    }

    private void validateStatusTransition(String currentStatus, String targetStatus) {
        if (currentStatus == null || currentStatus.equalsIgnoreCase(targetStatus)) {
            return;
        }

        // Terminal statuses can only be re-opened to IN_PROGRESS or ACKNOWLEDGED if needed
        if ("RESOLVED".equalsIgnoreCase(currentStatus) && "REQUESTED".equalsIgnoreCase(targetStatus)) {
            throw new BadRequestException("Resolved emergency cannot be reset directly to REQUESTED.");
        }
        if ("CANCELLED".equalsIgnoreCase(currentStatus) && "RESOLVED".equalsIgnoreCase(targetStatus)) {
            throw new BadRequestException("Cancelled emergency cannot be marked directly as RESOLVED.");
        }
    }

    private synchronized String generateSafeRequestCode() {
        int currentYear = Year.now().getValue();
        String prefix = "EMG-" + currentYear + "-";
        long count = emergencyRequestRepository.countByRequestCodeStartingWith(prefix);
        long sequence = count + 1;

        String candidate = String.format("%s%04d", prefix, sequence);
        while (emergencyRequestRepository.findByRequestCode(candidate).isPresent()) {
            sequence++;
            candidate = String.format("%s%04d", prefix, sequence);
        }

        return candidate;
    }

    private EmergencyRequestDto mapToDto(EmergencyRequest req) {
        return EmergencyRequestDto.builder()
                .id(req.getId())
                .requestCode(req.getRequestCode())
                .patientId(req.getPatient() != null ? req.getPatient().getId() : null)
                .patientCode(req.getPatient() != null ? req.getPatient().getPatientCode() : null)
                .patientName(req.getPatientNameSnapshot())
                .patientNameSnapshot(req.getPatientNameSnapshot())
                .contactNumber(req.getPatientPhoneSnapshot())
                .patientPhoneSnapshot(req.getPatientPhoneSnapshot())
                .emergencyType(req.getEmergencyType())
                .description(req.getDescription())
                .location(req.getLocation())
                .peopleAffected(req.getPeopleAffected())
                .numberOfPeople(req.getPeopleAffected())
                .status(req.getStatus())
                .contactMethod(req.getContactMethod())
                .callType(req.getContactMethod())
                .hospitalEmergencyNumber(req.getHospitalEmergencyNumber())
                .ambulanceNumber(req.getAmbulanceNumber())
                .emergencyCallInitiatedAt(req.getEmergencyCallInitiatedAt())
                .ambulanceCallInitiatedAt(req.getAmbulanceCallInitiatedAt())
                .priority(req.getPriority())
                .notes(req.getNotes())
                .acknowledgedBy(req.getAcknowledgedBy())
                .createdAt(req.getCreatedAt())
                .updatedAt(req.getUpdatedAt())
                .build();
    }
}