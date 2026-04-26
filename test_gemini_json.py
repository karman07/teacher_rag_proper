import asyncio
import google.generativeai as genai
import json
from config import get_settings

cfg = get_settings()
genai.configure(api_key=cfg.gemini_api_key)
model = genai.GenerativeModel("gemini-2.5-flash")

prompt = """
Return STRICT JSON only with this schema:
{
    "answer": "string",
    "citations": [
        { "source": 1, "quote": "string" }
    ]
}
"""

response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
print(response.text)
try:
    json.loads(response.text)
    print("Valid JSON!")
except Exception as e:
    print("Invalid JSON:", e)
