import { formatShort, getCountdown, getUrgency, splitByNow, toOffsetIso } from "./countdown";

const now = new Date("2026-10-13T12:00:00Z");
const at = (ms: number) => new Date(now.getTime() + ms).toISOString();
const S = 1000, H = 3600 * S, D = 24 * H;

test("countdown parts", () => {
  expect(getCountdown(at(2 * D + 4 * H + 5 * 60 * S + 6 * S), now)).toEqual({ days: 2, hours: 4, minutes: 5, seconds: 6, overdue: false });
});

test("exactly at the due moment is not overdue, one second later is", () => {
  expect(getCountdown(at(0), now)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, overdue: false });
  expect(getCountdown(at(-S), now)).toMatchObject({ seconds: 1, overdue: true });
});

test("urgency boundaries", () => {
  expect(getUrgency(at(-S), now)).toBe("overdue");
  expect(getUrgency(at(D - S), now)).toBe("critical");
  expect(getUrgency(at(D), now)).toBe("soon");
  expect(getUrgency(at(3 * D - S), now)).toBe("soon");
  expect(getUrgency(at(3 * D), now)).toBe("later");
});

test("short format", () => {
  expect(formatShort(getCountdown(at(2 * D + 4 * H), now))).toBe("2d 4h");
  expect(formatShort(getCountdown(at(3 * H + 12 * 60 * S), now))).toBe("3h 12m");
  expect(formatShort(getCountdown(at(12 * 60 * S + 5 * S), now))).toBe("12m 5s");
  expect(formatShort(getCountdown(at(0), now))).toBe("now");
});

test("split by now: upcoming soonest first, past most recent first", () => {
  const items = [
    { id: 1, due_at: at(5 * D) },
    { id: 2, due_at: at(H) },
    { id: 3, due_at: at(-3 * D) },
    { id: 4, due_at: at(-H) },
    { id: 5, due_at: at(0) },
  ];
  const { upcoming, past } = splitByNow(items, now);
  expect(upcoming.map((d) => d.id)).toEqual([2, 1]);
  expect(past.map((d) => d.id)).toEqual([5, 4, 3]);
});

test("toOffsetIso keeps the same instant", () => {
  const d = new Date("2026-10-20T09:00:00Z");
  expect(new Date(toOffsetIso(d)).getTime()).toBe(d.getTime());
  expect(toOffsetIso(d)).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:00[+-]\d\d:\d\d$/);
});
