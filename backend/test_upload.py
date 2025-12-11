"""Test complete upload flow"""
from drive_upload import upload_to_drive
from word_generator import generate_document
from database import SessionLocal
from models import Application

# Get test application
db = SessionLocal()
app = db.query(Application).first()
form_data = app.form_data if app.form_data else {}

print('Generating document...')
doc_bytes = generate_document(form_data)
print(f'Generated {len(doc_bytes)} bytes')

filename = 'test_upload.docx'
print(f'Uploading {filename} to Google Drive...')
result = upload_to_drive(doc_bytes, filename)

print('\n=== UPLOAD SUCCESS ===')
print(f'Filename: {result["name"]}')
print(f'Drive Link: {result["webViewLink"]}')
