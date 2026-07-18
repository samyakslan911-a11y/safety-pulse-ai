from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.analyze import router as analyze_router
from backend.api.detections import router as detections_router

app = FastAPI(title="SafetyPulse AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)
app.include_router(detections_router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "SafetyPulse AI"}
