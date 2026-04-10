// src/app/api/checklist/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const Schema = z.object({
  slotId: z.string(),
  date: z.string(),
  itemText: z.string(),
  checked: z.boolean(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { slotId, date, itemText, checked } = Schema.parse(body);

    const slot = await prisma.slot.findFirst({
      where: { id: slotId, schedule: { userId: session.user.id } },
    });
    if (!slot) return NextResponse.json({ error: "Slot not found" }, { status: 404 });

    let completion = await prisma.slotCompletion.findUnique({
      where: { slotId_date: { slotId, date } },
    });
    if (!completion) {
      completion = await prisma.slotCompletion.create({
        data: { slotId, date, xpEarned: 0 },
      });
    }

    const existing = await prisma.checklistCheck.findFirst({
      where: { completionId: completion.id, itemText },
    });

    if (existing) {
      await prisma.checklistCheck.update({ where: { id: existing.id }, data: { checked } });
    } else {
      await prisma.checklistCheck.create({ data: { completionId: completion.id, itemText, checked } });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
