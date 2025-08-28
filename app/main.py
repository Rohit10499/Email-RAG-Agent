import sqlite3
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime
from pathlib import Path
from collections import Counter

# Assuming these imports exist in your project structure
# from app.api import routes_email, routes_rag, routes_llm, routes_app
# from app.services.email_service import fetch_and_reply_emails

# --- FastAPI App Initialisation ---
app = FastAPI(title="Email RAG Agent API")

# --- CORS Middleware (Crucial for Frontend Communication) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database Configuration ---
DB_PATH = "data/sqlite.db3"

def get_db_connection():
    """Establishes and returns a SQLite database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # This allows dictionary-like access to rows
    return conn

def init_db():
    """Initialises the database tables if they do not already exist."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Create email_logs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS email_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_sender TEXT,
            subject TEXT,
            email_content TEXT,
            draft_reply TEXT,
            final_reply TEXT,
            validation_is_valid BOOLEAN,
            validation_reason TEXT,
            timestamp TEXT
        )
    """)

    # Create app_settings table for persistent settings
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    """)

    # Seed default settings if not present
    default_settings = {
        "llm_provider": "OpenAI GPT-4o",
        "vector_db": "ChromaDB",
        "polling_interval": "60", # Stored as text, converted to int in UI
        "notifications": "True",  # Boolean as text
        "auto_reply": "False"     # Boolean as text
    }
    for key, val in default_settings.items():
        cursor.execute("INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)", (key, val))

    conn.commit()
    conn.close()

# Ensure DB is initialised when the app starts
init_db()

# --- Pydantic Models for Request/Response Validation ---

class ValidationResult(BaseModel):
    is_valid: bool
    reason: str = ""

class EmailLogResponse(BaseModel):
    id: int
    original_sender: str
    subject: str
    email_content: str
    draft_reply: str
    final_reply: str
    validation_result: ValidationResult
    timestamp: str

class SettingsModel(BaseModel):
    llm_provider: str
    vector_db: str
    polling_interval: int
    notifications: bool
    auto_reply: bool

class EditReplyRequest(BaseModel):
    new_reply: str

# --- Routers (if you have them in separate files, include them here) ---
# app.include_router(routes_email.router, prefix="/email", tags=["Email"])
# app.include_router(routes_rag.router, prefix="/rag", tags=["RAG"])
# app.include_router(routes_llm.router, prefix="/llm", tags=["LLM"])
# app.include_router(routes_app.router, tags=["App"])

# --- API Endpoints with Persistent Logic ---

