import types


def test_send_email_builds_message(monkeypatch):
    from app.gmail import gmail_utils as g

    class FakeService:
        class users:
            class messages:
                @staticmethod
                def send(userId, body):
                    assert userId == 'me'
                    assert 'raw' in body
                    return types.SimpleNamespace(execute=lambda: {"id": "m1"})

            @staticmethod
            def messages():
                return FakeService.users.messages

        @staticmethod
        def users():
            return FakeService.users

    monkeypatch.setattr(g, 'authenticate_gmail', lambda: FakeService())
    out = g.send_email("to@example.com", "Subject", "hello")
    assert "Email sent to" in out


