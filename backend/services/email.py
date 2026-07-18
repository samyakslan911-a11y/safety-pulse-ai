import resend
from backend.config import settings

LABELS = {
    "no_hardhat": "Sin casco de seguridad",
    "no_vest":    "Sin chaleco reflectante",
    "no_mask":    "Sin mascarilla",
}

COLORS = {
    "no_hardhat": "#EF4444",
    "no_vest":    "#F59E0B",
    "no_mask":    "#8B5CF6",
}


def send_violation_alert(to_email: str, violation: dict) -> None:
    if not settings.resend_api_key:
        return
    resend.api_key = settings.resend_api_key

    vtype  = violation.get("violation_type", "")
    label  = LABELS.get(vtype, vtype)
    color  = COLORS.get(vtype, "#EF4444")
    zone   = violation.get("camera_zone", "Zona desconocida")
    conf   = violation.get("confidence", 0)
    ts     = violation.get("detected_at", "")

    resend.Emails.send({
        "from": settings.email_from,
        "to": [to_email],
        "subject": f"🚨 Violación de seguridad detectada — {label}",
        "html": f"""
<div style="font-family:system-ui,sans-serif;background:#0a0e1a;min-height:100vh;padding:40px 16px">
<div style="max-width:520px;margin:0 auto">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px">
    <div style="width:30px;height:30px;background:{color};border-radius:7px;display:flex;align-items:center;justify-content:center;font-weight:700;color:white;font-size:16px">!</div>
    <span style="font-weight:600;color:#f9fafb;font-size:14px">SafetyPulse AI</span>
  </div>
  <div style="background:#111827;border:1px solid #1f2937;border-radius:14px;padding:28px">
    <p style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;margin:0 0 10px">Alerta de seguridad</p>
    <h1 style="font-size:22px;font-weight:700;color:#f9fafb;margin:0 0 6px">{label}</h1>
    <p style="color:#9ca3af;font-size:14px;margin:0 0 24px">Detectado en <strong style="color:{color}">{zone}</strong> con {conf:.0%} de confianza.</p>
    <div style="background:#1f2937;border-radius:10px;padding:16px;margin-bottom:20px">
      <div style="font-size:11px;color:#6b7280;margin-bottom:6px">Timestamp</div>
      <div style="font-size:14px;color:#f9fafb;font-family:monospace">{ts}</div>
    </div>
    <a href="#" style="display:block;background:{color};color:white;text-align:center;padding:13px;border-radius:9px;text-decoration:none;font-weight:500;font-size:14px">
      Ver en dashboard →
    </a>
  </div>
  <p style="text-align:center;color:#374151;font-size:11px;margin-top:20px">SafetyPulse AI · Industrial Safety Intelligence</p>
</div>
</div>
""",
    })
