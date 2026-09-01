package com.vitalsync.hms.repository;

import com.vitalsync.hms.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    Optional<Prescription> findByPrescriptionCode(String prescriptionCode);

    List<Prescription> findByPatientId(Long patientId);
    List<Prescription> findByDoctorId(Long doctorId);

    @Query("SELECT DISTINCT p FROM Prescription p LEFT JOIN p.medicines m WHERE " +
           "(:patientId IS NULL OR p.patient.id = :patientId) " +
           "AND (:doctorId IS NULL OR p.doctor.id = :doctorId) " +
           "AND (:date IS NULL OR p.prescriptionDate = :date) " +
           "AND (:search IS NULL OR LOWER(p.patient.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(p.patient.patientCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(p.doctor.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(p.prescriptionCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(p.diagnosis) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(p.symptoms) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(m.medicineName) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY p.prescriptionDate DESC, p.id DESC")
    List<Prescription> filterPrescriptions(
            @Param("patientId") Long patientId,
            @Param("doctorId") Long doctorId,
            @Param("date") LocalDate date,
            @Param("search") String search);

    @Query("SELECT DISTINCT p FROM Prescription p LEFT JOIN p.medicines m WHERE " +
           ":query IS NULL OR LOWER(p.patient.fullName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(p.patient.patientCode) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(p.doctor.fullName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(p.prescriptionCode) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(p.diagnosis) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(p.symptoms) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(m.medicineName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY p.prescriptionDate DESC, p.id DESC")
    List<Prescription> searchByQuery(@Param("query") String query);

    boolean existsByDoctorId(Long doctorId);
    boolean existsByPatientId(Long patientId);
}
