/**
 * Format numbers for display with thousand separators (e.g. 1,000 / 1,234.56).
 * Uses en-GB locale so 1000+ displays as 1,000.
 */

const locale = "en-GB";

/**
 * Format a value as currency (2 decimal places, thousand separators).
 * e.g. 1234.5 → "1,234.50"
 */
export function formatCurrency(
  value: number | string | null | undefined
): string {
  const n = value === null || value === undefined ? 0 : Number(value);
  if (Number.isNaN(n)) return "0.00";
  return n.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format a number with optional decimal places and thousand separators.
 * e.g. formatNumber(1234) → "1,234", formatNumber(1234.5, 1) → "1,234.5"
 */
export function formatNumber(
  value: number | string | null | undefined,
  decimals: number = 0
): string {
  const n = value === null || value === undefined ? 0 : Number(value);
  if (Number.isNaN(n)) return decimals > 0 ? "0." + "0".repeat(decimals) : "0";
  if (decimals <= 0) {
    return Math.round(n).toLocaleString(locale);
  }
  return n.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
