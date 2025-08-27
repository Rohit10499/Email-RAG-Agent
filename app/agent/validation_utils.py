import re, unicodedata
from typing import Dict, List

__all__ = [
    "strip_html",
    "sanitize_email_body",
    "contains_prompt_injection",
    "contains_spam_signals",
    "ensure_minimum_content",
    "clamp_length",
    "prepare_input_for_llm",
]


def strip_html(text: str) -> str:
    """Remove basic HTML tags and collapse entities.

    This is a lightweight sanitizer meant for email bodies; it's not a full HTML parser
    but handles common patterns well enough for LLM input.
    """
    if not text:
        return ""
    # Remove script/style blocks
    no_blocks = re.sub(r"<(script|style)[\s\S]*?</\1>", " ", text, flags=re.IGNORECASE)
    # Remove all tags
    no_tags = re.sub(r"<[^>]+>", " ", no_blocks)
    # Replace HTML entities for basic whitespace variants
    unescaped = (
        no_tags.replace("&nbsp;", " ")
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
    )
    return unescaped


def _normalize_whitespace(text: str) -> str:
    # Normalize unicode, collapse all whitespace runs, strip edges
    normalized = unicodedata.normalize("NFKC", text)
    collapsed = re.sub(r"\s+", " ", normalized)
    return collapsed.strip()


def sanitize_email_body(text: str, *, strip_html_tags: bool = True) -> str:
    """Clean and normalize an email body for downstream processing.

    - Optionally strip HTML tags
    - Normalize unicode
    - Collapse whitespace
    - Remove control characters (except common whitespace)
    """
    if not text:
        return ""
    cleaned = strip_html(text) if strip_html_tags else text
    # Remove control characters except tab/newline/carriage-return
    cleaned = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", " ", cleaned)
    return _normalize_whitespace(cleaned)


def contains_prompt_injection(text: str) -> bool:
    """Heuristic detection of prompt-injection style instructions in the email body."""
    if not text:
        return False
    lowered = text.lower()
    red_flags = [
        "ignore previous instructions",
        "disregard previous",
        "system prompt",
        "act as the system",
        "you are chatgpt",
        "override the rules",
        "forget prior",
        "developer instructions",
    ]
    return any(flag in lowered for flag in red_flags)


def contains_spam_signals(text: str) -> bool:
    """Very lightweight spam-like heuristic; intended to gate auto-replies."""
    if not text:
        return False
    lowered = text.lower()
    patterns = [
        r"free\s+money",
        r"work\s+from\s+home\s+and\s+earn",
        r"click\s+here",
        r"winner|winning\s+prize",
        r"urgent\s+response\s+needed",
    ]
    return any(re.search(p, lowered) for p in patterns)


def ensure_minimum_content(text: str, *, min_words: int = 3, min_chars: int = 20) -> bool:
    """Check the email has enough substance to generate a meaningful reply."""
    if not text:
        return False
    if len(text.strip()) < min_chars:
        return False
    if len([w for w in text.split() if w.strip()]) < min_words:
        return False
    return True


def clamp_length(text: str, *, max_chars: int = 6000) -> str:
    """Hard-cap the text length for model input."""
    if not text:
        return ""
    if len(text) <= max_chars:
        return text
    return text[: max_chars - 1] + "…"


def prepare_input_for_llm(email_body: str, *, max_chars: int = 6000) -> Dict[str, object]:
    """Produce a sanitized body and basic risk flags for safe LLM prompting.

    Returns a dict with:
    - sanitized_body: str
    - flags: Dict[str, bool] with keys {"prompt_injection", "spam_like", "too_short"}
    - warnings: List[str] human-readable notes (may be empty)
    """
    sanitized = sanitize_email_body(email_body)
    sanitized = clamp_length(sanitized, max_chars=max_chars)

    flags = {
        "prompt_injection": contains_prompt_injection(sanitized),
        "spam_like": contains_spam_signals(sanitized),
        "too_short": not ensure_minimum_content(sanitized),
    }

    warnings: List[str] = []
    if flags["prompt_injection"]:
        warnings.append("Potential prompt-injection language detected in email body.")
    if flags["spam_like"]:
        warnings.append("Email resembles spam; consider manual review before replying.")
    if flags["too_short"]:
        warnings.append("Email content may be too short for a meaningful reply.")

    return {
        "sanitized_body": sanitized,
        "flags": flags,
        "warnings": warnings,
    }

