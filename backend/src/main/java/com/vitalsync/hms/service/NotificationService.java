package com.vitalsync.hms.service;

import com.vitalsync.hms.dto.NotificationResultDto;
import com.vitalsync.hms.entity.Appointment;
import com.vitalsync.hms.entity.EmergencyRequest;

import java.util.List;

public interface NotificationService {

    /**
     * Sends an SMS notification to the given phone number with strict E.164 normalization.
     */
    NotificationResultDto sendSms(String recipientPhone, String message, String recipientName);

    /**
     * Sends a WhatsApp notification to the given phone number with strict E.164 normalization.
     */
    NotificationResultDto sendWhatsApp(String recipientPhone, String message, String recipientName);

    /**
     * Notifies both patient and doctor of a confirmed appointment with individualized E.164 normalization.
     */
    List<NotificationResultDto> notifyAppointmentConfirmation(Appointment appointment);

    /**
     * Notifies both patient and doctor of appointment rescheduling.
     */
    List<NotificationResultDto> notifyAppointmentReschedule(Appointment appointment);

    /**
     * Notifies both patient and doctor of appointment cancellation.
     */
    List<NotificationResultDto> notifyAppointmentCancellation(Appointment appointment, String reason);

    /**
     * Dispatches urgent emergency notification to on-duty team and logs normalized caller callback.
     */
    NotificationResultDto notifyEmergencyAlert(EmergencyRequest request);
}