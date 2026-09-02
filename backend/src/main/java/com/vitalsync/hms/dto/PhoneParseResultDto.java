package com.vitalsync.hms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PhoneParseResultDto {
    private String rawInput;
    private String e164;
    private String countryCode; // e.g. "+91"
    private String nationalNumber; // e.g. "9876543210"
    private String regionCode; // e.g. "IN"
    private boolean valid;
}