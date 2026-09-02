package com.vitalsync.hms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyRequestDto {

    private Long id;
    private String requestCode;
    private Long patientId;
    private String patientCode;
    private String patientName;
    private String patientNameSnapshot;

    @NotBlank(message = "Contact number is required")
    private String contactNumber;
    private String patientPhoneSnapshot;

    @NotBlank(message = "Emergency type is required")
    private String emergencyType;

    private String description;
    private String location;
    private Integer peopleAffected;
    private Integer numberOfPeople; // alias
    private String status;   // REQUESTED, ACKNOWLEDGED, HOSPITAL_CONTACTED, AMBULANCE_CONTACTED, IN_PROGRESS, RESOLVED, CANCELLED
    private String contactMethod; // HOSPITAL_EMERGENCY, AMBULANCE, MANUAL_REQUEST
    private String callType; // alias
    private String hospitalEmergencyNumber;
    private String ambulanceNumber;
    private LocalDateTime emergencyCallInitiatedAt;
    private LocalDateTime ambulanceCallInitiatedAt;
    private String priority; // CRITICAL, HIGH, MEDIUM
    private String notes;
    private String acknowledgedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public String getPatientNameSnapshot() {
        return patientNameSnapshot != null ? patientNameSnapshot : patientName;
    }

    public String getPatientPhoneSnapshot() {
        return patientPhoneSnapshot != null ? patientPhoneSnapshot : contactNumber;
    }

    public Integer getPeopleAffected() {
        return peopleAffected != null ? peopleAffected : (numberOfPeople != null ? numberOfPeople : 1);
    }

    public String getContactMethod() {
        return contactMethod != null ? contactMethod : (callType != null ? callType : "HOSPITAL_EMERGENCY");
    }
}