"""Test API endpoint directly."""
import requests
import sys
sys.path.append(".")
from security import create_access_token
from database import SessionLocal
from models import Application
import time

# Get actual application ID
db = SessionLocal()
app = db.query(Application).first()
if not app:
    print("No applications found!")
    exit(1)

app_id = app.id
print(f"Testing with application: {app.course_name_zh} (ID: {app_id})")

# Create token for test user
token = create_access_token({"sub": "test@example.com"})
print(f"Token: {token[:50]}...")

# Try to download
url = f"http://localhost:8000/api/applications/{app_id}/download"
headers = {"Authorization": f"Bearer {token}"}

print(f"Making request to {url}")
start = time.time()

try:
    # 5 minute timeout
    resp = requests.get(url, headers=headers, timeout=300)
    elapsed = time.time() - start
    print(f"Status: {resp.status_code}")
    print(f"Time: {elapsed:.1f}s")
    
    if resp.status_code == 200:
        with open("api_download.docx", "wb") as f:
            f.write(resp.content)
        print(f"Saved to api_download.docx ({len(resp.content)} bytes)")
    else:
        print(f"Error response: {resp.text[:500]}")
except Exception as e:
    elapsed = time.time() - start
    print(f"Error after {elapsed:.1f}s: {type(e).__name__}: {e}")
