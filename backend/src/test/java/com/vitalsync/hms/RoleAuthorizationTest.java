package com.vitalsync.hms;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class RoleAuthorizationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Admin has access to analytics reports")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void testAdminCanAccessReports() throws Exception {
        mockMvc.perform(get("/api/reports/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalPatients").isNumber());
    }

    @Test
    @DisplayName("Doctor is forbidden from accessing analytics reports (403)")
    @WithMockUser(username = "dr.chen", roles = {"DOCTOR"})
    void testDoctorForbiddenFromReports() throws Exception {
        mockMvc.perform(get("/api/reports/summary"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("Receptionist is forbidden from accessing analytics reports (403)")
    @WithMockUser(username = "receptionist", roles = {"RECEPTIONIST"})
    void testReceptionistForbiddenFromReports() throws Exception {
        mockMvc.perform(get("/api/reports/summary"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("Receptionist is forbidden from creating prescriptions (403)")
    @WithMockUser(username = "receptionist", roles = {"RECEPTIONIST"})
    void testReceptionistForbiddenFromCreatingPrescriptions() throws Exception {
        mockMvc.perform(post("/api/prescriptions")
                        .contentType("application/json")
                        .content("{\"patientId\":1, \"doctorId\":1, \"diagnosis\":\"test\"}"))
                .andExpect(status().isForbidden());
    }
}
