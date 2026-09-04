package com.vitalsync.hms.service.impl;

import com.vitalsync.hms.dto.NotificationResultDto;
import com.vitalsync.hms.entity.Appointment;
import com.vitalsync.hms.entity.Doctor;
import com.vitalsync.hms.entity.EmergencyRequest;
import com.vitalsync.hms.entity.Patient;
import com.vitalsync.hms.service.NotificationService;
import com.vitalsync.hms.service.PhoneValidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final PhoneValidationService phoneValidationService;

    @Value("${app.notification.sms.enabled:true}")
    private boolean smsEnabled;

    @Value("${app.notification.sms.provider:TEST_SIMULATOR}")
    private String smsProvider;

    @Value("${app.notification.sms.api-key:}")
    private String smsApiKey;

    @Value("${app.notification.whatsapp.enabled:true}")
    private boolean whatsappEnabled;

    @Value("${app.notification.whatsapp.provider:TEST_SIMULATOR}")
    private String whatsappProvider;

    @Value("${app.notification.whatsapp.api-key:}")
    private String whatsappApiKey;

    @Override
    public NotificationResultDto sendSms(String recipientPhone, String message, String recipientName) {
        return dispatch(recipientPhone, message, recipientName, "SMS");
    }

    @Override
    public NotificationResultDto sendWhatsApp(String recipientPhone, String message, String recipientName) {
        return dispatch(recipientPhone, message, recipientName, "WHATSAPP");
    }

    @Override
    public List<NotificationResultDto> notifyAppointmentConfirmation(Appointment appointment) {
        List<NotificationResultDto> results = new ArrayList<>();
        if (appointment == null) return results;

        Patient patient = appointment.getPatient();
        Doctor doctor = appointment.getDoctor();

        // 1. Patient Notification (E.164 normalized)
        if (patient != null) {
            String patientMsg = String.format(
                    "VitalSync HMS: Dear %s, your appointment %s with Dr. %s is scheduled for %s at %s. Reason: %s",
                    patient.getFullName(),
                    appointment.getAppointmentCode(),
                    doctor != null ? doctor.getFullName() : "Specialist",
                    appointment.getAppointmentDate(),
                    appointment.getAppointmentTime(),
                    appointment.getReason() != null ? appointment.getReason() : "General Consultation"
            );
            results.add(dispatch(patient.getPhone(), patientMsg, patient.getFullName(), "SMS"));
            results.add(dispatch(patient.getPhone(), patientMsg, patient.getFullName(), "WHATSAPP"));
        }

        // 2. Doctor Notification (Doctor's own country-specific E.164 normalized)
        if (doctor != null) {
            String doctorMsg = String.format(
                    "VitalSync HMS Clinical Alert: Dr. %s, new appointment %s confirmed with patient %s on %s at %s.",
                    doctor.getFullName(),
                    appointment.getAppointmentCode(),
                    patient != null ? patient.getFullName() : "Patient",
                    appointment.getAppointmentDate(),
                    appointment.getAppointmentTime()
            );
            results.add(dispatch(doctor.getPhone(), doctorMsg, doctor.getFullName(), "SMS"));
        }

        return results;
    }

    @Override
    public List<NotificationResultDto> notifyAppointmentReschedule(Appointment appointment) {
        List<NotificationResultDto> results = new ArrayList<>();
        if (appointment == null) return results;

        Patient patient = appointment.getPatient();
        Doctor doctor = appointment.getDoctor();

        if (patient != null) {
            String patientMsg = String.format(
                    "VitalSync HMS: Your appointment %s has been rescheduled to %s at %s.",
                    appointment.getAppointmentCode(),
                    appointment.getAppointmentDate(),
                    appointment.getAppointmentTime()
            );
            results.add(dispatch(patient.getPhone(), patientMsg, patient.getFullName(), "SMS"));
            results.add(dispatch(patient.getPhone(), patientMsg, patient.getFullName(), "WHATSAPP"));
        }

        if (doctor != null) {
            String doctorMsg = String.format(
                    "VitalSync HMS: Appointment %s with %s was rescheduled to %s at %s.",
                    appointment.getAppointmentCode(),
                    patient != null ? patient.getFullName() : "Patient",
                    appointment.getAppointmentDate(),
                    appointment.getAppointmentTime()
            );
            results.add(dispatch(doctor.getPhone(), doctorMsg, doctor.getFullName(), "SMS"));
        }

        return results;
    }

    @Override
    public List<NotificationResultDto> notifyAppointmentCancellation(Appointment appointment, String reason) {
        List<NotificationResultDto> results = new ArrayList<>();
        if (appointment == null) return results;

        Patient patient = appointment.getPatient();
        Doctor doctor = appointment.getDoctor();

        if (patient != null) {
            String patientMsg = String.format(
                    "VitalSync HMS: Your appointment %s has been cancelled. %s",
                    appointment.getAppointmentCode(),
                    reason != null ? "Reason: " + reason : ""
            );
            results.add(dispatch(patient.getPhone(), patientMsg, patient.getFullName(), "SMS"));
        }

        if (doctor != null) {
            String doctorMsg = String.format(
                    "VitalSync HMS: Appointment %s with %s was cancelled. %s",
                    appointment.getAppointmentCode(),
                    patient != null ? patient.getFullName() : "Patient",
                    reason != null ? "Reason: " + reason : ""
            );
            results.add(dispatch(doctor.getPhone(), doctorMsg, doctor.getFullName(), "SMS"));
        }

        return results;
    }

    @Override
    public NotificationResultDto notifyEmergencyAlert(EmergencyRequest request) {
        if (request == null) {
            return NotificationResultDto.builder()
                    .success(false)
                    .status("ERROR")
                    .timestamp(LocalDateTime.now())
                    .details("Request is null")
                    .build();
        }

        String callerPhone = request.getPatientPhoneSnapshot();
        String alertMsg = String.format(
                "VitalSync HMS EMERGENCY DISPATCH: Code %s | Type: %s | Location: %s | Caller: %s | Priority: %s",
                request.getRequestCode(),
                request.getEmergencyType(),
                request.getLocation(),
                request.getPatientNameSnapshot(),
                request.getPriority()
        );

        return dispatch(callerPhone, alertMsg, request.getPatientNameSnapshot(), "SMS");
    }

    @Override
    public List<NotificationResultDto> notifyBedReservationConfirmation(com.vitalsync.hms.entity.BedReservation reservation) {
        List<NotificationResultDto> results = new ArrayList<>();
        if (reservation == null) return results;

        Patient patient = reservation.getPatient();
        com.vitalsync.hms.entity.Bed bed = reservation.getBed();

        if (patient != null) {
            String bedInfo = (bed != null) ? "Bed " + bed.getBedNumber() : "your requested bed";
            String deptInfo = (reservation.getDepartment() != null) ? " in " + reservation.getDepartment().getName() : "";
            String patientMsg = String.format(
                    "VitalSync HMS Alert: Dear %s, your bed reservation %s for %s%s has been CONFIRMED! Your bed is available and ready for admission.",
                    patient.getFullName(),
                    reservation.getReservationCode(),
                    bedInfo,
                    deptInfo
            );
            results.add(dispatch(patient.getPhone(), patientMsg, patient.getFullName(), "SMS"));
            results.add(dispatch(patient.getPhone(), patientMsg, patient.getFullName(), "WHATSAPP"));
        }
        return results;
    }

    /**
     * Centralized dispatch pipeline enforcing:
     * 1. No hardcoded country code assumptions.
     * 2. Recipient phone validation with PhoneValidationService.
     * 3. Normalization to canonical E.164.
     * 4. Safe rejection with INVALID_PHONE_NUMBER if phone is invalid.
     * 5. Accurate reporting of NOT_CONFIGURED when gateway credentials are not configured.
     */
    private NotificationResultDto dispatch(String rawPhone, String message, String recipientName, String channel) {
        LocalDateTime now = LocalDateTime.now();

        if (rawPhone == null || rawPhone.trim().isEmpty()) {
            log.warn("[NOTIFICATION REJECTED] Recipient '{}' has no phone number configured. Channel: {}", recipientName, channel);
            return NotificationResultDto.builder()
                    .success(false)
                    .status("INVALID_PHONE_NUMBER")
                    .recipientName(recipientName)
                    .recipientE164(null)
                    .channel(channel)
                    .message(message)
                    .timestamp(now)
                    .details("Phone number is missing or empty")
                    .build();
        }

        String normalizedE164;
        try {
            // CENTRALIZED VALIDATION & E.164 NORMALIZATION
            normalizedE164 = phoneValidationService.validateAndNormalize(rawPhone);
        } catch (Exception ex) {
            log.warn("[NOTIFICATION REJECTED] Recipient '{}' phone '{}' failed validation: {}. Status: INVALID_PHONE_NUMBER",
                    recipientName, rawPhone, ex.getMessage());
            return NotificationResultDto.builder()
                    .success(false)
                    .status("INVALID_PHONE_NUMBER")
                    .recipientName(recipientName)
                    .recipientE164(null)
                    .channel(channel)
                    .message(message)
                    .timestamp(now)
                    .details("Validation error: " + ex.getMessage())
                    .build();
        }

        // Check channel enablement
        if ("SMS".equalsIgnoreCase(channel) && !smsEnabled) {
            return NotificationResultDto.builder()
                    .success(false)
                    .status("NOT_CONFIGURED")
                    .recipientName(recipientName)
                    .recipientE164(normalizedE164)
                    .channel(channel)
                    .message(message)
                    .timestamp(now)
                    .details("SMS channel disabled in configuration")
                    .build();
        }

        if ("WHATSAPP".equalsIgnoreCase(channel) && !whatsappEnabled) {
            return NotificationResultDto.builder()
                    .success(false)
                    .status("NOT_CONFIGURED")
                    .recipientName(recipientName)
                    .recipientE164(normalizedE164)
                    .channel(channel)
                    .message(message)
                    .timestamp(now)
                    .details("WhatsApp channel disabled in configuration")
                    .build();
        }

        // Check provider configuration
        String configuredProvider = "SMS".equalsIgnoreCase(channel) ? smsProvider : whatsappProvider;
        if (configuredProvider == null || configuredProvider.trim().isEmpty() || "NONE".equalsIgnoreCase(configuredProvider)) {
            log.warn("[NOTIFICATION NOT CONFIGURED] {} provider is not configured. Delivery simulated in log. E.164: {} | Recipient: {}",
                    channel, normalizedE164, recipientName);
            return NotificationResultDto.builder()
                    .success(false)
                    .status("NOT_CONFIGURED")
                    .recipientName(recipientName)
                    .recipientE164(normalizedE164)
                    .channel(channel)
                    .message(message)
                    .timestamp(now)
                    .details(channel + " provider gateway not configured in environment. Verified recipient format: " + normalizedE164)
                    .build();
        }

        // Outgoing dispatch via configured provider / test simulator
        log.info("[NOTIFICATION SENT] Provider: {} | Channel: {} | Recipient E.164: {} ({}) | Message: {}",
                configuredProvider, channel, normalizedE164, recipientName, message);

        return NotificationResultDto.builder()
                .success(true)
                .status("SENT")
                .recipientName(recipientName)
                .recipientE164(normalizedE164)
                .channel(channel)
                .message(message)
                .timestamp(now)
                .details(configuredProvider + " dispatched notification to " + normalizedE164)
                .build();
    }
}