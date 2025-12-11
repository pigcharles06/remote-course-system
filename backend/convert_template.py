from pdf2docx import Converter

pdf_file = r"c:\Users\user\Desktop\ewant\映竹專案\國立陽明交通大學遠距教學課程教學計畫表 1141117.pdf"
docx_file = r"c:\Users\user\Desktop\ewant\映竹專案\remote_course_system\backend\template.docx"

try:
    cv = Converter(pdf_file)
    cv.convert(docx_file, start=0, end=None)
    cv.close()
    print(f"Successfully converted {pdf_file} to {docx_file}")
except Exception as e:
    print(f"Error converting PDF to DOCX: {e}")
