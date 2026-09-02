/**
 * Doctor-specific schedule and availability calculation utility for VitalSync HMS.
 * Handles parsing working days, time slot generation, and date availability matching.
 */

const DAY_MAP = {
  SUN: 0, SUNDAY: 0,
  MON: 1, MONDAY: 1,
  TUE: 2, TUES: 2, TUESDAY: 2,
  WED: 3, WEDNESDAY: 3,
  THU: 4, THUR: 4, THURS: 4, THURSDAY: 4,
  FRI: 5, FRIDAY: 5,
  SAT: 6, SATURDAY: 6,
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Parses any doctor availability string into a Set of day numbers (0=Sun, 1=Mon, ..., 6=Sat).
 * Handles: "Mon, Wed, Fri", "Tue, Thu, Sat", "Mon - Fri", "Mon - Sat", "Daily", "Weekdays", etc.
 */
export const parseDoctorWorkingDays = (availableDaysStr) => {
  const days = new Set();
  if (!availableDaysStr || typeof availableDaysStr !== 'string') {
    // Default to Monday - Friday (1 to 5)
    [1, 2, 3, 4, 5].forEach((d) => days.add(d));
    return days;
  }

  const cleaned = availableDaysStr
    .toUpperCase()
    .trim()
    .replace(/&/g, ',')
    .replace(/\s+AND\s+/g, ',')
    .replace(/\s+TO\s+/g, '-');

  if (cleaned.includes('DAILY') || cleaned.includes('EVERYDAY') || cleaned.includes('ALL DAYS')) {
    [0, 1, 2, 3, 4, 5, 6].forEach((d) => days.add(d));
    return days;
  }

  if (cleaned.includes('WEEKDAYS')) {
    [1, 2, 3, 4, 5].forEach((d) => days.add(d));
    return days;
  }

  if (cleaned.includes('WEEKENDS')) {
    [0, 6].forEach((d) => days.add(d));
    return days;
  }

  const tokens = cleaned.split(/[,;/]/);
  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;

    if (trimmed.includes('-')) {
      const parts = trimmed.split('-').map((p) => p.trim());
      if (parts.length === 2) {
        const startDay = parseSingleDayName(parts[0]);
        const endDay = parseSingleDayName(parts[1]);
        if (startDay !== null && endDay !== null) {
          if (startDay <= endDay) {
            for (let i = startDay; i <= endDay; i++) {
              days.add(i);
            }
          } else {
            for (let i = startDay; i <= 6; i++) {
              days.add(i);
            }
            for (let i = 0; i <= endDay; i++) {
              days.add(i);
            }
          }
        }
      }
    } else {
      const single = parseSingleDayName(trimmed);
      if (single !== null) {
        days.add(single);
      }
    }
  }

  if (days.size === 0) {
    [1, 2, 3, 4, 5].forEach((d) => days.add(d));
  }

  return days;
};

const parseSingleDayName = (str) => {
  if (!str) return null;
  const s = str.trim().toUpperCase();
  if (s.startsWith('MON')) return 1;
  if (s.startsWith('TUE')) return 2;
  if (s.startsWith('WED')) return 3;
  if (s.startsWith('THU')) return 4;
  if (s.startsWith('FRI')) return 5;
  if (s.startsWith('SAT')) return 6;
  if (s.startsWith('SUN')) return 0;
  return null;
};

/**
 * Checks if a doctor works on the date given by 'YYYY-MM-DD'.
 */
export const isDoctorAvailableOnDate = (doctor, dateStr) => {
  if (!doctor || !dateStr) return false;

  const status = (doctor.status || '').toLowerCase();
  if (status === 'unavailable' || status === 'on leave' || status === 'inactive') {
    return false;
  }

  // Parse dateStr safely in local time
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return false;
  const targetDate = new Date(year, month - 1, day);
  const dayOfWeek = targetDate.getDay(); // 0 = Sun, 1 = Mon ...

  const workingDays = parseDoctorWorkingDays(doctor.availableDays);
  return workingDays.has(dayOfWeek);
};

/**
 * Formats a 'YYYY-MM-DD' date string into e.g. "Thursday, 03 Sep 2026".
 */
export const formatFriendlyDate = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const date = new Date(year, month - 1, day);

  const dayName = DAY_NAMES[date.getDay()];
  const dd = String(day).padStart(2, '0');
  const monName = MONTH_NAMES[month - 1];
  return `${dayName}, ${dd} ${monName} ${year}`;
};

/**
 * Formats doctor name cleanly without double "Dr. Dr.".
 */
export const formatDoctorName = (fullName) => {
  if (!fullName) return 'Doctor';
  const trimmed = fullName.trim();
  if (trimmed.startsWith('Dr.') || trimmed.startsWith('Dr ') || trimmed.startsWith('Doctor ')) {
    return trimmed;
  }
  return `Dr. ${trimmed}`;
};

/**
 * Generates 30-minute consultation time slots based on the doctor's working hours.
 * Example: "09:00 AM - 05:00 PM" -> ["09:00 AM", "09:30 AM", ..., "04:30 PM"]
 */
export const generateDoctorTimeSlots = (availableTimeStr) => {
  let startMinutes = 9 * 60; // 09:00 AM
  let endMinutes = 17 * 60; // 05:00 PM

  if (availableTimeStr && typeof availableTimeStr === 'string') {
    const match = availableTimeStr.match(/(\d{1,2}:?\d{0,2}\s*(?:AM|PM|am|pm)?)\s*(?:-|to)\s*(\d{1,2}:?\d{0,2}\s*(?:AM|PM|am|pm)?)/i);
    if (match) {
      const pStart = parseTimeToMinutes(match[1]);
      const pEnd = parseTimeToMinutes(match[2]);
      if (pStart !== null && pEnd !== null && pStart < pEnd) {
        startMinutes = pStart;
        endMinutes = pEnd;
      }
    }
  }

  const slots = [];
  let current = startMinutes;
  while (current + 30 <= endMinutes) {
    slots.push(formatMinutesTo12Hour(current));
    current += 30;
  }

  if (slots.length === 0) {
    return [
      '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
      '11:00 AM', '11:30 AM', '12:00 PM', '02:00 PM',
      '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM',
      '04:30 PM'
    ];
  }

  return slots;
};

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const t = timeStr.trim().toUpperCase();
  const isPm = t.includes('PM');
  const isAm = t.includes('AM');
  const numPart = t.replace('AM', '').replace('PM', '').trim();
  const [hStr, mStr] = numPart.split(':');
  let hour = parseInt(hStr, 10);
  const min = mStr ? parseInt(mStr, 10) : 0;
  if (isNaN(hour)) return null;

  if (isPm && hour < 12) hour += 12;
  if (isAm && hour === 12) hour = 0;

  return hour * 60 + (isNaN(min) ? 0 : min);
};

const formatMinutesTo12Hour = (totalMinutes) => {
  const hour24 = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const ampm = hour24 >= 12 ? 'PM' : 'AM';
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  const hh = String(hour12).padStart(2, '0');
  const mm = String(mins).padStart(2, '0');
  return `${hh}:${mm} ${ampm}`;
};
