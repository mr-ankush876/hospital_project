package com.vitalsync.hms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bed_reservations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BedReservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reservation_code", unique = true, nullable = false, length = 20)
    private String reservationCode;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "bed_id")
    private Bed bed;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(name = "bed_type", nullable = false, length = 30)
    private String bedType; // GENERAL, ICU, EMERGENCY, PRIVATE, SEMI_PRIVATE

    @Column(name = "reservation_date", nullable = false)
    private LocalDate reservationDate;

    @Column(name = "admission_date")
    private LocalDate admissionDate;

    @Column(length = 255)
    private String reason;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDING"; // PENDING, CONFIRMED, CANCELLED, EXPIRED

    @Column(length = 500)
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
            status = "PENDING";
        }
        if (reservationDate == null) {
            reservationDate = LocalDate.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