@app.get("/status", response_model=Dict, tags=["Frontend"])
def get_status():
    """Returns the current status of the agent, fetching counts from the database."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM email_logs")
    processed_count = cursor.fetchone()

    cursor.execute("SELECT COUNT(*) FROM email_logs WHERE validation_is_valid = 0")
    escalated_count = cursor.fetchone() # Considered pending if escalated for human review

    conn.close()
    return {
        "state": "Running",  # Could be dynamic, e.g., "Processing" if agent is active
        "processed": processed_count,
        "pending": escalated_count # Assuming pending means escalated for human review
    }

@app.get("/logs", response_model=List[EmailLogResponse], tags=["Frontend"])
def get_logs(
    query: Optional[str] = Query(None, description="Keyword to search in email content or subject"),
    sender: Optional[str] = Query(None, description="Filter by sender email"),
    start_date: Optional[str] = Query(None, description="Filter logs from this date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter logs up to this date (YYYY-MM-DD)"),
    limit: int = Query(20, ge=1, description="Maximum number of logs to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination")
):
    """Retrieves processed email logs with filtering and pagination from the database."""
    conn = get_db_connection()
    cursor = conn.cursor()

    sql_query = "SELECT * FROM email_logs WHERE 1=1"
    params = []

    if query:
        sql_query += " AND (email_content LIKE ? OR subject LIKE ?)"
        params.extend([f"%{query}%", f"%{query}%"])
    if sender:
        sql_query += " AND original_sender LIKE ?"
        params.append(f"%{sender}%")
    if start_date:
        sql_query += " AND substr(timestamp, 1, 10) >= ?"
        params.append(start_date)
    if end_date:
        sql_query += " AND substr(timestamp, 1, 10) <= ?"
        params.append(end_date)

    sql_query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    cursor.execute(sql_query, params)
    rows = cursor.fetchall()
    conn.close()

    logs = []
    for row in rows:
        logs.append(EmailLogResponse(
            id=row["id"],
            original_sender=row["original_sender"],
            subject=row["subject"],
            email_content=row["email_content"],
            draft_reply=row["draft_reply"],
            final_reply=row["final_reply"],
            validation_result=ValidationResult(
                is_valid=bool(row["validation_is_valid"]),
                reason=row["validation_reason"]
            ),
            timestamp=row["timestamp"]
        ).dict())
    return logs

@app.get("/history", response_model=List[EmailLogResponse], tags=["Frontend"])
def get_history(
    query: Optional[str] = Query(None, description="Keyword to search in email content or subject"),
    sender: Optional[str] = Query(None, description="Filter by sender email"),
    start_date: Optional[str] = Query(None, description="Filter logs from this date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter logs up to this date (YYYY-MM-DD)"),
    limit: int = Query(50, ge=1, description="Maximum number of history records to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination")
):
    """Retrieves a larger set of email history records with filtering and pagination."""
    # Reuses the logic from get_logs, just with a different default limit
    return get_logs(query, sender, start_date, end_date, limit, offset)

@app.get("/escalations", response_model=List[EmailLogResponse], tags=["Frontend"])
def get_escalations():
    """Retrieves only escalated emails from the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM email_logs WHERE validation_is_valid = 0 ORDER BY timestamp DESC")
    rows = cursor.fetchall()
    conn.close()

    escalations = []
    for row in rows:
        escalations.append(EmailLogResponse(
            id=row["id"],
            original_sender=row["original_sender"],
            subject=row["subject"],
            email_content=row["email_content"],
            draft_reply=row["draft_reply"],
            final_reply=row["final_reply"],
            validation_result=ValidationResult(
                is_valid=bool(row["validation_is_valid"]),
                reason=row["validation_reason"]
            ),
            timestamp=row["timestamp"]
        ).dict())
    return escalations

@app.get("/analytics", response_model=Dict, tags=["Frontend"])
def get_analytics():
    """Calculates and returns analytics data based on processed emails from the database."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM email_logs")
    total_emails = cursor.fetchone()

    cursor.execute("SELECT COUNT(*) FROM email_logs WHERE validation_is_valid = 1")
    answered_emails = cursor.fetchone()

    escalated_emails = total_emails - answered_emails

    # Processed per day
    processed_per_day = {}
    cursor.execute("SELECT substr(timestamp, 1, 10) as date, COUNT(*) as count FROM email_logs GROUP BY date ORDER BY date")
    daily_counts = cursor.fetchall()
    for row in daily_counts:
        processed_per_day[row["date"]] = row["count"]

    conn.close()
    return {
        "total": total_emails,
        "answered": answered_emails,
        "escalated": escalated_emails,
        "processed_per_day": processed_per_day
    }

@app.get("/settings", response_model=SettingsModel, tags=["Frontend"])
def get_settings():
    """Retrieves application settings from the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT key, value FROM app_settings")
    settings_rows = cursor.fetchall()
    conn.close()

    settings_dict = {row["key"]: row["value"] for row in settings_rows}

    # Convert stored string values to appropriate types for Pydantic model
    return SettingsModel(
        llm_provider=settings_dict.get("llm_provider", "OpenAI GPT-4o"),
        vector_db=settings_dict.get("vector_db", "ChromaDB"),
        polling_interval=int(settings_dict.get("polling_interval", "60")),
        notifications=settings_dict.get("notifications", "True").lower() == "true",
        auto_reply=settings_dict.get("auto_reply", "False").lower() == "true"
    )

@app.post("/settings", response_model=Dict, tags=["Frontend"])
def update_settings(new_settings: SettingsModel):
    """Updates application settings in the database."""
    conn = get_db_connection()
    cursor = conn.cursor()

    settings_data = new_settings.dict()
    for key, val in settings_data.items():
        # Convert bool to string for storage
        stored_value = str(val) if isinstance(val, bool) else str(val)
        cursor.execute("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)", (key, stored_value))

    conn.commit()
    conn.close()
    return {"status": "success", "settings": new_settings.dict()}

