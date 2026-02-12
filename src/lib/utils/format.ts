export function formatDateGerman(dateStr: string | null | undefined): string {
  if (!dateStr) return '';

  // If it's already not in ISO format, just return as-is
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  const months = [
    'Januar',
    'Februar',
    'März',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Dezember'
  ];

  const shortYear = String(year).slice(-2);
  return `${day}. ${months[month - 1]} '${shortYear}`;
}

export function floatToTime(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '';

  const hours = Math.floor(value);
  let minutes = Math.round((value - hours) * 60);

  // handle rounding edge case, e.g. 13.999 -> 14:00
  let h = hours;
  if (minutes === 60) {
    minutes = 0;
    h += 1;
  }

  const hStr = String(h);
  const mStr = String(minutes).padStart(2, '0');

  return `${hStr}:${mStr}`;
}
