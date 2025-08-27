from app.agent.agent_graph import run_agent


def test_run_agent_escalates_on_validation_fail(tmp_path, monkeypatch):
    def fake_rag_retrieve(query: str, top_k: int = 5):
        return [{"id": "doc1"}]

    def fake_llm_call(prompt: str) -> str:
        return "bad draft"

    def bad_validator(draft: str, docs):
        return {"is_valid": False, "reason": "pii"}

    def fake_gmail_send(email_id: str, body: str) -> str:
        raise AssertionError("should not send when invalid")

    tickets = []

    def fake_escalate_handler(state):
        tickets.append("t1")
        return "t1"

    def fake_pii_redactor(text: str) -> str:
        return text

    out = run_agent(
        initial_state={"email_id": "e1", "email_content": "x"},
        run_id="rid",
        rag_retrieve=fake_rag_retrieve,
        llm_call=fake_llm_call,
        validator=bad_validator,
        gmail_send=fake_gmail_send,
        escalate_handler=fake_escalate_handler,
        pii_redactor=fake_pii_redactor,
        prompt_template="{email}",
        rewrite_prompt_template="{draft}",
        max_rewrites=0,
    )

    assert out["status"] == "escalated"
    assert tickets == ["t1"]



