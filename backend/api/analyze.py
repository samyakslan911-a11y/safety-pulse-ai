"""
POST /analyze/image   — upload single image, get detections + annotated image
POST /analyze/frame   — send base64 frame (webcam), get detections + annotated frame
"""
import base64
from datetime import datetime, timezone

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, Depends

from backend.auth.dependencies import get_current_user
from backend.vision.detector import detector
from backend.db import violations as db
from backend.services.email import send_violation_alert

router = APIRouter(prefix="/analyze", tags=["analyze"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _persist_and_alert(user_id: str, detections, camera_zone: str, annotated_b64: str):
    saved = []
    for det in detections:
        row = db.create_violation(user_id, {
            "violation_type":    det.violation_type,
            "label":             det.label,
            "confidence":        det.confidence,
            "bbox":              det.bbox,
            "camera_zone":       camera_zone,
            "detected_at":       datetime.now(timezone.utc).isoformat(),
            "annotated_image":   annotated_b64,
            "acknowledged":      False,
        })
        send_violation_alert.__wrapped__ = None  # email is fire-and-forget
        try:
            from supabase import create_client
            from backend.config import settings
            client = create_client(settings.supabase_url, settings.supabase_key)
            resp = client.auth.admin.get_user_by_id(user_id)
            send_violation_alert(resp.user.email, row)
        except Exception:
            pass
        saved.append(row)
    return saved


@router.post("/image")
async def analyze_image(
    file: UploadFile = File(...),
    camera_zone: str = Form("Zona principal"),
    user_id: str = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Solo se aceptan imágenes JPEG, PNG o WebP")

    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(400, "Imagen demasiado grande (máx 10 MB)")

    detections, annotated_b64 = detector.analyze_image_bytes(image_bytes)
    saved = _persist_and_alert(user_id, detections, camera_zone, annotated_b64)

    return {
        "violations_found": len(detections),
        "detections": [
            {
                "violation_type": d.violation_type,
                "label": d.label,
                "confidence": d.confidence,
                "bbox": d.bbox,
            }
            for d in detections
        ],
        "annotated_image": annotated_b64,
        "saved": saved,
    }


@router.post("/frame")
async def analyze_frame(
    payload: dict,
    user_id: str = Depends(get_current_user),
):
    """Receives {image_b64: '...', camera_zone: '...'} from webcam."""
    b64 = payload.get("image_b64", "")
    camera_zone = payload.get("camera_zone", "Webcam")

    if not b64:
        raise HTTPException(400, "image_b64 requerido")

    try:
        if "," in b64:
            b64 = b64.split(",", 1)[1]
        image_bytes = base64.b64decode(b64)
    except Exception:
        raise HTTPException(400, "Base64 inválido")

    detections, annotated_b64 = detector.analyze_image_bytes(image_bytes)

    if detections:
        _persist_and_alert(user_id, detections, camera_zone, annotated_b64)

    return {
        "violations_found": len(detections),
        "detections": [
            {
                "violation_type": d.violation_type,
                "label": d.label,
                "confidence": d.confidence,
                "bbox": d.bbox,
            }
            for d in detections
        ],
        "annotated_image": annotated_b64,
    }
