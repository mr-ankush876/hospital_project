package com.vitalsync.hms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "hospital_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HospitalSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "hospital_name", nullable = false, length = 150)
    private String hospitalName = "VitalSync Multi-Specialty Hospital";

    @Column(length = 20)
    private String phone = "+91 (800) 123-4567";

    @Column(length = 100)
    private String email = "info@vitalsync.com";

    @Column(length = 255)
    private String address = "Medical Center Road, Healthcare City, MH 400001";

    @Column(name = "registration_number", length = 100)
    private String registrationNumber = "VS-HOSP-2026-IND";

    @Column(name = "invoice_footer", length = 500)
    private String invoiceFooter = "Thank you for trusting VitalSync Healthcare. Get well soon!";

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
