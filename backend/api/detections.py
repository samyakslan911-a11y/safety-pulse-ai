from fastapi import APIRouter, Depends
from backend.auth.dependencies import get_current_user
from backend.db import violations as db

router = APIRouter(prefix="/violations", tags=["violations"])


@router.get("/")
def list_violations(limit: int = 50, user_id: str = Depends(get_current_user)):
    return db.list_violations(user_id, limit)


@router.get("/stats")
def get_stats(user_id: str = Depends(get_current_user)):
    return db.stats(user_id)


@router.post("/{violation_id}/acknowledge")
def acknowledge(violation_id: str, user_id: str = Depends(get_current_user)):
    return db.acknowledge(violation_id, user_id)
