from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Body
from pydantic import BaseModel
from pathlib import Path
import json

from app.services.metrics import snapshot as metrics_snapshot
from app.services.email_service import send_manual_email


router = APIRouter()


# Paths
PROJECT_ROOT = Path(__file__).resolve().parents[2]
LOG_FILE = PROJECT_ROOT / "app" / "logs" / "actions.log"
SETTINGS_FILE = PROJECT_ROOT / "data" / "ui_settings.json"


class SettingsModel(BaseModel):
    llm_model: Optional[str] = None
    db_path: Optional[str] = None
    additional: Dict[str, Any] = {}


def _read_log_tail(max_lines: int = 200) -> List[str]:
    if not LOG_FILE.exists():
        return []
    try:
        with LOG_FILE.open("r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
        return [line.rstrip("\n") for line in lines[-max_lines:]]
    except Exception:
        return []


def _load_settings() -> Dict[str, Any]:
    if SETTINGS_FILE.exists():
        try:
            return json.loads(SETTINGS_FILE.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}


def _save_settings(data: Dict[str, Any]) -> None:
    SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    SETTINGS_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")


@router.get("/status")
def get_status() -> Dict[str, Any]:
    metrics = metrics_snapshot()
    return {
        "status": "ok",
        "metrics": metrics,
    }


@router.get("/logs")
def get_logs(limit: int = 200) -> Dict[str, Any]:
    return {"logs": _read_log_tail(limit)}


@router.get("/analytics")
def get_analytics() -> Dict[str, Any]:
    metrics = metrics_snapshot()
    return {
        "processed": metrics.get("runs_sent", 0),
        "escalated": metrics.get("runs_escalated", 0),
        "validation_failures": metrics.get("validation_failures", 0),
        "rewrite_attempts": metrics.get("rewrite_attempts", 0),
    }


@router.get("/settings")
def get_settings() -> Dict[str, Any]:
    return _load_settings()


@router.post("/settings")
def update_settings(settings: SettingsModel) -> Dict[str, Any]:
    current = _load_settings()
    new_settings = {**current, **settings.model_dump(exclude_none=True)}
    _save_settings(new_settings)
    return new_settings


@router.post("/resolve-escalation/{item_id}")
def resolve_escalation(item_id: str) -> Dict[str, Any]:
    # Stub: mark escalation as resolved
    return {"id": item_id, "resolved": True}


class ReplyBody(BaseModel):
    to: Optional[str] = None
    subject: Optional[str] = None
    body: str


@router.post("/send-reply/{item_id}")
def send_reply(item_id: str, payload: ReplyBody) -> Dict[str, Any]:
    # If address is provided, send; otherwise, simulate
    if payload.to and payload.subject:
        try:
            send_manual_email(payload.to, payload.subject, payload.body)
            return {"id": item_id, "sent": True}
        except Exception as e:
            return {"id": item_id, "sent": False, "error": str(e)}
    return {"id": item_id, "sent": False, "message": "No recipient/subject provided; simulated only"}


@router.post("/edit-reply/{item_id}")
def edit_reply(item_id: str, payload: ReplyBody = Body(...)) -> Dict[str, Any]:
    # Stub: echo back edited content
    return {"id": item_id, "edited_body": payload.body}


