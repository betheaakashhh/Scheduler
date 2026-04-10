// src/app/(dashboard)/layout.tsx
"use client";
import { usePathname, useRouter } from "next/navigation";
import { Home, List, BarChart2, Settings } from "lucide-react";
import { useTimetableStore } from "@/store/timetableStore";
import { useSocket } from "@/hooks/useSocket";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

const NAV = [
  { href: "/today",    label: "Today",    Icon: Home },
  { href: "/schedule", label: "Schedule", Icon: List },
  { href: "/stats",    label: "Stats",    Icon: BarChart2 },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession({ required: true, onUnauthenticated: () => router.push("/login") });
  const { darkMode, toggleDarkMode, addXP, updateStreak } = useTimetableStore();
  const { on } = useSocket(session?.user?.id);

  // Real-time socket listeners
  useEffect(() => {
    const offXP = on("xp:gained", ({ points, total, levelUp }) => {
      addXP(points);
      if (levelUp) {
        // Show level-up toast — handled by global notification component
        window.dispatchEvent(new CustomEvent("timeflow:levelup", { detail: levelUp }));
      }
    });
    const offStreak = on("streak:updated", ({ streak }) => {
      updateStreak({ currentStreak: streak });
    });
    const offWarning = on("streak:warning", ({ hoursLeft }) => {
      window.dispatchEvent(new CustomEvent("timeflow:streak-warning", { detail: { hoursLeft } }));
    });
    return () => { offXP(); offStreak(); offWarning(); };
  }, [on, addXP, updateStreak]);

  return (
    <div className="app-shell">
      {/* Header */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-5 py-3"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
      >
        <div>
          <span className="text-xl font-black tracking-tight" style={{ color: "var(--accent)" }}>
            ⚡ TimeFlow
          </span>
        </div>
        <button
          onClick={toggleDarkMode}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: "var(--surface-alt)", color: "var(--text-muted)" }}
          aria-label="Toggle dark mode"
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] pb-safe z-50 flex"
        style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}
      >
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              className="flex-1 flex flex-col items-center gap-1 py-2 transition-colors"
              style={{ color: active ? "var(--accent)" : "var(--text-muted)" }}
            >
              <div
                className="w-11 h-8 rounded-xl flex items-center justify-center transition-colors"
                style={{ background: active ? "var(--accent-light)" : "transparent" }}
              >
                <Icon size={20} />
              </div>
              <span className="text-[10px]" style={{ fontWeight: active ? 700 : 500 }}>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
