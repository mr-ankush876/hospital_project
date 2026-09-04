package com.vitalsync.hms.repository;

import com.vitalsync.hms.entity.Nurse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NurseRepository extends JpaRepository<Nurse, Long> {

    Optional<Nurse> findByNurseCode(String nurseCode);

    Optional<Nurse> findByUserId(Long userId);

    Optional<Nurse> findByEmail(String email);

    boolean existsByNurseCode(String nurseCode);

    boolean existsByEmail(String email);

    long countByStatus(String status);

    @Query("SELECT n FROM Nurse n " +
           "WHERE (:departmentId IS NULL OR n.department.id = :departmentId) " +
           "AND (:status IS NULL OR LOWER(n.status) = LOWER(:status)) " +
           "AND (:shift IS NULL OR LOWER(n.shift) = LOWER(:shift)) " +
           "AND (:search IS NULL OR LOWER(n.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(n.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(n.nurseCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(n.phone) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(n.licenseNumber) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY n.id DESC")
    List<Nurse> searchNurses(
            @Param("departmentId") Long departmentId,
            @Param("status") String status,
            @Param("shift") String shift,
            @Param("search") String search);

    @Query("SELECT n FROM Nurse n " +
           "WHERE (:departmentId IS NULL OR n.department.id = :departmentId) " +
           "AND (:status IS NULL OR LOWER(n.status) = LOWER(:status)) " +
           "AND (:shift IS NULL OR LOWER(n.shift) = LOWER(:shift)) " +
           "AND (:search IS NULL OR LOWER(n.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(n.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(n.nurseCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(n.phone) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(n.licenseNumber) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Nurse> searchNursesPaged(
            @Param("departmentId") Long departmentId,
            @Param("status") String status,
            @Param("shift") String shift,
            @Param("search") String search,
            Pageable pageable);
}
