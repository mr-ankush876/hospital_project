package com.vitalsync.hms.repository;

import com.vitalsync.hms.entity.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByPatientCode(String patientCode);
    Optional<Patient> findByEmail(String email);
    Optional<Patient> findByUserId(Long userId);

    @Query("SELECT p FROM Patient p WHERE " +
           "(:search IS NULL OR LOWER(p.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(p.patientCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(p.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(p.gender) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(p.bloodGroup) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR p.phone LIKE CONCAT('%', :search, '%')) " +
           "AND (:status IS NULL OR p.status = :status) " +
           "AND (:gender IS NULL OR p.gender = :gender) " +
           "AND (:bloodGroup IS NULL OR p.bloodGroup = :bloodGroup) " +
           "ORDER BY p.id DESC")
    List<Patient> searchPatients(
            @Param("search") String search,
            @Param("status") String status,
            @Param("gender") String gender,
            @Param("bloodGroup") String bloodGroup);

    @Query("SELECT p FROM Patient p WHERE " +
           "(:search IS NULL OR LOWER(p.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(p.patientCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(p.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(p.gender) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(p.bloodGroup) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR p.phone LIKE CONCAT('%', :search, '%')) " +
           "AND (:status IS NULL OR p.status = :status) " +
           "AND (:gender IS NULL OR p.gender = :gender) " +
           "AND (:bloodGroup IS NULL OR p.bloodGroup = :bloodGroup)")
    Page<Patient> searchPatientsPaged(
            @Param("search") String search,
            @Param("status") String status,
            @Param("gender") String gender,
            @Param("bloodGroup") String bloodGroup,
            Pageable pageable);

    @Query("SELECT p FROM Patient p WHERE " +
           ":query IS NULL OR LOWER(p.fullName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(p.patientCode) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(p.email) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(p.gender) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(p.bloodGroup) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR p.phone LIKE CONCAT('%', :query, '%') " +
           "ORDER BY p.id DESC")
    List<Patient> searchByQuery(@Param("query") String query);

    @Query("SELECT COUNT(p) FROM Patient p WHERE p.status = 'Active'")
    long countActivePatients();
}
