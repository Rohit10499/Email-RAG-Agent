import json
import os
from typing import Any, Dict


RUNS_DIR = os.path.join("runs")


def _ensure_dir():
    os.makedirs(RUNS_DIR, exist_ok=True)


def _path(run_id: str) -> str:
    return os.path.join(RUNS_DIR, f"{run_id}.state.json")


def save_state(run_id: str, state: Dict[str, Any]) -> str:
    _ensure_dir()
    path = _path(run_id)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)
    return path


def load_state(run_id: str) -> Dict[str, Any]:
    path = _path(run_id)
    if not os.path.exists(path):
        raise FileNotFoundError(f"No state found for run_id={run_id}")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


