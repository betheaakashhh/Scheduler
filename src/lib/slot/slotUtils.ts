// src/lib/slot/slotUtils.ts
import type { Slot, SlotStatus } from "@/types";
import { format } from "date-fns";

export function timeToMins(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function minsToTime(m: number): string {
  const h = Math.floor(m / 60) % 24;
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export function fmt12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function getSlotStatus(
  slot: Slot,
  now: Date,
  isCompleted: boolean
): SlotStatus {
  if (isCompleted) return "done";

  const curMins = now.getHours() * 60 + now.getMinutes();
  const s = timeToMins(slot.startTime);
  const e = timeToMins(slot.endTime);

  // Overnight slot (e.g., 22:00–06:00)
  const adjustedEnd = e < s ? e + 1440 : e;
  const adjustedNow = curMins < s && e < s ? curMins + 1440 : curMins;

  if (adjustedNow >= s && adjustedNow < adjustedEnd) return "active";
  if (adjustedNow >= adjustedEnd) return "missed";
  return "upcoming";
}

export function getDayProgress(
  slots: Slot[],
  completedIds: Set<string>
): number {
  if (slots.length === 0) return 0;
  const done = slots.filter((s) => completedIds.has(s.id)).length;
  return Math.round((done / slots.length) * 100);
}

export function getXPForDate(
  slots: Slot[],
  completions: Record<string, { xpEarned: number }>,
  date: string
): number {
  return slots.reduce((sum, slot) => {
    const key = `${slot.id}-${date}`;
    return sum + (completions[key]?.xpEarned ?? 0);
  }, 0);
}

export function msUntilSlotStart(slot: Slot, now: Date): number {
  const curMins = now.getHours() * 60 + now.getMinutes();
  const slotMins = timeToMins(slot.startTime);
  let diff = slotMins - curMins;
  if (diff < 0) diff += 1440;
  return diff * 60 * 1000;
}

export function todayStr(): string {
  return format(new Date(), "yyyy-MM-dd");
}
