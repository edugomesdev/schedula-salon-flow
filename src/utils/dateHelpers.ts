
/**
 * Checks if a date string is valid and is in the future
 * @param date A date string that is parseable by the Date constructor
 * @returns true if the date is valid and in the future, false otherwise
 */
export function isValidDate(date: string) {
  const d = new Date(date);
  return Number.isFinite(d.valueOf()) && d.getTime() >= Date.now();
}
