package com.vitalsync.hms.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterPatientRequest {

    @NotBlank(message = "First name is required")
    @Size(max = 50, message = "First name must not exceed 50 characters")
    @Pattern(regexp = "^[A-Za-z\\s'\\-]+$", message = "First name must contain only alphabetic characters, spaces, hyphens, or apostrophes")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 50, message = "Last name must not exceed 50 characters")
    @Pattern(regexp = "^[A-Za-z\\s'\\-]+$", message = "Last name must contain only alphabetic characters, spaces, hyphens, or apostrophes")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Please enter a valid email address")
    private String email;

    @NotNull(message = "Date of Birth is required")
    @PastOrPresent(message = "Date of Birth cannot be in the future")
    private LocalDate dob;

    @NotBlank(message = "Phone number is required")
    private String phone;

    @NotBlank(message = "Blood group is required")
    @Pattern(regexp = "^(A\\+|A\\-|B\\+|B\\-|AB\\+|AB\\-|O\\+|O\\-)$", message = "Blood group must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-")
    private String bloodGroup;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be at least 8 characters long")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^()_\\-+=]).{8,}$",
        message = "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 digit, and 1 special character"
    )
    private String password;

    @NotBlank(message = "Confirm password is required")
    private String confirmPassword;

    public String getFullName() {
        String fn = firstName != null ? firstName.trim() : "";
        String ln = lastName != null ? lastName.trim() : "";
        return (fn + " " + ln).trim();
    }

    public String getUsername() {
        return email != null ? email.trim().toLowerCase() : null;
    }
}

