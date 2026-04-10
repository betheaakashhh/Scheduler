// src/lib/streak/index.ts
import { prisma } from "@/lib/db/prisma";
import { scheduleEmailReminder } from "@/lib/redis";
import { format, differenceInDays, parseISO } from "date-fns";

export async function updateStreak(userId: string): Promise<{ streak: number; isNewBest: boolean }> {
  const today = format(new Date(), "yyyy-MM-dd");

  let record = await prisma.streak.findUnique({ where: { userId } });
  if (!record) {
    record = await prisma.streak.create({
      data: { userId, currentStreak: 1, longestStreak: 1, lastActiveDate: today },
    });
    return { streak: 1, isNewBest: true };
  }

  if (record.lastActiveDate === today) {
    return { streak: record.currentStreak, isNewBest: false };
  }

  const daysSinceLast = record.lastActiveDate
    ? differenceInDays(parseISO(today), parseISO(record.lastActiveDate))
    : 999;

  let newStreak: number;
  if (daysSinceLast === 1) {
    newStreak = record.currentStreak + 1;
  } else {
    // Streak broken
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.emailReminders) {
      await scheduleEmailReminder({
        userId,
        email: user.email,
        name: user.name,
        slotTitle: "Streak Reset",
        slotTime: "",
        type: "streak_lost",
      });
    }
    newStreak = 1;
  }

  const isNewBest = newStreak > record.longestStreak;
  await prisma.streak.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak: isNewBest ? newStreak : record.longestStreak,
      lastActiveDate: today,
    },
  });

  return { streak: newStreak, isNewBest };
}

export async function checkStreakWarning(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.emailReminders) return;

  const record = await prisma.streak.findUnique({ where: { userId } });
  if (!record || record.currentStreak < 3) return; // Only warn if streak ≥ 3

  const today = format(new Date(), "yyyy-MM-dd");
  const completionsToday = await prisma.slotCompletion.count({
    where: {
      date: today,
      slot: { schedule: { userId } },
    },
  });

  if (completionsToday === 0 && new Date().getHours() >= 20) {
    await scheduleEmailReminder({
      userId,
      email: user.email,
      name: user.name,
      slotTitle: "Streak Warning",
      slotTime: "",
      type: "streak_warning",
    });
  }
}

export function getStreakLevel(streak: number): { label: string; emoji: string } {
  if (streak >= 365) return { label: "Legendary", emoji: "👑" };
  if (streak >= 100) return { label: "Unstoppable", emoji: "⚡" };
  if (streak >= 30)  return { label: "On Fire",    emoji: "🔥" };
  if (streak >= 14)  return { label: "Committed",  emoji: "💪" };
  if (streak >= 7)   return { label: "Building",   emoji: "🌱" };
  if (streak >= 3)   return { label: "Starting",   emoji: "✨" };
  return               { label: "Day 1",          emoji: "🌅" };
}
