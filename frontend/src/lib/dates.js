import { formatInTimeZone } from 'date-fns-tz';
import { pl, enGB } from 'date-fns/locale';

// the API sends UTC; the UI always shows Polish time, whatever the user's computer time zone is
export const APP_TIMEZONE = 'Europe/Warsaw';

// maps the app language code to the corresponding date-fns locale
function getLocale(language) {
  if (language === 'en') {
    return enGB;
  }
  return pl;
}

// formats an ISO timestamp into a full localized date (e.g., "Wednesday, 25 November 2026")
export function formatDate(iso, language) {
  return formatInTimeZone(iso, APP_TIMEZONE, 'EEEE, d MMMM yyyy', { locale: getLocale(language) });
}

// formats an ISO timestamp into a 24-hour time string (e.g., "14:15")
export function formatTime(iso, language) {
  return formatInTimeZone(iso, APP_TIMEZONE, 'HH:mm', { locale: getLocale(language) });
}

// formats an ISO timestamp into a full localized date and time (e.g., "Wednesday, 25 November 2026, 14:15")
export function formatDateTime(iso, language) {
  return formatInTimeZone(iso, APP_TIMEZONE, 'EEEE, d MMMM yyyy, HH:mm', { locale: getLocale(language) });
}