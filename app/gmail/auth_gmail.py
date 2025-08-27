import os
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# Scopes required for Gmail API
SCOPES = [
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.send'
]

BASE_DIR = os.path.dirname(os.path.dirname(__file__))  
CONFIG_DIR = os.path.join(BASE_DIR, "config")

def authenticate_gmail():
    """Authenticate user and return Gmail API service instance"""
    creds = None
    token_path = os.path.join(CONFIG_DIR, "token.json")
    credentials_path = os.path.join(CONFIG_DIR, "credentials.json")

    # Load existing token
    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)

    # If no valid creds, do OAuth
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(credentials_path, SCOPES)
            creds = flow.run_local_server(port=0)

        # Save the token for next runs
        with open(token_path, 'w') as token:
            token.write(creds.to_json())

    service = build('gmail', 'v1', credentials=creds)
    return service

if __name__ == "__main__":
    service = authenticate_gmail()
    print(" Gmail Authentication Successful")
