// src/app/api/slots/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { scheduleEmailReminder, scheduleSlotAutoComplete } from "@/lib/redis";
import { msUntilSlotStart } from "@/lib/slot/slotUtils";
import { format } from "date-fns";

const CreateSlotSchema = z.object({
  scheduleId: z.string(),
  title: z.string().min(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  tag: z.string(),
  strict: z.boolean().default(false),
  autoComplete: z.boolean().default(false),
  emailReminder: z.boolean().default(false),
  sortOrder: z.number().default(0),
  checklistItems: z.array(z.string()).default([]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = CreateSlotSchema.parse(body);

    // Verify schedule ownership
    const schedule = await prisma.schedule.findFirst({
      where: { id: data.scheduleId, userId: session.user.id },
    });
    if (!schedule) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });

    const slot = await prisma.slot.create({
      data: {
        scheduleId: data.scheduleId,
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        tag: data.tag as any,
        strict: data.strict,
        autoComplete: data.autoComplete,
        emailReminder: data.emailReminder,
        sortOrder: data.sortOrder,
        checklistItems: {
          create: data.checklistItems.map((text, i) => ({ text, sortOrder: i })),
        },
      },
      include: { checklistItems: { orderBy: { sortOrder: "asc" } } },
    });

    // Schedule auto-complete job if needed
    if (slot.autoComplete) {
      const delayMs = msUntilSlotStart(slot as any, new Date());
      await scheduleSlotAutoComplete({
        slotId: slot.id,
        userId: session.user.id,
        date: format(new Date(), "yyyy-MM-dd"),
        delayMs,
      });
    }

    // Schedule email reminder (15 min before)
    if (slot.emailReminder) {
      const user = await prisma.user.findUnique({ where: { id: session.user.id } });
      if (user?.emailReminders) {
        const delayMs = Math.max(0, msUntilSlotStart(slot as any, new Date()) - 15 * 60 * 1000);
        await scheduleEmailReminder({
          userId: session.user.id,
          email: user.email,
          name: user.name,
          slotTitle: slot.title,
          slotTime: slot.startTime,
          type: "reminder",
          delayMs,
        });
      }
    }

    return NextResponse.json({ slot }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
