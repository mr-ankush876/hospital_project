package com.vitalsync.hms;

import com.vitalsync.hms.config.DataInitializer;
import com.vitalsync.hms.dto.*;
import com.vitalsync.hms.entity.*;
import com.vitalsync.hms.exception.ConflictException;
import com.vitalsync.hms.repository.*;
import com.vitalsync.hms.service.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
public class ProductionPersistenceLifecycleTest {

    @Autowired
    private PatientService patientService;

    @Autowired
    private DoctorService doctorService;

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private PrescriptionService prescriptionService;

    @Autowired
    private BillService billService;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private DataInitializer dataInitializer;

    @Test
    @DisplayName("Test 1: Create Patient -> Read -> Update -> Simulate Backend Restart -> Data Remains Intact")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testPatientPersistenceLifecycle() {
        // 1. Create Patient
        PatientDto patientDto = PatientDto.builder()
                .fullName("Permanent Test Patient")
                .dob(LocalDate.of(1990, 5, 20))
                .gender("Female")
                .bloodGroup("B+")
                .phone("+1 (555) 777-8888")
                .email("permanent.test@hospital.com")
                .address("100 Persistence Boulevard, Suite 5A")
                .emergencyContact("+1 (555) 999-0000")
                .medicalHistory("Prior knee surgery")
                .allergies("Latex")
                .status("Active")
                .build();

        PatientDto created = patientService.create(patientDto);
        assertNotNull(created.getId());
        assertNotNull(created.getPatientCode());
        assertEquals("Permanent Test Patient", created.getFullName());

        Long patientId = created.getId();

        // 2. Read Patient
        PatientDto fetched = patientService.getById(patientId);
        assertEquals("Permanent Test Patient", fetched.getFullName());
        assertEquals("+1 (555) 777-8888", fetched.getPhone());

        // 3. Update Patient
        fetched.setPhone("+1 (555) 000-1111");
        fetched.setAllergies("Latex, Penicillin");
        PatientDto updated = patientService.update(patientId, fetched);
        assertEquals("+1 (555) 000-1111", updated.getPhone());
        assertEquals("Latex, Penicillin", updated.getAllergies());

        // 4. Simulate application restart by invoking DataInitializer.run()
        dataInitializer.run();

        // 5. Verify patient record survived restart without loss or rollback
        Patient survived = patientRepository.findById(patientId).orElse(null);
        assertNotNull(survived, "Patient must survive backend restart!");
        assertEquals("Permanent Test Patient", survived.getFullName());
        assertEquals("+1 (555) 000-1111", survived.getPhone(), "Updated phone must survive restart!");
        assertEquals("Latex, Penicillin", survived.getAllergies(), "Updated allergies must survive restart!");
    }

