"use client";
import { useState, useRef } from "react";
import { apiFetch, apiUrl } from "@/lib/api";

export default function UploadPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<{ annotated_image: string; violations_found: number; detections: any[] } | null>(null);
  const [zone, setZone] = useState("Zona A");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError("");
  }

  async function analyze() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("camera_zone", zone);
      const res = await apiFetch("/analyze/image", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      setResult(await res.json());
    } catch (e: any) {
      setError(e.message ?? "Error al analizar");
    } finally {
      setLoading(false);
    }
  }

  const ZONES = ["Zona A", "Zona B", "Zona C", "Entrada", "Almacén", "Producción"];

  return (
    <div>
      <p className="text-xs font-mono tracking-widest mb-1" style={{ color: "#64748B" }}>MÓDULO 02 · UPLOAD</p>
      <h1 className="text-2xl font-bold mb-6">Analizar imagen</h1>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Upload panel */}
        <div>
          <div
            className="rounded-xl p-6 mb-4 text-center cursor-pointer"
            style={{ background: "#0D1629", border: "2px dashed #1A2744" }}
            onClick={() => fileRef.current?.click()}
          >
            {preview ? (
              <img src={preview} alt="preview" className="max-h-48 mx-auto rounded-lg object-contain" />
            ) : (
              <>
                <div className="text-4xl mb-3">📷</div>
                <div className="font-semibold mb-1">Arrastra o haz clic</div>
                <div className="text-sm" style={{ color: "#64748B" }}>JPEG, PNG, WebP · máx 10 MB</div>
              </>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          </div>

          <div className="mb-4">
            <label className="text-xs font-mono tracking-wider block mb-2" style={{ color: "#64748B" }}>ZONA DE CÁMARA</label>
            <select
              value={zone}
              onChange={e => setZone(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ background: "#0D1629", border: "1px solid #1A2744", color: "#F0F6FF" }}
            >
              {ZONES.map(z => <option key={z}>{z}</option>)}
            </select>
          </div>

          <button
            onClick={analyze}
            disabled={!preview || loading}
            className="w-full py-2.5 rounded-lg font-semibold text-sm"
            style={{
              background: !preview || loading ? "#1A2744" : "#EF4444",
              color: !preview || loading ? "#64748B" : "white",
            }}
          >
            {loading ? "Analizando..." : "Analizar con YOLOv8"}
          </button>

          {error && <p className="text-sm mt-3" style={{ color: "#EF4444" }}>{error}</p>}
        </div>

        {/* Result panel */}
        <div>
          {result ? (
            <div>
              <div
                className="rounded-xl p-3 mb-3 text-center font-semibold"
                style={{
                  background: result.violations_found > 0 ? "rgba(239,68,68,0.1)" : "rgba(34,211,164,0.1)",
                  border: `1px solid ${result.violations_found > 0 ? "#EF444455" : "#22D3A455"}`,
                  color: result.violations_found > 0 ? "#EF4444" : "#22D3A4",
                }}
              >
                {result.violations_found > 0
                  ? `⚠️ ${result.violations_found} violación${result.violations_found > 1 ? "es" : ""} detectada${result.violations_found > 1 ? "s" : ""}`
                  : "✅ Sin violaciones detectadas"}
              </div>

              {result.annotated_image && (
                <img
                  src={result.annotated_image}
                  alt="annotated"
                  className="w-full rounded-xl object-contain mb-3"
                  style={{ maxHeight: 280 }}
                />
              )}

              {result.detections.map((d, i) => (
                <div key={i} className="rounded-lg p-3 mb-2 text-sm" style={{ background: "#0D1629", border: "1px solid #EF444433" }}>
                  <span className="font-semibold" style={{ color: "#EF4444" }}>{d.label}</span>
                  <span className="ml-2" style={{ color: "#64748B" }}>{(d.confidence * 100).toFixed(0)}% confianza</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl p-8 text-center h-full flex items-center justify-center" style={{ background: "#0D1629", border: "1px solid #1A2744" }}>
              <div style={{ color: "#64748B" }}>
                <div className="text-3xl mb-2">🔍</div>
                <div className="text-sm">El resultado aparecerá aquí</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
