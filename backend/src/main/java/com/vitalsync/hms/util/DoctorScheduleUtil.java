package com.vitalsync.hms.util;

import com.vitalsync.hms.entity.Doctor;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class DoctorScheduleUtil {

    private static final DateTimeFormatter FRIENDLY_DATE_FORMATTER = DateTimeFormatter.ofPattern("EEEE, dd MMM yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter TIME_12H_FORMATTER = DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH);

    private DoctorScheduleUtil() {}

    /**
     * Parses any doctor availability string into a Set of DayOfWeek.
     * Supports:
     * - "Mon, Wed, Fri"
     * - "Monday, Wednesday, Friday"
     * - "Mon - Fri" / "Monday - Friday"
     * - "Mon - Sat"
     * - "Tue, Thu, Sat"
     * - "Daily" / "Everyday" / "All Days"
     * - "Weekdays" / "Weekends"
     */
    public static Set<DayOfWeek> parseAvailableDays(String availableDaysStr) {
        Set<DayOfWeek> days = new LinkedHashSet<>();
        if (availableDaysStr == null || availableDaysStr.trim().isEmpty()) {
            // Default to Monday - Friday if not configured
            days.addAll(Arrays.asList(
                    DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
                    DayOfWeek.THURSDAY, DayOfWeek.FRIDAY
            ));
            return days;
        }

        String cleaned = availableDaysStr.toUpperCase().trim()
                .replace("&", ",")
                .replace(" AND ", ",")
                .replace(" TO ", "-");

        if (cleaned.contains("DAILY") || cleaned.contains("EVERYDAY") || cleaned.contains("ALL DAYS")) {
            days.addAll(Arrays.asList(DayOfWeek.values()));
            return days;
        }

        if (cleaned.contains("WEEKDAYS")) {
            days.addAll(Arrays.asList(
                    DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
                    DayOfWeek.THURSDAY, DayOfWeek.FRIDAY
            ));
            return days;
        }

        if (cleaned.contains("WEEKENDS")) {
            days.addAll(Arrays.asList(DayOfWeek.SATURDAY, DayOfWeek.SUNDAY));
            return days;
        }

        String[] tokens = cleaned.split("[,;/]");
        for (String token : tokens) {
            String trimmed = token.trim();
            if (trimmed.isEmpty()) continue;

            if (trimmed.contains("-")) {
                String[] range = trimmed.split("-");
                if (range.length == 2) {
                    DayOfWeek start = parseSingleDay(range[0].trim());
                    DayOfWeek end = parseSingleDay(range[1].trim());
                    if (start != null && end != null) {
                        int current = start.getValue();
                        int endVal = end.getValue();
                        if (current <= endVal) {
                            for (int i = current; i <= endVal; i++) {
                                days.add(DayOfWeek.of(i));
                            }
                        } else {
                            for (int i = current; i <= 7; i++) {
                                days.add(DayOfWeek.of(i));
                            }
                            for (int i = 1; i <= endVal; i++) {
                                days.add(DayOfWeek.of(i));
                            }
                        }
                    }
                }
            } else {
                DayOfWeek single = parseSingleDay(trimmed);
                if (single != null) {
                    days.add(single);
                }
            }
        }

        if (days.isEmpty()) {
            days.addAll(Arrays.asList(
                    DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
                    DayOfWeek.THURSDAY, DayOfWeek.FRIDAY
            ));
        }

        return days;
    }

    private static DayOfWeek parseSingleDay(String str) {
        if (str == null) return null;
        String s = str.trim().toUpperCase();
        if (s.startsWith("MON")) return DayOfWeek.MONDAY;
        if (s.startsWith("TUE")) return DayOfWeek.TUESDAY;
        if (s.startsWith("WED")) return DayOfWeek.WEDNESDAY;
        if (s.startsWith("THU")) return DayOfWeek.THURSDAY;
        if (s.startsWith("FRI")) return DayOfWeek.FRIDAY;
        if (s.startsWith("SAT")) return DayOfWeek.SATURDAY;
        if (s.startsWith("SUN")) return DayOfWeek.SUNDAY;
        return null;
    }

    /**
     * Checks if a doctor is available to receive consultations on a specific date.
     */
    public static boolean isDoctorAvailableOnDate(Doctor doctor, LocalDate date) {
        if (doctor == null || date == null) return false;

        String status = doctor.getStatus();
        if ("Unavailable".equalsIgnoreCase(status) || "On Leave".equalsIgnoreCase(status)) {
            return false;
        }

        Set<DayOfWeek> workingDays = parseAvailableDays(doctor.getAvailableDays());
        return workingDays.contains(date.getDayOfWeek());
    }

    /**
     * Formats a LocalDate into a friendly readable string, e.g. "Thursday, 03 Sep 2026".
     */
    public static String formatFriendlyDate(LocalDate date) {
        if (date == null) return "";
        return date.format(FRIENDLY_DATE_FORMATTER);
    }

    /**
     * Formats doctor display name without double 'Dr. Dr.' prefix.
     */
    public static String formatDoctorName(String fullName) {
        if (fullName == null || fullName.trim().isEmpty()) return "Doctor";
        String trimmed = fullName.trim();
        if (trimmed.startsWith("Dr.") || trimmed.startsWith("Dr ") || trimmed.startsWith("Doctor ")) {
            return trimmed;
        }
        return "Dr. " + trimmed;
    }

    /**
     * Generates a list of 30-minute consultation time slots based on the doctor's working hours.
     * Example: "09:00 AM - 05:00 PM" -> ["09:00 AM", "09:30 AM", ..., "04:30 PM"]
     */
    public static List<String> generateTimeSlots(String availableTimeStr) {
        List<String> slots = new ArrayList<>();
        LocalTime startTime = LocalTime.of(9, 0);
        LocalTime endTime = LocalTime.of(17, 0);

        if (availableTimeStr != null && !availableTimeStr.trim().isEmpty()) {
            Pattern pattern = Pattern.compile("(\\d{1,2}:?\\d{0,2}\\s*(?:AM|PM|am|pm)?)\\s*(?:-|to)\\s*(\\d{1,2}:?\\d{0,2}\\s*(?:AM|PM|am|pm)?)");
            Matcher matcher = pattern.matcher(availableTimeStr.trim());
            if (matcher.find()) {
                LocalTime parsedStart = parseTime(matcher.group(1));
                LocalTime parsedEnd = parseTime(matcher.group(2));
                if (parsedStart != null && parsedEnd != null && parsedStart.isBefore(parsedEnd)) {
                    startTime = parsedStart;
                    endTime = parsedEnd;
                }
            }
        }

        LocalTime current = startTime;
        while (current.plusMinutes(30).isBefore(endTime) || current.plusMinutes(30).equals(endTime)) {
            slots.add(current.format(TIME_12H_FORMATTER));
            current = current.plusMinutes(30);
        }

        if (slots.isEmpty()) {
            slots.addAll(Arrays.asList(
                    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
                    "11:00 AM", "11:30 AM", "12:00 PM", "02:00 PM",
                    "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM",
                    "04:30 PM"
            ));
        }

        return slots;
    }

    private static LocalTime parseTime(String timeStr) {
        if (timeStr == null) return null;
        String t = timeStr.trim().toUpperCase();
        try {
            if (t.contains("AM") || t.contains("PM")) {
                boolean isPm = t.contains("PM");
                String numPart = t.replace("AM", "").replace("PM", "").trim();
                String[] parts = numPart.split(":");
                int hour = Integer.parseInt(parts[0].trim());
                int min = parts.length > 1 ? Integer.parseInt(parts[1].trim()) : 0;
                if (isPm && hour < 12) hour += 12;
                if (!isPm && hour == 12) hour = 0;
                return LocalTime.of(hour, min);
            } else {
                String[] parts = t.split(":");
                int hour = Integer.parseInt(parts[0].trim());
                int min = parts.length > 1 ? Integer.parseInt(parts[1].trim()) : 0;
                return LocalTime.of(hour, min);
            }
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Checks if a specific time slot is within the doctor's working hours.
     */
    public static boolean isTimeWithinWorkingHours(String timeSlot, String availableTimeStr) {
        if (timeSlot == null || timeSlot.trim().isEmpty()) return false;
        List<String> validSlots = generateTimeSlots(availableTimeStr);
        return validSlots.stream().anyMatch(s -> s.equalsIgnoreCase(timeSlot.trim()));
    }
}
