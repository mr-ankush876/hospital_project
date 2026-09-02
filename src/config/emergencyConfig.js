// Centralized Emergency Configuration for VitalSync HMS
// Phone numbers are configurable via environment variables, with sensible defaults.

export const EMERGENCY_CONTACTS = {
  // Hospital Emergency Hotline
  hospital: import.meta.env.VITE_HOSPITAL_EMERGENCY_NUMBER || '8797254899',
  hospitalFormatted: '+91 8797254899',
  hospitalLabel: 'VitalSync Emergency Trauma Center',

  // Local Campus / Regional Ambulance
  ambulance: import.meta.env.VITE_AMBULANCE_NUMBER || '7888834943',
  ambulanceFormatted: '+91 7888834943',
  ambulanceLabel: 'Local Quick-Response Ambulance',

  // Pre-formatted tel URIs
  get hospitalTelUri() {
    return `tel:${this.hospital}`;
  },
  get ambulanceTelUri() {
    return `tel:${this.ambulance}`;
  }
};