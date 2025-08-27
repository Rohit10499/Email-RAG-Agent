# Email RAG Agent

Production-ready Gmail auto-reply agent that uses Retrieval-Augmented Generation (RAG) with FAISS + an LLM (Groq) to draft responses based on airline policy. Includes a modular agent graph, lightweight persistence and metrics, and a Gmail integration for fetching unread emails and sending replies.

## Features
- RAG over `data/airlines_policy.md` using FAISS (auto-builds if missing)
- LLM replies via Groq API
- Gmail ingest (unread INBOX) and auto-reply flow
- Basic input sanitation and safety checks
- Agent graph with persistence and metrics
- Configurable rewrite policy and PII handling

## Project layout
```
app/
  agent/
    agent_graph.py        # Orchestrates retrieve → draft → validate → rewrite → send/escalate
    agent_reply.py        # Simple RAG + LLM reply helper
    validation_utils.py   # Sanitize and validate incoming email bodies
  config/
    settings.py           # Settings + get_config()
  gmail/
    gmail_utils.py        # Read unread emails, draft, and send replies
  models/
    __init__.py           # AgentState alias
    llm_model.py          # Groq LLM wrapper
    embeddings.py         # FAISS helpers
  rag/
    rag_pipeline.py       # Build/retrieve context from FAISS index
  services/
    persistence.py        # JSON file persistence for run state
    metrics.py            # In-memory counters
data/
  airlines_policy.md      # Knowledge base (RAG source)
  embeddings/faiss_index/ # FAISS index (auto-created)
```

## Prerequisites
- Python 3.11+
- A Groq API key
- Google API credentials for Gmail (OAuth client)

## Installation
Using uv (preferred):
```bash
uv sync
```

Or with pip:
```bash
python -m venv .venv
. .venv/Scripts/activate  # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Configuration
Create a `.env` file in the repository root (or set env vars another way):
```bash
GROQ_API_KEY=your_groq_api_key
```

Agent behavior (optional, via env):
```bash
AGENT_MAX_REWRITES=2             # how many validation-driven rewrites
AGENT_PII_POLICY=redact_and_send # or: block_and_escalate
```

### Gmail setup
1) In Google Cloud Console, create OAuth 2.0 Client Credentials for a desktop app.
2) Download the JSON and save as `credentials.json` under `app/config/` or project root (where your Gmail auth expects it).
3) On first run, a browser window will prompt you to authorize; a `token.json` will be saved under `app/config/`.

Note: The project includes `app/config/token.json` in the repo snapshot; you should generate your own.

## Running
Process unread inbox emails and auto-reply using RAG + LLM:
```bash
python -m app.main
```

This will:
- Fetch unread messages from your Gmail INBOX
- Extract the email body
- Build/retrieve context from FAISS
- Draft a reply with the Groq LLM
- Send the reply and mark the email as read

Logs and run state:
- State snapshots: `runs/<run_id>.state.json`
- Agent explainability export helper: `export_explainability(state)` in `app/agent/agent_graph.py`

## RAG and model details
- FAISS index auto-builds from `data/airlines_policy.md` on first retrieval
- Chunking is simple paragraph-based (double-newline split)
- You can update the policy file and delete `data/embeddings/faiss_index` to rebuild

## Programmatic usage
Minimal RAG + LLM reply for a body string:
```python
from app.agent.agent_reply import draft_reply

email_body = "I was charged a change fee. What is your policy?"
reply = draft_reply(email_body)
print(reply)
```

Agent graph (advanced orchestrator):
```python
from app.agent.agent_graph import run_agent

state = {
  "run_id": "demo-1",
  "email_id": "message-id",
  "email_content": "Passenger requests refund for delayed flight."
}

# Provide callables for rag_retrieve, llm_call, validator, gmail_send, escalate_handler, pii_redactor
# See function signatures in app/agent/agent_graph.py
```

## Troubleshooting
- Import errors: ensure you import with `app.*` package paths.
- Missing FAISS index: first retrieval builds it automatically.
- Groq errors: verify `GROQ_API_KEY` and network connectivity.
- Gmail auth errors: confirm `credentials.json` location and re-run to refresh `token.json`.

## License
MIT