    @Test
    @DisplayName("Test 2: Create Doctor, Appointment, Prescription & Bill -> Relational Integrity & Restart Persistence")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testFullClinicalWorkflowPersistenceAcrossRestart() {
        Department dept = departmentRepository.findAll().stream().findFirst().orElseThrow();

        // 1. Register Doctor
        DoctorDto doctorDto = DoctorDto.builder()
                .fullName("Dr. Hardened Specialist")
                .email("hardened.specialist@vitalsync.com")
                .phone("+1 (555) 333-4444")
                .specialization("Cardiology")
                .qualification("MD, FACC")
                .experience("14 Years")
                .availableDays("Mon, Wed, Fri")
                .availableTime("09:00 AM - 05:00 PM")
                .consultationFee(new BigDecimal("175.00"))
                .status("Available")
                .departmentId(dept.getId())
                .build();

        DoctorDto createdDoc = doctorService.create(doctorDto);
        assertNotNull(createdDoc.getId());
        Long docId = createdDoc.getId();

        // 2. Register Patient
        PatientDto patientDto = PatientDto.builder()
                .fullName("Workflow Patient")
                .dob(LocalDate.of(1985, 3, 15))
                .gender("Male")
                .bloodGroup("O-")
                .phone("+1 (555) 444-5555")
                .email("workflow.patient@vitalsync.com")
                .status("Active")
                .build();
        PatientDto createdPatient = patientService.create(patientDto);
        Long patId = createdPatient.getId();

        // 3. Find next available date (Wednesday or Friday)
        LocalDate nextDate = LocalDate.now().plusDays(1);
        while (nextDate.getDayOfWeek().getValue() != 1 && nextDate.getDayOfWeek().getValue() != 3 && nextDate.getDayOfWeek().getValue() != 5) {
            nextDate = nextDate.plusDays(1);
        }

        // 4. Book Appointment
        AppointmentDto aptDto = AppointmentDto.builder()
                .doctorId(docId)
                .patientId(patId)
                .appointmentDate(nextDate)
                .appointmentTime("09:30 AM")
                .reason("Post-Cardiac Diagnostic Follow-up")
                .status("Scheduled")
                .build();
        AppointmentDto createdApt = appointmentService.create(aptDto);
        assertNotNull(createdApt.getId());
        Long aptId = createdApt.getId();

        // 5. Create Prescription with Medicines
        PrescriptionDto rxDto = PrescriptionDto.builder()
                .doctorId(docId)
                .patientId(patId)
                .prescriptionDate(nextDate)
                .diagnosis("Hypertensive Heart Disease")
                .symptoms("Exertional dyspnea")
                .instructions("Take with food morning and night.")
                .medicines(new ArrayList<>(List.of(
                        PrescriptionMedicineDto.builder()
                                .medicineName("Amlodipine 5mg")
                                .dosage("1 Tab")
                                .frequency("1-0-0 (OD)")
                                .duration("30 Days")
                                .build(),
                        PrescriptionMedicineDto.builder()
                                .medicineName("Atorvastatin 20mg")
                                .dosage("1 Tab")
                                .frequency("0-0-1 (HS)")
                                .duration("30 Days")
                                .build()
                )))
                .build();
        PrescriptionDto createdRx = prescriptionService.create(rxDto);
        assertNotNull(createdRx.getId());
        assertEquals(2, createdRx.getMedicines().size());
        Long rxId = createdRx.getId();

        // 6. Create Bill
        BillDto billDto = BillDto.builder()
                .doctorId(docId)
                .patientId(patId)
                .billDate(nextDate)
                .consultationFee(new BigDecimal("175.00"))
                .medicineCharges(new BigDecimal("60.00"))
                .otherCharges(BigDecimal.ZERO)
                .discount(BigDecimal.ZERO)
                .tax(new BigDecimal("10.00"))
                .paymentMethod("Credit Card")
                .paymentStatus("Paid")
                .build();
        BillDto createdBill = billService.create(billDto);
        assertNotNull(createdBill.getId());
        Long billId = createdBill.getId();

        // 7. Simulate restart by invoking DataInitializer.run()
        dataInitializer.run();

        // 8. Verify all entities and foreign key links survived restart intact
        Appointment aptSurvived = appointmentRepository.findById(aptId).orElse(null);
        assertNotNull(aptSurvived);
        assertEquals(docId, aptSurvived.getDoctor().getId());
        assertEquals(patId, aptSurvived.getPatient().getId());

        Prescription rxSurvived = prescriptionRepository.findById(rxId).orElse(null);
        assertNotNull(rxSurvived);
        assertEquals(2, rxSurvived.getMedicines().size());
        assertEquals("Amlodipine 5mg", rxSurvived.getMedicines().get(0).getMedicineName());

        Bill billSurvived = billRepository.findById(billId).orElse(null);
        assertNotNull(billSurvived);
        assertEquals("Paid", billSurvived.getPaymentStatus());
        assertEquals(new BigDecimal("245.00"), billSurvived.getTotalAmount());
    }

    @Test
    @DisplayName("Test 3: Admin Customization Survives Restart Without Reverting")
    public void testAdminCustomizationSurvivesRestart() {
        // Find existing admin
        User admin = userRepository.findByUsername("ankush_876").orElse(null);
        if (admin == null) {
            dataInitializer.run();
            admin = userRepository.findByUsername("ankush_876").orElseThrow();
        }

        // Customise admin's profile
        admin.setFullName("Dr. Ankush singh (MD, Senior Administrator)");
        admin.setPhone("+91 9999988888");
        userRepository.save(admin);

        // Simulate backend restart
        dataInitializer.run();

        // Verify the admin's modified details were NOT reverted by DataInitializer
        User postRestartAdmin = userRepository.findByUsername("ankush_876").orElseThrow();
        assertEquals("Dr. Ankush singh (MD, Senior Administrator)", postRestartAdmin.getFullName(),
                "Admin's customized name must NEVER be overwritten on startup!");
        assertEquals("+91 9999988888", postRestartAdmin.getPhone(),
                "Admin's customized phone must NEVER be overwritten on startup!");
    }

    @Test
    @DisplayName("Test 4: Safe Deletion - Inactive Status Assigned When Relational Records Exist")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testSafeDeletionRelationalIntegrity() {
        // Create patient with linked appointment
        PatientDto patientDto = PatientDto.builder()
                .fullName("Safe Deletion Candidate")
                .dob(LocalDate.of(1992, 1, 1))
                .gender("Female")
                .bloodGroup("A+")
                .phone("+1 (555) 111-9999")
                .email("safe.deletion@vitalsync.com")
                .status("Active")
                .build();
        PatientDto created = patientService.create(patientDto);
        Long patId = created.getId();

        Doctor doctor = doctorRepository.findAll().stream().findFirst().orElseThrow();

        Appointment appointment = new Appointment();
        appointment.setAppointmentCode("APT-S-" + (System.currentTimeMillis() % 100000000L));
        appointment.setPatient(patientRepository.findById(patId).orElseThrow());
        appointment.setDoctor(doctor);
        appointment.setAppointmentDate(LocalDate.now().plusDays(5));
        appointment.setAppointmentTime("10:00 AM");
        appointment.setStatus("Scheduled");
        appointmentRepository.save(appointment);

        // Attempt deletion of patient with active appointment
        patientService.delete(patId);

        // Verify patient was NOT physically deleted (which would break DB foreign keys), but set to Inactive
        Patient patient = patientRepository.findById(patId).orElse(null);
        assertNotNull(patient, "Patient with relational history must not be deleted physically!");
        assertEquals("Inactive", patient.getStatus(), "Patient status must transition to Inactive!");
    }
}