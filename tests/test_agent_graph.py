from app.agent.agent_graph import run_agent


def test_run_agent_happy_path(tmp_path, monkeypatch):
    # Fakes
    def fake_rag_retrieve(query: str, top_k: int = 5):
        return [{"id": "doc1", "text": "policy A"}]

    def fake_llm_call(prompt: str) -> str:
        return "Draft reply"

    def fake_validator(draft: str, docs):
        return {"is_valid": True, "reason": "ok"}

    sent = {}

    def fake_gmail_send(email_id: str, body: str) -> str:
        sent["email_id"] = email_id
        sent["body"] = body
        return "msg-1"

    def fake_escalate_handler(state):
        return "ticket-1"

    def fake_pii_redactor(text: str) -> str:
        return text

    # Run
    state = {
        "email_id": "abc",
        "email_content": "Please explain baggage policy"
    }

    out = run_agent(
        initial_state=state,
        run_id="test-1",
        rag_retrieve=fake_rag_retrieve,
        llm_call=fake_llm_call,
        validator=fake_validator,
        gmail_send=fake_gmail_send,
        escalate_handler=fake_escalate_handler,
        pii_redactor=fake_pii_redactor,
        prompt_template="docs={docs} email={email}",
        rewrite_prompt_template="reason={reason} draft={draft}",
        max_rewrites=1,
    )

    assert out["status"] == "sent"
    assert out["final_reply"] == "Draft reply"
    assert sent["email_id"] == "abc"


