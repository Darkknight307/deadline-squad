export type Countdown = { days: number; hours: number; minutes: number; seconds: number; overdue: boolean };
export type Urgency = "overdue" | "critical" | "soon" | "later";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Time left until `dueIso` (or time since, when overdue), split into parts. */
export function getCountdown(dueIso: string, now: Date): Countdown {
  const diff = new Date(dueIso).getTime() - now.getTime();
  const overdue = diff < 0;
  let rest = Math.floor(Math.abs(diff) / SECOND) * SECOND;
  const days = Math.floor(rest / DAY);
  rest -= days * DAY;
  const hours = Math.floor(rest / HOUR);
  rest -= hours * HOUR;
  const minutes = Math.floor(rest / MINUTE);
  rest -= minutes * MINUTE;
  return { days, hours, minutes, seconds: Math.floor(rest / SECOND), overdue };
}

export function getUrgency(dueIso: string, now: Date): Urgency {
  const diff = new Date(dueIso).getTime() - now.getTime();
  if (diff < 0) return "overdue";
  if (diff < DAY) return "critical";
  if (diff < 3 * DAY) return "soon";
  return "later";
}

/** "2d 4h", "3h 12m", "12m 5s", "now". */
export function formatShort(c: Countdown): string {
  if (c.days) return `${c.days}d ${c.hours}h`;
  if (c.hours) return `${c.hours}h ${c.minutes}m`;
  if (c.minutes) return `${c.minutes}m ${c.seconds}s`;
  return c.seconds ? `${c.seconds}s` : "now";
}

/** Upcoming = due strictly after now (soonest first); past = the rest (most recent first). */
export function splitByNow<T extends { due_at: string; id: number }>(items: T[], now: Date) {
  const t = now.getTime();
  const upcoming = items
    .filter((d) => new Date(d.due_at).getTime() > t)
    .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime() || a.id - b.id);
  const past = items
    .filter((d) => new Date(d.due_at).getTime() <= t)
    .sort((a, b) => new Date(b.due_at).getTime() - new Date(a.due_at).getTime() || b.id - a.id);
  return { upcoming, past };
}

/** Date -> "2026-10-20T14:00:00+05:00" in the browser's time zone. */
export function toOffsetIso(d: Date): string {
  const pad = (n: number) => String(Math.abs(n)).padStart(2, "0");
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? "+" : "-";
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00` +
    `${sign}${pad(Math.floor(Math.abs(off) / 60))}:${pad(Math.abs(off) % 60)}`
  );
}

/** ISO string -> value for <input type="datetime-local"> in local time. */
export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
