package com.vitalsync.hms.service;

import com.vitalsync.hms.dto.*;
import org.springframework.security.core.Authentication;

import java.util.List;

public interface SearchService {
    GlobalSearchResultDto globalSearch(String query, Authentication authentication);
    List<UserDto> searchUsers(String query);
    List<PatientDto> searchPatients(String query);
    List<DoctorDto> searchDoctors(String query);
    List<AppointmentDto> searchAppointments(String query);
    List<PrescriptionDto> searchPrescriptions(String query);
    List<BillDto> searchBills(String query);
}
