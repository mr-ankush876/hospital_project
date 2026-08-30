package com.vitalsync.hms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BillStatusUpdateRequest {
    @NotBlank(message = "Payment status is required")
    private String status;

    private String paymentMethod;
}
