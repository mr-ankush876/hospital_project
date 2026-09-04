package com.vitalsync.hms.service;

import com.vitalsync.hms.dto.BedDto;
import com.vitalsync.hms.dto.BedReservationDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface BedService {
    List<BedDto> getAllBeds(Long departmentId, String bedType, String status, String search);
    Page<BedDto> getAllBedsPaged(Long departmentId, String bedType, String status, String search, Pageable pageable);
    BedDto getBedById(Long id);
    BedDto createBed(BedDto dto);
    BedDto updateBed(Long id, BedDto dto);
    BedDto updateBedStatus(Long id, String status, Long patientId);
    void deleteBed(Long id);

    // Bed Reservations
    List<BedReservationDto> getAllReservations(Long patientId, Long departmentId, String bedType, String status, String search);
    Page<BedReservationDto> getAllReservationsPaged(Long patientId, Long departmentId, String bedType, String status, String search, Pageable pageable);
    BedReservationDto getReservationById(Long id);
    BedReservationDto createReservation(BedReservationDto dto);
    BedReservationDto updateReservationStatus(Long id, String status, String notes);
    BedReservationDto updateReservationStatus(Long id, String status, String notes, Long bedId);
}
