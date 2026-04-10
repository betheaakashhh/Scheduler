// src/app/api/slots/[id]/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/db/prisma";
import { updateStreak } from "@/lib/streak";
import { TAG_CONFIG } from "@/types";
import { format } from "date-fns";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isInternal = req.headers.get("x-internal-key") === process.env.NEXTAUTH_SECRET;
    let userId: string;

    if (isInternal) {
      const body = await req.json();
      userId = body.userId;
    } else {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      userId = session.user.id;
    }

    const body = isInternal ? {} : await req.json();
    const date = (body as any).date ?? format(new Date(), "yyyy-MM-dd");
    const foodItems: string[] = (body as any).foodItems ?? [];
    const checklistChecks: { text: string; checked: boolean }[] = (body as any).checklistChecks ?? [];

    // Verify slot ownership
    const slot = await prisma.slot.findFirst({
      where: { id: params.id, schedule: { userId } },
    });
    if (!slot) return NextResponse.json({ error: "Slot not found" }, { status: 404 });

    const tagConfig = TAG_CONFIG[slot.tag as keyof typeof TAG_CONFIG];

    // Strict meal check
    if (tagConfig?.isMeal && foodItems.length === 0 && !isInternal) {
      return NextResponse.json(
        { error: "Please log your food items before completing a meal slot." },
        { status: 422 }
      );
    }

    const xp = tagConfig?.xpReward ?? 25;

    // Upsert completion
    const completion = await prisma.slotCompletion.upsert({
      where: { slotId_date: { slotId: params.id, date } },
      create: {
        slotId: params.id,
        date,
        xpEarned: xp,
        foodItems: { create: foodItems.map((name) => ({ name })) },
        checklistChecks: { create: checklistChecks.map((c) => ({ itemText: c.text, checked: c.checked })) },
      },
      update: {
        completedAt: new Date(),
      },
      include: { foodItems: true, checklistChecks: true },
    });

    // Log XP
    await prisma.xPLog.create({
      data: { userId, points: xp, reason: `Completed: ${slot.title}`, date },
    });

    // Update streak
    const { streak, isNewBest } = await updateStreak(userId);

    return NextResponse.json({ completion, xp, streak, isNewBest });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
