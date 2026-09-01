package com.vitalsync.hms.service;

import com.vitalsync.hms.dto.*;

import java.util.List;

public interface PatientPortalService {
    PatientDashboardDto getDashboard(String username);
    PatientDto getProfile(String username);
    PatientDto updateProfile(String username, PatientDto dto);

    List<AppointmentDto> getMyAppointments(String username, String status);
    AppointmentDto bookAppointment(String username, AppointmentDto dto);
    AppointmentDto cancelAppointment(String username, Long appointmentId);

    List<PrescriptionDto> getMyPrescriptions(String username);
    PrescriptionDto getMyPrescriptionById(String username, Long id);

    List<MedicalReportDto> getMyReports(String username);
    MedicalReportDto getMyReportById(String username, Long id);

    List<BillDto> getMyBills(String username);
    BillDto getMyBillById(String username, Long id);

    List<BedReservationDto> getMyBedReservations(String username);
    BedReservationDto bookBedReservation(String username, BedReservationDto dto);
}
