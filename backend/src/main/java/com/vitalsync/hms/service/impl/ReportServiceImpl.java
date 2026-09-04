package com.vitalsync.hms.service.impl;

import com.vitalsync.hms.dto.PatientDto;
import com.vitalsync.hms.dto.ReportSummaryDto;
import com.vitalsync.hms.entity.Appointment;
import com.vitalsync.hms.entity.Bill;
import com.vitalsync.hms.entity.Doctor;
import com.vitalsync.hms.entity.Patient;
import com.vitalsync.hms.entity.Bed;
import com.vitalsync.hms.entity.BedReservation;
import com.vitalsync.hms.repository.AppointmentRepository;
import com.vitalsync.hms.repository.BedRepository;
import com.vitalsync.hms.repository.BedReservationRepository;
import com.vitalsync.hms.repository.BillRepository;
import com.vitalsync.hms.repository.DoctorRepository;
import com.vitalsync.hms.repository.PatientRepository;
import com.vitalsync.hms.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
    private final BedRepository bedRepository;
    private final BedReservationRepository bedReservationRepository;

    @Override
    public ReportSummaryDto getSummary(String range) {
        List<Patient> allPatients = patientRepository.findAll();
        List<Doctor> doctors = doctorRepository.findAll();
        List<Appointment> allAppointments = appointmentRepository.findAll();
        List<Bill> allBills = billRepository.findAll();
        List<Bed> allBeds = bedRepository.findAll();
        List<BedReservation> allReservations = bedReservationRepository.findAll();

        // Calculate startDate threshold based on range parameter ('today', 'week', '7d', 'month', '30d', 'all')
        LocalDate now = LocalDate.now();
        LocalDate startDate = null;
        if (range != null) {
            String r = range.toLowerCase().trim();
            if ("today".equals(r)) {
                startDate = now;
            } else if ("week".equals(r) || "7d".equals(r)) {
                startDate = now.minusDays(7);
            } else if ("month".equals(r) || "30d".equals(r)) {
                startDate = now.minusDays(30);
            }
        }

        final LocalDate thresholdDate = startDate;

        // Filter appointments by appointmentDate if range is set
        List<Appointment> appointments = allAppointments.stream()
                .filter(a -> {
                    if (thresholdDate == null) return true;
                    if (a.getAppointmentDate() == null) return true;
                    return !a.getAppointmentDate().isBefore(thresholdDate);
                })
                .collect(Collectors.toList());

        // Filter bills by billDate or createdAt
        List<Bill> bills = allBills.stream()
                .filter(b -> {
                    if (thresholdDate == null) return true;
                    if (b.getBillDate() != null) {
                        return !b.getBillDate().isBefore(thresholdDate);
                    }
                    if (b.getCreatedAt() != null) {
                        return !b.getCreatedAt().toLocalDate().isBefore(thresholdDate);
                    }
                    return true;
                })
                .collect(Collectors.toList());

        // Filter patient registrations by createdAt
        List<Patient> patients = allPatients.stream()
                .filter(p -> {
                    if (thresholdDate == null) return true;
                    if (p.getCreatedAt() != null) {
                        return !p.getCreatedAt().toLocalDate().isBefore(thresholdDate);
                    }
                    return true;
                })
                .collect(Collectors.toList());

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

        List<PatientDto> recent = allPatients.stream()
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

        // Bed Telemetry
        long totalBeds = allBeds.size();
        long occupiedBeds = allBeds.stream().filter(b -> "OCCUPIED".equalsIgnoreCase(b.getStatus())).count();
        long availableBeds = allBeds.stream().filter(b -> "AVAILABLE".equalsIgnoreCase(b.getStatus())).count();
        long availableIcuBeds = allBeds.stream()
                .filter(b -> "ICU".equalsIgnoreCase(b.getBedType()) && "AVAILABLE".equalsIgnoreCase(b.getStatus()))
                .count();
        long pendingBedReservations = allReservations.stream()
                .filter(r -> "PENDING".equalsIgnoreCase(r.getStatus()))
                .count();

        return ReportSummaryDto.builder()
                .totalPatients(thresholdDate != null ? patients.size() : allPatients.size())
                .totalDoctors(doctors.size())
                .totalAppointments(appointments.size())
                .totalBills(bills.size())
                .totalRevenue(totalRevenue)
                .pendingRevenue(pendingRevenue)
                .appointmentsByStatus(aptStatusMap)
                .billsByStatus(billStatusMap)
                .doctorWorkloads(workloads)
                .recentRegistrations(recent)
                .totalBeds(totalBeds)
                .occupiedBeds(occupiedBeds)
                .availableBeds(availableBeds)
                .availableIcuBeds(availableIcuBeds)
                .pendingBedReservations(pendingBedReservations)
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
        sb.append("Bed Infrastructure,Total Bed Capacity,").append(summary.getTotalBeds()).append("\n");
        sb.append("Bed Infrastructure,Occupied Inpatient Beds,").append(summary.getOccupiedBeds()).append("\n");
        sb.append("Bed Infrastructure,Available Beds,").append(summary.getAvailableBeds()).append("\n");
        sb.append("Bed Infrastructure,Available ICU Beds,").append(summary.getAvailableIcuBeds()).append("\n");
        sb.append("Bed Infrastructure,Pending Admission Requests,").append(summary.getPendingBedReservations()).append("\n");
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
