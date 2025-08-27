from fastapi import FastAPI
from app.api import routes_email, routes_rag, routes_llm
from app.services.email_service import fetch_and_reply_emails

app = FastAPI(title="Email RAG Agent API")

# Routers
app.include_router(routes_email.router, prefix="/email", tags=["Email"])
app.include_router(routes_rag.router, prefix="/rag", tags=["RAG"])
app.include_router(routes_llm.router, prefix="/llm", tags=["LLM"])

@app.get("/")
def root():
    return {"message": "Welcome to the Email RAG Agent API"}

# ✅ CLI entrypoint
if __name__ == "__main__":
    # Run the Gmail fetch loop directly (without API)
    print("Running Email Agent in CLI mode...")
    result = fetch_and_reply_emails(max_results=5)
    print(result)
