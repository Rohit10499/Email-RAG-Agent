from app.gmail.auth_gmail import authenticate_gmail
from app.agent.agent_reply import draft_reply   
from email.mime.text import MIMEText
import base64

# --------- Helper: Extract email body ----------
def get_message_body(msg_data):
    """Extract the plain text body from Gmail API message data"""
    body = ""
    if "parts" in msg_data["payload"]:  # multipart emails
        for part in msg_data["payload"]["parts"]:
            if part["mimeType"] == "text/plain":
                body = base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8")
                break
            elif part["mimeType"] == "text/html":
                body = base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8")
                break
    else:  # single-part
        body = base64.urlsafe_b64decode(msg_data["payload"]["body"]["data"]).decode("utf-8")
    return body.strip()


# --------- Send Email ----------
def send_email(to, subject, message_text):
    service = authenticate_gmail()
    message = MIMEText(message_text)
    message['to'] = to
    message['subject'] = subject

    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    body = {'raw': raw}

    sent_message = service.users().messages().send(userId='me', body=body).execute()
    return f" Email sent to {to}, Message Id: {sent_message['id']}"


# --------- Fetch Emails & Auto-Reply ----------
def process_unread_emails(max_results=5):
    service = authenticate_gmail()
    results = service.users().messages().list(
        userId='me',
        labelIds=['INBOX'],
        q="is:unread",
        maxResults=max_results
    ).execute()

    messages = results.get('messages', [])
    if not messages:
        return "📭 No unread emails."

    for msg in messages:
        msg_data = service.users().messages().get(userId='me', id=msg['id']).execute()
        headers = msg_data['payload']['headers']

        sender, subject = None, None
        for header in headers:
            if header['name'] == 'Subject':
                subject = header['value']
            if header['name'] == 'From':
                sender = header['value']

        body = get_message_body(msg_data)

        print("\n New Email Found")
        print("From:", sender)
        print("Subject:", subject)
        print("Body Preview:", body[:200])

        # ---- RAG + LLM auto reply (replaces rules, flow unchanged) ----
        try:
            reply_text = draft_reply(body)  
        except Exception as e:
            print(f"LLM failed, using fallback. Error: {e}")
            reply_text = "Dear Customer,\n\nThank you for your query. Our support team will get back to you shortly.\n\nRegards,\nEmail RAG Agent"

        # ---- Send Reply ----
        response = send_email(sender, f"Re: {subject}", reply_text)
        print(response)

        # ---- Mark email as read ----
        try:
            service.users().messages().modify(
                userId='me',
                id=msg['id'],
                body={'removeLabelIds': ['UNREAD']}
            ).execute()
        except Exception as e:
            print(f" Could not mark as read: {e}")

    return " Processed all unread emails."
