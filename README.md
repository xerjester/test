Employee KPI Dashboard & HR Chatbot
ระบบ Dashboard สำหรับแสดงผลสถิติการเข้างานของพนักงาน (KPI) พร้อมระบบ HR Chatbot อัจฉริยะที่สามารถตอบคำถามเกี่ยวกับข้อมูลพนักงานได้แบบ Real-time โดยดึงข้อมูลจากระบบแทนการเดาสุ่ม

ข้อกำหนดเบื้องต้น (Prerequisites)
Node.js (v18+)
Python (v3.8+)

ฝั่ง Backend (Python + FastAPI)

เปิด Terminal และเข้าไปที่โฟลเดอร์ Backend
ติดตั้งแพ็กเกจที่จำเป็น : pip install fastapi uvicorn pydantic python-dotenv openai
สร้างไฟล์ .env ไว้ในโฟลเดอร์เดียวกับ main.py และใส่ API Key ของ OpenRouter : OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
รันเซิร์ฟเวอร์ Backend : python -m uvicorn main:app --reload (เซิร์ฟเวอร์จะรันที่: http://127.0.0.1:8000)

ฝั่ง Frontend (Next.js)
เปิด Terminal หน้าต่างใหม่ และเข้าไปที่โฟลเดอร์ Frontend
ติดตั้งแพ็กเกจ (หากยังไม่ได้ติดตั้ง) : npm install recharts lucide-react
รันเซิร์ฟเวอร์ Frontend : npm run dev (เข้าใช้งานเว็บไซต์ได้ที่: http://localhost:3000)

ระบบใช้สถาปัตยกรรมแบบ Client-Server โดยแยกส่วนการแสดงผลและการประมวลผลข้อมูลออกจากกันอย่างชัดเจน
Frontend (Client-side) : พัฒนาด้วย Next.js (React) ร่วมกับ Tailwind CSS สำหรับจัดหน้า UI และใช้ Recharts สำหรับวาดกราฟ Visualization แบบ Interactive (Filter, Sort, Limit)
Backend (Server-side) : พัฒนาด้วย Python (FastAPI) ทำหน้าที่เป็น RESTful API จัดการ Mock Data ของพนักงาน และเป็นตัวกลาง (Middleware) ในการเชื่อมต่อพูดคุยกับ LLM API
Communication: Frontend ติดต่อขอข้อมูลจาก Backend ผ่าน HTTP Request (GET /api/employees และ POST /api/chat)

AI ถูกนำมาใช้เป็นสมองหลักของฟีเจอร์ HR Assistant Chatbot โดยทำงานอยู่ฝั่ง Backend (ติดต่อผ่าน OpenRouter API) ซึ่งมีการใช้เทคนิค LLM ขั้นสูง 2 ส่วนหลัก ได้แก่
Prompt Engineering (System Instructions) :
Role-playing : กำหนดบทบาทให้ AI เป็นผู้ช่วย HR ที่สุภาพและเป็นมืออาชีพ
Guardrails : สร้างกฎเหล็ก (Strict Rules) เพื่อดักทางไม่ให้ AI ตอบคำถามนอกเรื่อง (เช่น สภาพอากาศ, โค้ดดิ้ง) และป้องกันการแต่งข้อมูลพนักงานขึ้นมาเอง (Hallucination)
Formatting : สั่งให้ AI จัดรูปแบบข้อความตอบกลับให้อ่านง่าย (ขึ้นบรรทัดใหม่, ใช้ Bullet points) แทนการใช้สัญลักษณ์ Markdown ที่ซับซ้อน

Function Calling (Tools) :
แทนที่จะยัดข้อมูลพนักงานทั้งหมดลงไปใน Prompt ให้สิ้นเปลือง Token ระบบได้สอนให้ AI รู้จักโครงสร้างของฟังก์ชัน get_employee_stats ใน Python
เมื่อผู้ใช้ถามคำถาม AI จะวิเคราะห์เจตนา สกัดตัวแปร (เช่น ชื่อคน หรือชื่อแผนก) และสั่งรันฟังก์ชันใน Backend เพื่อค้นหาข้อมูลใน Database (Mock Data)
จากนั้น AI จะนำผลลัพธ์ที่เป็นตัวเลขดิบๆ มาประมวลผลและเรียบเรียงสรุปเป็นภาษามนุษย์ตอบกลับไปยังผู้ใช้งาน