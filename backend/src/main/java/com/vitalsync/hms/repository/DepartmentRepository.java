package com.vitalsync.hms.repository;

import com.vitalsync.hms.entity.Department;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    Optional<Department> findByDepartmentCode(String departmentCode);
    Optional<Department> findByName(String name);

    @Query("SELECT d FROM Department d WHERE " +
           "(:search IS NULL OR LOWER(d.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(d.departmentCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(d.headDoctorName) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:status IS NULL OR d.status = :status) " +
           "ORDER BY d.name ASC")
    List<Department> searchDepartments(@Param("search") String search, @Param("status") String status);

    @Query("SELECT d FROM Department d WHERE " +
           "(:search IS NULL OR LOWER(d.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(d.departmentCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(d.headDoctorName) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:status IS NULL OR d.status = :status)")
    Page<Department> searchDepartmentsPaged(@Param("search") String search, @Param("status") String status, Pageable pageable);

    long countByStatus(String status);
}
