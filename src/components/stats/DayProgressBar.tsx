// src/components/stats/DayProgressBar.tsx
"use client";
export function DayProgressBar({ progress, done, total }: { progress: number; done: number; total: number }) {
  return (
    <div className="rounded-2xl px-4 py-3.5 mb-4"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="flex justify-between text-xs font-bold mb-2.5">
        <span style={{ color: "var(--text)" }}>Day Progress</span>
        <span style={{ color: "var(--accent)" }}>{progress}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-alt)" }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${progress}%`, background: "linear-gradient(90deg, var(--accent), var(--accent-2))" }} />
      </div>
      <div className="flex justify-between text-xs mt-2" style={{ color: "var(--text-muted)" }}>
        <span>{done} completed</span>
        <span>{total - done} remaining</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

// src/components/slots/ActiveNowBanner.tsx
import { Clock } from "lucide-react";
import { fmt12 } from "@/lib/slot/slotUtils";
import type { Slot } from "@/types";

export function ActiveNowBanner({ slot, now }: { slot: Slot; now: Date }) {
  const endMins = slot.endTime.split(":").map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const totalMins = endMins[0] * 60 + endMins[1] - (slot.startTime.split(":").map(Number).reduce((h, m, i) => i === 0 ? h + m * 60 : h + m, 0));
  const remaining = endMins[0] * 60 + endMins[1] - nowMins;
  const pct = Math.max(0, Math.min(100, 100 - (remaining / Math.abs(totalMins)) * 100));

  return (
    <div className="rounded-2xl px-4 py-3.5 mb-3 animate-pulse-ring"
      style={{ background: "var(--accent-light)", border: "1.5px solid var(--accent)" }}>
      <div className="flex items-center gap-2 mb-1">
        <Clock size={14} color="var(--accent)" />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
          Currently Active
        </span>
      </div>
      <p className="text-base font-black" style={{ color: "var(--text)" }}>{slot.title}</p>
      <p className="text-xs mt-0.5 mb-2" style={{ color: "var(--text-muted)" }}>
        {fmt12(slot.startTime)} – {fmt12(slot.endTime)}
        {remaining > 0 && ` · ${remaining} min left`}
      </p>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: "var(--accent)" }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

// src/components/slots/AcademicNowBanner.tsx
import { useEffect, useState } from "react";
import { BookOpen, ArrowRight } from "lucide-react";
import { getCurrentPeriod } from "@/lib/parser/academicParser";
import type { AcademicPeriod } from "@/types";

export function AcademicNowBanner({ userId, now }: { userId?: string; now: Date }) {
  const [current, setCurrent] = useState<AcademicPeriod | null>(null);
  const [next, setNext] = useState<AcademicPeriod | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetch("/api/timetable")
      .then((r) => r.json())
      .then((data) => {
        if (data.timetable?.periods) {
          const { current: c, next: n } = getCurrentPeriod(data.timetable.periods, now);
          setCurrent(c);
          setNext(n);
        }
      });
  }, [userId, now]);

  if (!current && !next) return null;

  return (
    <div className="rounded-2xl px-4 py-3.5 mb-3"
      style={{ background: "#eff6ff", border: "1.5px solid #93c5fd" }}>
      <div className="flex items-center gap-2 mb-2">
        <BookOpen size={14} color="#3b82f6" />
        <span className="text-xs font-bold uppercase tracking-widest text-blue-600">Academic Schedule</span>
      </div>
      {current && (
        <div className="mb-1">
          <span className="text-[10px] font-bold text-blue-400 uppercase">Now</span>
          <p className="text-sm font-black text-blue-900">{current.subject}</p>
          {current.teacher && <p className="text-xs text-blue-500">{current.teacher}</p>}
          {current.room && <p className="text-xs text-blue-400">📍 {current.room}</p>}
        </div>
      )}
      {next && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-blue-100">
          <ArrowRight size={12} color="#60a5fa" />
          <div>
            <span className="text-[10px] text-blue-400 font-semibold">Next: </span>
            <span className="text-xs font-bold text-blue-700">{next.subject}</span>
            <span className="text-[10px] text-blue-400 ml-1">at {next.startTime}</span>
          </div>
        </div>
      )}
    </div>
  );
}
