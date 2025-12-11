"""
Google Drive Upload Service
Uploads generated Word documents to a shared Google Drive folder.
"""
import os
import io
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload

# Configuration
SCOPES = ['https://www.googleapis.com/auth/drive']
SERVICE_ACCOUNT_FILE = os.path.join(os.path.dirname(__file__), 'google_service_account.json')

# Target folder ID - extracted from the shared folder URL
# URL: https://drive.google.com/drive/folders/1vTwM-_EH-nwLuvnLAQr5ilW4MrmPkAQa
FOLDER_ID = '1vTwM-_EH-nwLuvnLAQr5ilW4MrmPkAQa'


def get_drive_service():
    """Create and return a Google Drive service instance."""
    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        raise FileNotFoundError(
            f"Service account file not found: {SERVICE_ACCOUNT_FILE}\n"
            "Please create a Google Cloud service account and download the JSON key."
        )
    
    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES
    )
    return build('drive', 'v3', credentials=credentials)


def upload_to_drive(file_bytes: bytes, filename: str, folder_id: str = FOLDER_ID) -> dict:
    """
    Upload a file to Google Drive and return the file info with shareable link.
    
    Args:
        file_bytes: The file content as bytes
        filename: The name of the file (e.g., "課程名稱_教學計畫表.docx")
        folder_id: The ID of the target folder in Google Drive
        
    Returns:
        dict with 'id', 'name', 'webViewLink', 'webContentLink'
    """
    service = get_drive_service()
    
    # File metadata
    file_metadata = {
        'name': filename,
        'parents': [folder_id]
    }
    
    # Create media upload
    media = MediaIoBaseUpload(
        io.BytesIO(file_bytes),
        mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        resumable=True
    )
    
    # Upload the file
    print(f"[DRIVE] Uploading {filename} to Google Drive...")
    file = service.files().create(
        body=file_metadata,
        media_body=media,
        fields='id, name, webViewLink, webContentLink'
    ).execute()
    
    # Make the file accessible to anyone with the link
    print(f"[DRIVE] Setting file permissions...")
    service.permissions().create(
        fileId=file['id'],
        body={
            'type': 'anyone',
            'role': 'reader'
        }
    ).execute()
    
    print(f"[DRIVE] Upload complete: {file.get('webViewLink')}")
    
    return {
        'id': file.get('id'),
        'name': file.get('name'),
        'webViewLink': file.get('webViewLink'),  # View in browser
        'webContentLink': file.get('webContentLink')  # Direct download
    }


def test_connection():
    """Test the Google Drive connection."""
    try:
        service = get_drive_service()
        # Try to get folder info
        folder = service.files().get(
            fileId=FOLDER_ID,
            fields='id, name'
        ).execute()
        print(f"[DRIVE] Connection successful! Folder: {folder.get('name')}")
        return True
    except Exception as e:
        print(f"[DRIVE] Connection failed: {type(e).__name__}: {e}")
        return False


if __name__ == "__main__":
    # Test the connection
    test_connection()
