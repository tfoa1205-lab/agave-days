export function fmtShort(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function fmtLong(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

export function daysSince(iso: string): number {
  const then = new Date(iso);
  then.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - then.getTime()) / 86400000);
}

export function todayLongJa(): string {
  const d = new Date();
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

// Local (not UTC) date in the "YYYY-MM-DD" shape <input type="date"> expects.
export function todayInputValue(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Turns an <input type="date"> value into an ISO timestamp, anchored at
// local noon so day-level comparisons never drift across a timezone.
export function dateInputToIso(dateValue: string): string {
  return new Date(`${dateValue}T12:00:00`).toISOString();
}
