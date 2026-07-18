from supabase import create_client
from backend.config import settings

def _client():
    return create_client(settings.supabase_url, settings.supabase_key)

def list_violations(user_id: str, limit: int = 50) -> list[dict]:
    r = (
        _client()
        .table("violations")
        .select("*")
        .eq("user_id", user_id)
        .order("detected_at", desc=True)
        .limit(limit)
        .execute()
    )
    return r.data

def create_violation(user_id: str, data: dict) -> dict:
    r = _client().table("violations").insert({"user_id": user_id, **data}).execute()
    return r.data[0]

def acknowledge(violation_id: str, user_id: str) -> dict:
    r = (
        _client()
        .table("violations")
        .update({"acknowledged": True})
        .eq("id", violation_id)
        .eq("user_id", user_id)
        .execute()
    )
    return r.data[0]

def stats(user_id: str) -> dict:
    r = _client().table("violations").select("violation_type, acknowledged").eq("user_id", user_id).execute()
    rows = r.data
    total = len(rows)
    unacked = sum(1 for v in rows if not v["acknowledged"])
    by_type: dict[str, int] = {}
    for v in rows:
        by_type[v["violation_type"]] = by_type.get(v["violation_type"], 0) + 1
    return {"total": total, "unacknowledged": unacked, "by_type": by_type}
