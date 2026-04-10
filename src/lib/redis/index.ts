// src/lib/redis/index.ts
import { Queue, Worker, QueueEvents } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const redisClient = connection;

// ─── Queue names ────────────────────────────────────────────────────────────
export const QUEUES = {
  EMAIL:  "email-notifications",
  STREAK: "streak-check",
  SLOT:   "slot-auto-complete",
} as const;

// ─── Email queue ────────────────────────────────────────────────────────────
export const emailQueue = new Queue(QUEUES.EMAIL, { connection });

export async function scheduleEmailReminder(data: {
  userId: string;
  email: string;
  name: string;
  slotTitle: string;
  slotTime: string;
  type: "reminder" | "streak_warning" | "streak_lost";
  delayMs?: number;
}) {
  await emailQueue.add("send-email", data, {
    delay: data.delayMs ?? 0,
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  });
}

// ─── Streak check queue ──────────────────────────────────────────────────────
export const streakQueue = new Queue(QUEUES.STREAK, { connection });

export async function scheduleStreakCheck(userId: string) {
  await streakQueue.add(
    "check-streak",
    { userId },
    {
      jobId: `streak-${userId}`,         // deduplicate
      delay: 0,
      removeOnComplete: true,
    }
  );
}

// ─── Slot auto-complete queue ────────────────────────────────────────────────
export const slotQueue = new Queue(QUEUES.SLOT, { connection });

export async function scheduleSlotAutoComplete(data: {
  slotId: string;
  userId: string;
  date: string;
  delayMs: number;
}) {
  await slotQueue.add("auto-complete", data, {
    jobId: `slot-${data.slotId}-${data.date}`,
    delay: data.delayMs,
    removeOnComplete: true,
  });
}

export default redisClient;
