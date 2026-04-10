// src/components/slots/SlotCard.tsx
"use client";
import { useState } from "react";
import {
  Lock, Mail, Check, Clock, ChevronDown, ChevronUp,
  Utensils, List, X, Plus,
} from "lucide-react";
import { useTimetableStore } from "@/store/timetableStore";
import { TAG_CONFIG } from "@/types";
import { fmt12, todayStr } from "@/lib/slot/slotUtils";
import type { Slot, SlotStatus } from "@/types";

interface Props {
  slot: Slot;
  status: SlotStatus;
  date?: string;
}

const STATUS_META: Record<SlotStatus, { label: string; bg: string; color: string }> = {
  active:   { label: "⏳ Now",    bg: "var(--accent-light)", color: "var(--accent)" },
  done:     { label: "✓ Done",   bg: "#d1fae5",             color: "#059669" },
  upcoming: { label: "Soon",      bg: "var(--surface-alt)",  color: "var(--text-muted)" },
  missed:   { label: "Missed",    bg: "var(--surface-alt)",  color: "var(--text-muted)" },
  blocked:  { label: "Blocked",   bg: "#fee2e2",             color: "#dc2626" },
};

export function SlotCard({ slot, status, date }: Props) {
  const today = date ?? todayStr();
  const [expanded, setExpanded] = useState(status === "active");
  const [foodInput, setFoodInput] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const {
    completions,
    markComplete,
    addFoodItem,
    removeFoodItem,
    toggleChecklistItem,
  } = useTimetableStore();

  const compKey = `${slot.id}-${today}`;
  const completion = completions[compKey];
  const foodItems = completion?.foodItems ?? [];
  const checklistChecks = completion?.checklistChecks ?? [];

  const tag = TAG_CONFIG[slot.tag] || TAG_CONFIG.CUSTOM;
  const sm = STATUS_META[status];
  const isMeal = tag.isMeal;

  const isChecked = (text: string) =>
    checklistChecks.find((c) => c.itemText === text)?.checked ?? false;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2800);
  };

  const handleComplete = async () => {
    if (status === "done") return;
    if (isMeal && foodItems.length === 0) {
      showToast("⚠️ Log your food items first!");
      return;
    }
    try {
      const res = await fetch(`/api/slots/${slot.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: today,
          foodItems: foodItems.map((f) => f.name),
          checklistChecks: slot.checklistItems.map((ci) => ({
            text: ci.text,
            checked: isChecked(ci.text),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Error"); return; }
      markComplete(slot.id, today, data.xp ?? 25);
      showToast(`🎉 +${data.xp ?? 25} XP earned!`);
    } catch {
      showToast("Network error. Try again.");
    }
  };

  const handleAddFood = () => {
    if (!foodInput.trim()) return;
    addFoodItem(slot.id, today, foodInput.trim());
    setFoodInput("");
  };

  return (
    <div
      className="rounded-2xl mb-3 transition-all duration-200"
      style={{
        background: "var(--surface)",
        border: `1.5px solid ${status === "active" ? "var(--accent)" : "var(--border)"}`,
        borderLeft: `4px solid ${tag.color}`,
        boxShadow: status === "active" ? `0 0 0 3px ${tag.color}22` : "none",
      }}
    >
      {/* Toast */}
      {toastMsg && (
        <div
          className="mx-3 mt-3 px-4 py-2 rounded-xl text-sm font-semibold text-white text-center animate-slide-down"
          style={{ background: toastMsg.includes("⚠️") ? "var(--warning)" : "var(--accent)" }}
        >
          {toastMsg}
        </div>
      )}

      {/* Header row */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => setExpanded((e) => !e)}
      >
        {/* Tag icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
          style={{ background: `${tag.color}22`, color: tag.color }}
        >
          {/* Icon via Lucide — mapped by name */}
          <TagIcon name={tag.icon} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-tight truncate" style={{ color: "var(--text)" }}>
            {slot.title}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {fmt12(slot.startTime)} – {fmt12(slot.endTime)}
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {slot.strict && <Lock size={12} color="#ef4444" opacity={0.8} />}
          {slot.emailReminder && <Mail size={12} color="var(--accent)" opacity={0.8} />}
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: sm.bg, color: sm.color }}
          >
            {sm.label}
          </span>
          {expanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="px-4 pb-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>

          {/* Wake-up greeting */}
          {slot.tag === "WAKE_UP" && (
            <div className="rounded-xl px-4 py-3 mb-3 text-sm leading-relaxed"
              style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" }}>
              🌅 <strong>Good Morning!</strong> Hope you slept well. Today is a fresh start — let's make it amazing!
            </div>
          )}

          {/* Active pulse */}
          {status === "active" && (
            <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 mb-3 text-sm font-semibold animate-pulse-ring"
              style={{ background: "var(--accent-light)", color: "var(--accent)", border: "1px solid var(--accent)" }}>
              <Clock size={14} /> This slot is active right now!
            </div>
          )}

          {/* Meal food log */}
          {isMeal && (
            <div className="mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold mb-2" style={{ color: "var(--text)" }}>
                <Utensils size={13} />
                Food Log
                {foodItems.length === 0 && (
                  <span className="text-red-500 font-semibold">(required to complete)</span>
                )}
              </div>
              {foodItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg mb-1"
                  style={{ background: "var(--surface-alt)", color: "var(--text)" }}>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: tag.color }} />
                  <span className="flex-1">{item.name}</span>
                  <button onClick={() => removeFoodItem(slot.id, today, i)}>
                    <X size={13} color="#ef4444" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2 mt-1.5">
                <input
                  value={foodInput}
                  onChange={(e) => setFoodInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddFood()}
                  placeholder="Add item (e.g. Idli, Curd Rice)…"
                  className="flex-1 text-sm px-3 py-2 rounded-xl outline-none"
                  style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
                <button onClick={handleAddFood}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white"
                  style={{ background: "var(--accent)" }}>
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Checklist */}
          {slot.checklistItems.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold mb-2" style={{ color: "var(--text)" }}>
                <List size={13} /> Checklist
              </div>
              {slot.checklistItems.map((item, i) => {
                const checked = isChecked(item.text);
                return (
                  <button key={i} onClick={() => toggleChecklistItem(slot.id, today, item.text)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1.5 text-left transition-colors"
                    style={{ background: checked ? "#f0fdf4" : "var(--surface-alt)" }}>
                    <div className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center transition-colors"
                      style={{ background: checked ? "#10b981" : "transparent", border: `2px solid ${checked ? "#10b981" : "var(--border)"}` }}>
                      {checked && <Check size={11} color="#fff" strokeWidth={3} />}
                    </div>
                    <span className="text-sm" style={{
                      color: checked ? "#059669" : "var(--text)",
                      textDecoration: checked ? "line-through" : "none",
                    }}>
                      {item.text}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Complete button */}
          {status !== "done" ? (
            <button onClick={handleComplete}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-transform active:scale-95"
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
              }}>
              <Check size={16} strokeWidth={3} /> Mark as Complete
            </button>
          ) : (
            <div className="text-center py-2 text-sm font-bold" style={{ color: "#10b981" }}>
              ✓ Completed!
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Icon mapper (Lucide) ───────────────────────────────────────────────────
import {
  Sun, Coffee, BookOpen, Dumbbell, Activity,
  Footprints, BedDouble, Zap, Droplets, Star,
} from "lucide-react";

function TagIcon({ name }: { name: string }) {
  const map: Record<string, React.ElementType> = {
    Sun, Coffee, BookOpen, Dumbbell, Activity,
    Footprints, BedDouble, Zap, Droplets, Star, Utensils,
  };
  const Comp = map[name] || Star;
  return <Comp size={16} />;
}
