package com.vitalsync.hms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "doctors")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "doctor_code", unique = true, nullable = false, length = 20)
    private String doctorCode;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(unique = true, nullable = false, length = 100)
    private String email;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(nullable = false, length = 100)
    private String specialization;

    @Column(nullable = false, length = 100)
    private String qualification;

    @Column(length = 50)
    private String experience;

    @Column(name = "available_days", length = 100)
    private String availableDays;

    @Column(name = "available_time", length = 100)
    private String availableTime;

    @Column(name = "consultation_fee", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal consultationFee = new BigDecimal("100.00");

    @Column(length = 20)
    @Builder.Default
    private String status = "Available"; // Available, In Surgery, On Leave, Unavailable

    @Column(name = "image_url", length = 1000)
    private String imageUrl;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "Available";
        }
        if (consultationFee == null) {
            consultationFee = new BigDecimal("100.00");
        }
    }
}
