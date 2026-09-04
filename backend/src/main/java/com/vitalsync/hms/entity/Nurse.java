package com.vitalsync.hms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "nurses")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Nurse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nurse_code", unique = true, nullable = false, length = 20)
    private String nurseCode;

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

    @Column
    private LocalDate dob;

    @Column(length = 20)
    private String gender;

    @Column(name = "blood_group", length = 10)
    private String bloodGroup;

    @Column(length = 255)
    private String address;

    @Column(length = 100)
    private String qualification;

    @Column(length = 50)
    private String experience;

    @Column(name = "license_number", length = 50)
    private String licenseNumber;

    @Column(name = "joining_date")
    private LocalDate joiningDate;

    @Column(length = 50)
    @Builder.Default
    private String shift = "Day Shift"; // Day Shift, Night Shift, Rotational

    @Column(name = "employment_status", length = 50)
    @Builder.Default
    private String employmentStatus = "Full-Time"; // Full-Time, Part-Time, Contract

    @Column(length = 20)
    @Builder.Default
    private String status = "Active"; // Active, Inactive, On Leave

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
            status = "Active";
        }
        if (shift == null) {
            shift = "Day Shift";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
