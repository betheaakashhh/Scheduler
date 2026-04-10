// src/types/index.ts

export type SlotTag =
  | "WAKE_UP" | "MORNING_ROUTINE" | "BREAKFAST" | "LUNCH" | "DINNER"
  | "COLLEGE" | "SELF_STUDY" | "GYM" | "WORKOUT" | "WALK"
  | "SLEEP" | "WORK" | "HYDRATION" | "CUSTOM";

export type SlotStatus = "upcoming" | "active" | "done" | "missed" | "blocked";

export interface TagConfig {
  label: string;
  icon: string;
  color: string;
  strict: boolean;
  emailable: boolean;
  isMeal: boolean;
  xpReward: number;
}

export const TAG_CONFIG: Record<SlotTag, TagConfig> = {
  WAKE_UP:         { label: "Wake Up",         icon: "Sun",       color: "#f59e0b", strict: false, emailable: false, isMeal: false, xpReward: 10 },
  MORNING_ROUTINE: { label: "Morning Routine",  icon: "Coffee",    color: "#a78bfa", strict: false, emailable: false, isMeal: false, xpReward: 15 },
  BREAKFAST:       { label: "Breakfast",        icon: "Utensils",  color: "#fb923c", strict: true,  emailable: false, isMeal: true,  xpReward: 20 },
  LUNCH:           { label: "Lunch",            icon: "Utensils",  color: "#f97316", strict: true,  emailable: false, isMeal: true,  xpReward: 20 },
  DINNER:          { label: "Dinner",           icon: "Utensils",  color: "#ef4444", strict: true,  emailable: false, isMeal: true,  xpReward: 20 },
  COLLEGE:         { label: "College / School", icon: "BookOpen",  color: "#3b82f6", strict: true,  emailable: true,  isMeal: false, xpReward: 50 },
  SELF_STUDY:      { label: "Self Study",       icon: "BookOpen",  color: "#6366f1", strict: true,  emailable: true,  isMeal: false, xpReward: 40 },
  GYM:             { label: "Gym",              icon: "Dumbbell",  color: "#10b981", strict: true,  emailable: true,  isMeal: false, xpReward: 35 },
  WORKOUT:         { label: "Workout",          icon: "Activity",  color: "#14b8a6", strict: true,  emailable: true,  isMeal: false, xpReward: 35 },
  WALK:            { label: "Walk",             icon: "Footprints",color: "#22c55e", strict: false, emailable: false, isMeal: false, xpReward: 15 },
  SLEEP:           { label: "Sleep",            icon: "BedDouble", color: "#8b5cf6", strict: false, emailable: false, isMeal: false, xpReward: 10 },
  WORK:            { label: "Work",             icon: "Zap",       color: "#0ea5e9", strict: true,  emailable: true,  isMeal: false, xpReward: 45 },
  HYDRATION:       { label: "Hydration",        icon: "Droplets",  color: "#38bdf8", strict: false, emailable: false, isMeal: false, xpReward: 5  },
  CUSTOM:          { label: "Custom",           icon: "Star",      color: "#ec4899", strict: false, emailable: false, isMeal: false, xpReward: 25 },
};

export interface Slot {
  id: string;
  scheduleId: string;
  title: string;
  startTime: string;  // "HH:MM"
  endTime: string;    // "HH:MM"
  tag: SlotTag;
  strict: boolean;
  autoComplete: boolean;
  emailReminder: boolean;
  sortOrder: number;
  checklistItems: ChecklistItem[];
  completions?: SlotCompletion[];
}

export interface ChecklistItem {
  id: string;
  slotId: string;
  text: string;
  sortOrder: number;
}

export interface SlotCompletion {
  id: string;
  slotId: string;
  date: string;
  completedAt: string;
  xpEarned: number;
  foodItems: FoodItem[];
  checklistChecks: ChecklistCheck[];
}

export interface FoodItem {
  id: string;
  completionId: string;
  name: string;
}

export interface ChecklistCheck {
  id: string;
  completionId: string;
  itemText: string;
  checked: boolean;
}

export interface Streak {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
}

export interface XPLevel {
  level: number;
  label: string;
  icon: string;
  xpNeeded: number;
  xpMax: number;
}

export const XP_LEVELS: XPLevel[] = [
  { level: 1, label: "Starter",    icon: "Droplets", xpNeeded: 0,    xpMax: 100  },
  { level: 2, label: "Rising",     icon: "Star",     xpNeeded: 100,  xpMax: 300  },
  { level: 3, label: "Consistent", icon: "Zap",      xpNeeded: 300,  xpMax: 600  },
  { level: 4, label: "Focused",    icon: "Target",   xpNeeded: 600,  xpMax: 1000 },
  { level: 5, label: "Champion",   icon: "Trophy",   xpNeeded: 1000, xpMax: 1500 },
  { level: 6, label: "Legend",     icon: "Flame",    xpNeeded: 1500, xpMax: 9999 },
];

export interface AcademicPeriod {
  day: string;       // "Monday" | "Tuesday" ...
  startTime: string; // "HH:MM"
  endTime: string;
  subject: string;
  teacher?: string;
  room?: string;
}

// ─── Socket Events ───────────────────────────────────────────────────────
export interface ServerToClientEvents {
  "slot:tick":       (data: { slotId: string; status: SlotStatus; message?: string }) => void;
  "slot:completed":  (data: { slotId: string; date: string; xp: number }) => void;
  "streak:updated":  (data: { streak: number; message?: string }) => void;
  "streak:warning":  (data: { hoursLeft: number }) => void;
  "xp:gained":       (data: { points: number; total: number; levelUp?: XPLevel }) => void;
  "reminder:email":  (data: { slotId: string; title: string }) => void;
  "academic:period": (data: { current: AcademicPeriod | null; next: AcademicPeriod | null }) => void;
}

export interface ClientToServerEvents {
  "slot:complete":   (data: { slotId: string; date: string; userId: string }) => void;
  "checklist:check": (data: { slotId: string; itemText: string; checked: boolean }) => void;
  "join:room":       (userId: string) => void;
}
