// src/app/(dashboard)/schedule/page.tsx
"use client";
import { useState } from "react";
import { useTimetableStore } from "@/store/timetableStore";
import { SlotCard } from "@/components/slots/SlotCard";
import { AddSlotModal } from "@/components/modals/AddSlotModal";
import { getSlotStatus, todayStr } from "@/lib/slot/slotUtils";
import { Plus, Download, Upload } from "lucide-react";

export default function SchedulePage() {
  const { slots, liveNow, completions } = useTimetableStore();
  const [showAdd, setShowAdd] = useState(false);
  const today = todayStr();

  const completedIds = new Set(
    Object.keys(completions)
      .filter((k) => k.endsWith(`-${today}`))
      .map((k) => k.replace(`-${today}`, ""))
  );

  const handleExport = () => {
    const data = JSON.stringify(slots, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "timeflow-schedule.json"; a.click();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-black" style={{ color: "var(--text)" }}>My Schedule</h1>
        <button onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
          style={{ background: "var(--surface-alt)", color: "var(--text-muted)" }}>
          <Download size={13} /> Export
        </button>
      </div>

      {slots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">📅</div>
          <p className="font-bold text-base mb-2" style={{ color: "var(--text)" }}>No slots yet</p>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Create your first time slot or import a schedule
          </p>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
            <Plus size={16} /> Add First Slot
          </button>
        </div>
      ) : (
        <>
          {slots.map((slot) => (
            <SlotCard key={slot.id} slot={slot}
              status={getSlotStatus(slot, liveNow, completedIds.has(slot.id))}
              date={today} />
          ))}
          <button onClick={() => setShowAdd(true)}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl mt-2 text-sm font-bold"
            style={{ background: "var(--accent-light)", color: "var(--accent)", border: "1.5px dashed var(--accent)" }}>
            <Plus size={16} /> Add Time Slot
          </button>
        </>
      )}

      {showAdd && <AddSlotModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
