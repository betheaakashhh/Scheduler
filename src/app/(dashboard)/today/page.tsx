// src/app/(dashboard)/today/page.tsx
"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTimetableStore } from "@/store/timetableStore";
import { SlotCard } from "@/components/slots/SlotCard";
import { AddSlotModal } from "@/components/modals/AddSlotModal";
import { DayProgressBar } from "@/components/stats/DayProgressBar";
import { ActiveNowBanner } from "@/components/slots/ActiveNowBanner";
import { AcademicNowBanner } from "@/components/slots/AcademicNowBanner";
import { WelcomeBanner } from "@/components/layout/WelcomeBanner";
import { getSlotStatus, getDayProgress, todayStr } from "@/lib/slot/slotUtils";
import { Plus } from "lucide-react";
import type { Slot } from "@/types";

export default function TodayPage() {
  const { data: session } = useSession();
  const { slots, setSlots, completions, liveNow, tickTime } = useTimetableStore();
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const today = todayStr();

  // Live clock tick every 30s
  useEffect(() => {
    const t = setInterval(tickTime, 30_000);
    return () => clearInterval(t);
  }, [tickTime]);

  // Fetch schedule on mount
  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/schedules")
      .then((r) => r.json())
      .then((data) => {
        const defaultSchedule = data.schedules?.find((s: any) => s.isDefault) || data.schedules?.[0];
        if (defaultSchedule?.slots) setSlots(defaultSchedule.slots);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session, setSlots]);

  const completedIds = new Set(
    Object.keys(completions)
      .filter((k) => k.endsWith(`-${today}`))
      .map((k) => k.replace(`-${today}`, ""))
  );

  const activeSlot = slots.find((s) => getSlotStatus(s, liveNow, completedIds.has(s.id)) === "active");
  const progress = getDayProgress(slots, completedIds);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <WelcomeBanner name={session?.user?.name || "there"} />

      {/* Day progress */}
      <DayProgressBar progress={progress} done={completedIds.size} total={slots.length} />

      {/* Active slot banner */}
      {activeSlot && <ActiveNowBanner slot={activeSlot} now={liveNow} />}

      {/* Academic period banner (if college slot active) */}
      {activeSlot?.tag === "COLLEGE" && <AcademicNowBanner userId={session?.user?.id} now={liveNow} />}

      {/* Slot list */}
      <div className="mt-4 mb-2">
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
          Today's Schedule
        </p>
        {slots.map((slot) => (
          <SlotCard
            key={slot.id}
            slot={slot}
            status={getSlotStatus(slot, liveNow, completedIds.has(slot.id))}
            date={today}
          />
        ))}
      </div>

      {/* Add slot FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl mt-2 text-sm font-bold transition-colors"
        style={{
          background: "var(--accent-light)",
          color: "var(--accent)",
          border: "1.5px dashed var(--accent)",
          opacity: 0.85,
        }}
      >
        <Plus size={16} /> Add Time Slot
      </button>

      {showAdd && <AddSlotModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
