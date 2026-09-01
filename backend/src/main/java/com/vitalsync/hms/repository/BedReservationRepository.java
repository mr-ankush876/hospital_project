package com.vitalsync.hms.repository;

import com.vitalsync.hms.entity.BedReservation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BedReservationRepository extends JpaRepository<BedReservation, Long> {
    Optional<BedReservation> findByReservationCode(String reservationCode);

    List<BedReservation> findByPatientId(Long patientId);
    List<BedReservation> findByBedId(Long bedId);
    List<BedReservation> findByStatus(String status);

    @Query("SELECT r FROM BedReservation r WHERE " +
           "(:patientId IS NULL OR r.patient.id = :patientId) " +
           "AND (:departmentId IS NULL OR r.department.id = :departmentId) " +
           "AND (:bedType IS NULL OR r.bedType = :bedType) " +
           "AND (:status IS NULL OR r.status = :status) " +
           "AND (:search IS NULL OR LOWER(r.reservationCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(r.patient.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(r.patient.patientCode) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY r.id DESC")
    List<BedReservation> filterReservations(
            @Param("patientId") Long patientId,
            @Param("departmentId") Long departmentId,
            @Param("bedType") String bedType,
            @Param("status") String status,
            @Param("search") String search);

    @Query("SELECT r FROM BedReservation r WHERE " +
           "(:patientId IS NULL OR r.patient.id = :patientId) " +
           "AND (:departmentId IS NULL OR r.department.id = :departmentId) " +
           "AND (:bedType IS NULL OR r.bedType = :bedType) " +
           "AND (:status IS NULL OR r.status = :status) " +
           "AND (:search IS NULL OR LOWER(r.reservationCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(r.patient.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(r.patient.patientCode) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<BedReservation> filterReservationsPaged(
            @Param("patientId") Long patientId,
            @Param("departmentId") Long departmentId,
            @Param("bedType") String bedType,
            @Param("status") String status,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT COUNT(r) > 0 FROM BedReservation r WHERE " +
           "r.bed.id = :bedId AND r.status IN ('PENDING', 'CONFIRMED') " +
           "AND (:excludeId IS NULL OR r.id != :excludeId)")
    boolean existsActiveReservationForBed(@Param("bedId") Long bedId, @Param("excludeId") Long excludeId);
}
