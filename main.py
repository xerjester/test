from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
import os
import json
from dotenv import load_dotenv
from openai import OpenAI

# โหลด API Key
load_dotenv()

# ตั้งค่า Client โดยใช้โครงสร้างของ OpenAI แต่ชี้ไปที่ OpenRouter
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Mock Data -----------------
departments = ["IT", "HR", "Sales", "Marketing", "Finance", "Support"]
first_names = ["สมชาย", "สมหญิง", "มานพ", "วิชัย", "วิภา", "ธนา", "ธิดา", "ประเสริฐ", "ปราณี", "กฤษดา", 
               "กัญญา", "ณัฐพงศ์", "ณัฐริกา", "พงศกร", "พรพรรณ", "ศิริชัย", "ศิริพร", "เอกชัย", "เอกลักษณ์", "สุดา"]

employees = []
for i in range(20):
    employees.append({
        "emp_id": f"EMP{i+1:03d}",
        "name": first_names[i],
        "department": random.choice(departments),
        "days_present": random.randint(18, 22),
        "days_late": random.randint(0, 5),
        "days_absent": random.randint(0, 3),
        "days_leave": random.randint(0, 4)
    })

@app.get("/api/employees")
def get_employees():
    return employees

# ----------------- Function Calling Logic -----------------
def get_employee_stats(name: str = None, department: str = None) -> list:
    result = employees
    if name:
        result = [emp for emp in result if name in emp["name"]]
    if department:
        result = [emp for emp in result if emp["department"].lower() == department.lower()]
    return result

# กำหนดหน้าตาของ Tools ให้ OpenRouter รู้จัก (JSON Schema)
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_employee_stats",
            "description": "ค้นหาและดึงข้อมูลการเข้างาน (วันมาทำงาน, สาย, ขาด, ลา) ของพนักงาน",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "ชื่อของพนักงาน (ถ้าผู้ใช้ระบุ)"},
                    "department": {"type": "string", "description": "แผนกของพนักงาน เช่น IT, HR, Sales (ถ้าผู้ใช้ระบุ)"}
                }
            }
        }
    }
]

# System Prompt
system_prompt = """
คุณคือ HR Assistant ของบริษัท หน้าที่หลักของคุณคือตอบคำถามที่เกี่ยวข้องกับ 'ข้อมูลพนักงาน' เท่านั้น
กฎเหล็ก:
1. หากผู้ใช้ถามเรื่องอื่นที่ไม่ใช่พนักงาน ให้ปฏิเสธอย่างสุภาพ
2. ห้ามเดาข้อมูลพนักงานเอง ต้องใช้ข้อมูลจากฟังก์ชันที่เตรียมไว้ให้เท่านั้น
3. ในการตอบคำถาม ให้จัดรูปแบบข้อความให้อ่านง่าย โดยใช้การขึ้นบรรทัดใหม่ (Enter) และใช้เครื่องหมายขีด (-) นำหน้าหัวข้อเสมอ
4. ห้ามใช้สัญลักษณ์ Markdown เช่น ** หรือ __ ในการเน้นคำเด็ดขาด ให้พิมพ์เป็นข้อความธรรมดา
"""

# เก็บประวัติการคุย
chat_history = [
    {"role": "system", "content": system_prompt}
]

class ChatRequest(BaseModel):
    message: str

@app.post("/api/chat")
def chat_with_bot(request: ChatRequest):
    try:
        # 1. เอาคำถามใหม่ต่อท้ายประวัติแชท
        chat_history.append({"role": "user", "content": request.message})

        # 2. ส่งไปถาม OpenRouter
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b", 
            messages=chat_history,
            tools=tools,
            tool_choice="auto"
        )
        
        response_message = response.choices[0].message
        
        # 3. เช็กว่า AI ต้องการใช้ Tool (Function Calling) หรือไม่?
        if response_message.tool_calls:
            # เพิ่มสิ่งที่ AI ตอบกลับมาลงในประวัติ
            chat_history.append(response_message)
            
            for tool_call in response_message.tool_calls:
                if tool_call.function.name == "get_employee_stats":
                    # ถอดรหัส Parameters ที่ AI สกัดมาได้
                    arguments = json.loads(tool_call.function.arguments)
                    
                    # รันฟังก์ชัน Python ดึงข้อมูล
                    function_result = get_employee_stats(
                        name=arguments.get("name"),
                        department=arguments.get("department")
                    )
                    
                    # 4. ส่งผลลัพธ์จากฟังก์ชัน กลับไปให้ AI แต่งประโยคสรุป
                    chat_history.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "name": tool_call.function.name,
                        "content": json.dumps(function_result, ensure_ascii=False)
                    })
                    
            # เรียก AI อีกครั้งเพื่อให้มันสรุปข้อมูลจาก Tool เป็นภาษาคน
            final_response = client.chat.completions.create(
                model="openai/gpt-oss-120b",
                messages=chat_history
            )
            
            final_reply = final_response.choices[0].message.content
            chat_history.append({"role": "assistant", "content": final_reply})
            return {"reply": final_reply}
            
        else:
            # กรณีที่ AI ตอบได้เลยโดยไม่ต้องใช้ Tool (เช่น ตอบทักทาย หรือปฏิเสธคำถาม)
            chat_history.append({"role": "assistant", "content": response_message.content})
            return {"reply": response_message.content}

    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg:
            return {"reply": "⏳ ระบบกำลังประมวลผลคำถามจำนวนมาก รบกวนรอสักครู่แล้วลองใหม่นะครับ"}
        print(f"Error: {error_msg}")
        return {"reply": f"❌ ขออภัยครับ เกิดข้อผิดพลาดในการเชื่อมต่อ API ({error_msg})"}