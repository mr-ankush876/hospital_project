package com.vitalsync.hms.repository;

import com.vitalsync.hms.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:username IS NULL OR a.username = :username) " +
           "AND (:role IS NULL OR a.role = :role) " +
           "AND (:action IS NULL OR LOWER(a.action) LIKE LOWER(CONCAT('%', :action, '%'))) " +
           "AND (:search IS NULL OR LOWER(a.username) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(a.details) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(a.action) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(a.entityName) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY a.timestamp DESC")
    List<AuditLog> filterLogs(
            @Param("username") String username,
            @Param("role") String role,
            @Param("action") String action,
            @Param("search") String search);

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:username IS NULL OR a.username = :username) " +
           "AND (:role IS NULL OR a.role = :role) " +
           "AND (:action IS NULL OR LOWER(a.action) LIKE LOWER(CONCAT('%', :action, '%'))) " +
           "AND (:search IS NULL OR LOWER(a.username) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(a.details) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(a.action) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(a.entityName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<AuditLog> filterLogsPaged(
            @Param("username") String username,
            @Param("role") String role,
            @Param("action") String action,
            @Param("search") String search,
            Pageable pageable);
}
