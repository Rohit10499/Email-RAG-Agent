from fastapi import APIRouter
from app.services.email_service import fetch_and_reply_emails, send_manual_email

router = APIRouter()

@router.post("/fetch")
def fetch_and_reply(max_results: int = 5):
    """Fetch unread emails and auto-reply using RAG"""
    result = fetch_and_reply_emails(max_results)
    return {"status": "success", "details": result}

@router.post("/send")
def send_custom_email(to: str, subject: str, body: str):
    """Send a manual email"""
    response = send_manual_email(to, subject, body)
    return {"status": "sent", "details": response}
