"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { ViolationCard } from "@/components/ViolationCard";
import type { Violation, Stats } from "@/lib/types";

export default function Dashboard() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [vRes, sRes] = await Promise.all([
      apiFetch("/violations/"),
      apiFetch("/violations/stats"),
    ]);
    setViolations(await vRes.json());
    setStats(await sRes.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function onAcknowledge(id: string) {
    setViolations(vs => vs.map(v => v.id === id ? { ...v, acknowledged: true } : v));
  }

  if (loading) return <div className="text-sm" style={{ color: "#64748B" }}>Cargando...</div>;

  const TYPE_LABEL: Record<string, string> = {
    no_hardhat: "Sin casco",
    no_vest: "Sin chaleco",
    no_mask: "Sin mascarilla",
  };

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-mono tracking-widest mb-1" style={{ color: "#64748B" }}>SAFETYPULSE AI</p>
        <h1 className="text-2xl font-bold">Dashboard de Seguridad</h1>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
          {[
            { label: "Total violaciones", value: stats.total, color: "#F0F6FF" },
            { label: "Sin reconocer", value: stats.unacknowledged, color: "#EF4444" },
            { label: "Sin casco", value: stats.by_type.no_hardhat ?? 0, color: "#EF4444" },
            { label: "Sin chaleco", value: stats.by_type.no_vest ?? 0, color: "#F59E0B" },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4" style={{ background: "#0D1629", border: "1px solid #1A2744" }}>
              <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs mt-1" style={{ color: "#64748B" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Violations list */}
      <div className="space-y-3">
        {violations.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={{ background: "#0D1629", border: "1px solid #1A2744" }}>
            <div className="text-4xl mb-3">✅</div>
            <div className="font-semibold mb-1">Sin violaciones detectadas</div>
            <div className="text-sm" style={{ color: "#64748B" }}>
              Sube una imagen o activa la webcam para analizar
            </div>
          </div>
        ) : (
          violations.map(v => (
            <ViolationCard key={v.id} violation={v} onAcknowledge={onAcknowledge} />
          ))
        )}
      </div>
    </div>
  );
}
