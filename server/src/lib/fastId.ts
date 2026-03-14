/**
 * FAST ID format: 2 digits + letter (e.g. I, K) + hyphen + 4 digits
 * Examples: 23I-0545, 23K-0892, 23I-3039
 */
const FAST_ID_REGEX = /^\d{2}[A-Za-z]-\d{4}$/;

export function isValidFastId(value: string): boolean {
  return FAST_ID_REGEX.test(value.trim());
}

export function normalizeFastId(value: string): string {
  return value.trim().toUpperCase();
}
