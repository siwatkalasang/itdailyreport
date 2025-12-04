import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  limit,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const sections = document.querySelectorAll("main > section");
const navLinks = document.querySelectorAll(".nav-link");
const menuToggle = document.getElementById("menu-toggle");
const sidebar = document.getElementById("sidebar");
const bookingForm = document.getElementById("booking-form");
const bookingMessage = document.getElementById("booking-message");
const pinGate = document.getElementById("pin-gate");
const pinInput = document.getElementById("pin-input");
const pinSubmit = document.getElementById("pin-submit");
const pinMessage = document.getElementById("pin-message");
const ticketContent = document.getElementById("ticket-content");
const ticketList = document.getElementById("ticket-list");
const refreshTickets = document.getElementById("refresh-tickets");
const exportPdfBtn = document.getElementById("export-pdf");
const exportSelect = document.getElementById("export-select");
const printArea = document.getElementById("print-area");
let bookingChart;
let unsubscribeTickets;
let bookingsCache = new Map();

function toggleSidebar() {
  sidebar.classList.toggle("hidden");
}

menuToggle.addEventListener("click", toggleSidebar);

function showSection(targetId) {
  sections.forEach((section) => {
    section.classList.toggle("hidden", section.id !== targetId);
  });
  sidebar.classList.add("hidden");

  if (targetId === "booking-section") {
    bookingForm.reset();
    bookingMessage.textContent = "";
  }

  if (targetId === "ticket-section") {
    pinMessage.textContent = "";
    pinMessage.classList.remove("error");
    if (ticketContent.classList.contains("hidden")) {
      pinInput.value = "";
      pinInput.focus();
    }
  }
}

navLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    const targetId = e.target.dataset.target;
    showSection(targetId);
  });
});

bookingForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  bookingMessage.textContent = "กำลังบันทึก...";
  bookingMessage.classList.remove("error");

  const formData = new FormData(bookingForm);
  const data = Object.fromEntries(formData.entries());

  if (data.hotel === "บุคคลภายนอก" && !data.remark.trim()) {
    bookingMessage.textContent = "กรุณากรอก Remark สำหรับบุคคลภายนอก";
    bookingMessage.classList.add("error");
    return;
  }

  try {
    const requestNumber = await getNextRequestNumber();
    await addDoc(collection(db, "bookings"), {
      hotel: data.hotel,
      department: data.department,
      remark: data.remark,
      room: data.room,
      layout: data.layout,
      eventName: data.eventName,
      meetingDate: data.meetingDate,
      startTime: data.startTime,
      endTime: data.endTime,
      requester: data.requester,
      phone: data.phone,
      status: "pending",
      requestNumber,
      createdAt: serverTimestamp(),
    });
    bookingMessage.textContent = `บันทึกสำเร็จ หมายเลขการจอง ${requestNumber}`;
    bookingForm.reset();
    setTimeout(() => {
      bookingMessage.textContent = "";
    }, 2000);
  } catch (error) {
    bookingMessage.textContent = `บันทึกไม่สำเร็จ: ${error.message}`;
    bookingMessage.classList.add("error");
  }
});

function renderTickets(snapshot) {
  ticketList.innerHTML = "";
  bookingsCache.clear();
  exportSelect.innerHTML = '<option value="">เลือกหมายเลขการจองที่ Approve แล้ว</option>';
  if (snapshot.empty) {
    ticketList.innerHTML = "<p class='hint'>ยังไม่มีคำขอ</p>";
    return;
  }

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    bookingsCache.set(docSnap.id, data);

    if (data.status === "approved") {
      const opt = document.createElement("option");
      const label = data.requestNumber || docSnap.id;
      opt.value = docSnap.id;
      opt.textContent = `${label} • ${data.eventName || "ไม่ระบุชื่องาน"}`;
      exportSelect.appendChild(opt);
    }

    const card = document.createElement("article");
    card.className = "ticket-card";
    card.innerHTML = `
      <header>
        <div>
          <p class="eyebrow">${data.requestNumber || docSnap.id}</p>
          <p class="sub">${data.hotel} • ${data.department}</p>
          <h3>${data.eventName || "ไม่ระบุชื่องาน"}</h3>
          <p class="sub">${data.room} | ${data.layout}</p>
        </div>
        <span class="status status-${data.status}">${data.status}</span>
      </header>
      <dl>
        <div><dt>วันที่</dt><dd>${data.meetingDate}</dd></div>
        <div><dt>เวลา</dt><dd>${data.startTime} - ${data.endTime}</dd></div>
        <div><dt>ผู้จอง</dt><dd>${data.requester}</dd></div>
        <div><dt>โทร</dt><dd>${data.phone}</dd></div>
        <div><dt>Remark</dt><dd>${data.remark || "-"}</dd></div>
      </dl>
      <div class="ticket-buttons">
        <button class="secondary" data-action="approve" data-id="${docSnap.id}">Approve</button>
        <button class="secondary" data-action="reject" data-id="${docSnap.id}">Reject</button>
        <button class="danger" data-action="delete" data-id="${docSnap.id}">ลบคำขอ</button>
      </div>
    `;
    ticketList.appendChild(card);
  });
}

