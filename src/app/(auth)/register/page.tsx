// src/app/(auth)/register/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Zap } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", timezone: "Asia/Kolkata" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) { setError("Please fill all fields."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed."); setLoading(false); return; }
      router.push("/login?registered=1");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const inp = "w-full px-4 py-3.5 rounded-2xl text-sm outline-none";

  return (
    <div className="min-h-dvh flex items-end justify-center"
      style={{ background: "linear-gradient(160deg, #6366f1 0%, #8b5cf6 40%, #0f172a 100%)" }}>
      <div className="w-full max-w-[480px] rounded-t-3xl p-6 pb-10"
        style={{ background: "var(--surface)" }}>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--accent-light)" }}>
            <Zap size={24} color="var(--accent)" fill="var(--accent)" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text)" }}>Join TimeFlow</h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Create your free account</p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 mb-4 text-sm font-semibold"
            style={{ background: "#fee2e2", color: "#dc2626" }}>{error}</div>
        )}

        {[
          { key: "name",     label: "Full Name",   type: "text",     placeholder: "Aathiya" },
          { key: "email",    label: "Email",        type: "email",    placeholder: "you@example.com" },
          { key: "password", label: "Password",     type: "password", placeholder: "Min. 6 characters" },
        ].map((field) => (
          <div key={field.key} className="mb-4">
            <label className="block text-xs font-bold mb-2" style={{ color: "var(--text-muted)" }}>
              {field.label}
            </label>
            <div className="relative">
              <input
                type={field.key === "password" ? (showPw ? "text" : "password") : field.type}
                value={(form as any)[field.key]}
                onChange={(e) => set(field.key, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder={field.placeholder}
                className={inp}
                style={{
                  background: "var(--surface-alt)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  paddingRight: field.key === "password" ? 48 : undefined,
                }}
              />
              {field.key === "password" && (
                <button onClick={() => setShowPw((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              )}
            </div>
          </div>
        ))}

        <div className="mb-6">
          <label className="block text-xs font-bold mb-2" style={{ color: "var(--text-muted)" }}>Timezone</label>
          <select
            value={form.timezone}
            onChange={(e) => set("timezone", e.target.value)}
            className={inp}
            style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text)" }}
          >
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="America/New_York">America/New_York (EST)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
            <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
            <option value="Asia/Dubai">Asia/Dubai (GST)</option>
            <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
          </select>
        </div>

        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-4 rounded-2xl text-sm font-black text-white mb-4 transition-opacity active:scale-95"
          style={{
            background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
            opacity: loading ? 0.7 : 1,
            boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
          }}>
          {loading ? "Creating account…" : "Create Account →"}
        </button>

        <p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link href="/login" className="font-bold" style={{ color: "var(--accent)" }}>Sign in →</Link>
        </p>
      </div>
    </div>
  );
}
