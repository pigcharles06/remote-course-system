"""
AI Assistant Module for Form Filling Help

This module provides an AI-powered assistant to help teachers fill out 
the remote course application form. It uses Gemini and reference PDFs.
"""

import os
import json
from typing import Dict, List, Any, Optional
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# PDF file paths
RESOURCES_DIR = os.path.join(os.path.dirname(__file__), "resources")
PDF_FILES = {
    "filling_guidelines": os.path.join(RESOURCES_DIR, "filling_guidelines.pdf"),
    "faq": os.path.join(RESOURCES_DIR, "faq.pdf"),
    "sample_form": os.path.join(RESOURCES_DIR, "sample_form.pdf"),
}

# Global variable to cache uploaded files
_uploaded_files = {}


def upload_reference_pdfs() -> Dict[str, Any]:
    """Upload PDF files to Google File API for reference."""
    global _uploaded_files
    
    if _uploaded_files:
        print("[AI Assistant] Using cached PDF files")
        return _uploaded_files
    
    print("[AI Assistant] Uploading reference PDFs...")
    
    for name, path in PDF_FILES.items():
        if os.path.exists(path):
            try:
                uploaded = genai.upload_file(path, display_name=name)
                _uploaded_files[name] = uploaded
                print(f"  Uploaded: {name}")
            except Exception as e:
                print(f"  Error uploading {name}: {e}")
        else:
            print(f"  File not found: {path}")
    
    return _uploaded_files


# System prompt for the AI assistant
SYSTEM_PROMPT = """你是一個專業的遠距教學課程申請表單填寫助手。

## 你的角色
- 協助老師填寫「遠距教學課程申請表單」
- 提供填寫建議、範例和注意事項
- 解答老師的問題

## 你的參考資料
你可以存取以下三份參考文件：
1. **填寫重點** (filling_guidelines.pdf) - 表單填寫的重要說明和注意事項
2. **常見問答** (faq.pdf) - 老師們常問的問題和解答
3. **完成範例** (sample_form.pdf) - 一份已填妥的範例表單

## 回答原則
1. **使用 Markdown 格式**回答，包括標題、粗體、列表等
2. 回答要簡潔明瞭，使用繁體中文
3. 適時引用參考文件的內容
4. 如果老師目前填寫的內容有問題，溫和地指出並給予建議
5. **當老師詢問某欄位如何填寫時，從 sample_form.pdf 中找出該欄位的完整範例內容**
6. 對於選擇題，說明各選項的意義

## 提供範例的格式
當老師詢問某欄位的範例時，請用以下格式：

```
📝 **[欄位名稱] 填寫範例：**

> [從完成範例中擷取的實際內容]

💡 **填寫提示：**
- [注意事項1]
- [注意事項2]
```

## 表單結構 (共6頁)
- 第1頁：基本資料（課程名稱、開課系所、學制等）
- 第2頁：教學方法（同步/非同步時數、教學目標）
- 第3頁：課程大綱（每週內容）
- 第4頁：教學設計（教學活動、E3功能、作業繳交）
- 第5頁：學生支援（成績評量、助教資訊）
- 第6頁：最終確認（著作權聲明）

## 互動方式
- 當老師進入新頁面時，主動說明該頁的填寫重點
- 查看老師目前填寫的內容，給予個人化建議
- 當發現問題時，溫和提醒並提供修改範例
- 如果老師傳送圖片，仔細分析圖片內容並給予相關協助
"""


def get_page_context(step: int) -> str:
    """Get context about the current page/step."""
    page_info = {
        1: """目前是第1頁：基本資料
重點欄位：開課學期、主開系所、課程學制、科目類別、課程名稱（中英文）、授課教師、學分數、課程平台等。
注意：請確保課程名稱中英文都有填寫，學制選擇正確。""",
        
        2: """目前是第2頁：教學方法
重點欄位：教學方式時數（非同步/同步/實體）、教學目標、教科書與參考資料。
注意：各教學方式的週數和時數要填寫完整，教學目標要具體明確。""",
        
        3: """目前是第3頁：課程大綱
重點欄位：每週的教學主題、教學活動、各種上課時數。
注意：18週都要填寫，包含期中期末考週。""",
        
        4: """目前是第4頁：教學設計
重點欄位：教學活動設計、E3平台功能使用、作業繳交方式、師生互動方式。
注意：至少選擇一項教學活動和E3功能，互動方式要具體說明。""",
        
        5: """目前是第5頁：學生支援
重點欄位：成績評量方式、助教資訊、Office Hour。
注意：成績百分比總和要等於100%。""",
        
        6: """目前是第6頁：最終確認
重點欄位：備註、紙本/電子繳交方式、著作權聲明。
注意：著作權聲明必須勾選才能提交。"""
    }
    return page_info.get(step, "")


