package com.vitalsync.hms;

import com.vitalsync.hms.dto.BillDto;
import com.vitalsync.hms.service.BillService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class BillServiceTest {

    @Autowired
    private BillService billService;

    @Test
    @DisplayName("Backend authoritatively calculates total amount correctly")
    void testAuthoritativeBillCalculations() {
        BillDto inputDto = BillDto.builder()
                .patientId(1L)
                .doctorId(1L)
                .billDate(LocalDate.now())
                .consultationFee(new BigDecimal("500.00"))
                .medicineCharges(new BigDecimal("250.00"))
                .otherCharges(new BigDecimal("100.00"))
                .discount(new BigDecimal("50.00"))
                .tax(new BigDecimal("40.00"))
                // Deliberately wrong total sent from client:
                .totalAmount(new BigDecimal("9999.00"))
                .paymentMethod("UPI")
                .paymentStatus("Pending")
                .build();

        BillDto created = billService.create(inputDto);

        assertNotNull(created.getId());
        assertNotNull(created.getBillCode());
        assertTrue(created.getBillCode().startsWith("INV-"));

        // Expected: (500 + 250 + 100) = 850; minus 50 = 800; plus 40 = 840.00
        BigDecimal expectedTotal = new BigDecimal("840.00");
        assertEquals(0, expectedTotal.compareTo(created.getTotalAmount()));
    }
}
