import json
import os


def test_get_config_reads_env(monkeypatch):
    from app.config import get_config

    monkeypatch.setenv("AGENT_MAX_REWRITES", "5")
    monkeypatch.setenv("AGENT_PII_POLICY", "block_and_escalate")

    cfg = get_config()
    assert cfg.max_rewrites == 5
    assert cfg.pii_policy == "block_and_escalate"


def test_persistence_roundtrip(tmp_path, monkeypatch):
    from app.services import persistence

    monkeypatch.chdir(tmp_path)
    state = {"a": 1}
    path = persistence.save_state("rid", state)
    assert os.path.exists(path)
    loaded = persistence.load_state("rid")
    assert loaded == state


def test_metrics_counters():
    from app.services import metrics

    before = metrics.snapshot()
    metrics.increment_runs_started()
    metrics.increment_runs_sent()
    metrics.increment_runs_escalated()
    metrics.increment_validation_failures()
    metrics.increment_rewrite_attempts()
    after = metrics.snapshot()
    for k in [
        "runs_started",
        "runs_sent",
        "runs_escalated",
        "validation_failures",
        "rewrite_attempts",
    ]:
        assert after[k] == before.get(k, 0) + 1


