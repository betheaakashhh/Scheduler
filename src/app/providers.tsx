// src/app/providers.tsx
"use client";
import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import { useTimetableStore } from "@/store/timetableStore";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeApplier />
      {children}
    </SessionProvider>
  );
}

function ThemeApplier() {
  const darkMode = useTimetableStore((s) => s.darkMode);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);
  return null;
}
