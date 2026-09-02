package com.vitalsync.hms.repository;

import com.vitalsync.hms.entity.EmergencyRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmergencyRequestRepository extends JpaRepository<EmergencyRequest, Long> {
    Optional<EmergencyRequest> findByRequestCode(String requestCode);
    List<EmergencyRequest> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    List<EmergencyRequest> findAllByOrderByCreatedAtDesc();
    List<EmergencyRequest> findByStatusOrderByCreatedAtDesc(String status);

    long countByRequestCodeStartingWith(String prefix);
    long countByStatus(String status);
    long countByStatusNotIn(Collection<String> statuses);
    long countByAmbulanceCallInitiatedAtIsNotNull();

    @Query("SELECT e FROM EmergencyRequest e WHERE " +
           "(:search IS NULL OR LOWER(e.requestCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(e.patientNameSnapshot) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(e.patientPhoneSnapshot) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(e.emergencyType) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:status IS NULL OR e.status = :status) " +
           "AND (:emergencyType IS NULL OR e.emergencyType = :emergencyType) " +
           "AND (:contactMethod IS NULL OR e.contactMethod = :contactMethod) " +
           "ORDER BY e.createdAt DESC")
    List<EmergencyRequest> searchEmergencies(
            @Param("search") String search,
            @Param("status") String status,
            @Param("emergencyType") String emergencyType,
            @Param("contactMethod") String contactMethod
    );
}