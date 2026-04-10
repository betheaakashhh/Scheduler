// prisma/seed.ts
import { PrismaClient, SlotTag } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Demo user
  const hash = await bcrypt.hash("aathiya123", 12);
  const user = await prisma.user.upsert({
    where: { email: "aathiya@demo.com" },
    update: {},
    create: {
      name: "Aathiya",
      email: "aathiya@demo.com",
      passwordHash: hash,
      timezone: "Asia/Kolkata",
      emailReminders: true,
    },
  });

  // Default schedule
  const schedule = await prisma.schedule.create({
    data: {
      userId: user.id,
      name: "Aathiya's Daily Schedule",
      isDefault: true,
    },
  });

  const slots = [
    {
      title: "Wake Up",
      startTime: "06:00",
      endTime: "06:30",
      tag: SlotTag.WAKE_UP,
      strict: false,
      autoComplete: true,
      emailReminder: false,
      sortOrder: 1,
      checklist: ["Set alarm for tomorrow", "Drink a glass of water", "Open curtains / get sunlight"],
    },
    {
      title: "Morning Routine",
      startTime: "06:30",
      endTime: "07:30",
      tag: SlotTag.MORNING_ROUTINE,
      strict: false,
      autoComplete: true,
      emailReminder: false,
      sortOrder: 2,
      checklist: ["Brush teeth", "Take a shower", "Get dressed"],
    },
    {
      title: "Breakfast",
      startTime: "07:30",
      endTime: "08:30",
      tag: SlotTag.BREAKFAST,
      strict: true,
      autoComplete: false,
      emailReminder: false,
      sortOrder: 3,
      checklist: ["Log food items", "Take vitamins if prescribed"],
    },
    {
      title: "Morning Walk",
      startTime: "08:30",
      endTime: "09:30",
      tag: SlotTag.WALK,
      strict: false,
      autoComplete: true,
      emailReminder: false,
      sortOrder: 4,
      checklist: ["Carry water bottle", "Wear comfortable shoes"],
    },
    {
      title: "College / School",
      startTime: "09:30",
      endTime: "16:30",
      tag: SlotTag.COLLEGE,
      strict: true,
      autoComplete: false,
      emailReminder: true,
      sortOrder: 5,
      checklist: ["Pack bag", "Charge phone", "Review today's topics"],
    },
    {
      title: "Self Study",
      startTime: "16:30",
      endTime: "18:00",
      tag: SlotTag.SELF_STUDY,
      strict: true,
      autoComplete: false,
      emailReminder: true,
      sortOrder: 6,
      checklist: ["No phone distractions", "Review college notes", "Solve practice problems"],
    },
    {
      title: "Gym / Workout",
      startTime: "18:00",
      endTime: "19:00",
      tag: SlotTag.GYM,
      strict: true,
      autoComplete: false,
      emailReminder: true,
      sortOrder: 7,
      checklist: ["Carry gym bag", "Stay hydrated", "Log workout"],
    },
    {
      title: "Dinner",
      startTime: "19:30",
      endTime: "20:30",
      tag: SlotTag.DINNER,
      strict: true,
      autoComplete: false,
      emailReminder: false,
      sortOrder: 8,
      checklist: ["Log food items", "Avoid screen during meal"],
    },
    {
      title: "Sleep",
      startTime: "22:00",
      endTime: "06:00",
      tag: SlotTag.SLEEP,
      strict: false,
      autoComplete: true,
      emailReminder: false,
      sortOrder: 9,
      checklist: ["Put phone on silent", "Set alarm", "Reflect on the day"],
    },
  ];

  for (const s of slots) {
    const slot = await prisma.slot.create({
      data: {
        scheduleId: schedule.id,
        title: s.title,
        startTime: s.startTime,
        endTime: s.endTime,
        tag: s.tag,
        strict: s.strict,
        autoComplete: s.autoComplete,
        emailReminder: s.emailReminder,
        sortOrder: s.sortOrder,
      },
    });
    for (let i = 0; i < s.checklist.length; i++) {
      await prisma.checklistItem.create({
        data: { slotId: slot.id, text: s.checklist[i], sortOrder: i },
      });
    }
  }

  // Initial streak
  await prisma.streak.create({
    data: { userId: user.id, currentStreak: 7, longestStreak: 14 },
  });

  console.log("✅ Seeded user:", user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
