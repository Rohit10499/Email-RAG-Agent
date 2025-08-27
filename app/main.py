from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse
from pathlib import Path
from app.api import routes_email, routes_rag, routes_llm
from app.api import routes_app
from app.services.email_service import fetch_and_reply_emails

app = FastAPI(title="Email RAG Agent API")

# CORS for local Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(routes_email.router, prefix="/email", tags=["Email"])
app.include_router(routes_rag.router, prefix="/rag", tags=["RAG"])
app.include_router(routes_llm.router, prefix="/llm", tags=["LLM"])
app.include_router(routes_app.router, tags=["App"])

# Frontend static hosting (after build)
PROJECT_ROOT = Path(__file__).resolve().parents[2]
FRONTEND_DIST_DIR = PROJECT_ROOT / "Frontend" / "dist"

if FRONTEND_DIST_DIR.exists():
    # Serve built frontend at /ui
    app.mount("/ui", StaticFiles(directory=str(FRONTEND_DIST_DIR), html=True), name="frontend")

    @app.get("/")
    def root():
        # Redirect root to the SPA's index.html content
        index_file = FRONTEND_DIST_DIR / "index.html"
        return FileResponse(str(index_file))

    @app.get("/{full_path:path}")
    def spa_fallback(full_path: str):
        # If request targets API prefixes, let FastAPI handle normally
        if full_path.startswith(("email/", "rag/", "llm/", "docs", "redoc", "openapi.json")):
            from fastapi import HTTPException
            raise HTTPException(status_code=404)
        # Otherwise serve the SPA index for client-side routing
        index_file = FRONTEND_DIST_DIR / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        from fastapi import HTTPException
        raise HTTPException(status_code=404)
else:
    @app.get("/")
    def root():
        return {"message": "Welcome to the Email RAG Agent API"}

# ✅ CLI entrypoint
if __name__ == "__main__":
    # Run the Gmail fetch loop directly (without API)
    print("Running Email Agent in CLI mode...")
    result = fetch_and_reply_emails(max_results=5)
    print(result)