@app.post("/resolve-escalation/{log_id}", response_model=Dict, tags=["Frontend"])
def resolve_escalation(log_id: int):
    """Marks an escalated email as resolved in the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE email_logs SET validation_is_valid = 1, validation_reason = 'Manually resolved' WHERE id = ?",
        (log_id,)
    )
    conn.commit()
    conn.close()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log not found")
    return {"message": f"Escalation {log_id} resolved successfully"}

@app.post("/edit-reply/{log_id}", response_model=Dict, tags=["Frontend"])
def edit_reply(log_id: int, request_body: EditReplyRequest):
    """Updates the final reply of an email log in the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE email_logs SET final_reply = ? WHERE id = ?",
        (request_body.new_reply, log_id)
    )
    conn.commit()
    conn.close()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log not found")
    return {"message": f"Reply for log {log_id} updated", "new_reply": request_body.new_reply}

@app.post("/send-reply/{log_id}", response_model=Dict, tags=["Frontend"])
def send_reply(log_id: int):
    """Placeholder for sending the final reply via email, updates log status in DB."""
    conn = get_db_connection()
    cursor = conn.cursor()
    # In a real scenario, this would trigger Gmail API send and then update DB
    cursor.execute(
        "UPDATE email_logs SET validation_is_valid = 1, validation_reason = 'Reply sent manually' WHERE id = ?",
        (log_id,)
    )
    conn.commit()
    conn.close()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log not found")
    return {"message": f"Reply for log {log_id} sent (simulated)"}

@app.get("/sidebar", tags=["Frontend"])
def get_sidebar_links():
    """Returns static links for sidebar navigation. Could be dynamic in the future."""
    return {
        "links": [
            {"name": "Dashboard", "path": "/"}, # React Router uses / for dashboard
            {"name": "Logs", "path": "/logs"},
            {"name": "History", "path": "/history"},
            {"name": "Escalations", "path": "/escalations"},
            {"name": "Analytics", "path": "/analytics"},
            {"name": "Settings", "path": "/settings"},
        ]
    }

# --- Frontend Static Hosting (after build) ---
PROJECT_ROOT = Path(__file__).resolve().parents[1] # Adjust if main.py is deeper
FRONTEND_DIST_DIR = PROJECT_ROOT / "Frontend" / "dist"

if FRONTEND_DIST_DIR.exists():
    app.mount("/ui", StaticFiles(directory=str(FRONTEND_DIST_DIR), html=True), name="frontend")

    @app.get("/", include_in_schema=False)
    def root():
        """Serves the main index.html for the React frontend."""
        return FileResponse(str(FRONTEND_DIST_DIR / "index.html"))

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa_fallback(full_path: str):
        """Serves index.html for all client-side routes, unless it's an API route."""
        # If request targets API prefixes, let FastAPI handle normally
        if full_path.startswith(("email", "rag", "llm", "docs", "redoc", "openapi.json", "status", "logs", "analytics", "settings", "resolve-escalation", "edit-reply", "send-reply", "sidebar")):
            # If it matches an API endpoint, let FastAPI's other routes handle it,
            # or return 404 if no specific API route matches.
            # This is a fallback to prevent SPA routing from catching API calls
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API Endpoint Not Found")

        # Otherwise serve the SPA index for client-side routing
        index_file = FRONTEND_DIST_DIR / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
else:
    @app.get("/", tags=["App"])
    def root_no_frontend():
        return {"message": "Welcome to the Email RAG Agent API - Frontend not built or found."}


# --- CLI entrypoint (example usage, assuming email_service exists) ---
if __name__ == "__main__":
    # Example of how you might use fetch_and_reply_emails if imported
    # print("Running Email Agent in CLI mode...")
    # result = fetch_and_reply_emails(max_results=5)
    # print(result)
    print("\nTo run the FastAPI backend, use: uvicorn main:app --reload --port 8000")
    print("Ensure your 'data/sqlite.db3' is created and populated with 'email_logs' and 'app_settings' tables.")
    print("If you get a 'ModuleNotFoundError' for 'app.api' or 'app.services', comment out the corresponding imports and lines.")