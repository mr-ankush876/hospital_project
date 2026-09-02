package com.vitalsync.hms.repository;

import com.vitalsync.hms.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    Optional<Appointment> findByAppointmentCode(String appointmentCode);

    List<Appointment> findByDoctorId(Long doctorId);
    List<Appointment> findByPatientId(Long patientId);
    List<Appointment> findByDoctorIdAndAppointmentDate(Long doctorId, LocalDate appointmentDate);

    @Query("SELECT a FROM Appointment a WHERE " +
           "(:doctorId IS NULL OR a.doctor.id = :doctorId) " +
           "AND (:patientId IS NULL OR a.patient.id = :patientId) " +
           "AND (:status IS NULL OR a.status = :status) " +
           "AND (:date IS NULL OR a.appointmentDate = :date) " +
           "AND (:search IS NULL OR LOWER(a.patient.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(a.patient.patientCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(a.doctor.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(a.doctor.specialization) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(a.reason) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(a.status) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(a.appointmentCode) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY a.appointmentDate DESC, a.appointmentTime ASC")
    List<Appointment> filterAppointments(
            @Param("doctorId") Long doctorId,
            @Param("patientId") Long patientId,
            @Param("status") String status,
            @Param("date") LocalDate date,
            @Param("search") String search);

    @Query("SELECT a FROM Appointment a WHERE " +
           ":query IS NULL OR LOWER(a.patient.fullName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(a.patient.patientCode) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(a.doctor.fullName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(a.doctor.specialization) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(a.reason) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(a.status) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(a.appointmentCode) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY a.appointmentDate DESC, a.appointmentTime ASC")
    List<Appointment> searchByQuery(@Param("query") String query);

    @Query("SELECT COUNT(a) > 0 FROM Appointment a WHERE " +
           "a.doctor.id = :doctorId AND a.appointmentDate = :date AND a.appointmentTime = :time " +
           "AND a.status NOT IN ('Cancelled', 'Completed') " +
           "AND (:excludeId IS NULL OR a.id != :excludeId)")
    boolean existsConflictingAppointment(
            @Param("doctorId") Long doctorId,
            @Param("date") LocalDate date,
            @Param("time") String time,
            @Param("excludeId") Long excludeId);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.appointmentDate = :date")
    long countAppointmentsByDate(@Param("date") LocalDate date);

    boolean existsByDoctorId(Long doctorId);
    boolean existsByPatientId(Long patientId);
}
