"use client";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function LivePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [running, setRunning] = useState(false);
  const [fps, setFps] = useState(1);
  const [zone, setZone] = useState("Webcam");
  const [lastResult, setLastResult] = useState<{ violations_found: number; detections: any[]; annotated_image: string } | null>(null);
  const [totalDetections, setTotalDetections] = useState(0);
  const [error, setError] = useState("");

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setError("No se pudo acceder a la cámara. Verifica los permisos del navegador.");
    }
  }

  function stopCamera() {
    const video = videoRef.current;
    if (!video?.srcObject) return;
    (video.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    video.srcObject = null;
  }

  function captureFrame(): string | null {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.8);
  }

  async function sendFrame() {
    const b64 = captureFrame();
    if (!b64) return;
    try {
      const res = await apiFetch("/analyze/frame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_b64: b64, camera_zone: zone }),
      });
      const data = await res.json();
      setLastResult(data);
      if (data.violations_found > 0) setTotalDetections(t => t + data.violations_found);
    } catch {
      // silently ignore network errors during streaming
    }
  }

  async function toggleLive() {
    if (running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      stopCamera();
      setRunning(false);
    } else {
      setError("");
      await startCamera();
      const ms = Math.round(1000 / fps);
      intervalRef.current = setInterval(sendFrame, ms);
      setRunning(true);
    }
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopCamera();
    };
  }, []);

  const ZONES = ["Webcam", "Zona A", "Zona B", "Zona C", "Entrada"];

  return (
    <div>
      <p className="text-xs font-mono tracking-widest mb-1" style={{ color: "#64748B" }}>MÓDULO 02 · LIVE</p>
      <h1 className="text-2xl font-bold mb-6">Webcam en tiempo real</h1>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Camera feed */}
        <div>
          <div className="rounded-xl overflow-hidden mb-4 relative" style={{ background: "#000", aspectRatio: "4/3" }}>
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
            {!running && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ color: "#64748B" }}>
                <div className="text-center">
                  <div className="text-4xl mb-2">📷</div>
                  <div className="text-sm">Cámara inactiva</div>
                </div>
              </div>
            )}
            {running && (
              <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 rounded-md text-xs font-mono" style={{ background: "rgba(0,0,0,0.7)" }}>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                LIVE · {fps} fps
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs font-mono tracking-wider block mb-2" style={{ color: "#64748B" }}>ZONA</label>
              <select
                value={zone}
                onChange={e => setZone(e.target.value)}
                disabled={running}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ background: "#0D1629", border: "1px solid #1A2744", color: "#F0F6FF" }}
              >
                {ZONES.map(z => <option key={z}>{z}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-mono tracking-wider block mb-2" style={{ color: "#64748B" }}>FPS</label>
              <select
                value={fps}
                onChange={e => setFps(Number(e.target.value))}
                disabled={running}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ background: "#0D1629", border: "1px solid #1A2744", color: "#F0F6FF" }}
              >
                <option value={0.5}>0.5 fps (lento)</option>
                <option value={1}>1 fps</option>
                <option value={2}>2 fps</option>
              </select>
            </div>
          </div>

          <button
            onClick={toggleLive}
            className="w-full py-2.5 rounded-lg font-semibold text-sm"
            style={{ background: running ? "#1A2744" : "#EF4444", color: running ? "#94A3B8" : "white" }}
          >
            {running ? "⏹ Detener cámara" : "▶ Iniciar análisis en vivo"}
          </button>

          {error && <p className="text-sm mt-3" style={{ color: "#EF4444" }}>{error}</p>}
        </div>

        {/* Live result */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-4 text-center" style={{ background: "#0D1629", border: "1px solid #1A2744" }}>
              <div className="text-2xl font-bold font-mono" style={{ color: "#EF4444" }}>{totalDetections}</div>
              <div className="text-xs mt-1" style={{ color: "#64748B" }}>Violaciones detectadas</div>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: "#0D1629", border: "1px solid #1A2744" }}>
              <div className="text-2xl font-bold font-mono" style={{ color: lastResult?.violations_found ? "#EF4444" : "#22D3A4" }}>
                {lastResult?.violations_found ?? 0}
              </div>
              <div className="text-xs mt-1" style={{ color: "#64748B" }}>En frame actual</div>
            </div>
          </div>

          {lastResult?.annotated_image && (
            <img
              src={lastResult.annotated_image}
              alt="annotated"
              className="rounded-xl w-full object-contain"
              style={{ maxHeight: 240 }}
            />
          )}

          {lastResult?.detections && lastResult.detections.length > 0 && (
            <div>
              <p className="text-xs font-mono tracking-wider mb-2" style={{ color: "#64748B" }}>ÚLTIMO FRAME</p>
              {lastResult.detections.map((d, i) => (
                <div key={i} className="rounded-lg p-3 mb-2 text-sm flex justify-between" style={{ background: "#0D1629", border: "1px solid #EF444433" }}>
                  <span className="font-semibold" style={{ color: "#EF4444" }}>{d.label}</span>
                  <span style={{ color: "#64748B" }}>{(d.confidence * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}

          {(!lastResult || lastResult.violations_found === 0) && running && (
            <div className="rounded-xl p-6 text-center" style={{ background: "#0D1629", border: "1px solid #1A2744" }}>
              <div className="text-2xl mb-1">✅</div>
              <div className="text-sm" style={{ color: "#64748B" }}>Sin violaciones en este frame</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
