from fastapi import APIRouter
from app.models.llm_model import generate_response

router = APIRouter()

@router.post("/reply")
def generate_reply(email_body: str):
    """Generate LLM reply for email"""
    prompt = f"You are an airline assistant. Reply to: {email_body}"
    reply = generate_response(prompt)
    return {"email_body": email_body, "reply": reply}
