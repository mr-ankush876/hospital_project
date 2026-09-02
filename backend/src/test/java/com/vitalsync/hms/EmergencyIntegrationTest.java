package com.vitalsync.hms;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vitalsync.hms.dto.EmergencyRequestDto;
import com.vitalsync.hms.dto.EmergencyStatusUpdateDto;
import com.vitalsync.hms.entity.EmergencyRequest;
import com.vitalsync.hms.repository.EmergencyRequestRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
public class EmergencyIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private EmergencyRequestRepository emergencyRequestRepository;

    @Test
    @DisplayName("Test 1: Public Emergency Contacts Endpoint Returns Configured Numbers")
    public void testEmergencyContactsEndpoint() throws Exception {
        mockMvc.perform(get("/api/emergencies/contacts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hospital").value("8797254899"))
                .andExpect(jsonPath("$.ambulance").value("7888834943"))
                .andExpect(jsonPath("$.hospitalTelUri").value("tel:8797254899"))
                .andExpect(jsonPath("$.ambulanceTelUri").value("tel:7888834943"));
    }

    @Test
    @DisplayName("Test 2: Create Emergency Request (Hospital Call) Persists to Database with EMG-YYYY-XXXX code")
    public void testCreateHospitalEmergencyRequest() throws Exception {
        EmergencyRequestDto requestDto = EmergencyRequestDto.builder()
                .patientName("John Emergency Doe")
                .contactNumber("8797254899")
                .emergencyType("Severe Chest Pain & Palpitations")
                .description("Patient experiencing acute substernal chest discomfort radiated to left arm.")
                .location("Central Mall, 2nd Floor food court")
                .peopleAffected(1)
                .contactMethod("HOSPITAL_EMERGENCY")
                .build();

        String response = mockMvc.perform(post("/api/emergencies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.requestCode").isNotEmpty())
                .andExpect(jsonPath("$.status").value("HOSPITAL_CONTACTED"))
                .andExpect(jsonPath("$.contactMethod").value("HOSPITAL_EMERGENCY"))
                .andReturn().getResponse().getContentAsString();

        EmergencyRequestDto created = objectMapper.readValue(response, EmergencyRequestDto.class);
        assertNotNull(created.getId());
        assertTrue(created.getRequestCode().matches("EMG-\\d{4}-\\d{4}"), "Code must match EMG-YYYY-XXXX format: " + created.getRequestCode());

        // Verify direct database persistence
        EmergencyRequest inDb = emergencyRequestRepository.findById(created.getId()).orElse(null);
        assertNotNull(inDb, "Emergency request must be persisted in database!");
        assertEquals("HOSPITAL_CONTACTED", inDb.getStatus());
        assertEquals("Severe Chest Pain & Palpitations", inDb.getEmergencyType());
        assertNotNull(inDb.getEmergencyCallInitiatedAt(), "Call initiation timestamp must be stored");
    }

    @Test
    @DisplayName("Test 3: Create Ambulance Request Sets AMBULANCE_CONTACTED Status")
    public void testCreateAmbulanceEmergencyRequest() throws Exception {
        EmergencyRequestDto requestDto = EmergencyRequestDto.builder()
                .patientName("Roadside Accident Victim")
                .contactNumber("7888834943")
                .emergencyType("Accident / Trauma")
                .description("Motorcycle collision, severe bleeding.")
                .location("Highway 4, Near Sector 12 flyover")
                .peopleAffected(2)
                .contactMethod("AMBULANCE")
                .build();

        mockMvc.perform(post("/api/emergencies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("AMBULANCE_CONTACTED"))
                .andExpect(jsonPath("$.contactMethod").value("AMBULANCE"))
                .andExpect(jsonPath("$.peopleAffected").value(2))
                .andExpect(jsonPath("$.ambulanceCallInitiatedAt").isNotEmpty());
    }

    @Test
    @DisplayName("Test 4: Staff/Admin Can View All Emergencies and Update Status")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testStaffUpdateEmergencyStatus() throws Exception {
        EmergencyRequest request = EmergencyRequest.builder()
                .requestCode("EMG-2026-9999")
                .patientNameSnapshot("Cardiac Patient")
                .patientPhoneSnapshot("8797254899")
                .emergencyType("Cardiac Arrest")
                .description("Unresponsive breathing")
                .location("Room 102")
                .contactMethod("HOSPITAL_EMERGENCY")
                .status("HOSPITAL_CONTACTED")
                .build();
        EmergencyRequest saved = emergencyRequestRepository.save(request);

        // Staff updates status to ACKNOWLEDGED
        EmergencyStatusUpdateDto updateDto = EmergencyStatusUpdateDto.builder()
                .status("ACKNOWLEDGED")
                .notes("Emergency ER team dispatched to location with defibrillator.")
                .build();

        mockMvc.perform(patch("/api/emergencies/" + saved.getId() + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACKNOWLEDGED"))
                .andExpect(jsonPath("$.acknowledgedBy").value("admin"));

        EmergencyRequest updatedInDb = emergencyRequestRepository.findById(saved.getId()).orElseThrow();
        assertEquals("ACKNOWLEDGED", updatedInDb.getStatus());
        assertEquals("admin", updatedInDb.getAcknowledgedBy());
        assertTrue(updatedInDb.getNotes().contains("Emergency ER team dispatched"));
    }

    @Test
    @DisplayName("Test 5: Live Database Statistics Endpoint")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testEmergencyStatsEndpoint() throws Exception {
        mockMvc.perform(get("/api/emergencies/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRequests").isNumber())
                .andExpect(jsonPath("$.activeEmergencies").isNumber())
                .andExpect(jsonPath("$.ambulanceContacts").isNumber())
                .andExpect(jsonPath("$.resolvedEmergencies").isNumber());
    }
}