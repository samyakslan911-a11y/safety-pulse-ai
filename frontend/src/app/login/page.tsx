"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const fn = mode === "login"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });
      const { error } = await fn;
      if (error) setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#080F1E" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center text-2xl" style={{ background: "#EF4444" }}>
            🏭
          </div>
          <h1 className="text-xl font-bold">SafetyPulse AI</h1>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>Industrial Safety Intelligence</p>
        </div>

        <form onSubmit={submit} className="rounded-2xl p-6" style={{ background: "#0D1629", border: "1px solid #1A2744" }}>
          <div className="mb-4">
            <label className="text-xs font-mono tracking-wider block mb-2" style={{ color: "#64748B" }}>EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: "#080F1E", border: "1px solid #1A2744", color: "#F0F6FF" }}
            />
          </div>
          <div className="mb-6">
            <label className="text-xs font-mono tracking-wider block mb-2" style={{ color: "#64748B" }}>CONTRASEÑA</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: "#080F1E", border: "1px solid #1A2744", color: "#F0F6FF" }}
            />
          </div>

          {error && <p className="text-sm mb-4" style={{ color: "#EF4444" }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg font-semibold text-sm mb-4"
            style={{ background: "#EF4444", color: "white" }}
          >
            {loading ? "..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </button>

          <button
            type="button"
            onClick={() => setMode(m => m === "login" ? "signup" : "login")}
            className="w-full text-sm"
            style={{ color: "#64748B" }}
          >
            {mode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
