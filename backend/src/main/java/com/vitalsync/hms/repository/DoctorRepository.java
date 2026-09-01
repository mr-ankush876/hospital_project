package com.vitalsync.hms.repository;

import com.vitalsync.hms.entity.Doctor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    Optional<Doctor> findByDoctorCode(String doctorCode);
    Optional<Doctor> findByEmail(String email);
    Optional<Doctor> findByUserId(Long userId);

    @Query("SELECT d FROM Doctor d WHERE " +
           "(:search IS NULL OR LOWER(d.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(d.doctorCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(d.specialization) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:specialization IS NULL OR d.specialization = :specialization) " +
           "AND (:status IS NULL OR d.status = :status) " +
           "ORDER BY d.id DESC")
    List<Doctor> searchDoctors(
            @Param("search") String search,
            @Param("specialization") String specialization,
            @Param("status") String status);

    @Query("SELECT d FROM Doctor d WHERE " +
           "(:search IS NULL OR LOWER(d.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(d.doctorCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(d.specialization) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:specialization IS NULL OR d.specialization = :specialization) " +
           "AND (:status IS NULL OR d.status = :status)")
    Page<Doctor> searchDoctorsPaged(
            @Param("search") String search,
            @Param("specialization") String specialization,
            @Param("status") String status,
            Pageable pageable);

    @Query("SELECT COUNT(d) FROM Doctor d WHERE d.status = 'Available' OR d.status = 'In Surgery'")
    long countActiveDoctors();

    long countByStatus(String status);
}
