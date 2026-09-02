package com.vitalsync.hms.service.impl;

import com.vitalsync.hms.dto.*;
import com.vitalsync.hms.entity.*;
import com.vitalsync.hms.exception.BadRequestException;
import com.vitalsync.hms.exception.ConflictException;
import com.vitalsync.hms.exception.ForbiddenException;
import com.vitalsync.hms.exception.ResourceNotFoundException;
import com.vitalsync.hms.repository.*;
import com.vitalsync.hms.service.AuditLogService;
import com.vitalsync.hms.service.BedService;
import com.vitalsync.hms.service.PatientPortalService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientPortalServiceImpl implements PatientPortalService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final MedicalReportRepository medicalReportRepository;
    private final BillRepository billRepository;
    private final BedReservationRepository bedReservationRepository;
    private final BedService bedService;
    private final AuditLogService auditLogService;
    private final com.vitalsync.hms.service.PhoneValidationService phoneValidationService;

    private Patient resolveCurrentPatient(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));

        return patientRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    // Fallback to match by email if user_id link is not yet established
                    return patientRepository.findByEmail(user.getEmail())
                            .orElseThrow(() -> new ResourceNotFoundException("No patient profile linked to account: " + username));
                });
    }

    @Override
    @Transactional(readOnly = true)
    public PatientDashboardDto getDashboard(String username) {
        Patient patient = resolveCurrentPatient(username);
        Long pid = patient.getId();

        List<Appointment> allApts = appointmentRepository.findByPatientId(pid);
        long totalApts = allApts.size();
        long upcomingApts = allApts.stream()
                .filter(a -> !"Completed".equalsIgnoreCase(a.getStatus()) && !"Cancelled".equalsIgnoreCase(a.getStatus()))
                .count();
        long completedApts = allApts.stream()
                .filter(a -> "Completed".equalsIgnoreCase(a.getStatus()))
                .count();

        Appointment nextApt = allApts.stream()
                .filter(a -> !"Completed".equalsIgnoreCase(a.getStatus()) && !"Cancelled".equalsIgnoreCase(a.getStatus()))
                .filter(a -> !a.getAppointmentDate().isBefore(LocalDate.now()))
                .min((a1, a2) -> a1.getAppointmentDate().compareTo(a2.getAppointmentDate()))
                .orElse(null);

        List<Prescription> prescriptions = prescriptionRepository.findByPatientId(pid);
        List<MedicalReport> reports = medicalReportRepository.findByPatientId(pid);
        List<Bill> bills = billRepository.findByPatientId(pid);
        long pendingBills = bills.stream().filter(b -> "Pending".equalsIgnoreCase(b.getPaymentStatus())).count();

        PatientDto patientDto = PatientDto.builder()
                .id(patient.getId())
                .patientCode(patient.getPatientCode())
                .fullName(patient.getFullName())
                .email(patient.getEmail())
                .phone(patient.getPhone())
                .gender(patient.getGender())
                .bloodGroup(patient.getBloodGroup())
                .dob(patient.getDob())
                .age(patient.getAge())
                .address(patient.getAddress())
                .emergencyContact(patient.getEmergencyContact())
                .medicalHistory(patient.getMedicalHistory())
                .allergies(patient.getAllergies())
                .status(patient.getStatus())
                .build();

        return PatientDashboardDto.builder()
                .patient(patientDto)
                .totalAppointments(totalApts)
                .upcomingAppointments(upcomingApts)
                .completedAppointments(completedApts)
                .totalPrescriptions(prescriptions.size())
                .totalReports(reports.size())
                .pendingBills(pendingBills)
                .nextAppointment(nextApt != null ? mapToAppointmentDto(nextApt) : null)
                .recentAppointments(allApts.stream().limit(5).map(this::mapToAppointmentDto).collect(Collectors.toList()))
                .recentPrescriptions(prescriptions.stream().limit(5).map(this::mapToPrescriptionDto).collect(Collectors.toList()))
                .recentReports(reports.stream().limit(5).map(this::mapToReportDto).collect(Collectors.toList()))
                .recentBills(bills.stream().limit(5).map(this::mapToBillDto).collect(Collectors.toList()))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PatientDto getProfile(String username) {
        Patient patient = resolveCurrentPatient(username);
        return mapToPatientDto(patient);
    }

    @Override
    @Transactional
    public PatientDto updateProfile(String username, PatientDto dto) {
        Patient patient = resolveCurrentPatient(username);

        if (dto.getPhone() != null && !dto.getPhone().trim().isEmpty()) {
            String normPhone = phoneValidationService.validateAndNormalize(dto.getPhone());
            patient.setPhone(normPhone);
            if (patient.getUser() != null) {
                patient.getUser().setPhone(normPhone);
            }
        }
        if (dto.getAddress() != null) patient.setAddress(dto.getAddress());
        if (dto.getEmergencyContact() != null && !dto.getEmergencyContact().trim().isEmpty()) {
            patient.setEmergencyContact(phoneValidationService.validateAndNormalize(dto.getEmergencyContact()));
        }
        if (dto.getMedicalHistory() != null) patient.setMedicalHistory(dto.getMedicalHistory());
        if (dto.getAllergies() != null) patient.setAllergies(dto.getAllergies());

        Patient saved = patientRepository.save(patient);
        auditLogService.logAction(username, "PATIENT", "UPDATE_PROFILE", "Patient", saved.getId().toString(), "Patient updated personal profile", null);
        return mapToPatientDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentDto> getMyAppointments(String username, String status) {
        Patient patient = resolveCurrentPatient(username);
        return appointmentRepository.filterAppointments(null, patient.getId(), status, null, null)
                .stream()
                .map(this::mapToAppointmentDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AppointmentDto bookAppointment(String username, AppointmentDto dto) {
        Patient patient = resolveCurrentPatient(username);

        if (dto.getDoctorId() == null) {
            throw new BadRequestException("Doctor selection is required for booking");
        }

        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + dto.getDoctorId()));

        if ("Unavailable".equalsIgnoreCase(doctor.getStatus()) || "On Leave".equalsIgnoreCase(doctor.getStatus())) {
            throw new BadRequestException("Doctor " + doctor.getFullName() + " is currently " + doctor.getStatus());
        }

        if (dto.getAppointmentDate() == null || dto.getAppointmentDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Appointment date must be today or in the future");
        }

        // Validate doctor's specific working days
        if (!com.vitalsync.hms.util.DoctorScheduleUtil.isDoctorAvailableOnDate(doctor, dto.getAppointmentDate())) {
            String friendlyDate = com.vitalsync.hms.util.DoctorScheduleUtil.formatFriendlyDate(dto.getAppointmentDate());
            String docName = com.vitalsync.hms.util.DoctorScheduleUtil.formatDoctorName(doctor.getFullName());
            throw new ConflictException(docName + " is not available on " + friendlyDate + ".");
        }

        if (dto.getAppointmentTime() == null || dto.getAppointmentTime().trim().isEmpty()) {
            throw new BadRequestException("Appointment time slot is required");
        }

        // Validate doctor's working hours
        if (!com.vitalsync.hms.util.DoctorScheduleUtil.isTimeWithinWorkingHours(dto.getAppointmentTime(), doctor.getAvailableTime())) {
            String docName = com.vitalsync.hms.util.DoctorScheduleUtil.formatDoctorName(doctor.getFullName());
            throw new BadRequestException("Selected time slot " + dto.getAppointmentTime() + " is outside " + docName + "'s working hours (" + doctor.getAvailableTime() + ")");
        }

        // Prevent double booking for the doctor
        boolean hasConflict = appointmentRepository.existsConflictingAppointment(
                doctor.getId(),
                dto.getAppointmentDate(),
                dto.getAppointmentTime(),
                null
        );

        if (hasConflict) {
            throw new ConflictException("Doctor " + doctor.getFullName() + " already has a booked consultation on "
                    + dto.getAppointmentDate() + " at " + dto.getAppointmentTime() + ". Please select another time slot.");
        }

        long count = appointmentRepository.count();
        String aptCode = String.format("APT-%04d", 3000 + count + (System.currentTimeMillis() % 9000));

        Appointment apt = new Appointment();
        apt.setAppointmentCode(aptCode);
        apt.setPatient(patient);
        apt.setDoctor(doctor);
        apt.setAppointmentDate(dto.getAppointmentDate());
        apt.setAppointmentTime(dto.getAppointmentTime());
        apt.setReason(dto.getReason());
        apt.setNotes(dto.getNotes());
        apt.setStatus("Confirmed");

        Appointment saved = appointmentRepository.save(apt);
        auditLogService.logAction(username, "PATIENT", "BOOK_APPOINTMENT", "Appointment", saved.getId().toString(),
                "Patient booked appointment with " + doctor.getFullName() + " for " + dto.getAppointmentDate(), null);

        return mapToAppointmentDto(saved);
    }

    @Override
    @Transactional
    public AppointmentDto cancelAppointment(String username, Long appointmentId) {
        Patient patient = resolveCurrentPatient(username);
        Appointment apt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + appointmentId));

        if (!apt.getPatient().getId().equals(patient.getId())) {
            throw new ForbiddenException("You are not authorized to cancel this appointment");
        }

        if ("Completed".equalsIgnoreCase(apt.getStatus())) {
            throw new BadRequestException("Completed appointments cannot be cancelled");
        }

        apt.setStatus("Cancelled");
        Appointment updated = appointmentRepository.save(apt);
        auditLogService.logAction(username, "PATIENT", "CANCEL_APPOINTMENT", "Appointment", updated.getId().toString(),
                "Patient cancelled appointment " + apt.getAppointmentCode(), null);

        return mapToAppointmentDto(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PrescriptionDto> getMyPrescriptions(String username) {
        Patient patient = resolveCurrentPatient(username);
        return prescriptionRepository.filterPrescriptions(patient.getId(), null, null, null)
                .stream()
                .map(this::mapToPrescriptionDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PrescriptionDto getMyPrescriptionById(String username, Long id) {
        Patient patient = resolveCurrentPatient(username);
        Prescription rx = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with ID: " + id));

        if (!rx.getPatient().getId().equals(patient.getId())) {
            throw new ForbiddenException("Access denied: You do not own this prescription");
        }

        return mapToPrescriptionDto(rx);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MedicalReportDto> getMyReports(String username) {
        Patient patient = resolveCurrentPatient(username);
        return medicalReportRepository.filterReports(patient.getId(), null, null, null, null, null)
                .stream()
                .map(this::mapToReportDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public MedicalReportDto getMyReportById(String username, Long id) {
        Patient patient = resolveCurrentPatient(username);
        MedicalReport report = medicalReportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medical report not found with ID: " + id));

        if (!report.getPatient().getId().equals(patient.getId())) {
            throw new ForbiddenException("Access denied: You do not own this medical report");
        }

        return mapToReportDto(report);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BillDto> getMyBills(String username) {
        Patient patient = resolveCurrentPatient(username);
        return billRepository.filterBills(patient.getId(), null, null, null)
                .stream()
                .map(this::mapToBillDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BillDto getMyBillById(String username, Long id) {
        Patient patient = resolveCurrentPatient(username);
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with ID: " + id));

        if (!bill.getPatient().getId().equals(patient.getId())) {
            throw new ForbiddenException("Access denied: You do not own this invoice");
        }

        return mapToBillDto(bill);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BedReservationDto> getMyBedReservations(String username) {
        Patient patient = resolveCurrentPatient(username);
        return bedReservationRepository.filterReservations(patient.getId(), null, null, null, null)
                .stream()
                .map(this::mapToBedReservationDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BedReservationDto bookBedReservation(String username, BedReservationDto dto) {
        Patient patient = resolveCurrentPatient(username);
        dto.setPatientId(patient.getId());
        BedReservationDto result = bedService.createReservation(dto);

        auditLogService.logAction(username, "PATIENT", "RESERVE_BED", "BedReservation",
                result.getId() != null ? result.getId().toString() : "N/A",
                "Patient requested bed reservation for type " + dto.getBedType(), null);

        return result;
    }

    // Mapping helpers
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

    private PrescriptionDto mapToPrescriptionDto(Prescription p) {
        List<PrescriptionMedicineDto> meds = (p.getMedicines() != null) ? p.getMedicines().stream()
                .map(m -> PrescriptionMedicineDto.builder()
                        .id(m.getId())
                        .medicineName(m.getMedicineName())
                        .dosage(m.getDosage())
                        .frequency(m.getFrequency())
                        .duration(m.getDuration())
                        .build())
                .collect(Collectors.toList()) : new java.util.ArrayList<>();

        return PrescriptionDto.builder()
                .id(p.getId())
                .prescriptionCode(p.getPrescriptionCode())
                .patientId(p.getPatient() != null ? p.getPatient().getId() : null)
                .patientName(p.getPatient() != null ? p.getPatient().getFullName() : null)
                .patientCode(p.getPatient() != null ? p.getPatient().getPatientCode() : null)
                .doctorId(p.getDoctor() != null ? p.getDoctor().getId() : null)
                .doctorName(p.getDoctor() != null ? p.getDoctor().getFullName() : null)
                .prescriptionDate(p.getPrescriptionDate())
                .symptoms(p.getSymptoms())
                .diagnosis(p.getDiagnosis())
                .instructions(p.getInstructions())
                .followUpDate(p.getFollowUpDate())
                .medicines(meds)
                .createdAt(p.getCreatedAt())
                .build();
    }

    private MedicalReportDto mapToReportDto(MedicalReport r) {
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
                .build();
    }

    private BillDto mapToBillDto(Bill b) {
        return BillDto.builder()
                .id(b.getId())
                .billCode(b.getBillCode())
                .patientId(b.getPatient() != null ? b.getPatient().getId() : null)
                .patientName(b.getPatient() != null ? b.getPatient().getFullName() : null)
                .patientCode(b.getPatient() != null ? b.getPatient().getPatientCode() : null)
                .doctorId(b.getDoctor() != null ? b.getDoctor().getId() : null)
                .doctorName(b.getDoctor() != null ? b.getDoctor().getFullName() : null)
                .billDate(b.getBillDate())
                .consultationFee(b.getConsultationFee())
                .medicineCharges(b.getMedicineCharges())
                .otherCharges(b.getOtherCharges())
                .discount(b.getDiscount())
                .tax(b.getTax())
                .totalAmount(b.getTotalAmount())
                .paymentMethod(b.getPaymentMethod())
                .paymentStatus(b.getPaymentStatus())
                .createdAt(b.getCreatedAt())
                .build();
    }

    private BedReservationDto mapToBedReservationDto(BedReservation r) {
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
                .build();
    }
}
