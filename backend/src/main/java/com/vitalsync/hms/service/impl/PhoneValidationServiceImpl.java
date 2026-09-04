package com.vitalsync.hms.service.impl;

import com.google.i18n.phonenumbers.NumberParseException;
import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.Phonenumber;
import com.vitalsync.hms.dto.PhoneParseResultDto;
import com.vitalsync.hms.exception.BadRequestException;
import com.vitalsync.hms.service.PhoneValidationService;
import org.springframework.stereotype.Service;

@Service
public class PhoneValidationServiceImpl implements PhoneValidationService {

    private final PhoneNumberUtil phoneUtil = PhoneNumberUtil.getInstance();

    @Override
    public String validateAndNormalize(String rawPhone, String defaultRegionOrCallingCode) {
        if (rawPhone == null || rawPhone.trim().isEmpty()) {
            throw new BadRequestException("Phone number is required");
        }

        String clean = rawPhone.trim();
        if (!clean.matches("^[+]?[0-9\\s\\-().]+$")) {
            throw new BadRequestException("Please enter a valid phone number. Invalid characters detected.");
        }

        String region = resolveRegionCode(clean, defaultRegionOrCallingCode);

        try {
            Phonenumber.PhoneNumber proto = phoneUtil.parse(clean, region);
            validateProto(proto);
            return phoneUtil.format(proto, PhoneNumberUtil.PhoneNumberFormat.E164);
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            String digits = clean.replaceAll("[^0-9]", "");
            if (digits.length() == 10 && ("IN".equalsIgnoreCase(region) || "ZZ".equalsIgnoreCase(region))) {
                return "+91" + digits;
            }
            throw new BadRequestException("Please enter a valid phone number for the selected country.");
        }
    }

    @Override
    public String validateAndNormalize(String rawPhone) {
        return validateAndNormalize(rawPhone, "IN");
    }

    @Override
    public PhoneParseResultDto parse(String rawPhone, String defaultRegionOrCallingCode) {
        if (rawPhone == null || rawPhone.trim().isEmpty()) {
            return PhoneParseResultDto.builder()
                    .rawInput(rawPhone)
                    .valid(false)
                    .build();
        }

        String clean = rawPhone.trim();
        if (!clean.matches("^[+]?[0-9\\s\\-().]+$")) {
            return PhoneParseResultDto.builder()
                    .rawInput(rawPhone)
                    .valid(false)
                    .build();
        }

        String region = resolveRegionCode(clean, defaultRegionOrCallingCode);

        try {
            Phonenumber.PhoneNumber proto = phoneUtil.parse(clean, region);
            boolean isPossible = phoneUtil.isPossibleNumber(proto);
            boolean isValid = phoneUtil.isValidNumber(proto);
            if (!isValid && proto.getCountryCode() == 1 && isPossible) {
                String nat = String.valueOf(proto.getNationalNumber());
                if (nat.length() == 10) {
                    isValid = true;
                }
            }

            if (isPossible && isValid) {
                String e164 = phoneUtil.format(proto, PhoneNumberUtil.PhoneNumberFormat.E164);
                String countryCode = "+" + proto.getCountryCode();
                String nationalNumber = String.valueOf(proto.getNationalNumber());
                String regionCode = phoneUtil.getRegionCodeForNumber(proto);

                return PhoneParseResultDto.builder()
                        .rawInput(rawPhone)
                        .e164(e164)
                        .countryCode(countryCode)
                        .nationalNumber(nationalNumber)
                        .regionCode(regionCode != null ? regionCode : region)
                        .valid(true)
                        .build();
            }
        } catch (NumberParseException ignored) {
        }

        return PhoneParseResultDto.builder()
                .rawInput(rawPhone)
                .valid(false)
                .build();
    }

    @Override
    public PhoneParseResultDto parse(String rawPhone) {
        return parse(rawPhone, "IN");
    }

    @Override
    public boolean isValid(String rawPhone, String defaultRegionOrCallingCode) {
        if (rawPhone == null || rawPhone.trim().isEmpty()) {
            return false;
        }
        String clean = rawPhone.trim();
        if (!clean.matches("^[+]?[0-9\\s\\-().]+$")) {
            return false;
        }
        try {
            String region = resolveRegionCode(clean, defaultRegionOrCallingCode);
            Phonenumber.PhoneNumber proto = phoneUtil.parse(clean, region);
            if (!phoneUtil.isPossibleNumber(proto)) {
                return false;
            }
            if (phoneUtil.isValidNumber(proto)) {
                return true;
            }
            if (proto.getCountryCode() == 1) {
                String nat = String.valueOf(proto.getNationalNumber());
                return nat.length() == 10;
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    private void validateProto(Phonenumber.PhoneNumber proto) {
        PhoneNumberUtil.ValidationResult validationResult = phoneUtil.isPossibleNumberWithReason(proto);
        if (validationResult == PhoneNumberUtil.ValidationResult.TOO_SHORT) {
            throw new BadRequestException("Please enter the complete phone number.");
        } else if (validationResult == PhoneNumberUtil.ValidationResult.TOO_LONG) {
            throw new BadRequestException("Please enter a valid phone number for the selected country. Number has too many digits.");
        } else if (validationResult == PhoneNumberUtil.ValidationResult.INVALID_COUNTRY_CODE) {
            throw new BadRequestException("Please select a valid country code.");
        } else if (validationResult == PhoneNumberUtil.ValidationResult.INVALID_LENGTH) {
            throw new BadRequestException("Please enter a valid phone number for the selected country.");
        }

        boolean isValid = phoneUtil.isValidNumber(proto);
        if (!isValid && proto.getCountryCode() == 1 && phoneUtil.isPossibleNumber(proto)) {
            String nat = String.valueOf(proto.getNationalNumber());
            if (nat.length() == 10) {
                isValid = true;
            }
        }

        if (!isValid) {
            throw new BadRequestException("Please enter a valid phone number for the selected country.");
        }
    }

    private String resolveRegionCode(String rawPhone, String defaultRegionOrCallingCode) {
        if (defaultRegionOrCallingCode != null && !defaultRegionOrCallingCode.trim().isEmpty()) {
            String val = defaultRegionOrCallingCode.trim();
            if (val.startsWith("+")) {
                val = val.substring(1);
            }
            if (val.matches("\\d+")) {
                int countryCode = Integer.parseInt(val);
                String region = phoneUtil.getRegionCodeForCountryCode(countryCode);
                if (region != null && !"ZZ".equalsIgnoreCase(region)) {
                    return region.toUpperCase();
                }
            } else if (val.length() == 2) {
                return val.toUpperCase();
            }
        }

        // If rawPhone starts with "+", PhoneNumberUtil can parse without default region (region = "ZZ")
        if (rawPhone.startsWith("+")) {
            return "ZZ";
        }

        return "IN"; // Fallback default region
    }
}