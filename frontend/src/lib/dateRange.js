function pad(value) {
  return String(value).padStart(2, '0');
}

/** Calendar date (YYYY-MM-DD) in the browser's local time zone, as used by <input type="date">. */
export function toLocalInputDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Default report window: first day of the previous month up to today, so today's sales are visible. */
export function defaultDateRange(today = new Date()) {
  const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  return { from: toLocalInputDate(start), to: toLocalInputDate(today) };
}

/**
 * Turns local calendar dates (YYYY-MM-DD) into UTC instants that cover the whole local days.
 * The database then compares real moments, whatever its session time zone is.
 */
export function toUtcRangeParams({ from, to }) {
  const params = {};
  if (from) params.from = new Date(`${from}T00:00:00`).toISOString();
  if (to) params.to = new Date(`${to}T23:59:59.999`).toISOString();
  return params;
}