def analyze_form_data(form_data: Dict, step: int) -> str:
    """Analyze current form data and provide context."""
    analysis = []
    
    if step == 1:
        if not form_data.get("course_name_zh"):
            analysis.append("課程中文名稱尚未填寫")
        if not form_data.get("course_name_en"):
            analysis.append("課程英文名稱尚未填寫")
        if not form_data.get("teacher_name"):
            analysis.append("授課教師尚未填寫")
        if not form_data.get("credits"):
            analysis.append("學分數尚未填寫")
            
    elif step == 2:
        if not form_data.get("teaching_objectives"):
            analysis.append("教學目標尚未填寫")
            
    elif step == 3:
        weeks = form_data.get("course_outline_weeks", [])
        if len(weeks) < 18:
            analysis.append(f"課程大綱只有 {len(weeks)} 週，建議填滿 18 週")
        empty_weeks = [w["week"] for w in weeks if not w.get("content")]
        if empty_weeks:
            analysis.append(f"第 {', '.join(map(str, empty_weeks[:3]))} 週內容尚未填寫")
            
    elif step == 5:
        grading = form_data.get("grading_criteria", [])
        if grading:
            total = sum(int(g.get("percentage", 0) or 0) for g in grading)
            if total != 100:
                analysis.append(f"成績評量百分比總和為 {total}%，應為 100%")
    
    if analysis:
        return "目前發現以下待填項目：\n- " + "\n- ".join(analysis)
    return "目前該頁填寫狀況良好！"


class AIAssistant:
    """AI Assistant for form filling help."""
    
    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name="gemini-2.0-flash-exp",  # Will be updated if gemini-3-pro-preview available
            generation_config={
                "temperature": 0.7,
                "max_output_tokens": 2048,
            },
            system_instruction=SYSTEM_PROMPT
        )
        self.chat_history = []
        self.pdf_files = None
    
    def initialize(self):
        """Initialize by uploading PDFs."""
        self.pdf_files = upload_reference_pdfs()
    
    def get_welcome_message(self, step: int, form_data: Dict) -> str:
        """Generate a welcome message when entering a page."""
        page_context = get_page_context(step)
        form_analysis = analyze_form_data(form_data, step)
        
        prompt = f"""老師剛進入表單的第 {step} 頁。

{page_context}

老師目前的填寫狀況：
{form_analysis}

請提供一段簡短的歡迎訊息和填寫提示（約100字以內）。"""
        
        return self._generate_response(prompt)
    
    def check_before_page_change(self, step: int, form_data: Dict) -> str:
        """Check form data before changing to next page."""
        form_analysis = analyze_form_data(form_data, step)
        
        prompt = f"""老師準備離開第 {step} 頁。

老師目前的填寫狀況：
{form_analysis}

如果有重要問題需要提醒，請簡短說明（約50字）。如果沒有問題，回覆「✓ 本頁填寫完整，可以繼續」。"""
        
        return self._generate_response(prompt)
    
    def chat(self, message: str, step: int, form_data: Dict, image_data: str = None) -> str:
        """Process a chat message from the user, optionally with an image."""
        page_context = get_page_context(step)
        form_analysis = analyze_form_data(form_data, step)
        
        if image_data:
            prompt = f"""老師傳送了一張圖片並問：{message if message else '請幫我看一下這張圖片'}

目前位置：第 {step} 頁
{page_context}

請仔細分析圖片內容，並根據表單填寫的角度給予協助。"""
        else:
            prompt = f"""老師的問題：{message}

目前位置：第 {step} 頁
{page_context}

目前填寫狀況：
{form_analysis}

表單資料摘要：
- 課程名稱：{form_data.get('course_name_zh', '未填')}
- 授課教師：{form_data.get('teacher_name', '未填')}
- 學分數：{form_data.get('credits', '未填')}

請根據參考文件回答老師的問題。如果老師問到某個欄位的範例，請從 sample_form.pdf 中找出完整的填寫範例。"""
        
        return self._generate_response(prompt, image_data)
    
    def _generate_response(self, prompt: str, image_data: str = None) -> str:
        """Generate a response using the AI model, optionally with an image."""
        import base64
        try:
            # Build content with PDFs for first message or important queries
            content = []
            
            # Add PDF files if available (first time only to save tokens)
            if self.pdf_files and len(self.chat_history) == 0:
                for pdf in self.pdf_files.values():
                    content.append(pdf)
            
            # Add image if provided
            if image_data:
                try:
                    # Parse base64 data URL
                    if "base64," in image_data:
                        image_data = image_data.split("base64,")[1]
                    
                    image_bytes = base64.b64decode(image_data)
                    content.append({
                        "mime_type": "image/jpeg",
                        "data": image_bytes
                    })
                except Exception as img_error:
                    print(f"[AI Assistant] Image processing error: {img_error}")
            
            content.append(prompt)
            
            # Generate response
            response = self.model.generate_content(content)
            
            if response.candidates and response.candidates[0].content.parts:
                result = response.text
                self.chat_history.append({"role": "user", "content": prompt})
                self.chat_history.append({"role": "assistant", "content": result})
                return result
            else:
                return "抱歉，我目前無法回應。請稍後再試。"
                
        except Exception as e:
            print(f"[AI Assistant] Error: {e}")
            return f"抱歉，發生錯誤：{str(e)}"


# Global assistant instance
_assistant = None


def get_assistant() -> AIAssistant:
    """Get or create the global assistant instance."""
    global _assistant
    if _assistant is None:
        _assistant = AIAssistant()
        _assistant.initialize()
    return _assistant
