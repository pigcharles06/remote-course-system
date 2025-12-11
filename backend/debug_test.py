"""Debug test for word generation."""
import traceback

try:
    import word_generator
    
    form_data = {
        "course_name_zh": "Test",
        "semester": "下學期"
    }
    
    print("Starting generation...")
    doc = word_generator.generate_document(form_data)
    print(f"Success: {len(doc)} bytes")
    
    with open("debug_output.docx", "wb") as f:
        f.write(doc)
    print("Saved to debug_output.docx")
    
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
    traceback.print_exc()
