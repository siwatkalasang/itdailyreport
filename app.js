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
let bookingChart;
let unsubscribeTickets;

function toggleSidebar() {
  sidebar.classList.toggle("hidden");
}

menuToggle.addEventListener("click", toggleSidebar);

navLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    const targetId = e.target.dataset.target;
    sections.forEach((section) => {
      section.classList.toggle("hidden", section.id !== targetId);
    });
    sidebar.classList.add("hidden");
    if (targetId === "ticket-section" && ticketContent.classList.contains("hidden")) {
      pinInput.focus();
    }
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
      createdAt: serverTimestamp(),
    });
    bookingMessage.textContent = "ส่งคำขอเรียบร้อย!";
    bookingForm.reset();
  } catch (error) {
    bookingMessage.textContent = `บันทึกไม่สำเร็จ: ${error.message}`;
    bookingMessage.classList.add("error");
  }
});

function renderTickets(snapshot) {
  ticketList.innerHTML = "";
  if (snapshot.empty) {
    ticketList.innerHTML = "<p class='hint'>ยังไม่มีคำขอ</p>";
    return;
  }

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const card = document.createElement("article");
    card.className = "ticket-card";
    card.innerHTML = `
      <header>
        <div>
          <p class="eyebrow">${data.hotel} • ${data.department}</p>
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
          backgroundColor: "#4f46e5",
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

attachTicketEvents();
startDashboardListener();
