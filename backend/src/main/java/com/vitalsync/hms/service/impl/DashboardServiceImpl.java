package com.vitalsync.hms.service.impl;

import com.vitalsync.hms.dto.DashboardStatsDto;
import com.vitalsync.hms.repository.*;
import com.vitalsync.hms.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final BillRepository billRepository;
    private final BedRepository bedRepository;

    @Override
    public DashboardStatsDto getStats(Authentication authentication) {
        long totalPatients = patientRepository.countActivePatients();
        long totalDoctors = doctorRepository.countActiveDoctors();
        long totalUsers = userRepository.count();
        long totalReceptionists = userRepository.countByRole("RECEPTIONIST");
        long todayAppointments = appointmentRepository.countAppointmentsByDate(LocalDate.now());
        long pendingBills = billRepository.countPendingBills();
        long activeUsers = userRepository.countByStatus("ACTIVE");

        // Bed live metrics
        long totalBeds = bedRepository.count();
        long availableBeds = bedRepository.countByStatus("AVAILABLE");
        long occupiedBeds = bedRepository.countByStatus("OCCUPIED");
        long totalIcuBeds = bedRepository.countByBedType("ICU");
        long availableIcuBeds = bedRepository.countByBedTypeAndStatus("ICU", "AVAILABLE");
        long totalEmgBeds = bedRepository.countByBedType("EMERGENCY");
        long availableEmgBeds = bedRepository.countByBedTypeAndStatus("EMERGENCY", "AVAILABLE");

        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_ADMIN"));

        BigDecimal totalRevenue = isAdmin ? billRepository.sumCollectedRevenue() : BigDecimal.ZERO;

        return DashboardStatsDto.builder()
                .totalPatients(totalPatients)
                .totalDoctors(totalDoctors)
                .totalUsers(totalUsers)
                .totalReceptionists(totalReceptionists)
                .todayAppointments(todayAppointments)
                .pendingAppointments(appointmentRepository.count() - todayAppointments)
                .pendingBills(pendingBills)
                .totalRevenue(totalRevenue)
                .totalBeds(totalBeds)
                .availableBeds(availableBeds)
                .occupiedBeds(occupiedBeds)
                .totalIcuBeds(totalIcuBeds)
                .availableIcuBeds(availableIcuBeds)
                .totalEmergencyBeds(totalEmgBeds)
                .availableEmergencyBeds(availableEmgBeds)
                .activeUsers(activeUsers)
                .build();
    }
}
