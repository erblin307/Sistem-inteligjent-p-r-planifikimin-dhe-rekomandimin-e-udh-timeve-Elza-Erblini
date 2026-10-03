/**
 * Display formatting. All money is handled as integer minor units
 * (see docs/ARCHITECTURE.md §6.1); these helpers only format for display.
 */

export type Money = { amountMinor: number; currency: string };

const moneyFormatters = new Map<string, Intl.NumberFormat>();

export function formatMoney(
  { amountMinor, currency }: Money,
  { locale = "en-GB", cents = false }: { locale?: string; cents?: boolean } = {},
): string {
  const key = `${locale}:${currency}:${cents}`;
  let formatter = moneyFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: cents ? 2 : 0,
      maximumFractionDigits: cents ? 2 : 0,
    });
    moneyFormatters.set(key, formatter);
  }
  return formatter.format(amountMinor / 100);
}

export function eur(amount: number): Money {
  return { amountMinor: Math.round(amount * 100), currency: "EUR" };
}

/** 90 → "1h 30m", 45 → "45m", 120 → "2h" */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** 850 → "850 m", 2300 → "2.3 km" */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/** Same month: "12–17 July". Across months: "29 June – 3 July". */
export function formatDateRange(start: Date, end: Date, locale = "en-GB"): string {
  const day = new Intl.DateTimeFormat(locale, { day: "numeric", timeZone: "UTC" });
  const dayMonth = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  if (start.getUTCMonth() === end.getUTCMonth()) {
    return `${day.format(start)}–${dayMonth.format(end)}`;
  }
  return `${dayMonth.format(start)} – ${dayMonth.format(end)}`;
}

export function formatCount(n: number, locale = "en-GB"): string {
  return new Intl.NumberFormat(locale).format(n);
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}
