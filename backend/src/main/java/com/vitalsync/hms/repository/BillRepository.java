package com.vitalsync.hms.repository;

import com.vitalsync.hms.entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {
    Optional<Bill> findByBillCode(String billCode);

    List<Bill> findByPatientId(Long patientId);

    @Query("SELECT b FROM Bill b WHERE " +
           "(:patientId IS NULL OR b.patient.id = :patientId) " +
           "AND (:status IS NULL OR b.paymentStatus = :status) " +
           "AND (:date IS NULL OR b.billDate = :date) " +
           "AND (:search IS NULL OR LOWER(b.patient.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(b.patient.patientCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(b.doctor.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(b.paymentStatus) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(b.billCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(b.paymentMethod) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY b.billDate DESC, b.id DESC")
    List<Bill> filterBills(
            @Param("patientId") Long patientId,
            @Param("status") String status,
            @Param("date") LocalDate date,
            @Param("search") String search);

    @Query("SELECT b FROM Bill b WHERE " +
           ":query IS NULL OR LOWER(b.patient.fullName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(b.patient.patientCode) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(b.doctor.fullName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(b.paymentStatus) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(b.billCode) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(b.paymentMethod) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY b.billDate DESC, b.id DESC")
    List<Bill> searchByQuery(@Param("query") String query);

    @Query("SELECT COUNT(b) FROM Bill b WHERE b.paymentStatus = 'Pending'")
    long countPendingBills();

    long countByPaymentStatus(String paymentStatus);

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Bill b WHERE b.paymentStatus = 'Paid'")
    BigDecimal sumCollectedRevenue();

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Bill b WHERE b.paymentStatus = 'Pending'")
    BigDecimal sumPendingRevenue();

    boolean existsByPatientId(Long patientId);
    boolean existsByDoctorId(Long doctorId);
}
