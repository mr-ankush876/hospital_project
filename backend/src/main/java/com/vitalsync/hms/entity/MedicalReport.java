package com.vitalsync.hms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "medical_reports")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "report_code", unique = true, nullable = false, length = 20)
    private String reportCode;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "doctor_id")
    private Doctor doctor;

    @Column(name = "department_name", length = 100)
    private String departmentName;

    @Column(name = "report_type", nullable = false, length = 100)
    private String reportType; // Blood Chemistry, ECG, Chest X-Ray, MRI Scan, Pathology, Urinalysis, Ultrasound

    @Column(name = "report_date", nullable = false)
    private LocalDate reportDate;

    @Column(length = 500)
    private String symptoms;

    @Column(length = 500)
    private String diagnosis;

    @Column(name = "test_results", length = 2000)
    private String testResults;

    @Column(name = "doctor_notes", length = 2000)
    private String doctorNotes;

    @Column(length = 20)
    @Builder.Default
    private String status = "Final"; // Final, Preliminary, Pending

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "Final";
        }
        if (reportDate == null) {
            reportDate = LocalDate.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
