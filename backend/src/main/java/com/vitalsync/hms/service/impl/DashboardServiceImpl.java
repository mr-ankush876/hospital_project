package com.vitalsync.hms.service.impl;

import com.vitalsync.hms.dto.DashboardStatsDto;
import com.vitalsync.hms.repository.*;
import com.vitalsync.hms.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final NurseRepository nurseRepository;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final BillRepository billRepository;
    private final BedRepository bedRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final EmergencyRequestRepository emergencyRequestRepository;
    private final MedicalReportRepository medicalReportRepository;
    private final DepartmentRepository departmentRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardStatsDto getStats(Authentication authentication) {
        long totalPatients = patientRepository.countActivePatients();
        long totalDoctors = doctorRepository.countActiveDoctors();
        long totalReceptionists = userRepository.countByRole("RECEPTIONIST");
        long totalNurses = nurseRepository.count();
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByStatus("ACTIVE");
        long totalStaff = totalDoctors + totalReceptionists + totalNurses;

        // Appointments Breakdown
        LocalDate today = LocalDate.now();
        long todayAppointments = appointmentRepository.countAppointmentsByDate(today);
        long totalAppointments = appointmentRepository.count();
        long pendingAppointments = appointmentRepository.countByStatus("Scheduled") + appointmentRepository.countByStatus("Confirmed") + appointmentRepository.countByStatus("Urgent");
        long completedAppointments = appointmentRepository.countByStatus("Completed");

        // Billing & Invoices Metrics
        long totalBills = billRepository.count();
        long pendingBills = billRepository.countPendingBills();
        long paidBills = billRepository.countByPaymentStatus("Paid") + billRepository.countByPaymentStatus("PAID");

        // Prescriptions, Emergencies, Reports & Departments
        long totalPrescriptions = prescriptionRepository.count();
        long emergencyCases = emergencyRequestRepository.count();
        long medicalReports = medicalReportRepository.count();
        long departments = departmentRepository.count();

        // Bed & ICU live metrics
        long totalBeds = bedRepository.count();
        long availableBeds = bedRepository.countByStatus("AVAILABLE");
        long occupiedBeds = bedRepository.countByStatus("OCCUPIED");
        long reservedBeds = bedRepository.countByStatus("RESERVED");
        long maintenanceBeds = bedRepository.countByStatus("MAINTENANCE");

        long totalIcuBeds = bedRepository.countByBedType("ICU");
        long availableIcuBeds = bedRepository.countByBedTypeAndStatus("ICU", "AVAILABLE");

        long totalEmgBeds = bedRepository.countByBedType("EMERGENCY");
        long availableEmgBeds = bedRepository.countByBedTypeAndStatus("EMERGENCY", "AVAILABLE");

        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_ADMIN"));

        BigDecimal totalRevenue = isAdmin ? billRepository.sumCollectedRevenue() : BigDecimal.ZERO;
        if (totalRevenue == null) {
            totalRevenue = BigDecimal.ZERO;
        }

        return DashboardStatsDto.builder()
                .totalPatients(totalPatients)
                .totalDoctors(totalDoctors)
                .totalReceptionists(totalReceptionists)
                .totalNurses(totalNurses)
                .totalStaff(totalStaff)
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .todayAppointments(todayAppointments)
                .pendingAppointments(pendingAppointments)
                .completedAppointments(completedAppointments)
                .totalAppointments(totalAppointments)
                .pendingBills(pendingBills)
                .paidBills(paidBills)
                .totalBills(totalBills)
                .totalInvoices(totalBills)
                .totalRevenue(totalRevenue)
                .totalPrescriptions(totalPrescriptions)
                .emergencyCases(emergencyCases)
                .medicalReports(medicalReports)
                .departments(departments)
                .totalBeds(totalBeds)
                .availableBeds(availableBeds)
                .occupiedBeds(occupiedBeds)
                .reservedBeds(reservedBeds)
                .maintenanceBeds(maintenanceBeds)
                .totalIcuBeds(totalIcuBeds)
                .availableIcuBeds(availableIcuBeds)
                .totalEmergencyBeds(totalEmgBeds)
                .availableEmergencyBeds(availableEmgBeds)
                .build();
    }
}
