// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { SlotTag } from "@prisma/client";

const RegisterSchema = z.object({
  name:     z.string().min(2),
  email:    z.string().email(),
  password: z.string().min(6),
  timezone: z.string().default("Asia/Kolkata"),
});

// Default schedule template applied on registration
const DEFAULT_SLOTS = [
  { title:"Wake Up",         startTime:"06:00", endTime:"06:30", tag: SlotTag.WAKE_UP,         strict:false, autoComplete:true,  emailReminder:false, sortOrder:1, checklist:["Set alarm for tomorrow","Drink a glass of water","Get sunlight"] },
  { title:"Morning Routine", startTime:"06:30", endTime:"07:30", tag: SlotTag.MORNING_ROUTINE, strict:false, autoComplete:true,  emailReminder:false, sortOrder:2, checklist:["Brush teeth","Take a shower","Get dressed"] },
  { title:"Breakfast",       startTime:"07:30", endTime:"08:30", tag: SlotTag.BREAKFAST,       strict:true,  autoComplete:false, emailReminder:false, sortOrder:3, checklist:["Log food items","Take vitamins if prescribed"] },
  { title:"Self Study",      startTime:"16:30", endTime:"18:00", tag: SlotTag.SELF_STUDY,      strict:true,  autoComplete:false, emailReminder:true,  sortOrder:4, checklist:["No phone distractions","Review notes","Solve practice problems"] },
  { title:"Dinner",          startTime:"19:30", endTime:"20:30", tag: SlotTag.DINNER,          strict:true,  autoComplete:false, emailReminder:false, sortOrder:5, checklist:["Log food items","Avoid screen during meal"] },
  { title:"Sleep",           startTime:"22:00", endTime:"06:00", tag: SlotTag.SLEEP,           strict:false, autoComplete:true,  emailReminder:false, sortOrder:6, checklist:["Put phone on silent","Set alarm","Reflect on the day"] },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, timezone } = RegisterSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, timezone },
    });

    // Create default schedule
    const schedule = await prisma.schedule.create({
      data: { userId: user.id, name: "My Daily Schedule", isDefault: true },
    });

    for (const s of DEFAULT_SLOTS) {
      const slot = await prisma.slot.create({
        data: {
          scheduleId: schedule.id,
          title: s.title, startTime: s.startTime, endTime: s.endTime,
          tag: s.tag, strict: s.strict, autoComplete: s.autoComplete,
          emailReminder: s.emailReminder, sortOrder: s.sortOrder,
        },
      });
      for (let i = 0; i < s.checklist.length; i++) {
        await prisma.checklistItem.create({ data: { slotId: slot.id, text: s.checklist[i], sortOrder: i } });
      }
    }

    // Init streak
    await prisma.streak.create({ data: { userId: user.id } });

    return NextResponse.json({ message: "Account created successfully" }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
