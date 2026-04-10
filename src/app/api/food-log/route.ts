// src/app/api/food-log/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const Schema = z.object({
  slotId: z.string(),
  date: z.string(),
  items: z.array(z.string().min(1)),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { slotId, date, items } = Schema.parse(body);

    // Verify ownership
    const slot = await prisma.slot.findFirst({
      where: { id: slotId, schedule: { userId: session.user.id } },
    });
    if (!slot) return NextResponse.json({ error: "Slot not found" }, { status: 404 });

    // Upsert a draft completion record to hold food items before final complete
    let completion = await prisma.slotCompletion.findUnique({
      where: { slotId_date: { slotId, date } },
    });

    if (!completion) {
      completion = await prisma.slotCompletion.create({
        data: { slotId, date, xpEarned: 0 },
      });
    }

    // Replace food items
    await prisma.foodItem.deleteMany({ where: { completionId: completion.id } });
    const created = await prisma.foodItem.createMany({
      data: items.map((name) => ({ completionId: completion!.id, name })),
    });

    return NextResponse.json({ saved: created.count });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
