"""
PPE Detector — YOLOv8 + Supervision.
Uses Roboflow construction-site-safety model when ROBOFLOW_API_KEY is set.
Falls back to yolov8n (COCO person detection only) otherwise.
"""
import io
import base64
from pathlib import Path
from typing import NamedTuple

import cv2
import numpy as np
from PIL import Image
import supervision as sv

from backend.config import settings

# Roboflow model detects these classes — map to our violation types
PPE_CLASS_MAP = {
    "NO-Hardhat":      "no_hardhat",
    "NO-Safety Vest":  "no_vest",
    "NO-Mask":         "no_mask",
    "Hardhat":         None,   # compliant — not a violation
    "Safety Vest":     None,
    "Mask":            None,
    "Person":          None,
    "person":          None,
}

VIOLATION_LABELS = {
    "no_hardhat": "Sin casco de seguridad",
    "no_vest":    "Sin chaleco reflectante",
    "no_mask":    "Sin mascarilla",
}

VIOLATION_COLORS = {
    "no_hardhat": sv.Color.from_hex("#EF4444"),
    "no_vest":    sv.Color.from_hex("#F59E0B"),
    "no_mask":    sv.Color.from_hex("#8B5CF6"),
}


class Detection(NamedTuple):
    violation_type: str
    confidence: float
    bbox: list[int]      # [x1, y1, x2, y2]
    label: str


class PPEDetector:
    def __init__(self):
        self._model = None
        self._use_roboflow = bool(settings.roboflow_api_key)

    def _load(self):
        if self._model is not None:
            return
        from ultralytics import YOLO
        if self._use_roboflow:
            # Download Roboflow PPE model via ultralytics hub
            self._model = YOLO(f"https://hub.ultralytics.com/models/construction-site-safety")
        else:
            self._model = YOLO("yolov8n.pt")

    def _run_roboflow(self, frame_bgr: np.ndarray) -> list[Detection]:
        result = self._model.infer(frame_bgr)[0]
        detections = []
        for pred in result.predictions:
            vtype = PPE_CLASS_MAP.get(pred.class_name)
            if vtype is None:
                continue
            x1 = int(pred.x - pred.width / 2)
            y1 = int(pred.y - pred.height / 2)
            x2 = int(pred.x + pred.width / 2)
            y2 = int(pred.y + pred.height / 2)
            detections.append(Detection(
                violation_type=vtype,
                confidence=round(pred.confidence, 3),
                bbox=[x1, y1, x2, y2],
                label=VIOLATION_LABELS[vtype],
            ))
        return detections

    def _run_yolo(self, frame_bgr: np.ndarray) -> list[Detection]:
        results = self._model(frame_bgr, verbose=False)[0]
        detections = []
        for box in results.boxes:
            cls_name = results.names[int(box.cls)]
            if cls_name != "person":
                continue
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            detections.append(Detection(
                violation_type="no_hardhat",
                confidence=round(float(box.conf), 3),
                bbox=[x1, y1, x2, y2],
                label="Persona detectada (PPE no verificable sin API key)",
            ))
        return detections

    def analyze_frame(self, frame_bgr: np.ndarray) -> tuple[list[Detection], np.ndarray]:
        """Returns detections + annotated frame (BGR)."""
        self._load()

        detections = (
            self._run_roboflow(frame_bgr)
            if self._use_roboflow
            else self._run_yolo(frame_bgr)
        )

        annotated = self._annotate(frame_bgr.copy(), detections)
        return detections, annotated

    def _annotate(self, frame: np.ndarray, detections: list[Detection]) -> np.ndarray:
        for det in detections:
            color = VIOLATION_COLORS.get(det.violation_type, sv.Color.RED)
            bgr = (color.b, color.g, color.r)
            x1, y1, x2, y2 = det.bbox
            cv2.rectangle(frame, (x1, y1), (x2, y2), bgr, 2)
            label = f"{det.label} {det.confidence:.0%}"
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            cv2.rectangle(frame, (x1, y1 - th - 6), (x1 + tw + 4, y1), bgr, -1)
            cv2.putText(frame, label, (x1 + 2, y1 - 4),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
        return frame

    def analyze_image_bytes(self, image_bytes: bytes) -> tuple[list[Detection], str]:
        """Returns detections + base64-encoded annotated PNG."""
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        detections, annotated = self.analyze_frame(frame)
        _, buf = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 85])
        b64 = base64.b64encode(buf.tobytes()).decode()
        return detections, f"data:image/jpeg;base64,{b64}"


detector = PPEDetector()
