package com.vitalsync.hms.config;

import com.vitalsync.hms.entity.*;
import com.vitalsync.hms.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final BillRepository billRepository;
    private final HospitalSettingRepository hospitalSettingRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already contains data. Skipping seed initialization.");
            return;
        }

        log.info("Empty database detected. Seeding initial data...");
        seedUsers();
        seedDoctors();
        seedPatients();
        seedAppointments();
        seedPrescriptions();
        seedBills();
        seedHospitalSettings();
        log.info("Database seeding completed successfully!");
    }

    private void seedUsers() {
        String encodedPassword = passwordEncoder.encode("password123");

        User admin = new User();
        admin.setUsername("admin");
        admin.setPassword(encodedPassword);
        admin.setEmail("admin@vitalsync.com");
        admin.setFullName("Dr. Sarah Mitchell");
        admin.setRole("ADMIN");
        userRepository.save(admin);

        User drChen = new User();
        drChen.setUsername("dr.chen");
        drChen.setPassword(encodedPassword);
        drChen.setEmail("r.chen@vitalsync.com");
        drChen.setFullName("Dr. Robert Chen");
        drChen.setRole("DOCTOR");
        userRepository.save(drChen);

        User drStanton = new User();
        drStanton.setUsername("dr.stanton");
        drStanton.setPassword(encodedPassword);
        drStanton.setEmail("e.stanton@vitalsync.com");
        drStanton.setFullName("Dr. Emily Stanton");
        drStanton.setRole("DOCTOR");
        userRepository.save(drStanton);

        User receptionist = new User();
        receptionist.setUsername("receptionist");
        receptionist.setPassword(encodedPassword);
        receptionist.setEmail("reception@vitalsync.com");
        receptionist.setFullName("Alex Vance");
        receptionist.setRole("RECEPTIONIST");
        userRepository.save(receptionist);

        log.info("Seeded 4 users (admin, dr.chen, dr.stanton, receptionist) with password: password123");
    }

    private void seedDoctors() {
        Doctor d1 = new Doctor();
        d1.setDoctorCode("DOC-2001");
        d1.setFullName("Dr. Robert Chen");
        d1.setEmail("r.chen@vitalsync.com");
        d1.setPhone("+1 (555) 123-4567");
        d1.setSpecialization("Cardiology");
        d1.setQualification("MD, FACC");
        d1.setExperience("15 Years");
        d1.setAvailableDays("Mon, Wed, Fri");
        d1.setAvailableTime("09:00 AM - 05:00 PM");
        d1.setStatus("Available");
        doctorRepository.save(d1);

        Doctor d2 = new Doctor();
        d2.setDoctorCode("DOC-2002");
        d2.setFullName("Dr. Emily Stanton");
        d2.setEmail("e.stanton@vitalsync.com");
        d2.setPhone("+1 (555) 987-6543");
        d2.setSpecialization("Pediatrics");
        d2.setQualification("MD, FAAP");
        d2.setExperience("10 Years");
        d2.setAvailableDays("Tue, Thu, Sat");
        d2.setAvailableTime("08:00 AM - 04:00 PM");
        d2.setStatus("Available");
        doctorRepository.save(d2);

        Doctor d3 = new Doctor();
        d3.setDoctorCode("DOC-2003");
        d3.setFullName("Dr. Marcus Vance");
        d3.setEmail("m.vance@vitalsync.com");
        d3.setPhone("+1 (555) 456-7890");
        d3.setSpecialization("Neurology");
        d3.setQualification("MD, PhD");
        d3.setExperience("18 Years");
        d3.setAvailableDays("Mon - Fri");
        d3.setAvailableTime("10:00 AM - 06:00 PM");
        d3.setStatus("In Surgery");
        doctorRepository.save(d3);

        Doctor d4 = new Doctor();
        d4.setDoctorCode("DOC-2004");
        d4.setFullName("Dr. Sarah Mitchell");
        d4.setEmail("s.mitchell@vitalsync.com");
        d4.setPhone("+1 (555) 321-7654");
        d4.setSpecialization("General Practice");
        d4.setQualification("MBBS, MD");
        d4.setExperience("12 Years");
        d4.setAvailableDays("Mon - Sat");
        d4.setAvailableTime("09:00 AM - 05:00 PM");
        d4.setStatus("Available");
        doctorRepository.save(d4);

        log.info("Seeded 4 doctors");
    }

    private void seedPatients() {
        String[][] patientData = {
            {"PT-1001", "Michael Chang", "1979-05-14", "45", "Male", "O+", "+1 (555) 123-4567", "michael.chang@email.com", "742 Evergreen Terrace, Springfield", "+1 (555) 999-1111", "Hypertension diagnosed in 2021.", "Penicillin, Latex (Mild)", "Active"},
            {"PT-1002", "Sarah Jenkins", "1996-08-22", "28", "Female", "A-", "+1 (555) 987-6543", "sarah.j@email.com", "123 Maple Street, Cityville", "+1 (555) 888-2222", "Mild asthma, managed with Inhaler.", "Sulfa Drugs", "Active"},
            {"PT-1003", "Robert Johnson", "1962-11-03", "62", "Male", "B+", "+1 (555) 345-6789", "robert.j@email.com", "456 Oak Avenue, Metropolis", "+1 (555) 777-3333", "Type 2 Diabetes since 2018.", "None reported", "Inactive"},
            {"PT-1004", "Eleanor Vance", "1985-02-19", "39", "Female", "AB+", "+1 (555) 234-5678", "eleanor.vance@email.com", "89 Hill House Lane, Boston", "+1 (555) 666-4444", "Migraine headaches.", "Aspirin", "Active"},
            {"PT-1005", "Marcus Holloway", "1992-09-30", "32", "Male", "O-", "+1 (555) 876-5432", "marcus.h@email.com", "505 Bay Street, San Francisco", "+1 (555) 555-5555", "ACL Knee Reconstruction in 2020.", "Ibuprofen", "Active"},
            {"PT-1006", "Sophia Chen", "2016-04-12", "8", "Female", "A+", "+1 (555) 432-1098", "parent.chen@email.com", "321 Pine Road, Seattle", "+1 (555) 444-6666", "Pediatric seasonal allergies.", "Peanuts (Severe)", "Active"},
            {"PT-1007", "James Wilson", "1970-12-05", "53", "Male", "B-", "+1 (555) 654-3210", "j.wilson@email.com", "789 Cedar Drive, Chicago", "+1 (555) 333-7777", "Coronary artery disease history.", "Codeine", "Active"},
            {"PT-1008", "Clara Oswald", "1994-11-23", "29", "Female", "O+", "+1 (555) 789-0123", "clara.o@email.com", "42 Time Vortex Way, London", "+1 (555) 222-8888", "Routine wellness checkups.", "None", "Active"}
        };

        for (String[] pd : patientData) {
            Patient p = new Patient();
            p.setPatientCode(pd[0]);
            p.setFullName(pd[1]);
            p.setDob(LocalDate.parse(pd[2]));
            p.setAge(Integer.parseInt(pd[3]));
            p.setGender(pd[4]);
            p.setBloodGroup(pd[5]);
            p.setPhone(pd[6]);
            p.setEmail(pd[7]);
            p.setAddress(pd[8]);
            p.setEmergencyContact(pd[9]);
            p.setMedicalHistory(pd[10]);
            p.setAllergies(pd[11]);
            p.setStatus(pd[12]);
            patientRepository.save(p);
        }
        log.info("Seeded 8 patients");
    }

    private void seedAppointments() {
        LocalDate today = LocalDate.now();

        Patient p1 = patientRepository.findByPatientCode("PT-1001").orElse(null);
        Patient p2 = patientRepository.findByPatientCode("PT-1002").orElse(null);
        Patient p4 = patientRepository.findByPatientCode("PT-1004").orElse(null);
        Patient p6 = patientRepository.findByPatientCode("PT-1006").orElse(null);
        Patient p7 = patientRepository.findByPatientCode("PT-1007").orElse(null);

        Doctor d1 = doctorRepository.findByDoctorCode("DOC-2001").orElse(null);
        Doctor d2 = doctorRepository.findByDoctorCode("DOC-2002").orElse(null);
        Doctor d3 = doctorRepository.findByDoctorCode("DOC-2003").orElse(null);

        if (p1 != null && d1 != null) {
            Appointment a1 = new Appointment();
            a1.setAppointmentCode("APT-2045");
            a1.setPatient(p1); a1.setDoctor(d1);
            a1.setAppointmentDate(today);
            a1.setAppointmentTime("09:00 AM");
            a1.setReason("Routine Cardiac Evaluation");
            a1.setNotes("Patient reported mild chest tightness.");
            a1.setStatus("Confirmed");
            appointmentRepository.save(a1);
        }

        if (p2 != null && d2 != null) {
            Appointment a2 = new Appointment();
            a2.setAppointmentCode("APT-2046");
            a2.setPatient(p2); a2.setDoctor(d2);
            a2.setAppointmentDate(today);
            a2.setAppointmentTime("09:30 AM");
            a2.setReason("General Wellness Check");
            a2.setNotes("Followup after pediatric fever.");
            a2.setStatus("In Progress");
            appointmentRepository.save(a2);
        }

        if (p6 != null && d2 != null) {
            Appointment a3 = new Appointment();
            a3.setAppointmentCode("APT-2047");
            a3.setPatient(p6); a3.setDoctor(d2);
            a3.setAppointmentDate(today);
            a3.setAppointmentTime("10:15 AM");
            a3.setReason("Allergy Followup");
            a3.setNotes("Routine checkup for asthma inhaler refill.");
            a3.setStatus("Scheduled");
            appointmentRepository.save(a3);
        }

        if (p7 != null && d1 != null) {
            Appointment a4 = new Appointment();
            a4.setAppointmentCode("APT-2048");
            a4.setPatient(p7); a4.setDoctor(d1);
            a4.setAppointmentDate(today);
            a4.setAppointmentTime("11:00 AM");
            a4.setReason("Urgent BP Spiking Evaluation");
            a4.setNotes("BP reading 160/100 at home.");
            a4.setStatus("Urgent");
            appointmentRepository.save(a4);
        }

        if (p4 != null && d3 != null) {
            Appointment a5 = new Appointment();
            a5.setAppointmentCode("APT-2049");
            a5.setPatient(p4); a5.setDoctor(d3);
            a5.setAppointmentDate(today.plusDays(1));
            a5.setAppointmentTime("02:00 PM");
            a5.setReason("Neurology Consultation for Migraine");
            a5.setNotes("Evaluated for chronic headaches.");
            a5.setStatus("Scheduled");
            appointmentRepository.save(a5);
        }

        log.info("Seeded 5 appointments");
    }

    private void seedPrescriptions() {
        Patient p1 = patientRepository.findByPatientCode("PT-1001").orElse(null);
        Patient p2 = patientRepository.findByPatientCode("PT-1002").orElse(null);
        Doctor d1 = doctorRepository.findByDoctorCode("DOC-2001").orElse(null);
        Doctor d2 = doctorRepository.findByDoctorCode("DOC-2002").orElse(null);

        LocalDate today = LocalDate.now();

        if (p1 != null && d1 != null) {
            Prescription rx1 = new Prescription();
            rx1.setPrescriptionCode("RX-4001");
            rx1.setPatient(p1); rx1.setDoctor(d1);
            rx1.setPrescriptionDate(today);
            rx1.setSymptoms("Mild chest tightness, elevated blood pressure");
            rx1.setDiagnosis("Stage 1 Primary Hypertension");
            rx1.setInstructions("Take medications after breakfast. Avoid salt heavy foods.");
            rx1.setFollowUpDate(today.plusDays(14));

            List<PrescriptionMedicine> meds1 = new ArrayList<>();
            PrescriptionMedicine pm1 = new PrescriptionMedicine();
            pm1.setMedicineName("Amoxicillin 500mg"); pm1.setDosage("1 Tab"); pm1.setFrequency("1-0-1 (BID)"); pm1.setDuration("7 Days");
            meds1.add(pm1);
            PrescriptionMedicine pm2 = new PrescriptionMedicine();
            pm2.setMedicineName("Lisinopril 10mg"); pm2.setDosage("1 Tab"); pm2.setFrequency("1-0-0 (OD)"); pm2.setDuration("30 Days");
            meds1.add(pm2);
            rx1.setMedicines(meds1);
            prescriptionRepository.save(rx1);
        }

        if (p2 != null && d2 != null) {
            Prescription rx2 = new Prescription();
            rx2.setPrescriptionCode("RX-4002");
            rx2.setPatient(p2); rx2.setDoctor(d2);
            rx2.setPrescriptionDate(today);
            rx2.setSymptoms("Sore throat, mild fever");
            rx2.setDiagnosis("Upper Respiratory Tract Infection");
            rx2.setInstructions("Complete full antibiotic course. Drink plenty of warm fluids.");
            rx2.setFollowUpDate(today.plusDays(7));

            List<PrescriptionMedicine> meds2 = new ArrayList<>();
            PrescriptionMedicine pm3 = new PrescriptionMedicine();
            pm3.setMedicineName("Paracetamol 500mg"); pm3.setDosage("1 Tab"); pm3.setFrequency("1-1-1 (TID)"); pm3.setDuration("5 Days");
            meds2.add(pm3);
            rx2.setMedicines(meds2);
            prescriptionRepository.save(rx2);
        }

        log.info("Seeded 2 prescriptions");
    }

    private void seedBills() {
        Patient p1 = patientRepository.findByPatientCode("PT-1001").orElse(null);
        Patient p2 = patientRepository.findByPatientCode("PT-1002").orElse(null);
        Patient p3 = patientRepository.findByPatientCode("PT-1003").orElse(null);
        Doctor d1 = doctorRepository.findByDoctorCode("DOC-2001").orElse(null);
        Doctor d2 = doctorRepository.findByDoctorCode("DOC-2002").orElse(null);
        Doctor d3 = doctorRepository.findByDoctorCode("DOC-2003").orElse(null);

        LocalDate today = LocalDate.now();

        if (p1 != null && d1 != null) {
            Bill b1 = new Bill();
            b1.setBillCode("INV-2023-001");
            b1.setPatient(p1); b1.setDoctor(d1);
            b1.setBillDate(today);
            b1.setConsultationFee(new BigDecimal("100.00"));
            b1.setMedicineCharges(new BigDecimal("45.00"));
            b1.setOtherCharges(new BigDecimal("15.00"));
            b1.setDiscount(new BigDecimal("10.00"));
            b1.setTax(new BigDecimal("5.00"));
            b1.setTotalAmount(new BigDecimal("155.00"));
            b1.setPaymentMethod("Credit Card");
            b1.setPaymentStatus("Paid");
            billRepository.save(b1);
        }

        if (p2 != null && d2 != null) {
            Bill b2 = new Bill();
            b2.setBillCode("INV-2023-002");
            b2.setPatient(p2); b2.setDoctor(d2);
            b2.setBillDate(today);
            b2.setConsultationFee(new BigDecimal("80.00"));
            b2.setMedicineCharges(new BigDecimal("25.50"));
            b2.setOtherCharges(new BigDecimal("35.00"));
            b2.setDiscount(new BigDecimal("20.00"));
            b2.setTax(BigDecimal.ZERO);
            b2.setTotalAmount(new BigDecimal("120.50"));
            b2.setPaymentMethod("Cash");
            b2.setPaymentStatus("Pending");
            billRepository.save(b2);
        }

        if (p3 != null && d3 != null) {
            Bill b3 = new Bill();
            b3.setBillCode("INV-2023-003");
            b3.setPatient(p3); b3.setDoctor(d3);
            b3.setBillDate(today.minusDays(5));
            b3.setConsultationFee(new BigDecimal("150.00"));
            b3.setMedicineCharges(new BigDecimal("120.00"));
            b3.setOtherCharges(new BigDecimal("50.00"));
            b3.setDiscount(BigDecimal.ZERO);
            b3.setTax(new BigDecimal("15.00"));
            b3.setTotalAmount(new BigDecimal("335.00"));
            b3.setPaymentMethod("Insurance");
            b3.setPaymentStatus("Pending");
            billRepository.save(b3);
        }

        log.info("Seeded 3 bills");
    }

    private void seedHospitalSettings() {
        HospitalSetting settings = new HospitalSetting();
        settings.setHospitalName("VitalSync Multi-Specialty Hospital");
        settings.setPhone("+91 (800) 123-4567");
        settings.setEmail("info@vitalsync.com");
        settings.setAddress("Medical Center Road, Healthcare City, MH 400001");
        settings.setRegistrationNumber("VS-HOSP-2026-IND");
        settings.setInvoiceFooter("Thank you for trusting VitalSync Healthcare. Get well soon!");
        hospitalSettingRepository.save(settings);
        log.info("Seeded hospital settings");
    }
}
