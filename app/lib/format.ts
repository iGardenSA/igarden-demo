// =========================================================================
// Display helpers — Arabic-first, BiDi-safe, ISA-101 tabular numerals.
// Western numerals per §6 (Gulf technical convention).
// =========================================================================

const ARABIC_LOCALE = "ar-SA";

const dtRelative = new Intl.RelativeTimeFormat(ARABIC_LOCALE, { numeric: "auto" });
const dtFull = new Intl.DateTimeFormat(ARABIC_LOCALE, {
  year: "numeric", month: "short", day: "numeric",
  hour: "2-digit", minute: "2-digit",
  numberingSystem: "latn",
});
const dtTime = new Intl.DateTimeFormat(ARABIC_LOCALE, {
  hour: "2-digit", minute: "2-digit", numberingSystem: "latn",
});
const dtDay = new Intl.DateTimeFormat(ARABIC_LOCALE, {
  year: "numeric", month: "short", day: "numeric", numberingSystem: "latn",
});
const hijriFmt = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
  year: "numeric", month: "short", day: "numeric",
});

export function fmtDateTime(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso.includes("T") ? iso : iso + "Z") : iso;
  return dtFull.format(d);
}

export function fmtTime(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso.includes("T") ? iso : iso + "Z") : iso;
  return dtTime.format(d);
}

export function fmtDay(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso.includes("T") ? iso : iso + "Z") : iso;
  return dtDay.format(d);
}

export function fmtHijri(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso.includes("T") ? iso : iso + "Z") : iso;
  return hijriFmt.format(d);
}

/** Relative-time ago, in Arabic. */
export function fmtAgo(iso: string | Date | null | undefined, now = new Date()): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso.includes("T") ? iso : iso + "Z") : iso;
  const diffMs = d.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const abs = Math.abs(diffSec);

  if (abs < 60) return dtRelative.format(Math.round(diffSec), "second");
  if (abs < 3600) return dtRelative.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return dtRelative.format(Math.round(diffSec / 3600), "hour");
  if (abs < 86400 * 30) return dtRelative.format(Math.round(diffSec / 86400), "day");
  return fmtDay(d);
}

export function fmtNumber(v: number | null | undefined, digits = 2): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return v.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function fmtPercent(v: number | null | undefined, digits = 0): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return `${fmtNumber(v, digits)}%`;
}

/** Check if a reading timestamp is stale (older than N minutes). */
export function isStale(iso: string | null | undefined, thresholdMinutes = 15, now = new Date()): boolean {
  if (!iso) return true;
  const d = new Date(iso.includes("T") ? iso : iso + "Z");
  return now.getTime() - d.getTime() > thresholdMinutes * 60 * 1000;
}
