package com.vitalsync.hms;

import com.vitalsync.hms.config.DataInitializer;
import com.vitalsync.hms.dto.*;
import com.vitalsync.hms.entity.*;
import com.vitalsync.hms.repository.*;
import com.vitalsync.hms.service.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;

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
    @DisplayName("TEST A: Create patient -> Save -> GET patient -> Restart application -> GET patient -> Still exists")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testA_CreatePatientPersistsAcrossRestart() {
        PatientDto patientDto = PatientDto.builder()
                .fullName("Test-A Patient")
                .dob(LocalDate.of(1991, 7, 10))
                .gender("Male")
                .bloodGroup("O+")
                .phone("+1 (555) 700-0001")
                .email("test.a.patient@vitalsync.com")
                .status("Active")
                .build();

        PatientDto created = patientService.create(patientDto);
        assertNotNull(created.getId());
        Long id = created.getId();

        PatientDto readBefore = patientService.getById(id);
        assertEquals("Test-A Patient", readBefore.getFullName());

        // Simulate application restart
        dataInitializer.run();

        PatientDto readAfter = patientService.getById(id);
        assertNotNull(readAfter, "Patient must survive restart!");
        assertEquals("Test-A Patient", readAfter.getFullName());
    }

    @Test
    @DisplayName("TEST B: Create patient -> Update patient -> Restart application -> GET patient -> Updated values still exist")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testB_UpdatePatientPersistsAcrossRestart() {
        PatientDto patientDto = PatientDto.builder()
                .fullName("Test-B Patient")
                .dob(LocalDate.of(1988, 3, 22))
                .gender("Female")
                .bloodGroup("A+")
                .phone("+1 (555) 700-0002")
                .email("test.b.patient@vitalsync.com")
                .allergies("None")
                .status("Active")
                .build();

        PatientDto created = patientService.create(patientDto);
        Long id = created.getId();

        // Update fields
        created.setPhone("+1 (555) 700-9999");
        created.setAllergies("Sulfa Drugs, Codeine");
        PatientDto updated = patientService.update(id, created);
        assertEquals("+15557009999", updated.getPhone());
        assertEquals("Sulfa Drugs, Codeine", updated.getAllergies());

        // Simulate application restart
        dataInitializer.run();

        PatientDto readAfter = patientService.getById(id);
        assertNotNull(readAfter);
        assertEquals("+15557009999", readAfter.getPhone(), "Updated phone must survive restart!");
        assertEquals("Sulfa Drugs, Codeine", readAfter.getAllergies(), "Updated allergies must survive restart!");
    }

    @Test
    @DisplayName("TEST C: Create doctor -> Restart -> Verify doctor still exists")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testC_CreateDoctorPersistsAcrossRestart() {
        Department dept = departmentRepository.findAll().stream().findFirst().orElseThrow();

        DoctorDto doctorDto = DoctorDto.builder()
                .fullName("Dr. Test-C Specialist")
                .email("test.c.specialist@vitalsync.com")
                .phone("+1 (555) 700-0003")
                .specialization("Cardiology")
                .qualification("MD, FACC")
                .experience("12 Years")
                .availableDays("Mon, Wed, Fri")
                .availableTime("09:00 AM - 05:00 PM")
                .consultationFee(new BigDecimal("160.00"))
                .status("Available")
                .departmentId(dept.getId())
                .build();

        DoctorDto created = doctorService.create(doctorDto);
        Long docId = created.getId();

        // Simulate restart
        dataInitializer.run();

        DoctorDto readAfter = doctorService.getById(docId);
        assertNotNull(readAfter, "Doctor must survive restart!");
        assertEquals("Dr. Test-C Specialist", readAfter.getFullName());
        assertEquals("Mon, Wed, Fri", readAfter.getAvailableDays());
    }

    @Test
    @DisplayName("TEST D: Create appointment -> Restart -> Verify appointment still exists")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testD_CreateAppointmentPersistsAcrossRestart() {
        Doctor doctor = doctorRepository.findAll().stream().findFirst().orElseThrow();
        Patient patient = patientRepository.findAll().stream().findFirst().orElseThrow();

        // Next Monday, Wednesday or Friday
        LocalDate nextDate = LocalDate.now().plusDays(1);
        while (nextDate.getDayOfWeek().getValue() != 1 && nextDate.getDayOfWeek().getValue() != 3 && nextDate.getDayOfWeek().getValue() != 5) {
            nextDate = nextDate.plusDays(1);
        }

        AppointmentDto aptDto = AppointmentDto.builder()
                .doctorId(doctor.getId())
                .patientId(patient.getId())
                .appointmentDate(nextDate)
                .appointmentTime("09:00 AM")
                .reason("Test-D Routine Consultation")
                .status("Scheduled")
                .build();

        AppointmentDto created = appointmentService.create(aptDto);
        Long aptId = created.getId();

        // Simulate restart
        dataInitializer.run();

        Appointment apt = appointmentRepository.findById(aptId).orElse(null);
        assertNotNull(apt, "Appointment must survive restart!");
        assertEquals("Test-D Routine Consultation", apt.getReason());
        assertEquals(doctor.getId(), apt.getDoctor().getId());
    }

    @Test
    @DisplayName("TEST E: Create prescription + medicines -> Restart -> Verify prescription and medicines still exist")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testE_CreatePrescriptionAndMedicinesPersistAcrossRestart() {
        Doctor doctor = doctorRepository.findAll().stream().findFirst().orElseThrow();
        Patient patient = patientRepository.findAll().stream().findFirst().orElseThrow();

        PrescriptionDto rxDto = PrescriptionDto.builder()
                .doctorId(doctor.getId())
                .patientId(patient.getId())
                .prescriptionDate(LocalDate.now())
                .diagnosis("Test-E Acute Bronchitis")
                .symptoms("Cough, mild wheezing")
                .instructions("Complete full 7-day course.")
                .medicines(new ArrayList<>(List.of(
                        PrescriptionMedicineDto.builder()
                                .medicineName("Azithromycin 500mg")
                                .dosage("1 Tab")
                                .frequency("1-0-0 (OD)")
                                .duration("5 Days")
                                .build(),
                        PrescriptionMedicineDto.builder()
                                .medicineName("Levocetirizine 5mg")
                                .dosage("1 Tab")
                                .frequency("0-0-1 (HS)")
                                .duration("7 Days")
                                .build()
                )))
                .build();

        PrescriptionDto created = prescriptionService.create(rxDto);
        Long rxId = created.getId();

        // Simulate restart
        dataInitializer.run();

        Prescription rx = prescriptionRepository.findById(rxId).orElse(null);
        assertNotNull(rx, "Prescription must survive restart!");
        assertEquals(2, rx.getMedicines().size(), "Child medicines must survive restart!");
        assertEquals("Azithromycin 500mg", rx.getMedicines().get(0).getMedicineName());
    }

    @Test
    @DisplayName("TEST F: Create bill -> Restart -> Verify bill still exists")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testF_CreateBillPersistsAcrossRestart() {
        Doctor doctor = doctorRepository.findAll().stream().findFirst().orElseThrow();
        Patient patient = patientRepository.findAll().stream().findFirst().orElseThrow();

        BillDto billDto = BillDto.builder()
                .doctorId(doctor.getId())
                .patientId(patient.getId())
                .billDate(LocalDate.now())
                .consultationFee(new BigDecimal("120.00"))
                .medicineCharges(new BigDecimal("45.00"))
                .otherCharges(BigDecimal.ZERO)
                .discount(new BigDecimal("15.00"))
                .tax(new BigDecimal("7.50"))
                .paymentMethod("UPI / QR")
                .paymentStatus("Paid")
                .build();

        BillDto created = billService.create(billDto);
        Long billId = created.getId();

        // Simulate restart
        dataInitializer.run();

        Bill bill = billRepository.findById(billId).orElse(null);
        assertNotNull(bill, "Bill must survive restart!");
        assertEquals("Paid", bill.getPaymentStatus());
        assertEquals("UPI / QR", bill.getPaymentMethod());
        assertEquals(new BigDecimal("157.50"), bill.getTotalAmount());
    }

    @Test
    @DisplayName("TEST G: Customize admin profile -> Restart -> Verify custom values remain")
    public void testG_CustomizeAdminProfileSurvivesRestart() {
        User admin = userRepository.findByUsername("ankush_876").orElse(null);
        if (admin == null) {
            dataInitializer.run();
            admin = userRepository.findByUsername("ankush_876").orElseThrow();
        }

        admin.setFullName("Dr. Ankush singh (Chief Medical Officer)");
        admin.setPhone("+91 9988776655");
        userRepository.save(admin);

        // Simulate backend restart
        dataInitializer.run();

        User postRestartAdmin = userRepository.findByUsername("ankush_876").orElseThrow();
        assertEquals("Dr. Ankush singh (Chief Medical Officer)", postRestartAdmin.getFullName(),
                "Admin custom name must NOT be overwritten on restart!");
        assertEquals("+91 9988776655", postRestartAdmin.getPhone(),
                "Admin custom phone must NOT be overwritten on restart!");
    }

    @Test
    @DisplayName("TEST H: Patient with clinical history -> Attempt deletion -> Verify safe deactivation -> History remains")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testH_SafeDeactivationPreservesClinicalHistory() {
        PatientDto patientDto = PatientDto.builder()
                .fullName("Test-H Safe History Patient")
                .dob(LocalDate.of(1980, 11, 5))
                .gender("Male")
                .bloodGroup("AB-")
                .phone("+1 (555) 700-0008")
                .email("test.h.history@vitalsync.com")
                .status("Active")
                .build();
        PatientDto created = patientService.create(patientDto);
        Long patId = created.getId();

        Doctor doctor = doctorRepository.findAll().stream().findFirst().orElseThrow();

        Appointment appointment = new Appointment();
        appointment.setAppointmentCode("APT-H-" + (System.currentTimeMillis() % 100000000L));
        appointment.setPatient(patientRepository.findById(patId).orElseThrow());
        appointment.setDoctor(doctor);
        appointment.setAppointmentDate(LocalDate.now().plusDays(4));
        appointment.setAppointmentTime("11:30 AM");
        appointment.setStatus("Scheduled");
        appointmentRepository.save(appointment);

        // Attempt deletion of patient with existing appointment
        patientService.delete(patId);

        // Patient must remain in database, transitioning status to 'Inactive' to preserve relational history
        Patient patient = patientRepository.findById(patId).orElse(null);
        assertNotNull(patient, "Patient record must NOT be deleted physically!");
        assertEquals("Inactive", patient.getStatus(), "Patient status must be Inactive!");

        // The appointment must still be intact
        Appointment linkedApt = appointmentRepository.findByAppointmentCode(appointment.getAppointmentCode()).orElse(null);
        assertNotNull(linkedApt, "Clinical appointment history must remain preserved!");
    }
}