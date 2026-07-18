"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";

export function Nav() {
  const { user } = useAuth();
  const pathname = usePathname();
  if (!user || pathname === "/login") return null;

  const links = [
    { href: "/", label: "Dashboard" },
    { href: "/upload", label: "Analizar imagen" },
    { href: "/live", label: "Webcam en vivo" },
  ];

  return (
    <nav style={{ background: "#0D1629", borderBottom: "1px solid #1A2744" }} className="px-6 py-3 flex items-center gap-6">
      <span className="font-bold text-sm" style={{ color: "#EF4444" }}>SafetyPulse AI</span>
      <div className="flex gap-4 flex-1">
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className="text-sm"
            style={{ color: pathname === l.href ? "#F0F6FF" : "#64748B" }}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs" style={{ color: "#64748B" }}>{user.email}</span>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-xs px-3 py-1 rounded"
          style={{ background: "#1A2744", color: "#94A3B8" }}
        >
          Salir
        </button>
      </div>
    </nav>
  );
}
