# Request Transportation WebApp - The Sands Khaolak

เว็บแอปหน้าเดียว (Single Page) พร้อมเมนู Hamburger 3 หน้าในหน้าจอเดียว:
1. Request + Dashboard Analytics + ตารางย้อนหลัง
2. HM Approval
3. Export PDF

## Stack
- HTML/CSS/JavaScript (Vanilla)
- Chart.js
- Google Apps Script Web App + Google Sheet

## Google Sheet / GAS
- Endpoint: `https://script.google.com/macros/s/AKfycbwEPWbRkm0TY1sdNtYx2tvcOxwncDDQnA0KbIORCUHuJ_fZa8SjaPsU3Mo2ZzXg2fbo/exec`
- Spreadsheet ID: `1h_5QhDJrfBPv50MmLRwPE1Ftaf6FLpmXsNP9pGb1isk`
- Sheet Name: `Request`
- Apps Script ตัวอย่างอยู่ไฟล์ `google-apps-script.gs`

## Features implemented
- Request Number รูปแบบ `REQ-000xx` auto increment จาก Google Sheet
- Form แบบ Dynamic สำหรับ Transfer one way / round trip
- Validation ช่อง Total ให้เป็นตัวเลข
- Submit แล้วแจ้งผลสำเร็จ/ล้มเหลว
- Dashboard Dynamic (Line รายปี 12 เดือน + Bar ตามแผนกต่อเดือน + Bar รวมแผนก)
- HM Approval เลือก Request Number จาก dropdown และอนุมัติ
- Export หน้าแบบฟอร์มมาตรฐานและสั่งพิมพ์เป็น PDF
- ทุกหน้าดึงข้อมูลจาก API (Google Apps Script) ไม่ใช้ Mock

## Run
เปิด `index.html` ผ่าน static server เช่น
```bash
python -m http.server 8080
```
