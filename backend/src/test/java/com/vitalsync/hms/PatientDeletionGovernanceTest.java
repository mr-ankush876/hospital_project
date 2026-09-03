package com.vitalsync.hms;

import com.vitalsync.hms.entity.*;
import com.vitalsync.hms.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
class PatientDeletionGovernanceTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private BedReservationRepository bedReservationRepository;

    @Autowired
    private MedicalReportRepository medicalReportRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private BedRepository bedRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    private Patient createTestPatient(String suffix) {
        return patientRepository.save(Patient.builder()
                .patientCode("PT-TEST-" + suffix)
                .fullName("Test Patient " + suffix)
                .dob(LocalDate.of(1995, 5, 20))
                .age(31)
                .gender("Male")
                .bloodGroup("O+")
                .phone("+919876543210")
                .status("Active")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());
    }

    @Test
    @DisplayName("Doctor is forbidden from deleting a patient record (403)")
    @WithMockUser(username = "dr.chen", roles = {"DOCTOR"})
    void testDoctorCannotDeletePatient() throws Exception {
        Patient patient = createTestPatient("DOC-TEST");

        mockMvc.perform(delete("/api/patients/" + patient.getId()))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Receptionist is forbidden from deleting a patient record (403)")
    @WithMockUser(username = "receptionist", roles = {"RECEPTIONIST"})
    void testReceptionistCannotDeletePatient() throws Exception {
        Patient patient = createTestPatient("REC-TEST");

        mockMvc.perform(delete("/api/patients/" + patient.getId()))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Admin cannot delete patient with active uncancelled appointments (400)")
    @WithMockUser(username = "ankush_876", roles = {"ADMIN"})
    void testCannotDeletePatientWithActiveAppointment() throws Exception {
        Patient patient = createTestPatient("APT-ACTIVE");
        Doctor doctor = doctorRepository.findAll().stream().findFirst().orElseThrow();

        Appointment appt = new Appointment();
        appt.setAppointmentCode("APT-TEST-001");
        appt.setPatient(patient);
        appt.setDoctor(doctor);
        appt.setAppointmentDate(LocalDate.now().plusDays(2));
        appt.setAppointmentTime("10:00 AM");
        appt.setStatus("Scheduled");
        appointmentRepository.save(appt);

        mockMvc.perform(delete("/api/patients/" + patient.getId()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("active appointment(s)")));
    }

    @Test
    @DisplayName("Admin cannot delete patient with active bed reservation (400)")
    @WithMockUser(username = "ankush_876", roles = {"ADMIN"})
    void testCannotDeletePatientWithActiveBedReservation() throws Exception {
        Patient patient = createTestPatient("BED-ACTIVE");
        Bed bed = bedRepository.findAll().stream().findFirst().orElseThrow();
        Department dept = departmentRepository.findAll().stream().findFirst().orElseThrow();

        BedReservation reservation = BedReservation.builder()
                .reservationCode("RES-TEST-001")
                .patient(patient)
                .bed(bed)
                .department(dept)
                .bedType("GENERAL")
                .reservationDate(LocalDate.now())
                .status("CONFIRMED")
                .build();
        bedReservationRepository.save(reservation);

        mockMvc.perform(delete("/api/patients/" + patient.getId()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("active bed reservation")));
    }

    @Test
    @DisplayName("Admin cannot delete patient with pending medical reports (400)")
    @WithMockUser(username = "ankush_876", roles = {"ADMIN"})
    void testCannotDeletePatientWithPendingMedicalReport() throws Exception {
        Patient patient = createTestPatient("RPT-ACTIVE");
        Doctor doctor = doctorRepository.findAll().stream().findFirst().orElseThrow();

        MedicalReport report = MedicalReport.builder()
                .reportCode("RPT-TEST-001")
                .patient(patient)
                .doctor(doctor)
                .reportType("Blood Chemistry")
                .reportDate(LocalDate.now())
                .status("Pending")
                .build();
        medicalReportRepository.save(report);

        mockMvc.perform(delete("/api/patients/" + patient.getId()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("medical report(s) that are still pending")));
    }

    @Test
    @DisplayName("Admin can cleanly delete patient when appointments are cancelled, bed discharged, reports finalized")
    @WithMockUser(username = "ankush_876", roles = {"ADMIN"})
    void testAdminCanCleanlyDeletePatientWhenAllLocksCleared() throws Exception {
        Patient patient = createTestPatient("CLEAN-DEL");
        Doctor doctor = doctorRepository.findAll().stream().findFirst().orElseThrow();
        Bed bed = bedRepository.findAll().stream().findFirst().orElseThrow();
        Department dept = departmentRepository.findAll().stream().findFirst().orElseThrow();

        // 1. Cancelled appointment
        Appointment appt = new Appointment();
        appt.setAppointmentCode("APT-TEST-CANCELLED");
        appt.setPatient(patient);
        appt.setDoctor(doctor);
        appt.setAppointmentDate(LocalDate.now().plusDays(2));
        appt.setAppointmentTime("10:00 AM");
        appt.setStatus("Cancelled");
        appointmentRepository.save(appt);

        // 2. Discharged / Cancelled bed reservation
        BedReservation reservation = BedReservation.builder()
                .reservationCode("RES-TEST-CANCELLED")
                .patient(patient)
                .bed(bed)
                .department(dept)
                .bedType("GENERAL")
                .reservationDate(LocalDate.now())
                .status("CANCELLED")
                .build();
        bedReservationRepository.save(reservation);

        // 3. Finalized medical report
        MedicalReport report = MedicalReport.builder()
                .reportCode("RPT-TEST-FINAL")
                .patient(patient)
                .doctor(doctor)
                .reportType("Blood Chemistry")
                .reportDate(LocalDate.now())
                .status("Final")
                .build();
        medicalReportRepository.save(report);

        // Admin performs delete -> should succeed with HTTP 200 without foreign key constraint error!
        mockMvc.perform(delete("/api/patients/" + patient.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("successfully")));

        // Verify patient is truly deleted from repository
        assertFalse(patientRepository.findById(patient.getId()).isPresent());
    }
}