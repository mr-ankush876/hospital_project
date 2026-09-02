package com.vitalsync.hms;

import com.vitalsync.hms.dto.HospitalSettingDto;
import com.vitalsync.hms.dto.NotificationResultDto;
import com.vitalsync.hms.entity.Appointment;
import com.vitalsync.hms.entity.Doctor;
import com.vitalsync.hms.entity.Patient;
import com.vitalsync.hms.entity.User;
import com.vitalsync.hms.exception.BadRequestException;
import com.vitalsync.hms.repository.DoctorRepository;
import com.vitalsync.hms.repository.UserRepository;
import com.vitalsync.hms.service.NotificationService;
import com.vitalsync.hms.service.SettingService;
import com.vitalsync.hms.service.UserManagementService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class NotificationAndPhoneAuditTest {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private SettingService settingService;

    @Autowired
    private UserManagementService userManagementService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Test
    @DisplayName("Notification Service - Valid E.164 Normalization for India & US")
    void testNotificationServiceE164Normalization() {
        // India
        NotificationResultDto indiaRes = notificationService.sendSms("9876543210", "Test SMS", "Test Indian Patient");
        assertTrue(indiaRes.isSuccess());
        assertEquals("SENT", indiaRes.getStatus());
        assertEquals("+919876543210", indiaRes.getRecipientE164());

        // US
        NotificationResultDto usRes = notificationService.sendSms("+1 202-555-0173", "Test SMS", "Test US Doctor");
        assertTrue(usRes.isSuccess());
        assertEquals("SENT", usRes.getStatus());
        assertEquals("+12025550173", usRes.getRecipientE164());
    }

    @Test
    @DisplayName("Notification Service - Refuses Invalid Numbers with INVALID_PHONE_NUMBER status")
    void testNotificationServiceRejectsInvalidPhone() {
        // Incomplete number
        NotificationResultDto res1 = notificationService.sendSms("12345", "Test", "Incomplete");
        assertFalse(res1.isSuccess());
        assertEquals("INVALID_PHONE_NUMBER", res1.getStatus());
        assertNull(res1.getRecipientE164());

        // Missing / Empty number
        NotificationResultDto res2 = notificationService.sendSms("", "Test", "Empty");
        assertFalse(res2.isSuccess());
        assertEquals("INVALID_PHONE_NUMBER", res2.getStatus());

        // Oversized / direct bypass number
        NotificationResultDto res3 = notificationService.sendSms("+91 987654321012345", "Test", "Bypass");
        assertFalse(res3.isSuccess());
        assertEquals("INVALID_PHONE_NUMBER", res3.getStatus());
    }

    @Test
    @DisplayName("Appointment Notifications - Independent E.164 Normalization for Patient & Doctor")
    void testAppointmentNotificationNormalizesIndependently() {
        Patient patient = new Patient();
        patient.setFullName("Aarav Patel");
        patient.setPhone("+91 98765 43210");

        Doctor doctor = new Doctor();
        doctor.setFullName("Dr. Elizabeth Taylor");
        doctor.setPhone("+44 7911 123456");

        Appointment appointment = new Appointment();
        appointment.setAppointmentCode("APT-9999");
        appointment.setAppointmentDate(LocalDate.now().plusDays(2));
        appointment.setAppointmentTime("10:00 AM");
        appointment.setReason("Annual Physical Exam");
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);

        List<NotificationResultDto> results = notificationService.notifyAppointmentConfirmation(appointment);
        assertNotNull(results);
        assertEquals(3, results.size()); // Patient SMS, Patient WhatsApp, Doctor SMS

        // Patient SMS
        NotificationResultDto patientSms = results.get(0);
        assertTrue(patientSms.isSuccess());
        assertEquals("+919876543210", patientSms.getRecipientE164());

        // Patient WhatsApp
        NotificationResultDto patientWa = results.get(1);
        assertTrue(patientWa.isSuccess());
        assertEquals("+919876543210", patientWa.getRecipientE164());

        // Doctor SMS (UK E.164)
        NotificationResultDto doctorSms = results.get(2);
        assertTrue(doctorSms.isSuccess());
        assertEquals("+447911123456", doctorSms.getRecipientE164());
    }

    @Test
    @DisplayName("Admin User Management - Phone Validation & Bypass Prevention on Update")
    void testAdminUserPhoneValidation() {
        User user = User.builder()
                .username("audit_staff_user")
                .password("Password123!")
                .email("audit_staff@vitalsync.com")
                .fullName("Audit Staff")
                .phone("+919876543210")
                .role("DOCTOR")
                .status("ACTIVE")
                .build();
        User saved = userRepository.save(user);

        // Attempting API bypass with invalid phone
        Map<String, Object> invalidUpdate = new HashMap<>();
        invalidUpdate.put("phone", "12345"); // too short
        assertThrows(BadRequestException.class, () ->
                userManagementService.updateUser(saved.getId(), invalidUpdate, "ankush_876"));

        // Valid update
        Map<String, Object> validUpdate = new HashMap<>();
        validUpdate.put("phone", "+1 202 555 0173");
        var updated = userManagementService.updateUser(saved.getId(), validUpdate, "ankush_876");
        assertEquals("+12025550173", updated.getPhone());
    }

    @Test
    @DisplayName("Hospital Setting - Phone, Emergency, Ambulance & Help Center Validation")
    void testHospitalSettingPhoneValidation() {
        HospitalSettingDto dto = settingService.getHospitalProfile();
        dto.setPhone("+91 800 123 4567");
        dto.setEmergencyNumber("8797254899");
        dto.setAmbulanceNumber("7888834943");
        dto.setHelpCenterNumber("+1 202 555 0173");

        HospitalSettingDto saved = settingService.updateHospitalProfile(dto);
        assertEquals("+918001234567", saved.getPhone());
        assertEquals("+918797254899", saved.getEmergencyNumber());
        assertEquals("+917888834943", saved.getAmbulanceNumber());
        assertEquals("+12025550173", saved.getHelpCenterNumber());

        // Attempt to update with invalid emergency number
        dto.setEmergencyNumber("999999999999999999"); // too long
        assertThrows(BadRequestException.class, () -> settingService.updateHospitalProfile(dto));
    }

    @Autowired
    private com.vitalsync.hms.service.DoctorPortalService doctorPortalService;

    @Autowired
    private com.vitalsync.hms.service.PatientPortalService patientPortalService;

    @Autowired
    private com.vitalsync.hms.repository.PatientRepository patientRepository;

    @Test
    @DisplayName("Doctor Portal - Profile Phone Validation & User Account Sync")
    void testDoctorPortalPhoneValidation() {
        User docUser = User.builder()
                .username("dr_audit_portal")
                .password("Password123!")
                .email("dr_audit_portal@vitalsync.com")
                .fullName("Dr. Audit Portal")
                .phone("+919876543210")
                .role("DOCTOR")
                .status("ACTIVE")
                .build();
        User savedUser = userRepository.save(docUser);

        Doctor doctor = Doctor.builder()
                .doctorCode("DOC-9888")
                .user(savedUser)
                .fullName(savedUser.getFullName())
                .email(savedUser.getEmail())
                .phone(savedUser.getPhone())
                .specialization("Cardiology")
                .qualification("MD, FACC")
                .experience("10 Years")
                .availableDays("Mon, Wed, Fri")
                .availableTime("09:00 AM - 05:00 PM")
                .status("Available")
                .build();
        doctorRepository.save(doctor);

        // Attempt bypass with invalid phone
        var badDto = com.vitalsync.hms.dto.DoctorDto.builder()
                .phone("12345")
                .build();
        assertThrows(BadRequestException.class, () ->
                doctorPortalService.updateMyProfile("dr_audit_portal", badDto));

        // Valid phone update
        var goodDto = com.vitalsync.hms.dto.DoctorDto.builder()
                .phone("+44 7911 123456")
                .build();
        var updated = doctorPortalService.updateMyProfile("dr_audit_portal", goodDto);
        assertEquals("+447911123456", updated.getPhone());

        // Verify linked user was synced
        User refetched = userRepository.findById(savedUser.getId()).orElseThrow();
        assertEquals("+447911123456", refetched.getPhone());
    }

    @Test
    @DisplayName("Patient Portal - Profile Phone & Emergency Contact Validation")
    void testPatientPortalPhoneValidation() {
        User patUser = User.builder()
                .username("pat_audit_portal")
                .password("Password123!")
                .email("pat_audit_portal@vitalsync.com")
                .fullName("Pat Audit")
                .phone("+919876543210")
                .role("PATIENT")
                .status("ACTIVE")
                .build();
        User savedUser = userRepository.save(patUser);

        Patient patient = Patient.builder()
                .patientCode("PT-9888")
                .user(savedUser)
                .fullName(savedUser.getFullName())
                .email(savedUser.getEmail())
                .phone(savedUser.getPhone())
                .emergencyContact("+919876543210")
                .dob(LocalDate.of(1994, 5, 20))
                .age(30)
                .gender("Male")
                .bloodGroup("O+")
                .status("Active")
                .build();
        patientRepository.save(patient);

        // Attempt invalid primary phone
        var badPhoneDto = com.vitalsync.hms.dto.PatientDto.builder()
                .phone("999999999999999999")
                .build();
        assertThrows(BadRequestException.class, () ->
                patientPortalService.updateProfile("pat_audit_portal", badPhoneDto));

        // Attempt invalid emergency contact
        var badEmergDto = com.vitalsync.hms.dto.PatientDto.builder()
                .emergencyContact("00000000000000000000")
                .build();
        assertThrows(BadRequestException.class, () ->
                patientPortalService.updateProfile("pat_audit_portal", badEmergDto));

        // Valid update
        var goodDto = com.vitalsync.hms.dto.PatientDto.builder()
                .phone("+1 202 555 0173")
                .emergencyContact("+91 8797254899")
                .build();
        var updated = patientPortalService.updateProfile("pat_audit_portal", goodDto);
        assertEquals("+12025550173", updated.getPhone());
        assertEquals("+918797254899", updated.getEmergencyContact());

        // Verify linked user phone was synced
        User refetched = userRepository.findById(savedUser.getId()).orElseThrow();
        assertEquals("+12025550173", refetched.getPhone());
    }
}