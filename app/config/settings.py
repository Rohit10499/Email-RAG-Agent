from dataclasses import dataclass
import os


@dataclass
class Settings:
    max_rewrites: int = 2
    pii_policy: str = "redact_and_send"  # or "block_and_escalate"


def get_config() -> Settings:
    # Read environment overrides if present, else default
    max_rewrites = int(os.getenv("AGENT_MAX_REWRITES", "2"))
    pii_policy = os.getenv("AGENT_PII_POLICY", "redact_and_send")
    return Settings(max_rewrites=max_rewrites, pii_policy=pii_policy)


