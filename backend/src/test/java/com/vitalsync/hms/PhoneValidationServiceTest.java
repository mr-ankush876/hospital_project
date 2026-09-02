package com.vitalsync.hms;

import com.vitalsync.hms.dto.PhoneParseResultDto;
import com.vitalsync.hms.exception.BadRequestException;
import com.vitalsync.hms.service.PhoneValidationService;
import com.vitalsync.hms.service.impl.PhoneValidationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PhoneValidationServiceTest {

    private PhoneValidationService phoneValidationService;

    @BeforeEach
    void setUp() {
        phoneValidationService = new PhoneValidationServiceImpl();
    }

    @Test
    @DisplayName("Test 10 Representative Countries - Valid Numbers Normalized to E.164")
    void testValidNumbersAcrossCountries() {
        // 1. India (+91)
        assertEquals("+918797254899", phoneValidationService.validateAndNormalize("8797254899", "IN"));
        assertEquals("+919876543210", phoneValidationService.validateAndNormalize("+91 9876543210", "IN"));

        // 2. United States (+1)
        assertEquals("+12025550173", phoneValidationService.validateAndNormalize("202-555-0173", "US"));
        assertEquals("+14155552671", phoneValidationService.validateAndNormalize("+1 415 555 2671", "US"));

        // 3. United Kingdom (+44)
        assertEquals("+447911123456", phoneValidationService.validateAndNormalize("07911 123456", "GB"));
        assertEquals("+442079460991", phoneValidationService.validateAndNormalize("+44 20 7946 0991", "GB"));

        // 4. United Arab Emirates (+971)
        assertEquals("+971501234567", phoneValidationService.validateAndNormalize("050 123 4567", "AE"));
        assertEquals("+971501234567", phoneValidationService.validateAndNormalize("+971 50 123 4567", "AE"));

        // 5. Australia (+61)
        assertEquals("+61412345678", phoneValidationService.validateAndNormalize("0412 345 678", "AU"));

        // 6. Canada (+1)
        assertEquals("+14165550198", phoneValidationService.validateAndNormalize("416-555-0198", "CA"));

        // 7. Germany (+49)
        assertEquals("+4915123456789", phoneValidationService.validateAndNormalize("0151 23456789", "DE"));

        // 8. France (+33)
        assertEquals("+33612345678", phoneValidationService.validateAndNormalize("06 12 34 56 78", "FR"));

        // 9. Japan (+81)
        assertEquals("+819012345678", phoneValidationService.validateAndNormalize("090-1234-5678", "JP"));

        // 10. Singapore (+65)
        assertEquals("+6581234567", phoneValidationService.validateAndNormalize("8123 4567", "SG"));
    }

    @Test
    @DisplayName("Test Incomplete / Too Short Numbers Rejected")
    void testTooShortNumbers() {
        // India requires 10 digits
        BadRequestException exIndia = assertThrows(BadRequestException.class, () ->
                phoneValidationService.validateAndNormalize("9876543", "IN"));
        assertTrue(exIndia.getMessage().contains("complete") || exIndia.getMessage().contains("valid"));

        // US requires 10 digits
        assertThrows(BadRequestException.class, () ->
                phoneValidationService.validateAndNormalize("202555", "US"));

        // UK requires complete number
        assertThrows(BadRequestException.class, () ->
                phoneValidationService.validateAndNormalize("07911", "GB"));
    }

    @Test
    @DisplayName("Test Too Long Numbers Rejected (Prevents Oversized Input)")
    void testTooLongNumbers() {
        // India with 13 national digits (max is 10)
        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                phoneValidationService.validateAndNormalize("9876543210123", "IN"));
        assertTrue(ex.getMessage().contains("valid") || ex.getMessage().contains("digits"));

        // US with 12 national digits
        assertThrows(BadRequestException.class, () ->
                phoneValidationService.validateAndNormalize("202555017399", "US"));

        // UAE with 12 national digits
        assertThrows(BadRequestException.class, () ->
                phoneValidationService.validateAndNormalize("0501234567890", "AE"));
    }

    @Test
    @DisplayName("Test Invalid Characters / Letters Rejected")
    void testInvalidCharacters() {
        assertThrows(BadRequestException.class, () ->
                phoneValidationService.validateAndNormalize("987654abcd", "IN"));
        assertThrows(BadRequestException.class, () ->
                phoneValidationService.validateAndNormalize("invalid-phone", "US"));
    }

    @Test
    @DisplayName("Test Direct API Bypass with Extra Digits Rejected")
    void testApiBypassWithExtraDigits() {
        // Direct bypass attempt: "+91 123456789012345"
        assertThrows(BadRequestException.class, () ->
                phoneValidationService.validateAndNormalize("+91123456789012345", "IN"));
    }

    @Test
    @DisplayName("Test Parsing Structured Elements")
    void testStructuredParsing() {
        PhoneParseResultDto result = phoneValidationService.parse("+91 8797254899", "IN");
        assertTrue(result.isValid());
        assertEquals("+91", result.getCountryCode());
        assertEquals("8797254899", result.getNationalNumber());
        assertEquals("+918797254899", result.getE164());
        assertEquals("IN", result.getRegionCode());

        PhoneParseResultDto usResult = phoneValidationService.parse("2025550173", "US");
        assertTrue(usResult.isValid());
        assertEquals("+1", usResult.getCountryCode());
        assertEquals("2025550173", usResult.getNationalNumber());
        assertEquals("+12025550173", usResult.getE164());
    }
}