package com.vitalsync.hms;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vitalsync.hms.dto.AuthRequest;
import com.vitalsync.hms.dto.ForgotPasswordRequest;
import com.vitalsync.hms.dto.RegisterPatientRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${app.admin.username:ankush_876}")
    private String adminUsername;

    @Value("${app.admin.password:Ankush143@}")
    private String adminPassword;

    @Test
    @DisplayName("Admin Login Success with valid JWT token returned")
    void testAdminLoginSuccess() throws Exception {
        AuthRequest request = new AuthRequest(adminUsername, adminPassword);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user.username").value(adminUsername))
                .andExpect(jsonPath("$.user.role").value("ADMIN"));
    }

    @Test
    @DisplayName("Doctor Login Success")
    void testDoctorLoginSuccess() throws Exception {
        AuthRequest request = new AuthRequest("dr.chen", "password123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user.username").value("dr.chen"))
                .andExpect(jsonPath("$.user.role").value("DOCTOR"));
    }

    @Test
    @DisplayName("Receptionist Login Success")
    void testReceptionistLoginSuccess() throws Exception {
        AuthRequest request = new AuthRequest("receptionist", "password123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user.username").value("receptionist"))
                .andExpect(jsonPath("$.user.role").value("RECEPTIONIST"));
    }

    @Test
    @DisplayName("Patient Login Success")
    void testPatientLoginSuccess() throws Exception {
        AuthRequest request = new AuthRequest("patient.michael", "password123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user.username").value("patient.michael"))
                .andExpect(jsonPath("$.user.role").value("PATIENT"));
    }

    @Test
    @DisplayName("Public Patient Self-Registration strictly creates ROLE_PATIENT")
    void testPatientSelfRegistration() throws Exception {
        RegisterPatientRequest regRequest = RegisterPatientRequest.builder()
                .firstName("Jane")
                .lastName("Doe")
                .email("jane.doe@example.com")
                .phone("+91 98765 43210")
                .dob(LocalDate.of(1998, 4, 15))
                .bloodGroup("B+")
                .password("Password123!")
                .confirmPassword("Password123!")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user.username").value("jane.doe@example.com"))
                .andExpect(jsonPath("$.user.role").value("PATIENT"));
    }

    @Test
    @DisplayName("Forgot Password initiates valid recovery token")
    void testForgotPasswordInitiation() throws Exception {
        ForgotPasswordRequest forgot = new ForgotPasswordRequest("ankush@vitalsync.com");

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(forgot)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resetToken").isString())
                .andExpect(jsonPath("$.message").isString());
    }

    @Test
    @DisplayName("Invalid Password returns 401 Unauthorized JSON")
    void testInvalidPasswordReturns401() throws Exception {
        AuthRequest request = new AuthRequest(adminUsername, "wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("Unauthenticated request to protected endpoint returns 401 JSON")
    void testUnauthenticatedProtectedEndpointReturns401() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }
}
