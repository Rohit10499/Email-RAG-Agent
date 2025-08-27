from app.gmail.auth_gmail import authenticate_gmail
svc = authenticate_gmail()
print(svc.users().getProfile(userId='me').execute()['emailAddress'])

res = svc.users().messages().list(userId='me', maxResults=10).execute()
print("messages:", len(res.get('messages', [])))

service = authenticate_gmail()
print("Bot address:", service.users().getProfile(userId='me').execute()['emailAddress'])
results = service.users().messages().list(userId='me', labelIds=['INBOX'], q="is:unread", maxResults=10).execute()
print("Unread in INBOX:", len(results.get('messages', [])))