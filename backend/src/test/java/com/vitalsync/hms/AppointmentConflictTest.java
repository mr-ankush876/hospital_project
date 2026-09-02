package com.vitalsync.hms;

import com.vitalsync.hms.dto.AppointmentDto;
import com.vitalsync.hms.dto.DoctorAvailabilityDto;
import com.vitalsync.hms.entity.Doctor;
import com.vitalsync.hms.exception.ConflictException;
import com.vitalsync.hms.repository.DoctorRepository;
import com.vitalsync.hms.service.AppointmentService;
import com.vitalsync.hms.service.DoctorService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class AppointmentConflictTest {

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private DoctorService doctorService;

    @Autowired
    private DoctorRepository doctorRepository;

    @Test
    @DisplayName("Prevent conflicting appointment booking at the same doctor, date and time")
    void testAppointmentConflictPrevention() {
        // Doctor 1 is Dr. Robert Chen (Mon, Wed, Fri) -> find next Monday
        LocalDate nextMonday = LocalDate.now().plusDays(1).with(TemporalAdjusters.next(DayOfWeek.MONDAY));
        String testTime = "11:30 AM";

        AppointmentDto apt1 = AppointmentDto.builder()
                .patientId(1L)
                .doctorId(1L)
                .appointmentDate(nextMonday)
                .appointmentTime(testTime)
                .reason("First consultation")
                .status("Scheduled")
                .build();

        appointmentService.create(apt1);

        // Attempt second booking for same doctor at exact same date & time
        AppointmentDto conflictingApt = AppointmentDto.builder()
                .patientId(2L)
                .doctorId(1L)
                .appointmentDate(nextMonday)
                .appointmentTime(testTime)
                .reason("Conflicting second consultation")
                .status("Scheduled")
                .build();

        assertThrows(ConflictException.class, () -> appointmentService.create(conflictingApt));
    }

    @Test
    @DisplayName("Reject appointment when doctor is not working on the requested day of week")
    void testDoctorUnavailableDayRejection() {
        // Doctor 1 is Dr. Robert Chen (Mon, Wed, Fri). Next Thursday is NOT an available day.
        LocalDate nextThursday = LocalDate.now().plusDays(1).with(TemporalAdjusters.next(DayOfWeek.THURSDAY));
        String testTime = "11:30 AM";

        AppointmentDto invalidDayApt = AppointmentDto.builder()
                .patientId(1L)
                .doctorId(1L)
                .appointmentDate(nextThursday)
                .appointmentTime(testTime)
                .reason("Invalid day consultation")
                .status("Scheduled")
                .build();

        ConflictException ex = assertThrows(ConflictException.class, () -> appointmentService.create(invalidDayApt));
        assertTrue(ex.getMessage().contains("is not available on"), "Expected unavailability message");
    }

    @Test
    @DisplayName("Allow appointment booking when doctor is working on the requested day")
    void testDoctorAvailableDayBookingSuccess() {
        // Doctor 2 is Dr. Emily Stanton (Tue, Thu, Sat). Next Thursday IS an available day.
        LocalDate nextThursday = LocalDate.now().plusDays(1).with(TemporalAdjusters.next(DayOfWeek.THURSDAY));
        String testTime = "10:00 AM";

        AppointmentDto validApt = AppointmentDto.builder()
                .patientId(1L)
                .doctorId(2L)
                .appointmentDate(nextThursday)
                .appointmentTime(testTime)
                .reason("Valid pediatric consultation")
                .status("Scheduled")
                .build();

        AppointmentDto created = appointmentService.create(validApt);
        assertNotNull(created.getId());
        assertEquals("Scheduled", created.getStatus());
    }

    @Test
    @DisplayName("Doctor availability API returns correct dynamic schedule and slots")
    void testDoctorAvailabilityApi() {
        LocalDate nextThursday = LocalDate.now().plusDays(1).with(TemporalAdjusters.next(DayOfWeek.THURSDAY));

        // Doctor 1 (Mon, Wed, Fri) on Thursday -> isAvailable should be false
        DoctorAvailabilityDto doc1Avail = doctorService.getDoctorAvailability(1L, nextThursday);
        assertFalse(doc1Avail.isAvailable());
        assertTrue(doc1Avail.getMessage().contains("is not available"));

        // Doctor 2 (Tue, Thu, Sat) on Thursday -> isAvailable should be true
        DoctorAvailabilityDto doc2Avail = doctorService.getDoctorAvailability(2L, nextThursday);
        assertTrue(doc2Avail.isAvailable());
        assertFalse(doc2Avail.getAvailableSlots().isEmpty());
    }
}
