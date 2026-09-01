package com.vitalsync.hms;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vitalsync.hms.dto.AppointmentDto;
import com.vitalsync.hms.dto.BedReservationDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
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
class PatientSelfServiceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Patient can access own dashboard data via JWT")
    @WithMockUser(username = "patient.michael", roles = {"PATIENT"})
    void testPatientDashboardAccess() throws Exception {
        mockMvc.perform(get("/api/patient/dashboard")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patient.fullName").value("Michael Chang"))
                .andExpect(jsonPath("$.patient.patientCode").value("PT-1001"))
                .andExpect(jsonPath("$.totalAppointments").isNumber());
    }

    @Test
    @DisplayName("Patient can view own prescriptions only")
    @WithMockUser(username = "patient.michael", roles = {"PATIENT"})
    void testPatientPrescriptionsAccess() throws Exception {
        mockMvc.perform(get("/api/patient/prescriptions")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("Patient can view own medical reports only")
    @WithMockUser(username = "patient.michael", roles = {"PATIENT"})
    void testPatientMedicalReportsAccess() throws Exception {
        mockMvc.perform(get("/api/patient/reports")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("Patient can book appointment with real doctor")
    @WithMockUser(username = "patient.michael", roles = {"PATIENT"})
    void testPatientBookAppointment() throws Exception {
        AppointmentDto dto = AppointmentDto.builder()
                .doctorId(1L)
                .appointmentDate(LocalDate.now().plusDays(5))
                .appointmentTime("03:00 PM")
                .reason("Cardiac Follow-up Evaluation")
                .notes("Review of medication efficacy")
                .status("Confirmed")
                .build();

        mockMvc.perform(post("/api/patient/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.appointmentCode").isNotEmpty())
                .andExpect(jsonPath("$.patientName").value("Michael Chang"));
    }

    @Test
    @DisplayName("Patient can submit bed reservation request")
    @WithMockUser(username = "patient.michael", roles = {"PATIENT"})
    void testPatientBedReservation() throws Exception {
        BedReservationDto dto = BedReservationDto.builder()
                .departmentId(1L)
                .bedType("GENERAL")
                .reservationDate(LocalDate.now())
                .admissionDate(LocalDate.now().plusDays(2))
                .reason("Observation and inpatient care")
                .build();

        mockMvc.perform(post("/api/patient/bed-reservations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.reservationCode").isNotEmpty());
    }
}
