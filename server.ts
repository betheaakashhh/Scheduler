// server.ts  — run with: ts-node server.ts
import { createServer } from "http";
import { Server } from "socket.io";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { QUEUES } from "./src/lib/redis/index";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  SlotStatus,
} from "./src/types/index";

const PORT = parseInt(process.env.SOCKET_PORT || "3001", 10);

const redisConnection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const httpServer = createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// ─── Socket Rooms (one per user) ─────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  socket.on("join:room", (userId) => {
    socket.join(`user:${userId}`);
    console.log(`[socket] ${socket.id} joined room user:${userId}`);
  });

  socket.on("slot:complete", async ({ slotId, date, userId }) => {
    // Emit XP gained back to the room
    io.to(`user:${userId}`).emit("xp:gained", { points: 25, total: 0 });
    io.to(`user:${userId}`).emit("slot:completed", { slotId, date, xp: 25 });
  });

  socket.on("disconnect", () => {
    console.log(`[socket] disconnected: ${socket.id}`);
  });
});

// ─── Tick worker: broadcasts slot status every minute ────────────────────────
setInterval(() => {
  // In production: query DB for all active users' slots and emit tick
  // Simplified broadcast — actual implementation queries DB
  io.emit("slot:tick", { slotId: "tick", status: "active" as SlotStatus });
}, 60_000);

// ─── Email Worker (processes BullMQ jobs) ────────────────────────────────────
const emailWorker = new Worker(
  QUEUES.EMAIL,
  async (job) => {
    const { email, name, slotTitle, slotTime, type } = job.data;

    // Dynamic import to avoid circular deps
    const { sendEmail } = await import("./src/lib/email/index");

    if (type === "reminder") {
      await sendEmail({
        to: email,
        subject: `⏰ Reminder: ${slotTitle} starts at ${slotTime}`,
        html: `<p>Hi ${name},</p><p>Your <strong>${slotTitle}</strong> slot starts at <strong>${slotTime}</strong>. Stay on track! 💪</p>`,
      });
    } else if (type === "streak_warning") {
      await sendEmail({
        to: email,
        subject: "🔥 Your streak is about to break!",
        html: `<p>Hi ${name},</p><p>You have less than 2 hours left to maintain your streak. Complete at least one task! 🏃</p>`,
      });
    } else if (type === "streak_lost") {
      await sendEmail({
        to: email,
        subject: "😢 Your streak was reset",
        html: `<p>Hi ${name},</p><p>Your streak was reset. But that's okay — start fresh today. You've got this! 💪</p>`,
      });
    }
  },
  { connection: redisConnection }
);

// ─── Slot auto-complete Worker ────────────────────────────────────────────────
const slotWorker = new Worker(
  QUEUES.SLOT,
  async (job) => {
    const { slotId, userId, date } = job.data;
    console.log(`[worker] auto-completing slot ${slotId} for ${userId} on ${date}`);
    // Call internal API to mark complete
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/slots/${slotId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-key": process.env.NEXTAUTH_SECRET! },
      body: JSON.stringify({ date, autoComplete: true, userId }),
    });
    io.to(`user:${userId}`).emit("slot:completed", { slotId, date, xp: 0 });
  },
  { connection: redisConnection }
);

emailWorker.on("completed", (job) => console.log(`[email] job ${job.id} done`));
emailWorker.on("failed", (job, err) => console.error(`[email] job ${job?.id} failed:`, err));

httpServer.listen(PORT, () => {
  console.log(`✅ Socket.io + Workers running on port ${PORT}`);
});

export { io };
