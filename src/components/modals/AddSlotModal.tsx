// src/components/modals/AddSlotModal.tsx
"use client";
import { useState } from "react";
import { X, Plus } from "lucide-react";
import { useTimetableStore } from "@/store/timetableStore";
import { TAG_CONFIG } from "@/types";
import type { SlotTag } from "@/types";

export function AddSlotModal({ onClose }: { onClose: () => void }) {
  const { addSlot } = useTimetableStore();
  const [form, setForm] = useState({
    title: "",
    startTime: "09:00",
    endTime: "10:00",
    tag: "SELF_STUDY" as SlotTag,
    strict: false,
    autoComplete: false,
    emailReminder: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.startTime || !form.endTime) {
      setError("Please fill all required fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Get default scheduleId from API
      const schedRes = await fetch("/api/schedules");
      const schedData = await schedRes.json();
      const scheduleId = schedData.schedules?.[0]?.id;
      if (!scheduleId) { setError("No schedule found."); setLoading(false); return; }

      const res = await fetch("/api/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, scheduleId, checklistItems: [] }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error"); setLoading(false); return; }
      addSlot(data.slot);
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}>
      <div className="w-full max-w-[480px] rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto animate-slide-up"
        style={{ background: "var(--surface)" }}
        onClick={(e) => e.stopPropagation()}>

        {/* Handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "var(--border)" }} />
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black" style={{ color: "var(--text)" }}>Add Time Slot</h2>
          <button onClick={onClose}><X size={20} color="var(--text-muted)" /></button>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-2.5 mb-4 text-sm font-semibold"
            style={{ background: "#fee2e2", color: "#dc2626" }}>{error}</div>
        )}

        {/* Title */}
        <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-muted)" }}>Title *</label>
        <input value={form.title} onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. Morning Walk"
          className="w-full px-4 py-3 rounded-xl text-sm mb-4 outline-none"
          style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text)" }} />

        {/* Times */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {["startTime", "endTime"].map((k) => (
            <div key={k}>
              <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-muted)" }}>
                {k === "startTime" ? "Start Time *" : "End Time *"}
              </label>
              <input type="time" value={(form as any)[k]} onChange={(e) => set(k, e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text)" }} />
            </div>
          ))}
        </div>

        {/* Category */}
        <label className="block text-xs font-bold mb-2" style={{ color: "var(--text-muted)" }}>Category</label>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {(Object.entries(TAG_CONFIG) as [SlotTag, typeof TAG_CONFIG[SlotTag]][]).map(([key, tag]) => (
            <button key={key} onClick={() => set("tag", key)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-colors"
              style={{
                background: form.tag === key ? `${tag.color}22` : "var(--surface-alt)",
                border: `1.5px solid ${form.tag === key ? tag.color : "transparent"}`,
              }}>
              <span className="text-base">{getCategoryEmoji(key)}</span>
              <span className="text-xs font-semibold leading-tight" style={{ color: "var(--text)" }}>
                {tag.label}
              </span>
            </button>
          ))}
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { key: "strict",        label: "Strict",     desc: "Must complete" },
            { key: "emailReminder", label: "Email",      desc: "Remind me"     },
            { key: "autoComplete",  label: "Auto Done",  desc: "Self-mark"     },
          ].map(({ key, label, desc }) => (
            <button key={key} onClick={() => set(key, !(form as any)[key])}
              className="flex flex-col items-center gap-1 py-3 rounded-xl transition-colors"
              style={{
                background: (form as any)[key] ? "var(--accent-light)" : "var(--surface-alt)",
                border: `1.5px solid ${(form as any)[key] ? "var(--accent)" : "transparent"}`,
              }}>
              <span className="text-base">{key === "strict" ? "🔒" : key === "emailReminder" ? "📧" : "✅"}</span>
              <span className="text-xs font-bold" style={{ color: (form as any)[key] ? "var(--accent)" : "var(--text-muted)" }}>
                {label}
              </span>
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{desc}</span>
            </button>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl text-sm font-bold"
            style={{ background: "var(--surface-alt)", color: "var(--text-muted)" }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-[2] py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity active:scale-95"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Adding…" : <><Plus size={15} /> Add Slot</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function getCategoryEmoji(tag: string): string {
  const map: Record<string, string> = {
    WAKE_UP:"🌅", MORNING_ROUTINE:"☕", BREAKFAST:"🍳", LUNCH:"🍱", DINNER:"🍽️",
    COLLEGE:"📚", SELF_STUDY:"📖", GYM:"🏋️", WORKOUT:"💪", WALK:"🚶",
    SLEEP:"😴", WORK:"⚡", HYDRATION:"💧", CUSTOM:"⭐",
  };
  return map[tag] || "⭐";
}
