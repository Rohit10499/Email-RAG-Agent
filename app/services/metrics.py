from typing import Dict


_COUNTERS: Dict[str, int] = {
    "runs_started": 0,
    "runs_sent": 0,
    "runs_escalated": 0,
    "validation_failures": 0,
    "rewrite_attempts": 0,
}


def _inc(key: str) -> None:
    _COUNTERS[key] = _COUNTERS.get(key, 0) + 1


def increment_runs_started() -> None:
    _inc("runs_started")


def increment_runs_sent() -> None:
    _inc("runs_sent")


def increment_runs_escalated() -> None:
    _inc("runs_escalated")


def increment_validation_failures() -> None:
    _inc("validation_failures")


def increment_rewrite_attempts() -> None:
    _inc("rewrite_attempts")


def snapshot() -> Dict[str, int]:
    return dict(_COUNTERS)


