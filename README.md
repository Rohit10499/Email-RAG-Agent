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
tests/
  unit/                   # Fast, isolated tests
  integration/            # Cross-module or IO-simulating tests
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
Create a `.env` file in the repository root (or set env vars another way). See `.env.example` for a complete template:
```bash
GROQ_API_KEY=your_groq_api_key
LLM_MODEL=llama-3.1-8b-instant
AGENT_MAX_REWRITES=2
AGENT_PII_POLICY=redact_and_send
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

### LangGraph runner (optional)
```python
from app.agent.agent_graph import build_agent_graph, run_with_graph

graph = build_agent_graph(
    rag_retrieve=..., llm_call=..., validator=...,
    gmail_send=..., escalate_handler=..., pii_redactor=...,
    prompt_template="docs={docs} email={email}",
    rewrite_prompt_template="reason={reason} draft={draft}",
)
final_state = run_with_graph(graph, {"email_id": "e1", "email_content": "hello"}, run_id="demo")
```

## Troubleshooting
- Import errors: ensure you import with `app.*` package paths.
- Missing FAISS index: first retrieval builds it automatically.
- Groq errors: verify `GROQ_API_KEY` and network connectivity.
- Gmail auth errors: confirm `credentials.json` location and re-run to refresh `token.json`.

## Team alignment and branching guidance

- Test consolidation: tests are now under `tests/unit` and `tests/integration`. Remove any old top-level test files in your feature branches to avoid conflicts.
- Added LangGraph support in `app/agent/agent_graph.py`. If your branch changed this file, rebase and resolve by keeping both `run_agent` and the new `build_agent_graph`/`run_with_graph` APIs.
- New dependency: `langgraph`. If using pip, ensure requirements are up to date: `pip install -r requirements.txt`.
- Package manager differences:
  - If using uv: `uv sync` uses `pyproject.toml` and `uv.lock`.
  - If using pip: ignore `uv.lock` and rely on `requirements.txt`. We keep both files consistent.
- Recommended update sequence for feature branches:
  1) `git fetch origin && git checkout <your-branch> && git rebase origin/main`
  2) Delete or move any tests that still live at `tests/` root into `tests/unit` or `tests/integration`.
  3) Ensure your virtualenv has new deps: `pip install -r requirements.txt` (pip) or `uv sync` (uv).
  4) Run `pytest -q` and fix any local conflicts.

## Repository housekeeping

- Single README policy: folder-level READMEs were merged into root. `tests/README.md` test-running notes are condensed here. If you add docs inside subfolders, consider linking them here instead.

## License
MIT


