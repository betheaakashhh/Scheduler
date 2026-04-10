// src/app/(dashboard)/settings/page.tsx
"use client";
import { useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTimetableStore } from "@/store/timetableStore";
import { ChevronRight, Moon, Sun, Bell, Upload, Mail, LogOut, BookOpen } from "lucide-react";
import { TAG_CONFIG } from "@/types";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { darkMode, toggleDarkMode, email, setEmail } = useTimetableStore();
  const [toast, setToast] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [parsedCount, setParsedCount] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleEmailChange = () => {
    const val = prompt("Enter your email for reminders:", email || session?.user?.email || "");
    if (val) { setEmail(val); showToast("✅ Email updated!"); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadStatus("Parsing timetable…");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("name", "My Academic Timetable");
    try {
      const res = await fetch("/api/timetable", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setParsedCount(data.periodsFound);
        setUploadStatus(`✅ Found ${data.periodsFound} periods!`);
      } else {
        setUploadStatus("⚠️ " + (data.error || "Failed to parse"));
      }
    } catch {
      setUploadStatus("❌ Upload failed. Try again.");
    }
  };

  const settingsRows = [
    {
      icon: Mail, label: "Email Address",
      value: email || session?.user?.email || "Not set",
      action: handleEmailChange,
    },
    {
      icon: darkMode ? Sun : Moon, label: "Dark Mode",
      value: darkMode ? "On" : "Off",
      action: toggleDarkMode,
    },
    {
      icon: Bell, label: "Reminders",
      value: "Enabled",
      action: () => showToast("Configure reminders per slot via checklist"),
    },
    {
      icon: LogOut, label: "Sign Out",
      value: "",
      action: () => signOut({ callbackUrl: "/login" }),
      danger: true,
    },
  ];

  return (
    <div className="animate-fade-in">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-bold text-white animate-slide-down"
          style={{ background: "var(--accent)", boxShadow: "0 8px 24px rgba(99,102,241,0.35)" }}>
          {toast}
        </div>
      )}

      {/* Profile */}
      <div className="rounded-2xl px-5 py-4 mb-4 flex items-center gap-4"
        style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", color: "#fff" }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black"
          style={{ background: "rgba(255,255,255,0.2)" }}>
          {session?.user?.name?.[0]?.toUpperCase() || "?"}
        </div>
        <div>
          <p className="font-black text-lg">{session?.user?.name}</p>
          <p className="text-xs opacity-75">{session?.user?.email}</p>
        </div>
      </div>

      {/* Settings list */}
      <div className="rounded-2xl overflow-hidden mb-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {settingsRows.map((row, i) => {
          const Icon = row.icon;
          return (
            <button key={row.label} onClick={row.action}
              className="w-full flex items-center gap-3 px-4 py-4 text-left transition-colors hover:opacity-80"
              style={{ borderBottom: i < settingsRows.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: row.danger ? "#fee2e2" : "var(--accent-light)",
                  color: row.danger ? "#ef4444" : "var(--accent)",
                }}>
                <Icon size={18} />
              </div>
              <span className="flex-1 text-sm font-semibold" style={{ color: row.danger ? "#ef4444" : "var(--text)" }}>
                {row.label}
              </span>
              {row.value && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{row.value}</span>}
              <ChevronRight size={16} color="var(--text-muted)" />
            </button>
          );
        })}
      </div>

      {/* Academic timetable import */}
      <div className="rounded-2xl p-4 mb-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={18} color="var(--accent)" />
          <p className="text-sm font-bold" style={{ color: "var(--text)" }}>Academic Timetable</p>
        </div>
        <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
          Upload your class timetable (PDF, image, or .txt). We'll parse it and show live period info during college hours.
        </p>
        {uploadStatus && (
          <div className="rounded-xl px-4 py-2.5 mb-3 text-sm font-semibold"
            style={{ background: uploadStatus.includes("✅") ? "#f0fdf4" : "#fef9c3", color: uploadStatus.includes("✅") ? "#15803d" : "#a16207" }}>
            {uploadStatus}
            {parsedCount !== null && ` ${parsedCount} periods imported.`}
          </div>
        )}
        <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.txt,.csv" className="hidden" onChange={handleFileUpload} />
        <button onClick={() => fileRef.current?.click()}
          className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
          style={{ background: "var(--accent-light)", color: "var(--accent)", border: "1.5px dashed var(--accent)" }}>
          <Upload size={15} /> Upload Timetable File
        </button>
      </div>

      {/* Tag overview */}
      <div className="rounded-2xl p-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <p className="text-sm font-bold mb-3" style={{ color: "var(--text)" }}>Category Reference</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(TAG_CONFIG).map(([key, tag]) => (
            <div key={key} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
              style={{ background: "var(--surface-alt)" }}>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: tag.color }} />
              <div>
                <p className="text-xs font-bold leading-tight" style={{ color: "var(--text)" }}>{tag.label}</p>
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {tag.strict ? "🔒 Strict" : "✓ Flexible"}
                  {tag.emailable ? " · 📧 Email" : ""}
                  {` · +${tag.xpReward}XP`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
