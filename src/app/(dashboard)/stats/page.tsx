// src/app/(dashboard)/stats/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useTimetableStore } from "@/store/timetableStore";
import { XP_LEVELS } from "@/types";
import { Flame, Trophy, Zap, Target, Star, Droplets } from "lucide-react";

const LEVEL_ICONS: Record<string, React.ElementType> = {
  Droplets, Star, Zap, Target, Trophy, Flame
};

export default function StatsPage() {
  const { streak, xpTotal } = useTimetableStore();
  const [weekData, setWeekData] = useState<{ date: string; pct: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        setWeekData(data.weekly ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const curLevel = XP_LEVELS.filter((l) => xpTotal >= l.xpNeeded).slice(-1)[0] || XP_LEVELS[0];
  const nextLevel = XP_LEVELS[XP_LEVELS.indexOf(curLevel) + 1];
  const lvlPct = nextLevel
    ? Math.round(((xpTotal - curLevel.xpNeeded) / (nextLevel.xpNeeded - curLevel.xpNeeded)) * 100)
    : 100;

  const LvlIcon = LEVEL_ICONS[curLevel.icon] || Star;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="animate-fade-in">
      {/* Level hero */}
      <div className="rounded-2xl p-5 mb-4 text-white"
        style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.2)" }}>
            <LvlIcon size={30} />
          </div>
          <div>
            <p className="text-xs opacity-75">Current Level</p>
            <h2 className="text-2xl font-black tracking-tight">Lv.{curLevel.level} — {curLevel.label}</h2>
          </div>
        </div>
        <p className="text-sm opacity-80 mb-2">
          {xpTotal} XP {nextLevel ? `/ ${nextLevel.xpNeeded} XP` : "(Max Level!)"}
        </p>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.25)" }}>
          <div className="h-full rounded-full transition-all duration-700 bg-white" style={{ width: `${lvlPct}%` }} />
        </div>
        {nextLevel && (
          <p className="text-xs opacity-70 mt-2">
            {nextLevel.xpNeeded - xpTotal} XP to unlock Level {nextLevel.level} — {nextLevel.label}
          </p>
        )}
      </div>

      {/* Level path */}
      <div className="rounded-2xl px-4 py-4 mb-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <p className="text-xs font-bold mb-4" style={{ color: "var(--text)" }}>Level Progression</p>
        <div className="flex justify-between items-start relative">
          <div className="absolute top-4 left-4 right-4 h-0.5" style={{ background: "var(--border)" }} />
          {XP_LEVELS.map((l) => {
            const reached = xpTotal >= l.xpNeeded;
            const current = l.level === curLevel.level;
            const Icon = LEVEL_ICONS[l.icon] || Star;
            return (
              <div key={l.level} className="flex flex-col items-center gap-1.5 relative z-10">
                <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: reached ? "var(--accent)" : "var(--surface-alt)",
                    boxShadow: current ? `0 0 0 3px var(--accent)` : "none",
                    color: reached ? "#fff" : "var(--text-muted)",
                  }}>
                  <Icon size={14} />
                </div>
                <span className="text-[9px] text-center leading-tight"
                  style={{ color: reached ? "var(--text)" : "var(--text-muted)", fontWeight: current ? 800 : 400 }}>
                  {l.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Streak */}
      <div className="rounded-2xl p-4 mb-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold" style={{ color: "var(--text)" }}>🔥 Current Streak</p>
          <span className="text-3xl font-black" style={{ color: "#f59e0b" }}>
            {streak.currentStreak}
            <span className="text-sm font-normal ml-1" style={{ color: "var(--text-muted)" }}>days</span>
          </span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: 7 }, (_, i) => {
            const active = i < (streak.currentStreak % 7 || 7);
            return (
              <div key={i} className="flex-1 h-10 rounded-xl flex items-center justify-center"
                style={{ background: active ? "#fef3c7" : "var(--surface-alt)" }}>
                <Flame size={16} color={active ? "#f59e0b" : "var(--border)"} fill={active ? "#f59e0b" : "none"} />
              </div>
            );
          })}
        </div>
        <p className="text-xs text-center mt-2.5" style={{ color: "var(--text-muted)" }}>
          Longest streak: {streak.longestStreak} days 🏆
        </p>
      </div>

      {/* Weekly bar chart */}
      {weekData.length > 0 && (
        <div className="rounded-2xl p-4"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="text-sm font-bold mb-4" style={{ color: "var(--text)" }}>Weekly Completion</p>
          <div className="flex gap-2 items-end h-24">
            {weekData.map((d, i) => {
              const isToday = i === weekData.length - 1;
              const day = new Date(d.date).toLocaleDateString("en-US", { weekday: "short" });
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{d.pct}%</span>
                  <div className="w-full rounded-t-lg transition-all duration-700 min-h-[4px]"
                    style={{
                      height: `${d.pct}%`,
                      background: isToday ? "linear-gradient(180deg, var(--accent), var(--accent-2))" : `var(--accent)44`,
                    }} />
                  <span className="text-[10px] font-semibold" style={{ color: isToday ? "var(--accent)" : "var(--text-muted)" }}>
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
