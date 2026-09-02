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
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final BedRepository bedRepository;
    private final BedReservationRepository bedReservationRepository;
    private final AppointmentRepository appointmentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final MedicalReportRepository medicalReportRepository;
    private final BillRepository billRepository;
    private final HospitalSettingRepository hospitalSettingRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    @org.springframework.beans.factory.annotation.Value("${app.admin.username:admin}")
    private String adminUsername;

    @org.springframework.beans.factory.annotation.Value("${app.admin.password:Admin@2026}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(String... args) {
        if (departmentRepository.count() == 0) {
            seedDepartments();
        }

        if (userRepository.count() == 0) {
            log.info("Empty database detected. Seeding initial users and data...");
            seedUsers();
            seedDoctors();
            seedPatients();
            seedBeds();
            seedAppointments();
            seedPrescriptions();
            seedMedicalReports();
            seedBills();
            seedHospitalSettings();
            seedAuditLogs();
            log.info("Database seeding completed successfully!");
        } else {
            // Ensure admin credentials always match configuration
            ensureAdminUser();

            // If departments or beds are missing in existing DB, initialize them
            if (bedRepository.count() == 0) {
                seedBeds();
            }
            if (medicalReportRepository.count() == 0) {
                seedMedicalReports();
            }
        }
    }

    private void ensureAdminUser() {
        Optional<User> adminOpt = userRepository.findAll().stream()
                .filter(u -> "ADMIN".equalsIgnoreCase(u.getRole()))
                .findFirst();

        if (adminOpt.isPresent()) {
            User admin = adminOpt.get();
            admin.setUsername(adminUsername);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setFullName("Dr. Ankush singh (Administrator)");
            admin.setEmail("ankush@vitalsync.com");
            admin.setPhone("+91 8797254899");
            admin.setStatus("ACTIVE");
            userRepository.save(admin);
            log.info("Admin account credentials synchronized: username='{}', name='{}'", adminUsername, admin.getFullName());
        } else {
            User admin = User.builder()
                    .username(adminUsername)
                    .password(passwordEncoder.encode(adminPassword))
                    .email("ankush@vitalsync.com")
                    .fullName("Dr. Ankush singh (Administrator)")
                    .phone("+91 8797254899")
                    .role("ADMIN")
                    .status("ACTIVE")
                    .build();
            userRepository.save(admin);
            log.info("Admin account created with username='{}'", adminUsername);
        }
    }

    private void seedDepartments() {
        String[][] depts = {
            {"DEP-001", "Cardiology", "Specialized comprehensive cardiovascular diagnostics and interventions.", "Dr. Robert Chen", "15"},
            {"DEP-002", "Neurology", "Comprehensive neurological and neurosurgical clinical care.", "Dr. Marcus Vance", "10"},
            {"DEP-003", "Pediatrics", "Pediatric medicine, neonatal care, and child healthcare.", "Dr. Emily Stanton", "12"},
            {"DEP-004", "General Medicine", "Primary outpatient and inpatient internal medical care.", "Dr. Sarah Mitchell", "20"},
            {"DEP-005", "Emergency & Trauma", "24/7 Level-1 Emergency and critical acute trauma center.", "Dr. Sarah Mitchell", "15"},
            {"DEP-006", "Intensive Care Unit (ICU)", "State-of-the-art intensive monitoring and life support systems.", "Dr. Robert Chen", "10"},
            {"DEP-007", "Orthopedics", "Musculoskeletal surgical care, joint replacement, and rehabilitation.", "Dr. Marcus Vance", "10"},
            {"DEP-008", "General Surgery", "Advanced laparoscopic and major open surgical interventions.", "Dr. Sarah Mitchell", "12"},
            {"DEP-009", "Radiology & Imaging", "High-field MRI, 128-slice CT, digital X-Ray, and ultrasonography.", "Dr. Emily Stanton", "5"},
            {"DEP-010", "Pathology & Diagnostics", "Automated clinical biochemistry, hematology, and histopathology.", "Dr. Robert Chen", "0"},
            {"DEP-011", "Pharmacy", "Hospital formulary dispensing and inpatient medication distribution.", "Dr. Sarah Mitchell", "0"},
            {"DEP-012", "Oncology", "Medical oncology, chemotherapy infusion, and palliative support.", "Dr. Marcus Vance", "8"}
        };

        for (String[] d : depts) {
            Department dept = Department.builder()
                    .departmentCode(d[0])
                    .name(d[1])
                    .description(d[2])
                    .headDoctorName(d[3])
                    .totalBeds(Integer.parseInt(d[4]))
                    .availableBeds(Integer.parseInt(d[4]))
                    .occupiedBeds(0)
                    .status("Active")
                    .build();
            departmentRepository.save(dept);
        }
        log.info("Seeded 12 hospital departments");
    }

    private void seedUsers() {
        String encodedPassword = passwordEncoder.encode("password123");

        User admin = User.builder()
                .username(adminUsername)
                .password(passwordEncoder.encode(adminPassword))
                .email("ankush@vitalsync.com")
                .fullName("Dr. Ankush singh (Administrator)")
                .phone("+91 8797254899")
                .role("ADMIN")
                .status("ACTIVE")
                .build();
        userRepository.save(admin);

        User drChen = User.builder()
                .username("dr.chen")
                .password(encodedPassword)
                .email("r.chen@vitalsync.com")
                .fullName("Dr. Robert Chen")
                .phone("+1 (555) 123-4567")
                .role("DOCTOR")
                .status("ACTIVE")
                .build();
        userRepository.save(drChen);

        User drStanton = User.builder()
                .username("dr.stanton")
                .password(encodedPassword)
                .email("e.stanton@vitalsync.com")
                .fullName("Dr. Emily Stanton")
                .phone("+1 (555) 987-6543")
                .role("DOCTOR")
                .status("ACTIVE")
                .build();
        userRepository.save(drStanton);

        User drVance = User.builder()
                .username("dr.vance")
                .password(encodedPassword)
                .email("m.vance@vitalsync.com")
                .fullName("Dr. Marcus Vance")
                .phone("+1 (555) 456-7890")
                .role("DOCTOR")
                .status("ACTIVE")
                .build();
        userRepository.save(drVance);

        User receptionist = User.builder()
                .username("receptionist")
                .password(encodedPassword)
                .email("reception@vitalsync.com")
                .fullName("Alex Vance")
                .phone("+1 (555) 111-2233")
                .role("RECEPTIONIST")
                .status("ACTIVE")
                .build();
        userRepository.save(receptionist);

        // Seed patient accounts
        User pUser1 = User.builder()
                .username("patient.michael")
                .password(encodedPassword)
                .email("michael.chang@email.com")
                .fullName("Michael Chang")
                .phone("+1 (555) 123-4567")
                .role("PATIENT")
                .status("ACTIVE")
                .build();
        userRepository.save(pUser1);

        User pUser2 = User.builder()
                .username("patient.sarah")
                .password(encodedPassword)
                .email("sarah.j@email.com")
                .fullName("Sarah Jenkins")
                .phone("+1 (555) 987-6543")
                .role("PATIENT")
                .status("ACTIVE")
                .build();
        userRepository.save(pUser2);

        log.info("Seeded central user accounts with BCrypt passwords");
    }

    private void seedDoctors() {
        Department cardio = departmentRepository.findByName("Cardiology").orElse(null);
        Department peds = departmentRepository.findByName("Pediatrics").orElse(null);
        Department neuro = departmentRepository.findByName("Neurology").orElse(null);
        Department genMed = departmentRepository.findByName("General Medicine").orElse(null);

        User drChenUser = userRepository.findByUsername("dr.chen").orElse(null);
        User drStantonUser = userRepository.findByUsername("dr.stanton").orElse(null);
        User drVanceUser = userRepository.findByUsername("dr.vance").orElse(null);
        User adminUser = userRepository.findByUsername(adminUsername).orElse(null);

        Doctor d1 = Doctor.builder()
                .doctorCode("DOC-2001")
                .user(drChenUser)
                .department(cardio)
                .fullName("Dr. Robert Chen")
                .email("r.chen@vitalsync.com")
                .phone("+1 (555) 123-4567")
                .specialization("Cardiology")
                .qualification("MD, FACC, Board Certified Cardiologist")
                .experience("15 Years")
                .availableDays("Mon, Wed, Fri")
                .availableTime("09:00 AM - 05:00 PM")
                .consultationFee(new BigDecimal("150.00"))
                .status("Available")
                .imageUrl("https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&h=300&fit=crop&crop=face")
                .build();
        doctorRepository.save(d1);

        Doctor d2 = Doctor.builder()
                .doctorCode("DOC-2002")
                .user(drStantonUser)
                .department(peds)
                .fullName("Dr. Emily Stanton")
                .email("e.stanton@vitalsync.com")
                .phone("+1 (555) 987-6543")
                .specialization("Pediatrics")
                .qualification("MD, FAAP, Pediatric Critical Care Specialist")
                .experience("10 Years")
                .availableDays("Tue, Thu, Sat")
                .availableTime("08:00 AM - 04:00 PM")
                .consultationFee(new BigDecimal("120.00"))
                .status("Available")
                .imageUrl("https://images.unsplash.com/photo-1594824813589-3221b66b4033?w=300&h=300&fit=crop&crop=face")
                .build();
        doctorRepository.save(d2);

        Doctor d3 = Doctor.builder()
                .doctorCode("DOC-2003")
                .user(drVanceUser)
                .department(neuro)
                .fullName("Dr. Marcus Vance")
                .email("m.vance@vitalsync.com")
                .phone("+1 (555) 456-7890")
                .specialization("Neurology")
                .qualification("MD, PhD, Neuro-Oncology Fellow")
                .experience("18 Years")
                .availableDays("Mon - Fri")
                .availableTime("10:00 AM - 06:00 PM")
                .consultationFee(new BigDecimal("200.00"))
                .status("In Surgery")
                .imageUrl("https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&h=300&fit=crop&crop=face")
                .build();
        doctorRepository.save(d3);

        Doctor d4 = Doctor.builder()
                .doctorCode("DOC-2004")
                .user(adminUser)
                .department(genMed)
                .fullName("Dr. Sarah Mitchell")
                .email("s.mitchell@vitalsync.com")
                .phone("+1 (555) 321-7654")
                .specialization("General Practice & Internal Medicine")
                .qualification("MBBS, MD, Chief Medical Officer")
                .experience("12 Years")
                .availableDays("Mon - Sat")
                .availableTime("09:00 AM - 05:00 PM")
                .consultationFee(new BigDecimal("100.00"))
                .status("Available")
                .imageUrl("https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face")
                .build();
        doctorRepository.save(d4);

        log.info("Seeded 4 doctors with linked user and department relationships");
    }

    private void seedPatients() {
        User pUser1 = userRepository.findByUsername("patient.michael").orElse(null);
        User pUser2 = userRepository.findByUsername("patient.sarah").orElse(null);

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
            User linkedUser = null;
            if ("PT-1001".equals(pd[0])) linkedUser = pUser1;
            if ("PT-1002".equals(pd[0])) linkedUser = pUser2;

            Patient p = Patient.builder()
                    .patientCode(pd[0])
                    .user(linkedUser)
                    .fullName(pd[1])
                    .dob(LocalDate.parse(pd[2]))
                    .age(Integer.parseInt(pd[3]))
                    .gender(pd[4])
                    .bloodGroup(pd[5])
                    .phone(pd[6])
                    .email(pd[7])
                    .address(pd[8])
                    .emergencyContact(pd[9])
                    .medicalHistory(pd[10])
                    .allergies(pd[11])
                    .status(pd[12])
                    .build();
            patientRepository.save(p);
        }
        log.info("Seeded 8 patients");
    }

    private void seedBeds() {
        Department icu = departmentRepository.findByName("Intensive Care Unit (ICU)").orElse(null);
        Department emg = departmentRepository.findByName("Emergency & Trauma").orElse(null);
        Department cardio = departmentRepository.findByName("Cardiology").orElse(null);
        Department genMed = departmentRepository.findByName("General Medicine").orElse(null);

        Patient p1 = patientRepository.findByPatientCode("PT-1001").orElse(null);
        Patient p3 = patientRepository.findByPatientCode("PT-1003").orElse(null);

        if (icu != null) {
            for (int i = 1; i <= 10; i++) {
                String bedNum = String.format("ICU-%03d", i);
                String status = (i <= 3) ? "OCCUPIED" : (i == 4 ? "RESERVED" : "AVAILABLE");
                Patient current = (i == 1) ? p1 : (i == 2 ? p3 : null);

                Bed bed = Bed.builder()
                        .bedNumber(bedNum)
                        .department(icu)
                        .bedType("ICU")
                        .dailyCharge(new BigDecimal("500.00"))
                        .status(status)
                        .currentPatient(current)
                        .admissionDate(current != null ? LocalDateTime.now().minusDays(2) : null)
                        .notes("Advanced mechanical ventilator and dynamic hemodynamic monitor")
                        .build();
                bedRepository.save(bed);
            }
        }

        if (emg != null) {
            for (int i = 1; i <= 8; i++) {
                String bedNum = String.format("EMG-%02d", i);
                String status = (i <= 2) ? "OCCUPIED" : "AVAILABLE";

                Bed bed = Bed.builder()
                        .bedNumber(bedNum)
                        .department(emg)
                        .bedType("EMERGENCY")
                        .dailyCharge(new BigDecimal("300.00"))
                        .status(status)
                        .notes("Level 1 Acute Trauma resuscitation bay")
                        .build();
                bedRepository.save(bed);
            }
        }

        if (genMed != null) {
            for (int i = 1; i <= 15; i++) {
                String bedNum = String.format("GW-%03d", 200 + i);
                String status = (i <= 4) ? "OCCUPIED" : "AVAILABLE";

                Bed bed = Bed.builder()
                        .bedNumber(bedNum)
                        .department(genMed)
                        .bedType("GENERAL")
                        .dailyCharge(new BigDecimal("100.00"))
                        .status(status)
                        .notes("General Medical Inpatient ward unit")
                        .build();
                bedRepository.save(bed);
            }
        }

        if (cardio != null) {
            for (int i = 1; i <= 5; i++) {
                String bedNum = String.format("PVT-%03d", 300 + i);
                String status = (i == 1) ? "OCCUPIED" : "AVAILABLE";

                Bed bed = Bed.builder()
                        .bedNumber(bedNum)
                        .department(cardio)
                        .bedType("PRIVATE")
                        .dailyCharge(new BigDecimal("250.00"))
                        .status(status)
                        .notes("Private single-room deluxe recovery suite")
                        .build();
                bedRepository.save(bed);
            }
        }

        log.info("Seeded hospital beds (ICU, Emergency, General Ward, Private suites)");
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

        log.info("Seeded appointments");
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

        log.info("Seeded prescriptions");
    }

    private void seedMedicalReports() {
        Patient p1 = patientRepository.findByPatientCode("PT-1001").orElse(null);
        Patient p2 = patientRepository.findByPatientCode("PT-1002").orElse(null);
        Doctor d1 = doctorRepository.findByDoctorCode("DOC-2001").orElse(null);
        Doctor d2 = doctorRepository.findByDoctorCode("DOC-2002").orElse(null);

        if (p1 != null && d1 != null) {
            MedicalReport rep1 = MedicalReport.builder()
                    .reportCode("REP-7001")
                    .patient(p1)
                    .doctor(d1)
                    .departmentName("Cardiology")
                    .reportType("12-Lead Electrocardiogram (ECG)")
                    .reportDate(LocalDate.now().minusDays(3))
                    .symptoms("Exertional palpitation and mild chest heaviness.")
                    .diagnosis("Sinus rhythm with borderline LVH criteria.")
                    .testResults("PR Interval: 160ms, QRS Duration: 92ms, QTc: 418ms. No acute ST-elevation or T-wave inversion.")
                    .doctorNotes("Continue Lisinopril 10mg. Schedule 2D-Echocardiogram if symptoms persist.")
                    .status("Final")
                    .build();
            medicalReportRepository.save(rep1);

            MedicalReport rep2 = MedicalReport.builder()
                    .reportCode("REP-7002")
                    .patient(p1)
                    .doctor(d1)
                    .departmentName("Pathology & Diagnostics")
                    .reportType("Comprehensive Lipid Profile")
                    .reportDate(LocalDate.now().minusDays(10))
                    .symptoms("Routine cardiovascular risk profiling.")
                    .diagnosis("Mild Dyslipidemia")
                    .testResults("Total Cholesterol: 215 mg/dL (Borderline High), Triglycerides: 165 mg/dL, HDL: 44 mg/dL, LDL: 138 mg/dL.")
                    .doctorNotes("Lifestyle modification recommended: low saturated fat diet, 30 min daily walking.")
                    .status("Final")
                    .build();
            medicalReportRepository.save(rep2);
        }

        if (p2 != null && d2 != null) {
            MedicalReport rep3 = MedicalReport.builder()
                    .reportCode("REP-7003")
                    .patient(p2)
                    .doctor(d2)
                    .departmentName("Pathology & Diagnostics")
                    .reportType("Complete Blood Count (CBC)")
                    .reportDate(LocalDate.now().minusDays(2))
                    .symptoms("Fatigue and low-grade pyrexia.")
                    .diagnosis("Mild reactive leukocytosis consistent with viral URI.")
                    .testResults("WBC: 11.2 x 10^3/uL, Hemoglobin: 13.4 g/dL, Platelets: 280 x 10^3/uL, CRP: 4.2 mg/L.")
                    .doctorNotes("Supportive hydration and antipyretics. Review in 5 days if fever persists.")
                    .status("Final")
                    .build();
            medicalReportRepository.save(rep3);
        }

        log.info("Seeded medical reports");
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

    private void seedAuditLogs() {
        AuditLog l1 = AuditLog.builder()
                .username("system")
                .role("SYSTEM")
                .action("SYSTEM_INITIALIZATION")
                .entityName("System")
                .entityId("0")
                .details("VitalSync Clinical Precision HMS initialized and synchronized.")
                .ipAddress("127.0.0.1")
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(l1);

        AuditLog l2 = AuditLog.builder()
                .username("admin")
                .role("ADMIN")
                .action("SYSTEM_VERIFICATION")
                .entityName("HospitalSetting")
                .entityId("1")
                .details("Hospital configuration verified and active.")
                .ipAddress("127.0.0.1")
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(l2);

        log.info("Seeded audit logs");
    }
}
