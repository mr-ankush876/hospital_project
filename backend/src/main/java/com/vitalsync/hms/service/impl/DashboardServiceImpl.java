package com.vitalsync.hms.service.impl;

import com.vitalsync.hms.dto.DashboardStatsDto;
import com.vitalsync.hms.repository.AppointmentRepository;
import com.vitalsync.hms.repository.BillRepository;
import com.vitalsync.hms.repository.DoctorRepository;
import com.vitalsync.hms.repository.PatientRepository;
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
    private final AppointmentRepository appointmentRepository;
    private final BillRepository billRepository;

    @Override
    public DashboardStatsDto getStats(Authentication authentication) {
        long totalPatients = patientRepository.countActivePatients();
        long totalDoctors = doctorRepository.countActiveDoctors();
        long todayAppointments = appointmentRepository.countAppointmentsByDate(LocalDate.now());
        long pendingBills = billRepository.countPendingBills();

        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_ADMIN"));

        BigDecimal totalRevenue = isAdmin ? billRepository.sumCollectedRevenue() : BigDecimal.ZERO;

        return DashboardStatsDto.builder()
                .totalPatients(totalPatients)
                .totalDoctors(totalDoctors)
                .todayAppointments(todayAppointments)
                .pendingBills(pendingBills)
                .totalRevenue(totalRevenue)
                .build();
    }
}