async function updateStatus(id, status) {
  await updateDoc(doc(db, "bookings", id), { status });
}

async function removeBooking(id) {
  await deleteDoc(doc(db, "bookings", id));
}

function attachTicketEvents() {
  ticketList.addEventListener("click", async (event) => {
    const target = event.target;
    const action = target.dataset.action;
    const id = target.dataset.id;
    if (!action || !id) return;

    try {
      if (action === "approve") await updateStatus(id, "approved");
      if (action === "reject") await updateStatus(id, "rejected");
      if (action === "delete") await removeBooking(id);
    } catch (error) {
      alert(`ทำรายการไม่สำเร็จ: ${error.message}`);
    }
  });
}

function requirePin() {
  const pin = pinInput.value.trim();
  if (pin !== "1234") {
    pinMessage.textContent = "PIN ไม่ถูกต้อง";
    pinMessage.classList.add("error");
    return;
  }
  pinMessage.textContent = "";
  ticketContent.classList.remove("hidden");
  pinGate.classList.add("hidden");
  startTicketListener();
}

pinSubmit.addEventListener("click", requirePin);
pinInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") requirePin();
});

function startTicketListener() {
  if (unsubscribeTickets) unsubscribeTickets();
  const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
  unsubscribeTickets = onSnapshot(q, renderTickets);
}

refreshTickets.addEventListener("click", () => {
  if (unsubscribeTickets) {
    unsubscribeTickets();
    startTicketListener();
  }
});

function exportTicketsToPdf() {
  const selectedId = exportSelect.value;
  if (!selectedId) {
    alert("เลือกหมายเลขการจองที่ต้องการ Export");
    return;
  }

  const booking = bookingsCache.get(selectedId);
  if (!booking) {
    alert("ไม่พบข้อมูลคำขอ");
    return;
  }

  if (booking.status !== "approved") {
    alert("Export ได้เฉพาะคำขอที่ Approved แล้วเท่านั้น");
    return;
  }

  printArea.innerHTML = `
    <div class="print-card">
      <div class="print-header">
        <div>
          <p class="eyebrow">หมายเลขการจอง</p>
          <h2>${booking.requestNumber || selectedId}</h2>
        </div>
        <div class="print-status">Approved</div>
      </div>
      <dl>
        <div><dt>โรงแรม</dt><dd>${booking.hotel}</dd></div>
        <div><dt>แผนก</dt><dd>${booking.department}</dd></div>
        <div><dt>ห้องประชุม</dt><dd>${booking.room}</dd></div>
        <div><dt>รูปแบบการจัดโต๊ะ</dt><dd>${booking.layout}</dd></div>
        <div><dt>ชื่องาน</dt><dd>${booking.eventName || "-"}</dd></div>
        <div><dt>วันที่</dt><dd>${booking.meetingDate}</dd></div>
        <div><dt>เวลา</dt><dd>${booking.startTime} - ${booking.endTime}</dd></div>
        <div><dt>ผู้จอง</dt><dd>${booking.requester}</dd></div>
        <div><dt>โทร</dt><dd>${booking.phone}</dd></div>
        <div class="full"><dt>Remark</dt><dd>${booking.remark || "-"}</dd></div>
      </dl>
      <p class="print-note">ใบคำขอที่ผ่านการอนุมัติสำหรับติดหน้าห้องประชุม</p>
    </div>
  `;

  window.print();
}

exportPdfBtn.addEventListener("click", exportTicketsToPdf);

function buildChart(snapshot) {
  const counts = {};
  snapshot.forEach((docSnap) => {
    const { hotel, department } = docSnap.data();
    const key = `${hotel} - ${department}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  const labels = Object.keys(counts);
  const values = Object.values(counts);
  const ctx = document.getElementById("bookingChart");
  if (bookingChart) bookingChart.destroy();
  bookingChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "จำนวนการจอง",
          data: values,
          backgroundColor: "#2563eb",
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.y} รายการ` } },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
          title: { display: true, text: "จำนวนคำขอ" },
        },
        x: {
          title: { display: true, text: "โรงแรม - แผนก" },
        },
      },
    },
  });
}

function startDashboardListener() {
  const q = query(collection(db, "bookings"));
  onSnapshot(q, buildChart);
}

async function getNextRequestNumber() {
  const latest = query(
    collection(db, "bookings"),
    orderBy("requestNumber", "desc"),
    limit(1)
  );
  const snapshot = await getDocs(latest);
  let next = 1;
  if (!snapshot.empty) {
    const current = snapshot.docs[0].data().requestNumber;
    const currentNum = parseInt(String(current || "").replace("REQ", ""), 10);
    if (!Number.isNaN(currentNum)) next = currentNum + 1;
  }
  return `REQ${String(next).padStart(4, "0")}`;
}

attachTicketEvents();
startDashboardListener();
