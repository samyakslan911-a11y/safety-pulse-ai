from pydantic import BaseModel
from datetime import datetime

class ViolationOut(BaseModel):
    id: str
    violation_type: str
    label: str
    confidence: float
    camera_zone: str
    detected_at: datetime
    annotated_image_url: str | None
    acknowledged: bool
    user_id: str
