"""Agent graph runner (LangGraph-compatible API)
Simple self-contained runner showing control flow for
retrieve -> draft -> validate -> (send|escalate|rewrite loop)

This module provides two ways to run the agent:
- run_agent: a simple imperative flow used by tests
- build_agent_graph/run_with_graph: a LangGraph-style graph API
"""

import time, json, os
from typing import Callable, Dict, Any, List, Optional

try:
    # Soft dependency: only used if user opts into LangGraph
    from langgraph.graph import StateGraph, END
    _HAS_LANGGRAPH = True
except Exception:  # pragma: no cover - tests don’t require langgraph
    StateGraph = None  # type: ignore
    END = "__END__"  # type: ignore
    _HAS_LANGGRAPH = False

from app.models import AgentState
from app.services import persistence, metrics
from app.config import get_config


def _now() -> float:
    return time.time()


def _log(state: AgentState, step: str, details: Dict[str, Any]):
    """Append a structured log entry to the agent state."""
    entry = {"Step": step, "timestamp": _now(), "details": details}
    state.setdefault("log", []).append(entry)


def retrieve_context(
    state: AgentState,
    rag_retrieve: Callable[[str, int], List[Dict[str, Any]]],
    top_k: int = 5,
) -> AgentState:
    """Call RAG retriever and attach docs to state."""
    docs = rag_retrieve(state.get("email_content"), top_k=top_k)
    state["retrieved_docs"] = docs
    _log(state, "retrieve_context", {"doc_ids": [d.get("id") for d in docs]})
    return state


def draft_reply(
    state: AgentState,
    llm_call: Callable[[str], str],
    prompt_template: str,
) -> AgentState:
    """Draft a reply using retrieved docs and LLM prompt template"""
    prompt = prompt_template.format(
        docs=[d["id"] for d in state.get("retrieved_docs", [])],
        email=state["email_content"],
    )
    draft = llm_call(prompt)
    state["draft_reply"] = draft
    _log(state, "draft_reply", {"prompt_snippet": prompt[:200]})
    return state


def validate_reply(
    state: AgentState,
    validator: Callable[[str, List[Dict[str, Any]]], Dict[str, Any]],
) -> AgentState:
    """Run validator (factuality, PII, style)."""
    result = validator(state.get("draft_reply", ""), state.get("retrieved_docs", []))
    state["validation_result"] = result
    _log(state, "validate_reply", {"result": result})
    return state


def rewrite_reply(
    state: AgentState,
    llm_call: Callable[[str], str],
    rewrite_prompt_template: str,
) -> AgentState:
    """Ask LLM to rewrite based on validation feedback."""
    state["rewrite_count"] = state.get("rewrite_count", 0) + 1
    reason = state.get("validation_result", {}).get("reason", "unspecified")
    prompt = rewrite_prompt_template.format(
        reason=reason, draft=state.get("draft_reply", "")
    )
    new = llm_call(prompt)
    state["draft_reply"] = new
    _log(
        state,
        "rewrite_reply",
        {"rewrite_count": state["rewrite_count"], "prompt_snippet": prompt[:200]},
    )

    metrics.increment_rewrite_attempts()
    return state


def send_email(
    state: AgentState,
    gmail_send: Callable[[str, str], str],
    pii_redactor: Callable[[str], str],
) -> AgentState:
    """Send final reply via Gmail client after PII redaction."""
    body = pii_redactor(state.get("draft_reply", ""))
    msg_id = gmail_send(state["email_id"], body)
    state["final_reply"] = body
    state["status"] = "sent"
    _log(state, "send_email", {"msg_id": msg_id})

    metrics.increment_runs_sent()
    return state


def escalate(
    state: AgentState, escalate_handler: Callable[[AgentState], str]
) -> AgentState:
    """Escalate to human / support queue."""
    ticket = escalate_handler(state)
    state["status"] = "escalated"
    _log(state, "escalate", {"ticket": ticket})

    metrics.increment_runs_escalated()
    return state


def run_agent(
    initial_state: AgentState,
    run_id: str,
    rag_retrieve: Callable,
    llm_call: Callable,
    validator: Callable,
    gmail_send: Callable,
    escalate_handler: Callable,
    pii_redactor: Callable,
    prompt_template: str,
    rewrite_prompt_template: str,
    max_rewrites: Optional[int] = None,
) -> AgentState:
    """
    Execute full agent flow with retries and persistence.
    Reads max_rewrites and pii_policy from config if not passed explicitly.
    """
    cfg = get_config()
    max_rewrites = max_rewrites or cfg.max_rewrites
    pii_policy = cfg.pii_policy

    state = dict(initial_state)
    state["run_id"] = run_id
    state["rewrite_count"] = state.get("rewrite_count", 0)
    state["status"] = "pending"
    _log(state, "run_started", {"run_id": run_id})
    persistence.save_state(run_id, state)

    metrics.increment_runs_started()
    # 1. Retrieve
    state = retrieve_context(state, rag_retrieve)
    persistence.save_state(run_id, state)

    # 2. Draft
    state = draft_reply(state, llm_call, prompt_template)
    persistence.save_state(run_id, state)

    # 3. Validate + rewrite loop
    attempts = 0
    while True:
        state = validate_reply(state, validator)
        persistence.save_state(run_id, state)

        if state["validation_result"].get("is_valid"):
            if pii_policy == "redact_and_send":
                state = send_email(state, gmail_send, pii_redactor)
            elif pii_policy == "block_and_escalate":
                state = escalate(state, escalate_handler)
            else:
                raise ValueError(f"Unknown pii_policy: {pii_policy}")

            persistence.save_state(run_id, state)
            return state
        else:
            metrics.increment_validation_failures()

        attempts += 1
        if attempts >= max_rewrites:
            state = escalate(state, escalate_handler)
            persistence.save_state(run_id, state)
            return state

        state = rewrite_reply(state, llm_call, rewrite_prompt_template)
        persistence.save_state(run_id, state)


