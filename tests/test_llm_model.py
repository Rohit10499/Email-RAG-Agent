import os
import types
import builtins


def test_llm_generate_response_env_default(monkeypatch):
    # Avoid real network: monkeypatch Groq client
    from app.models import llm_model as m

    class FakeChoices:
        def __init__(self, content):
            self.message = types.SimpleNamespace(content=content)

    class FakeResponse:
        def __init__(self, content):
            self.choices = [FakeChoices(content)]

    class FakeChat:
        class completions:
            @staticmethod
            def create(model, messages, temperature, max_tokens):
                return FakeResponse("ok")

    class FakeGroq:
        def __init__(self, api_key: str):
            self.chat = FakeChat()

    monkeypatch.setenv("GROQ_API_KEY", "x")
    monkeypatch.setenv("LLM_MODEL", "llama-3.1-8b-instant")
    monkeypatch.setattr(m, "Groq", FakeGroq)

    out = m.generate_response("hello")
    assert out == "ok"


