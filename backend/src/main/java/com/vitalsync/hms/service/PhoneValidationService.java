package com.vitalsync.hms.service;

import com.vitalsync.hms.dto.PhoneParseResultDto;

public interface PhoneValidationService {

    /**
     * Validates and normalizes phone number to canonical E.164.
     * Throws BadRequestException if invalid.
     */
    String validateAndNormalize(String rawPhone, String defaultRegionOrCallingCode);

    /**
     * Validates and normalizes phone number with default fallback.
     */
    String validateAndNormalize(String rawPhone);

    /**
     * Parses phone number into structured elements.
     */
    PhoneParseResultDto parse(String rawPhone, String defaultRegionOrCallingCode);

    /**
     * Parses phone number into structured elements with default fallback.
     */
    PhoneParseResultDto parse(String rawPhone);

    /**
     * Returns true if phone number is valid for the region/metadata.
     */
    boolean isValid(String rawPhone, String defaultRegionOrCallingCode);
}