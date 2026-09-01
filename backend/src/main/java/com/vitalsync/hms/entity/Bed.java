package com.vitalsync.hms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "beds")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Bed {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bed_number", unique = true, nullable = false, length = 20)
    private String bedNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Column(name = "bed_type", nullable = false, length = 30)
    private String bedType; // GENERAL, ICU, EMERGENCY, PRIVATE, SEMI_PRIVATE

    @Column(name = "daily_charge", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal dailyCharge = BigDecimal.ZERO;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "AVAILABLE"; // AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "current_patient_id")
    private Patient currentPatient;

    @Column(name = "admission_date")
    private LocalDateTime admissionDate;

    @Column(name = "discharge_date")
    private LocalDateTime dischargeDate;

    @Column(length = 255)
    private String notes;

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
            status = "AVAILABLE";
        }
        if (dailyCharge == null) {
            dailyCharge = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