# === Explainability Export Helper === #


def export_explainability(state: AgentState, out_dir: str = "runs") -> str:
    """Export run state with logs to JSON file for auditing."""
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, f"{state['run_id']}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)
    return path


# === Optional: LangGraph builder === #


def build_agent_graph(
    rag_retrieve: Callable[[str, int], List[Dict[str, Any]]],
    llm_call: Callable[[str], str],
    validator: Callable[[str, List[Dict[str, Any]]], Dict[str, Any]],
    gmail_send: Callable[[str, str], str],
    escalate_handler: Callable[[Dict[str, Any]], str],
    pii_redactor: Callable[[str], str],
    prompt_template: str,
    rewrite_prompt_template: str,
    *,
    max_rewrites: Optional[int] = None,
):
    """Build a LangGraph StateGraph that mirrors run_agent control-flow.

    Returns a compiled graph if langgraph is installed; otherwise raises ImportError.
    """
    if not _HAS_LANGGRAPH:
        raise ImportError("langgraph is not installed. Add 'langgraph' to dependencies.")

    cfg = get_config()
    max_rewrites = max_rewrites or cfg.max_rewrites
    pii_policy = cfg.pii_policy

    def node_retrieve(state: AgentState) -> AgentState:
        return retrieve_context(state, rag_retrieve)

    def node_draft(state: AgentState) -> AgentState:
        return draft_reply(state, llm_call, prompt_template)

    def node_validate(state: AgentState) -> AgentState:
        return validate_reply(state, validator)

    def node_rewrite(state: AgentState) -> AgentState:
        return rewrite_reply(state, llm_call, rewrite_prompt_template)

    def node_send(state: AgentState) -> AgentState:
        return send_email(state, gmail_send, pii_redactor)

    def node_escalate(state: AgentState) -> AgentState:
        return escalate(state, escalate_handler)

    def should_finish(state: AgentState) -> str:
        """Router after validate: send/escalate or rewrite.

        - if valid -> policy branch to send or escalate
        - else if reached max rewrites -> escalate
        - else -> rewrite
        """
        result = state.get("validation_result", {})
        if result.get("is_valid"):
            return "policy"

        attempts = state.get("rewrite_count", 0)
        if attempts >= max_rewrites:
            return "escalate"
        return "rewrite"

    def follow_policy(state: AgentState) -> str:
        if pii_policy == "redact_and_send":
            return "send"
        if pii_policy == "block_and_escalate":
            return "escalate"
        raise ValueError(f"Unknown pii_policy: {pii_policy}")

    graph = StateGraph(dict)  # using plain dict state
    graph.add_node("retrieve", node_retrieve)
    graph.add_node("draft", node_draft)
    graph.add_node("validate", node_validate)
    graph.add_node("rewrite", node_rewrite)
    graph.add_node("send", node_send)
    graph.add_node("escalate", node_escalate)

    graph.set_entry_point("retrieve")
    graph.add_edge("retrieve", "draft")
    graph.add_edge("draft", "validate")

    # Router after validate
    graph.add_conditional_edges(
        "validate",
        should_finish,
        {
            "policy": "policy_router",
            "rewrite": "rewrite",
            "escalate": "escalate",
        },
    )

    # A lightweight policy router node implemented via conditional edges
    graph.add_conditional_edges(
        "policy_router",
        follow_policy,
        {"send": "send", "escalate": "escalate"},
    )

    # After rewrite, go back to validate
    graph.add_edge("rewrite", "validate")

    # Terminal nodes
    graph.add_edge("send", END)
    graph.add_edge("escalate", END)

    return graph.compile()


def run_with_graph(
    compiled_graph,
    initial_state: AgentState,
    run_id: str,
):
    """Run the compiled LangGraph with persistence/metrics similar to run_agent.

    This helper ensures we stamp run metadata and persist state transitions.
    """
    state = dict(initial_state)
    state["run_id"] = run_id
    state["status"] = state.get("status", "pending")
    _log(state, "run_started", {"run_id": run_id})
    persistence.save_state(run_id, state)

    for step in compiled_graph.stream(state):  # yields intermediate states
        # step is a dict-like state; persist incrementally
        persistence.save_state(run_id, step)
        state = step

    # Final state is last yielded
    persistence.save_state(run_id, state)
    return state
