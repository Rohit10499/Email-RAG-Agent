from app.gmail.gmail_utils import process_unread_emails, send_email

def fetch_and_reply_emails(max_results: int = 5):
    """Reusable service for fetching unread emails and replying"""
    return process_unread_emails(max_results=max_results)

def send_manual_email(to: str, subject: str, body: str):
    """Reusable service for sending manual emails"""
    return send_email(to, subject, body)
