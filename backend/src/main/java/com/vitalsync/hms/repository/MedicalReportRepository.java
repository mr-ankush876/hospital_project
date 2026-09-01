package com.vitalsync.hms.repository;

import com.vitalsync.hms.entity.MedicalReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MedicalReportRepository extends JpaRepository<MedicalReport, Long> {
    Optional<MedicalReport> findByReportCode(String reportCode);

    List<MedicalReport> findByPatientId(Long patientId);
    List<MedicalReport> findByDoctorId(Long doctorId);

    @Query("SELECT r FROM MedicalReport r WHERE " +
           "(:patientId IS NULL OR r.patient.id = :patientId) " +
           "AND (:doctorId IS NULL OR r.doctor.id = :doctorId) " +
           "AND (:reportType IS NULL OR r.reportType = :reportType) " +
           "AND (:status IS NULL OR r.status = :status) " +
           "AND (:date IS NULL OR r.reportDate = :date) " +
           "AND (:search IS NULL OR LOWER(r.reportCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(r.patient.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(r.diagnosis) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(r.reportType) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY r.reportDate DESC, r.id DESC")
    List<MedicalReport> filterReports(
            @Param("patientId") Long patientId,
            @Param("doctorId") Long doctorId,
            @Param("reportType") String reportType,
            @Param("status") String status,
            @Param("date") LocalDate date,
            @Param("search") String search);

    @Query("SELECT r FROM MedicalReport r WHERE " +
           "(:patientId IS NULL OR r.patient.id = :patientId) " +
           "AND (:doctorId IS NULL OR r.doctor.id = :doctorId) " +
           "AND (:reportType IS NULL OR r.reportType = :reportType) " +
           "AND (:status IS NULL OR r.status = :status) " +
           "AND (:date IS NULL OR r.reportDate = :date) " +
           "AND (:search IS NULL OR LOWER(r.reportCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(r.patient.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(r.diagnosis) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(r.reportType) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<MedicalReport> filterReportsPaged(
            @Param("patientId") Long patientId,
            @Param("doctorId") Long doctorId,
            @Param("reportType") String reportType,
            @Param("status") String status,
            @Param("date") LocalDate date,
            @Param("search") String search,
            Pageable pageable);

    long countByPatientId(Long patientId);
}
