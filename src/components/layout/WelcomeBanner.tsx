// src/components/layout/WelcomeBanner.tsx
"use client";
import { useState } from "react";
import { X } from "lucide-react";

export function WelcomeBanner({ name }: { name: string }) {
  const [show, setShow] = useState(true);
  if (!show) return null;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const emoji = hour < 12 ? "🌅" : hour < 17 ? "☀️" : "🌙";

  return (
    <div className="rounded-2xl px-5 py-4 mb-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", color: "#fff" }}>
      <button onClick={() => setShow(false)}
        className="absolute top-3 right-3 w-6 h-6 rounded-lg flex items-center justify-center"
        style={{ background: "rgba(255,255,255,0.15)" }}>
        <X size={13} />
      </button>
      <p className="text-xs opacity-80 mb-1">
        {new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}
      </p>
      <h2 className="text-xl font-black tracking-tight">{emoji} {greeting}, {name}!</h2>
      <p className="text-xs opacity-75 mt-1">Stay consistent. Every slot counts. 💪</p>
    </div>
  );
}
