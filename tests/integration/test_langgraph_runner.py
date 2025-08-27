import pytest


def test_langgraph_runner_if_available(monkeypatch):
    try:
        from app.agent.agent_graph import build_agent_graph, run_with_graph
    except ImportError:
        pytest.skip("langgraph not installed")

    # Fakes
    def fake_rag_retrieve(query: str, top_k: int = 5):
        return [{"id": "doc1"}]

    def fake_llm_call(prompt: str) -> str:
        return "ok"

    def good_validator(draft: str, docs):
        return {"is_valid": True, "reason": "ok"}

    def fake_gmail_send(email_id: str, body: str) -> str:
        return "m1"

    def fake_escalate_handler(state):
        return "t1"

    def fake_pii_redactor(text: str) -> str:
        return text

    graph = build_agent_graph(
        rag_retrieve=fake_rag_retrieve,
        llm_call=fake_llm_call,
        validator=good_validator,
        gmail_send=fake_gmail_send,
        escalate_handler=fake_escalate_handler,
        pii_redactor=fake_pii_redactor,
        prompt_template="{email}",
        rewrite_prompt_template="{draft}",
        max_rewrites=1,
    )

    final = run_with_graph(
        compiled_graph=graph,
        initial_state={"email_id": "e1", "email_content": "hello"},
        run_id="lg-1",
    )

    assert final["status"] in {"sent", "escalated"}
    assert "log" in final



