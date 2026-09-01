package com.vitalsync.hms;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class PublicControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Public can fetch hospital info without authentication")
    void testGetPublicHospitalInfo() throws Exception {
        mockMvc.perform(get("/api/public/hospital-info")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hospitalName").isNotEmpty());
    }

    @Test
    @DisplayName("Public can fetch doctor list without authentication")
    void testGetPublicDoctors() throws Exception {
        mockMvc.perform(get("/api/public/doctors")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("Public can fetch departments list without authentication")
    void testGetPublicDepartments() throws Exception {
        mockMvc.perform(get("/api/public/departments")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("Public can fetch real-time bed and ICU availability")
    void testGetPublicBedAvailability() throws Exception {
        mockMvc.perform(get("/api/public/beds/availability")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalBeds").isNumber())
                .andExpect(jsonPath("$.availableBeds").isNumber())
                .andExpect(jsonPath("$.totalIcuBeds").isNumber())
                .andExpect(jsonPath("$.availableIcuBeds").isNumber());
    }
}
