// src/app/api/slots/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const UpdateSchema = z.object({
  title:         z.string().min(1).optional(),
  startTime:     z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime:       z.string().regex(/^\d{2}:\d{2}$/).optional(),
  tag:           z.string().optional(),
  strict:        z.boolean().optional(),
  autoComplete:  z.boolean().optional(),
  emailReminder: z.boolean().optional(),
  sortOrder:     z.number().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = UpdateSchema.parse(body);

    const slot = await prisma.slot.findFirst({
      where: { id: params.id, schedule: { userId: session.user.id } },
    });
    if (!slot) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.slot.update({
      where: { id: params.id },
      data: data as any,
      include: { checklistItems: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json({ slot: updated });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const slot = await prisma.slot.findFirst({
      where: { id: params.id, schedule: { userId: session.user.id } },
    });
    if (!slot) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.slot.delete({ where: { id: params.id } });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
