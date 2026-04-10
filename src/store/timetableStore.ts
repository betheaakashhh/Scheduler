// src/store/timetableStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Slot, SlotCompletion, Streak, FoodItem } from "@/types";

interface TimetableState {
  // Data
  slots: Slot[];
  completions: Record<string, SlotCompletion>;  // key: `${slotId}-${date}`
  streak: Streak;
  xpTotal: number;
  darkMode: boolean;
  email: string;

  // Real-time
  activeSlotId: string | null;
  liveNow: Date;

  // Actions
  setSlots: (slots: Slot[]) => void;
  markComplete: (slotId: string, date: string, xp: number) => void;
  addFoodItem: (slotId: string, date: string, item: string) => void;
  removeFoodItem: (slotId: string, date: string, index: number) => void;
  toggleChecklistItem: (slotId: string, date: string, itemText: string) => void;
  setActiveSlot: (slotId: string | null) => void;
  tickTime: () => void;
  addXP: (points: number) => void;
  updateStreak: (streak: Partial<Streak>) => void;
  toggleDarkMode: () => void;
  setEmail: (email: string) => void;
  addSlot: (slot: Slot) => void;
  updateSlot: (id: string, updates: Partial<Slot>) => void;
  deleteSlot: (id: string) => void;
}

export const useTimetableStore = create<TimetableState>()(
  persist(
    (set, get) => ({
      slots: [],
      completions: {},
      streak: { currentStreak: 0, longestStreak: 0, lastActiveDate: null },
      xpTotal: 0,
      darkMode: false,
      email: "",
      activeSlotId: null,
      liveNow: new Date(),

      setSlots: (slots) => set({ slots }),

      markComplete: (slotId, date, xp) => {
        const key = `${slotId}-${date}`;
        set((s) => ({
          completions: {
            ...s.completions,
            [key]: {
              id: key,
              slotId,
              date,
              completedAt: new Date().toISOString(),
              xpEarned: xp,
              foodItems: s.completions[key]?.foodItems ?? [],
              checklistChecks: s.completions[key]?.checklistChecks ?? [],
            },
          },
          xpTotal: s.xpTotal + xp,
        }));
      },

      addFoodItem: (slotId, date, item) => {
        const key = `${slotId}-${date}`;
        set((s) => {
          const existing = s.completions[key] ?? {
            id: key, slotId, date, completedAt: "", xpEarned: 0, foodItems: [], checklistChecks: [],
          };
          return {
            completions: {
              ...s.completions,
              [key]: {
                ...existing,
                foodItems: [...existing.foodItems, { id: Date.now().toString(), completionId: key, name: item }],
              },
            },
          };
        });
      },

      removeFoodItem: (slotId, date, index) => {
        const key = `${slotId}-${date}`;
        set((s) => {
          const existing = s.completions[key];
          if (!existing) return s;
          return {
            completions: {
              ...s.completions,
              [key]: {
                ...existing,
                foodItems: existing.foodItems.filter((_, i) => i !== index),
              },
            },
          };
        });
      },

      toggleChecklistItem: (slotId, date, itemText) => {
        const key = `${slotId}-${date}`;
        set((s) => {
          const existing = s.completions[key] ?? {
            id: key, slotId, date, completedAt: "", xpEarned: 0, foodItems: [], checklistChecks: [],
          };
          const checks = existing.checklistChecks;
          const idx = checks.findIndex((c) => c.itemText === itemText);
          const updated =
            idx >= 0
              ? checks.map((c, i) => (i === idx ? { ...c, checked: !c.checked } : c))
              : [...checks, { id: Date.now().toString(), completionId: key, itemText, checked: true }];
          return {
            completions: { ...s.completions, [key]: { ...existing, checklistChecks: updated } },
          };
        });
      },

      setActiveSlot: (slotId) => set({ activeSlotId: slotId }),
      tickTime: () => set({ liveNow: new Date() }),
      addXP: (points) => set((s) => ({ xpTotal: s.xpTotal + points })),
      updateStreak: (streak) => set((s) => ({ streak: { ...s.streak, ...streak } })),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      setEmail: (email) => set({ email }),

      addSlot: (slot) => set((s) => ({ slots: [...s.slots, slot].sort((a, b) => a.sortOrder - b.sortOrder) })),
      updateSlot: (id, updates) =>
        set((s) => ({ slots: s.slots.map((sl) => (sl.id === id ? { ...sl, ...updates } : sl)) })),
      deleteSlot: (id) => set((s) => ({ slots: s.slots.filter((sl) => sl.id !== id) })),
    }),
    {
      name: "timeflow-storage",
      partialize: (s) => ({
        completions: s.completions,
        xpTotal: s.xpTotal,
        streak: s.streak,
        darkMode: s.darkMode,
        email: s.email,
      }),
    }
  )
);
