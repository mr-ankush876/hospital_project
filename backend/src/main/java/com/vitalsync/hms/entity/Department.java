package com.vitalsync.hms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "departments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "department_code", unique = true, nullable = false, length = 20)
    private String departmentCode;

    @Column(unique = true, nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(name = "head_doctor_name", length = 100)
    private String headDoctorName;

    @Column(name = "total_beds")
    @Builder.Default
    private Integer totalBeds = 0;

    @Column(name = "available_beds")
    @Builder.Default
    private Integer availableBeds = 0;

    @Column(name = "occupied_beds")
    @Builder.Default
    private Integer occupiedBeds = 0;

    @Column(length = 20)
    @Builder.Default
    private String status = "Active";

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
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
