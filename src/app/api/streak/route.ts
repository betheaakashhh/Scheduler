// src/app/api/streak/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/db/prisma";
import { updateStreak, checkStreakWarning, getStreakLevel } from "@/lib/streak";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const streak = await prisma.streak.findUnique({ where: { userId: session.user.id } });
    const level = getStreakLevel(streak?.currentStreak ?? 0);

    return NextResponse.json({
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
      lastActiveDate: streak?.lastActiveDate,
      level,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Called after any slot completion to update streak
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { streak, isNewBest } = await updateStreak(session.user.id);
    await checkStreakWarning(session.user.id);
    const level = getStreakLevel(streak);

    return NextResponse.json({ streak, isNewBest, level });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
