"""Test script with file-based error logging."""
import traceback
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

log_file = open("error_log.txt", "w", encoding="utf-8")

try:
    from word_generator import generate_document, extract_placeholders, upload_reference_files, TEMPLATE_PATH
    
    log_file.write("Testing placeholder extraction...\n")
    placeholders = extract_placeholders(TEMPLATE_PATH)
    log_file.write(f"Found {len(placeholders)} placeholders\n")
    
    log_file.write("\nTesting file upload...\n")
    pdf_file = upload_reference_files()
    log_file.write(f"PDF: {pdf_file}\n")
    
    log_file.write("\nTesting full generation...\n")
    doc_bytes = generate_document({"course_name_zh": "Test Course"})
    log_file.write(f"Generated {len(doc_bytes)} bytes\n")

except Exception as e:
    log_file.write(f"\n{'='*50}\n")
    log_file.write(f"ERROR: {type(e).__name__}\n")
    log_file.write(f"{'='*50}\n")
    log_file.write(str(e) + "\n")
    log_file.write(f"{'='*50}\n")
    traceback.print_exc(file=log_file)

log_file.close()
print("Done. Check error_log.txt")
