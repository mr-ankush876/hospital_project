package com.vitalsync.hms.service.impl;

import com.vitalsync.hms.dto.PatientDto;
import com.vitalsync.hms.dto.ReportSummaryDto;
import com.vitalsync.hms.entity.Appointment;
import com.vitalsync.hms.entity.Bill;
import com.vitalsync.hms.entity.Doctor;
import com.vitalsync.hms.entity.Patient;
import com.vitalsync.hms.repository.AppointmentRepository;
import com.vitalsync.hms.repository.BillRepository;
import com.vitalsync.hms.repository.DoctorRepository;
import com.vitalsync.hms.repository.PatientRepository;
import com.vitalsync.hms.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final BillRepository billRepository;

    @Override
    public ReportSummaryDto getSummary(String range) {
        List<Patient> patients = patientRepository.findAll();
        List<Doctor> doctors = doctorRepository.findAll();
        List<Appointment> appointments = appointmentRepository.findAll();
        List<Bill> bills = billRepository.findAll();

        Map<String, Long> aptStatusMap = appointments.stream()
                .collect(Collectors.groupingBy(Appointment::getStatus, Collectors.counting()));

        Map<String, Long> billStatusMap = bills.stream()
                .collect(Collectors.groupingBy(Bill::getPaymentStatus, Collectors.counting()));

        BigDecimal totalRevenue = bills.stream()
                .filter(b -> "Paid".equalsIgnoreCase(b.getPaymentStatus()))
                .map(Bill::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal pendingRevenue = bills.stream()
                .filter(b -> "Pending".equalsIgnoreCase(b.getPaymentStatus()))
                .map(Bill::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<ReportSummaryDto.DoctorWorkloadDto> workloads = doctors.stream().map(doc -> {
            long total = appointments.stream()
                    .filter(a -> a.getDoctor() != null && a.getDoctor().getId().equals(doc.getId()))
                    .count();
            long completed = appointments.stream()
                    .filter(a -> a.getDoctor() != null && a.getDoctor().getId().equals(doc.getId()) && "Completed".equalsIgnoreCase(a.getStatus()))
                    .count();
            return ReportSummaryDto.DoctorWorkloadDto.builder()
                    .id(doc.getId())
                    .name(doc.getFullName())
                    .specialization(doc.getSpecialization())
                    .totalAppointments(total)
                    .completedAppointments(completed)
                    .status(doc.getStatus())
                    .build();
        }).collect(Collectors.toList());

        List<PatientDto> recent = patients.stream()
                .sorted((a, b) -> b.getId().compareTo(a.getId()))
                .limit(5)
                .map(p -> PatientDto.builder()
                        .id(p.getId())
                        .patientCode(p.getPatientCode())
                        .fullName(p.getFullName())
                        .gender(p.getGender())
                        .bloodGroup(p.getBloodGroup())
                        .phone(p.getPhone())
                        .status(p.getStatus())
                        .build())
                .collect(Collectors.toList());

        return ReportSummaryDto.builder()
                .totalPatients(patients.size())
                .totalDoctors(doctors.size())
                .totalAppointments(appointments.size())
                .totalBills(bills.size())
                .totalRevenue(totalRevenue)
                .pendingRevenue(pendingRevenue)
                .appointmentsByStatus(aptStatusMap)
                .billsByStatus(billStatusMap)
                .doctorWorkloads(workloads)
                .recentRegistrations(recent)
                .build();
    }

    @Override
    public byte[] exportCsv(String range) {
        ReportSummaryDto summary = getSummary(range);
        StringBuilder sb = new StringBuilder();
        sb.append("Category,Metric,Value\n");
        sb.append("Overview,Total Patients Registered,").append(summary.getTotalPatients()).append("\n");
        sb.append("Overview,Active Doctors,").append(summary.getTotalDoctors()).append("\n");
        sb.append("Overview,Total Consultations,").append(summary.getTotalAppointments()).append("\n");
        sb.append("Financials,Collected Revenue (INR),").append(summary.getTotalRevenue()).append("\n");
        sb.append("Financials,Pending Receivables (INR),").append(summary.getPendingRevenue()).append("\n");
        sb.append("\n");
        sb.append("Doctor Name,Specialization,Appointments Handled,Completed Consultations,Status\n");

        for (ReportSummaryDto.DoctorWorkloadDto doc : summary.getDoctorWorkloads()) {
            sb.append("\"").append(doc.getName()).append("\",")
                    .append("\"").append(doc.getSpecialization()).append("\",")
                    .append(doc.getTotalAppointments()).append(",")
                    .append(doc.getCompletedAppointments()).append(",")
                    .append(doc.getStatus()).append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }
}
