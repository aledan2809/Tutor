/**
 * The hours people may get our scheduled messages, in Bucharest: from 9:00 to 20:00 (reminders to a
 * parent, warnings before an erasure, the free week's messages). MESSAGE_WINDOW_HOURS ("9-20") moves it
 * — a test stack opens it round the clock ("0-24") to check the messages at any hour.
 */
const DEFAULT: [number, number] = [9, 20];

function window(): [number, number] {
  const m = /^(\d{1,2})-(\d{1,2})$/.exec(process.env.MESSAGE_WINDOW_HOURS?.trim() ?? "");
  if (!m) return DEFAULT;
  const from = Number(m[1]);
  const until = Number(m[2]);
  return from >= 0 && until <= 24 && from < until ? [from, until] : DEFAULT;
}

export function bucharestHour(now: Date): number {
  return Number(now.toLocaleString("en-GB", { timeZone: "Europe/Bucharest", hour: "2-digit", hourCycle: "h23" }));
}

/** Whether a scheduled message may go out now. */
export function inMessageWindow(now: Date = new Date()): boolean {
  const [from, until] = window();
  const hour = bucharestHour(now);
  return hour >= from && hour < until;
}
