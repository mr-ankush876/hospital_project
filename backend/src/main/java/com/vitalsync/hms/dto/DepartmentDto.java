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
public class DepartmentDto {
    private Long id;
    private String departmentCode;

    @NotBlank(message = "Department name is required")
    private String name;

    private String description;
    private String headDoctorName;
    private Integer totalBeds;
    private Integer availableBeds;
    private Integer occupiedBeds;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
