package com.vitalsync.hms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "emergency_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_code", unique = true, nullable = false, length = 30)
    private String requestCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @Column(name = "patient_name_snapshot", nullable = false, length = 100)
    private String patientNameSnapshot;

    @Column(name = "patient_phone_snapshot", nullable = false, length = 25)
    private String patientPhoneSnapshot;

    @Column(name = "emergency_type", nullable = false, length = 100)
    private String emergencyType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 255)
    private String location;

    @Column(name = "people_affected")
    @Builder.Default
    private Integer peopleAffected = 1;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "REQUESTED"; // REQUESTED, ACKNOWLEDGED, HOSPITAL_CONTACTED, AMBULANCE_CONTACTED, IN_PROGRESS, RESOLVED, CANCELLED

    @Column(name = "contact_method", length = 30)
    @Builder.Default
    private String contactMethod = "HOSPITAL_EMERGENCY"; // HOSPITAL_EMERGENCY, AMBULANCE, MANUAL_REQUEST

    @Column(name = "hospital_emergency_number", length = 25)
    @Builder.Default
    private String hospitalEmergencyNumber = "8797254899";

    @Column(name = "ambulance_number", length = 25)
    @Builder.Default
    private String ambulanceNumber = "7888834943";

    @Column(name = "emergency_call_initiated_at")
    private LocalDateTime emergencyCallInitiatedAt;

    @Column(name = "ambulance_call_initiated_at")
    private LocalDateTime ambulanceCallInitiatedAt;

    @Column(length = 20)
    @Builder.Default
    private String priority = "CRITICAL"; // CRITICAL, HIGH, MEDIUM

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "acknowledged_by", length = 100)
    private String acknowledgedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Compatibility getters & setters
    public String getPatientName() {
        return patientNameSnapshot;
    }
    public void setPatientName(String name) {
        this.patientNameSnapshot = name;
    }
    public String getContactNumber() {
        return patientPhoneSnapshot;
    }
    public void setContactNumber(String phone) {
        this.patientPhoneSnapshot = phone;
    }
    public Integer getNumberOfPeople() {
        return peopleAffected;
    }
    public void setNumberOfPeople(Integer num) {
        this.peopleAffected = num;
    }
    public String getCallType() {
        return contactMethod;
    }
    public void setCallType(String type) {
        this.contactMethod = type;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = "REQUESTED";
        }
        if (this.priority == null) {
            this.priority = "CRITICAL";
        }
        if (this.contactMethod == null) {
            this.contactMethod = "HOSPITAL_EMERGENCY";
        }
        if (this.hospitalEmergencyNumber == null) {
            this.hospitalEmergencyNumber = "8797254899";
        }
        if (this.ambulanceNumber == null) {
            this.ambulanceNumber = "7888834943";
        }
        if (this.peopleAffected == null) {
            this.peopleAffected = 1;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}