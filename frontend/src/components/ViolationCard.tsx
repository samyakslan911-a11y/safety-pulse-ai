"use client";
import { apiFetch } from "@/lib/api";
import type { Violation } from "@/lib/types";

const TYPE_COLOR: Record<string, string> = {
  no_hardhat: "#EF4444",
  no_vest:    "#F59E0B",
  no_mask:    "#8B5CF6",
};

const TYPE_ICON: Record<string, string> = {
  no_hardhat: "⛑️",
  no_vest:    "🦺",
  no_mask:    "😷",
};

interface Props {
  violation: Violation;
  onAcknowledge: (id: string) => void;
}

export function ViolationCard({ violation: v, onAcknowledge }: Props) {
  const color = TYPE_COLOR[v.violation_type] ?? "#EF4444";
  const icon = TYPE_ICON[v.violation_type] ?? "⚠️";
  const ts = new Date(v.detected_at).toLocaleString("es-CL");

  async function ack() {
    await apiFetch(`/violations/${v.id}/acknowledge`, { method: "POST" });
    onAcknowledge(v.id);
  }

  return (
    <div
      className="rounded-xl p-4 flex gap-4"
      style={{
        background: "#0D1629",
        border: `1px solid ${v.acknowledged ? "#1A2744" : color + "55"}`,
        opacity: v.acknowledged ? 0.6 : 1,
      }}
    >
      {v.annotated_image && (
        <img
          src={v.annotated_image}
          alt="frame"
          className="rounded-lg object-cover flex-shrink-0"
          style={{ width: 96, height: 72 }}
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span>{icon}</span>
          <span className="font-semibold text-sm" style={{ color }}>{v.label}</span>
          {v.acknowledged && (
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: "#1A2744", color: "#64748B" }}>
              Reconocida
            </span>
          )}
        </div>
        <div className="text-xs mb-1" style={{ color: "#64748B" }}>
          {v.camera_zone} · {ts} · {(v.confidence * 100).toFixed(0)}% confianza
        </div>
      </div>
      {!v.acknowledged && (
        <button
          onClick={ack}
          className="text-xs px-3 py-1 rounded self-start flex-shrink-0"
          style={{ background: "#1A2744", color: "#94A3B8" }}
        >
          Reconocer
        </button>
      )}
    </div>
  );
}
