// src/app/api/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/db/prisma";
import { format, subDays } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const today = format(new Date(), "yyyy-MM-dd");

    // Streak
    const streak = await prisma.streak.findUnique({ where: { userId } });

    // Total XP
    const xpAgg = await prisma.xPLog.aggregate({
      where: { userId },
      _sum: { points: true },
    });
    const xpTotal = xpAgg._sum.points ?? 0;

    // Weekly completion (last 7 days)
    const weekData = await Promise.all(
      Array.from({ length: 7 }, (_, i) => {
        const date = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
        return prisma.slotCompletion.count({
          where: { date, slot: { schedule: { userId } } },
        }).then((count) => ({ date, count }));
      })
    );

    // Total slots per day (for percentage)
    const totalSlots = await prisma.slot.count({
      where: { schedule: { userId, isDefault: true } },
    });

    const weekly = weekData.map((d) => ({
      date: d.date,
      completed: d.count,
      total: totalSlots,
      pct: totalSlots > 0 ? Math.round((d.count / totalSlots) * 100) : 0,
    }));

    // Today's completions
    const todayCompletions = await prisma.slotCompletion.findMany({
      where: { date: today, slot: { schedule: { userId } } },
      include: { foodItems: true },
    });

    return NextResponse.json({
      streak: streak ?? { currentStreak: 0, longestStreak: 0 },
      xpTotal,
      weekly,
      todayCompleted: todayCompletions.length,
      totalSlots,
    });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
