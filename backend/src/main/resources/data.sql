-- Seed Data for VitalSync HMS
-- Passwords are BCrypt hashed for 'password123': $2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07Xd00DMxs.AQubh4a

-- 1. Users
INSERT INTO users (username, password, email, full_name, role) VALUES
('ankush_876', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07Xd00DMxs.AQubh4a', 'admin@vitalsync.com', 'Dr. Sarah Mitchell', 'ADMIN'),
('dr.chen', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07Xd00DMxs.AQubh4a', 'r.chen@vitalsync.com', 'Dr. Robert Chen', 'DOCTOR'),
('dr.stanton', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07Xd00DMxs.AQubh4a', 'e.stanton@vitalsync.com', 'Dr. Emily Stanton', 'DOCTOR'),
('receptionist', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07Xd00DMxs.AQubh4a', 'reception@vitalsync.com', 'Alex Vance', 'RECEPTIONIST');

-- 2. Patients
INSERT INTO patients (patient_code, full_name, dob, age, gender, blood_group, phone, email, address, emergency_contact, medical_history, allergies, status) VALUES
('PT-1001', 'Michael Chang', '1979-05-14', 45, 'Male', 'O+', '+1 (555) 123-4567', 'michael.chang@email.com', '742 Evergreen Terrace, Springfield', '+1 (555) 999-1111', 'Hypertension diagnosed in 2021. Regular checkup.', 'Penicillin, Latex (Mild)', 'Active'),
('PT-1002', 'Sarah Jenkins', '1996-08-22', 28, 'Female', 'A-', '+1 (555) 987-6543', 'sarah.j@email.com', '123 Maple Street, Cityville', '+1 (555) 888-2222', 'Mild asthma, managed with Inhaler.', 'Sulfa Drugs', 'Active'),
('PT-1003', 'Robert Johnson', '1962-11-03', 62, 'Male', 'B+', '+1 (555) 345-6789', 'robert.j@email.com', '456 Oak Avenue, Metropolis', '+1 (555) 777-3333', 'Type 2 Diabetes since 2018.', 'None reported', 'Inactive'),
('PT-1004', 'Eleanor Vance', '1985-02-19', 39, 'Female', 'AB+', '+1 (555) 234-5678', 'eleanor.vance@email.com', '89 Hill House Lane, Boston', '+1 (555) 666-4444', 'Migraine headaches.', 'Aspirin', 'Active'),
('PT-1005', 'Marcus Holloway', '1992-09-30', 32, 'Male', 'O-', '+1 (555) 876-5432', 'marcus.h@email.com', '505 Bay Street, San Francisco', '+1 (555) 555-5555', 'ACL Knee Reconstruction in 2020.', 'Ibuprofen', 'Active'),
('PT-1006', 'Sophia Chen', '2016-04-12', 8, 'Female', 'A+', '+1 (555) 432-1098', 'parent.chen@email.com', '321 Pine Road, Seattle', '+1 (555) 444-6666', 'Pediatric seasonal allergies.', 'Peanuts (Severe)', 'Active'),
('PT-1007', 'James Wilson', '1970-12-05', 53, 'Male', 'B-', '+1 (555) 654-3210', 'j.wilson@email.com', '789 Cedar Drive, Chicago', '+1 (555) 333-7777', 'Coronary artery disease history.', 'Codeine', 'Active'),
('PT-1008', 'Clara Oswald', '1994-11-23', 29, 'Female', 'O+', '+1 (555) 789-0123', 'clara.o@email.com', '42 Time Vortex Way, London', '+1 (555) 222-8888', 'Routine wellness checkups.', 'None', 'Active');

-- 3. Doctors
INSERT INTO doctors (doctor_code, full_name, email, phone, specialization, qualification, experience, available_days, available_time, status, image_url) VALUES
('DOC-2001', 'Dr. Robert Chen', 'r.chen@vitalsync.com', '+1 (555) 123-4567', 'Cardiology', 'MD, FACC', '15 Years', 'Mon, Wed, Fri', '09:00 AM - 05:00 PM', 'Available', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBctLRtQ8NHjbeK38jiNpkCE7D4Ng9jR5rbsE30fNR5jFOa1-cughyOBYzbdmiV44xQCk2AUGGVvTGlTmDGMFiIPSqHkqeIkX9ruHCwPtRQoKexEHQk4tvfBYvjBKOFdO1AP3kbP_Ta4LBeSDsQZGJEA25Yi9bYllkJa0mLt1DDdh7TbNOCxyCUS_xqmGOF8hnmz9I_yBIRJYPstupgEloj_bAZI6H-cvkRwIXBsldc2dSoWhwaBa00'),
('DOC-2002', 'Dr. Emily Stanton', 'e.stanton@vitalsync.com', '+1 (555) 987-6543', 'Pediatrics', 'MD, FAAP', '10 Years', 'Tue, Thu, Sat', '08:00 AM - 04:00 PM', 'Available', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDFywVtwJtodyjzPqX6BmW2hTzuT_guMztAIcO4SjgredtVXw33yo2ah22nV8i_RyUJbU5_b79jUj6n6qzF_qWfyADPx4tyKSmubmQjcggDbtnt8Rjlrj3_dtxTCLUzczLcF2fqhHlvGLNG7T9OIoiQ4F4kjcYZCN5OoJMqHcw8py__uA9F72GfZzd2lckBTfLhtQko1vMiqJrvhaZBWYeytLcNsigI2cTymdMPulSccY03bs3ko2ix'),
('DOC-2003', 'Dr. Marcus Vance', 'm.vance@vitalsync.com', '+1 (555) 456-7890', 'Neurology', 'MD, PhD', '18 Years', 'Mon - Fri', '10:00 AM - 06:00 PM', 'In Surgery', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDhB0ud0-09zEzZXawjKzpZLVHPtCJc7ZAKFsceZpd0U3OzomyGE9l8LUB4R2uHECaWZU7VDfXDWnVi-eeNra4KcjwewiQjHvDdaf3X57qFO9qX1pVQ5YoFnF_Pmq5Pmpapf0RugKyK_JSfb-OttwKwRoPYSmwXrDyFUx92CCSMIEYke9igWZcrzPvNm8XZftMy9UKYJaN1IhgRucFWT7WYkA3JdEcojvwqc9M0J-3-0QRoYKRbs85'),
('DOC-2004', 'Dr. Sarah Mitchell', 's.mitchell@vitalsync.com', '+1 (555) 321-7654', 'General Practice', 'MBBS, MD', '12 Years', 'Mon - Sat', '09:00 AM - 05:00 PM', 'Available', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZK4XNdJnvRpcRWrzlH6QKn2KtmFsLkMvNLdNeMwmQ_wR3pu0jSXYQ_CNfYW5l9o6pICfGuuISvVCicbczjgTxRioiIYD8xyxw_0tPktXsYhWoklr6qrwMQQhtkxGIV1RkoeDnqthQEQA1beeZX4CU-B1eDNqZJ2TBpIWPJ4qx89oCMWMrmQ1v_4CA2EuHLVXXnSZca94Hs16yOtP2Bu_LgedaBrOLTggF8qkyFsTiHCr9rpGeScim');

-- 4. Appointments
INSERT INTO appointments (appointment_code, patient_id, doctor_id, appointment_date, appointment_time, reason, notes, status) VALUES
('APT-2045', 1, 1, CURRENT_DATE, '09:00 AM', 'Routine Cardiac Evaluation', 'Patient reported mild chest tightness.', 'Confirmed'),
('APT-2046', 2, 2, CURRENT_DATE, '09:30 AM', 'General Wellness Check', 'Followup after pediatric fever.', 'In Progress'),
('APT-2047', 6, 2, CURRENT_DATE, '10:15 AM', 'Allergy Followup', 'Routine checkup for asthma inhaler refill.', 'Scheduled'),
('APT-2048', 7, 1, CURRENT_DATE, '11:00 AM', 'Urgent BP Spiking Evaluation', 'BP reading 160/100 at home.', 'Urgent'),
('APT-2049', 4, 3, DATEADD('DAY', 1, CURRENT_DATE), '02:00 PM', 'Neurology Consultation for Migraine', 'Evaluated for chronic headaches.', 'Scheduled');

-- 5. Prescriptions
INSERT INTO prescriptions (prescription_code, patient_id, doctor_id, prescription_date, symptoms, diagnosis, instructions, follow_up_date) VALUES
('RX-4001', 1, 1, CURRENT_DATE, 'Mild chest tightness, elevated blood pressure', 'Stage 1 Primary Hypertension', 'Take medications after breakfast. Avoid salt heavy foods.', DATEADD('DAY', 14, CURRENT_DATE)),
('RX-4002', 2, 2, CURRENT_DATE, 'Sore throat, mild fever', 'Upper Respiratory Tract Infection', 'Complete full antibiotic course. Drink plenty of warm fluids.', DATEADD('DAY', 7, CURRENT_DATE));

-- 6. Prescription Medicines
INSERT INTO prescription_medicines (prescription_id, medicine_name, dosage, frequency, duration) VALUES
(1, 'Amoxicillin 500mg', '1 Tab', '1-0-1 (BID)', '7 Days'),
(1, 'Lisinopril 10mg', '1 Tab', '1-0-0 (OD)', '30 Days'),
(2, 'Paracetamol 500mg', '1 Tab', '1-1-1 (TID)', '5 Days');

-- 7. Bills
INSERT INTO bills (bill_code, patient_id, doctor_id, bill_date, consultation_fee, medicine_charges, other_charges, discount, tax, total_amount, payment_method, payment_status) VALUES
('INV-2023-001', 1, 1, CURRENT_DATE, 100.00, 45.00, 15.00, 10.00, 5.00, 155.00, 'Credit Card', 'Paid'),
('INV-2023-002', 2, 2, CURRENT_DATE, 80.00, 25.50, 35.00, 20.00, 0.00, 120.50, 'Cash', 'Pending'),
('INV-2023-003', 3, 3, DATEADD('DAY', -5, CURRENT_DATE), 150.00, 120.00, 50.00, 0.00, 15.00, 335.00, 'Insurance', 'Pending');

-- 8. Hospital Settings
INSERT INTO hospital_settings (hospital_name, phone, email, address, registration_number, invoice_footer) VALUES
('VitalSync Multi-Specialty Hospital', '+91 (800) 123-4567', 'info@vitalsync.com', 'Medical Center Road, Healthcare City, MH 400001', 'VS-HOSP-2026-IND', 'Thank you for trusting VitalSync Healthcare. Get well soon!');
