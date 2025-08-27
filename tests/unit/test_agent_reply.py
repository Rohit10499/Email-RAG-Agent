def test_draft_reply_wires_prompt(monkeypatch):
    from app.agent import agent_reply as mod

    # Fake retrieve_context to return known context
    monkeypatch.setattr(mod, 'retrieve_context', lambda q: 'CTX')

    captured = {}

    def fake_generate_response(prompt):
        captured['prompt'] = prompt
        return 'REPLY'

    monkeypatch.setattr(mod, 'generate_response', fake_generate_response)

    out = mod.draft_reply('EMAIL BODY')
    assert out == 'REPLY'
    assert 'EMAIL BODY' in captured['prompt']
    assert 'CTX' in captured['prompt']



