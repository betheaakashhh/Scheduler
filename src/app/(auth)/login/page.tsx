// src/app/(auth)/login/page.tsx
"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Zap } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.email || !form.password) { setError("Please fill all fields."); return; }
    setLoading(true); setError("");
    const res = await signIn("credentials", { ...form, redirect: false });
    setLoading(false);
    if (res?.error) { setError("Invalid email or password."); return; }
    router.push("/today");
  };

  const inp = "w-full px-4 py-3.5 rounded-2xl text-sm outline-none transition-colors";

  return (
    <div className="min-h-dvh flex items-end justify-center"
      style={{ background: "linear-gradient(160deg, #6366f1 0%, #8b5cf6 40%, #0f172a 100%)" }}>
      <div className="w-full max-w-[480px] rounded-t-3xl p-6 pb-10"
        style={{ background: "var(--surface)" }}>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--accent-light)" }}>
            <Zap size={24} color="var(--accent)" fill="var(--accent)" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text)" }}>TimeFlow</h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Your smart daily planner</p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 mb-4 text-sm font-semibold"
            style={{ background: "#fee2e2", color: "#dc2626" }}>{error}</div>
        )}

        <div className="mb-4">
          <label className="block text-xs font-bold mb-2" style={{ color: "var(--text-muted)" }}>Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="you@example.com" className={inp}
            style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text)" }} />
        </div>

        <div className="mb-6">
          <label className="block text-xs font-bold mb-2" style={{ color: "var(--text-muted)" }}>Password</label>
          <div className="relative">
            <input type={showPw ? "text" : "password"} value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="••••••••" className={inp}
              style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text)", paddingRight: 48 }} />
            <button onClick={() => setShowPw((s) => !s)}
              className="absolute right-4 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-muted)" }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-4 rounded-2xl text-sm font-black text-white mb-4 transition-opacity active:scale-95"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", opacity: loading ? 0.7 : 1, boxShadow: "0 4px 14px rgba(99,102,241,0.4)" }}>
          {loading ? "Signing in…" : "Sign In"}
        </button>

        <p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>
          No account?{" "}
          <Link href="/register" className="font-bold" style={{ color: "var(--accent)" }}>Create one →</Link>
        </p>

        {/* Demo hint */}
        <button onClick={() => { setForm({ email: "aathiya@demo.com", password: "aathiya123" }); }}
          className="w-full mt-3 py-2.5 rounded-xl text-xs font-bold"
          style={{ background: "var(--surface-alt)", color: "var(--text-muted)" }}>
          Use demo account: aathiya@demo.com
        </button>
      </div>
    </div>
  );
}
