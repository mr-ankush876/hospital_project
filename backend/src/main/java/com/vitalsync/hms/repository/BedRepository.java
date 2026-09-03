package com.vitalsync.hms.repository;

import com.vitalsync.hms.entity.Bed;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BedRepository extends JpaRepository<Bed, Long> {
    Optional<Bed> findByBedNumber(String bedNumber);

    List<Bed> findByDepartmentId(Long departmentId);
    List<Bed> findByStatus(String status);
    List<Bed> findByBedType(String bedType);

    @Query("SELECT b FROM Bed b LEFT JOIN b.currentPatient p WHERE " +
           "(:departmentId IS NULL OR b.department.id = :departmentId) " +
           "AND (:bedType IS NULL OR b.bedType = :bedType) " +
           "AND (:status IS NULL OR b.status = :status) " +
           "AND (:search IS NULL OR (" +
           "LOWER(b.bedNumber) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(b.department.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR (p IS NOT NULL AND LOWER(p.fullName) LIKE LOWER(CONCAT('%', :search, '%')))" +
           ")) " +
           "ORDER BY b.bedNumber ASC")
    List<Bed> searchBeds(
            @Param("departmentId") Long departmentId,
            @Param("bedType") String bedType,
            @Param("status") String status,
            @Param("search") String search);

    @Query("SELECT b FROM Bed b LEFT JOIN b.currentPatient p WHERE " +
           "(:departmentId IS NULL OR b.department.id = :departmentId) " +
           "AND (:bedType IS NULL OR b.bedType = :bedType) " +
           "AND (:status IS NULL OR b.status = :status) " +
           "AND (:search IS NULL OR (" +
           "LOWER(b.bedNumber) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(b.department.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR (p IS NOT NULL AND LOWER(p.fullName) LIKE LOWER(CONCAT('%', :search, '%')))" +
           "))")
    Page<Bed> searchBedsPaged(
            @Param("departmentId") Long departmentId,
            @Param("bedType") String bedType,
            @Param("status") String status,
            @Param("search") String search,
            Pageable pageable);

    long countByStatus(String status);
    long countByBedType(String bedType);
    long countByBedTypeAndStatus(String bedType, String status);
    long countByDepartmentIdAndStatus(Long departmentId, String status);
    long countByDepartmentId(Long departmentId);
}
