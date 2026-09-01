package com.vitalsync.hms.service.impl;

import com.vitalsync.hms.dto.*;
import com.vitalsync.hms.entity.*;
import com.vitalsync.hms.repository.*;
import com.vitalsync.hms.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchServiceImpl implements SearchService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final BillRepository billRepository;
    private final DepartmentRepository departmentRepository;

    @Override
    @Transactional(readOnly = true)
    public GlobalSearchResultDto globalSearch(String query, Authentication authentication) {
        if (query == null || query.trim().isEmpty()) {
            return GlobalSearchResultDto.builder()
                    .query("")
                    .users(new ArrayList<>())
                    .doctors(new ArrayList<>())
                    .patients(new ArrayList<>())
                    .appointments(new ArrayList<>())
                    .prescriptions(new ArrayList<>())
                    .bills(new ArrayList<>())
                    .departments(new ArrayList<>())
                    .build();
        }

        String q = query.trim();
        GlobalSearchResultDto.GlobalSearchResultDtoBuilder result = GlobalSearchResultDto.builder().query(q);

        boolean isAuthenticated = authentication != null && authentication.isAuthenticated();
        String role = "";
        String username = "";
        if (isAuthenticated) {
            username = authentication.getName();
            role = authentication.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .findFirst()
                    .orElse("");
        }

        // 1. Doctors & Departments (Always searchable by everyone)
        List<DoctorDto> doctors = doctorRepository.searchByQuery(q).stream()
                .map(this::mapDoctorToDto)
                .collect(Collectors.toList());
        result.doctors(doctors);

        List<DepartmentDto> departments = departmentRepository.searchDepartments(q, null).stream()
                .map(this::mapDepartmentToDto)
                .collect(Collectors.toList());
        result.departments(departments);

        // Role-based visibility for sensitive medical and financial data:
        if (role.equals("ROLE_ADMIN")) {
            // ADMIN sees everything
            result.users(userRepository.searchByQuery(q).stream().map(this::mapUserToDto).collect(Collectors.toList()));
            result.patients(patientRepository.searchByQuery(q).stream().map(this::mapPatientToDto).collect(Collectors.toList()));
            result.appointments(appointmentRepository.searchByQuery(q).stream().map(this::mapAppointmentToDto).collect(Collectors.toList()));
            result.prescriptions(prescriptionRepository.searchByQuery(q).stream().map(this::mapPrescriptionToDto).collect(Collectors.toList()));
            result.bills(billRepository.searchByQuery(q).stream().map(this::mapBillToDto).collect(Collectors.toList()));
        } else if (role.equals("ROLE_RECEPTIONIST")) {
            // RECEPTIONIST sees patients, appointments, bills
            result.patients(patientRepository.searchByQuery(q).stream().map(this::mapPatientToDto).collect(Collectors.toList()));
            result.appointments(appointmentRepository.searchByQuery(q).stream().map(this::mapAppointmentToDto).collect(Collectors.toList()));
            result.bills(billRepository.searchByQuery(q).stream().map(this::mapBillToDto).collect(Collectors.toList()));
        } else if (role.equals("ROLE_DOCTOR")) {
            // DOCTOR sees assigned patients, their own appointments and prescriptions
            Optional<Doctor> docOpt = doctorRepository.findByEmail(username);
            if (docOpt.isEmpty()) {
                Optional<User> uOpt = userRepository.findByUsername(username);
                if (uOpt.isPresent()) {
                    docOpt = doctorRepository.findByUserId(uOpt.get().getId());
                    if (docOpt.isEmpty()) {
                        docOpt = doctorRepository.findByEmail(uOpt.get().getEmail());
                    }
                }
            }

            if (docOpt.isPresent()) {
                Long docId = docOpt.get().getId();
                result.patients(patientRepository.searchByQuery(q).stream().map(this::mapPatientToDto).collect(Collectors.toList()));
                result.appointments(appointmentRepository.filterAppointments(docId, null, null, null, q).stream().map(this::mapAppointmentToDto).collect(Collectors.toList()));
                result.prescriptions(prescriptionRepository.filterPrescriptions(null, docId, null, q).stream().map(this::mapPrescriptionToDto).collect(Collectors.toList()));
            } else {
                result.patients(patientRepository.searchByQuery(q).stream().map(this::mapPatientToDto).collect(Collectors.toList()));
            }
        } else if (role.equals("ROLE_PATIENT")) {
            // PATIENT only sees their own appointments, prescriptions, bills
            Optional<Patient> patOpt = patientRepository.findByEmail(username);
            if (patOpt.isEmpty()) {
                Optional<User> uOpt = userRepository.findByUsername(username);
                if (uOpt.isPresent()) {
                    patOpt = patientRepository.findByUserId(uOpt.get().getId());
                    if (patOpt.isEmpty()) {
                        patOpt = patientRepository.findByEmail(uOpt.get().getEmail());
                    }
                }
            }

            if (patOpt.isPresent()) {
                Long patId = patOpt.get().getId();
                result.appointments(appointmentRepository.filterAppointments(null, patId, null, null, q).stream().map(this::mapAppointmentToDto).collect(Collectors.toList()));
                result.prescriptions(prescriptionRepository.filterPrescriptions(patId, null, null, q).stream().map(this::mapPrescriptionToDto).collect(Collectors.toList()));
                result.bills(billRepository.filterBills(patId, null, null, q).stream().map(this::mapBillToDto).collect(Collectors.toList()));
            }
        }

        return result.build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDto> searchUsers(String query) {
        String clean = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        return userRepository.searchByQuery(clean).stream()
                .map(this::mapUserToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PatientDto> searchPatients(String query) {
        String clean = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        return patientRepository.searchByQuery(clean).stream()
                .map(this::mapPatientToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DoctorDto> searchDoctors(String query) {
        String clean = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        return doctorRepository.searchByQuery(clean).stream()
                .map(this::mapDoctorToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentDto> searchAppointments(String query) {
        String clean = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        return appointmentRepository.searchByQuery(clean).stream()
                .map(this::mapAppointmentToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PrescriptionDto> searchPrescriptions(String query) {
        String clean = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        return prescriptionRepository.searchByQuery(clean).stream()
                .map(this::mapPrescriptionToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BillDto> searchBills(String query) {
        String clean = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        return billRepository.searchByQuery(clean).stream()
                .map(this::mapBillToDto)
                .collect(Collectors.toList());
    }

    private UserDto mapUserToDto(User u) {
        return UserDto.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .phone(u.getPhone())
                .role(u.getRole())
                .status(u.getStatus())
                .lastLoginAt(u.getLastLoginAt())
                .createdAt(u.getCreatedAt())
                .updatedAt(u.getUpdatedAt())
                .build();
    }

    private PatientDto mapPatientToDto(Patient p) {
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

    private DoctorDto mapDoctorToDto(Doctor d) {
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

    private AppointmentDto mapAppointmentToDto(Appointment a) {
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

    private PrescriptionDto mapPrescriptionToDto(Prescription p) {
        List<PrescriptionMedicineDto> medDtos = (p.getMedicines() != null)
                ? p.getMedicines().stream()
                .map(m -> PrescriptionMedicineDto.builder()
                        .id(m.getId())
                        .medicineName(m.getMedicineName())
                        .dosage(m.getDosage())
                        .frequency(m.getFrequency())
                        .duration(m.getDuration())
                        .build())
                .collect(Collectors.toList())
                : new ArrayList<>();

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
                .medicines(medDtos)
                .createdAt(p.getCreatedAt())
                .build();
    }

    private BillDto mapBillToDto(Bill b) {
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

    private DepartmentDto mapDepartmentToDto(Department d) {
        return DepartmentDto.builder()
                .id(d.getId())
                .name(d.getName())
                .departmentCode(d.getDepartmentCode())
                .description(d.getDescription())
                .headDoctorName(d.getHeadDoctorName())
                .status(d.getStatus())
                .build();
    }
}
