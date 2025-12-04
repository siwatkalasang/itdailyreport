# Meeting Room Booking (Firebase)

เว็บแอปสำหรับจองห้องประชุม 2 ห้อง (ห้องประชุมปันหยี และ ห้องประชุมพิงกัน) พร้อมแดชบอร์ด, หน้าจองผู้จอง, และหน้ารวม Ticket ที่สามารถ Approve/Reject/Delete ได้ โดยใช้ Firebase Firestore เป็นฐานข้อมูล

## คุณสมบัติหลัก
- เมนู Hamburger ซ้ายบนพร้อม 3 หน้า: แดชบอร์ด, หน้าจองของผู้จอง, หน้ารวม Ticket
- ฟอร์มจองรองรับโรงแรม/แผนก (Dropdown) บุคคลภายนอกสามารถกรอก Remark เพิ่มได้
- เลือกห้องประชุม รูปแบบการจัดโต๊ะ และระบุชื่องานเพื่อนำไปติดหน้าห้อง
- หน้ารวม Ticket ต้องใส่ PIN 1234 ก่อนเข้าถึง สามารถ Approve / Reject / ลบคำขอ (ลบจากฐานข้อมูล) ได้
- แดชบอร์ดกราฟแนวตั้งแบบ Dynamic แยกตาม โรงแรม + แผนก ของผู้จอง

## การตั้งค่าและรัน
1. สร้างโปรเจ็กต์ Firebase และเปิดใช้ Firestore (โหมด Production หรือ Test ตามต้องการ)
2. สร้างไฟล์ config โดยแก้ไขค่าใน `firebase-config.js` ให้เป็นข้อมูลจากโปรเจ็กต์ Firebase ของคุณ
   ```js
   export const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "...",
   };
   ```
3. เปิด Live Server หรือเสิร์ฟไฟล์ `index.html` ด้วย HTTP server (เช่น `npx http-server .`)
4. เริ่มใช้งานผ่านเบราว์เซอร์ที่ `http://localhost:8080` (หรือพอร์ตที่คุณใช้)

## โครงสร้างข้อมูล Firestore
- Collection: `bookings`
- ฟิลด์ที่ใช้
  - `hotel`, `department`, `remark`
  - `room` ("ห้องประชุมปันหยี" / "ห้องประชุมพิงกัน")
  - `layout` (รูปแบบการจัดโต๊ะ)
  - `eventName`
  - `meetingDate`, `startTime`, `endTime`
  - `requester`, `phone`
  - `status` (pending | approved | rejected)
  - `createdAt` (serverTimestamp)

## หมายเหตุ
- หน้า Ticket จะเริ่มดึงข้อมูลหลังจากกรอก PIN ถูกต้อง
- ปุ่มรีเฟรชรายการจะรีสตาร์ทตัว listener เพื่อให้แน่ใจว่าข้อมูลล่าสุดถูกดึงมาแสดง
- กราฟแดชบอร์ดอัปเดตแบบเรียลไทม์เมื่อมีคำขอใหม่หรือเปลี่ยนสถานะ
