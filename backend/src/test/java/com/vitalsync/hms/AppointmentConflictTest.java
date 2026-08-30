package com.vitalsync.hms;

import com.vitalsync.hms.dto.AppointmentDto;
import com.vitalsync.hms.exception.ConflictException;
import com.vitalsync.hms.service.AppointmentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class AppointmentConflictTest {

    @Autowired
    private AppointmentService appointmentService;

    @Test
    @DisplayName("Prevent conflicting appointment booking at the same doctor, date and time")
    void testAppointmentConflictPrevention() {
        LocalDate testDate = LocalDate.now().plusDays(10);
        String testTime = "11:30 AM";

        AppointmentDto apt1 = AppointmentDto.builder()
                .patientId(1L)
                .doctorId(1L)
                .appointmentDate(testDate)
                .appointmentTime(testTime)
                .reason("First consultation")
                .status("Scheduled")
                .build();

        appointmentService.create(apt1);

        // Attempt second booking for same doctor at exact same date & time
        AppointmentDto conflictingApt = AppointmentDto.builder()
                .patientId(2L)
                .doctorId(1L)
                .appointmentDate(testDate)
                .appointmentTime(testTime)
                .reason("Conflicting second consultation")
                .status("Scheduled")
                .build();

        assertThrows(ConflictException.class, () -> appointmentService.create(conflictingApt));
    }
}
