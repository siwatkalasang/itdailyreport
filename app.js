const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwEPWbRkm0TY1sdNtYx2tvcOxwncDDQnA0KbIORCUHuJ_fZa8SjaPsU3Mo2ZzXg2fbo/exec";

const state = { requests: [], lineChart: null, deptMonthChart: null, deptTotalChart: null };
const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const menuToggle = document.getElementById("menu-toggle");
const sidebar = document.getElementById("sidebar");
const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll("main > section");
const transferType = document.getElementById("transfer-type");
const legsContainer = document.getElementById("legs-container");
const requestForm = document.getElementById("request-form");
const requestMessage = document.getElementById("request-message");
const historyBody = document.querySelector("#history-table tbody");
const approvalSelect = document.getElementById("approval-select");
const approvalDetail = document.getElementById("approval-detail");
const approvalMessage = document.getElementById("approval-message");
const approveBtn = document.getElementById("approve-btn");
const exportSelect = document.getElementById("export-select");
const exportForm = document.getElementById("export-form");
const printBtn = document.getElementById("print-btn");

menuToggle.addEventListener("click", () => sidebar.classList.toggle("hidden"));
navLinks.forEach((btn) => btn.addEventListener("click", () => {
  sections.forEach((sec) => sec.classList.toggle("hidden", sec.id !== btn.dataset.target));
  sidebar.classList.add("hidden");
}));

function renderLegInputs() {
  const t = transferType.value;
  if (!t) {
    legsContainer.innerHTML = "";
    return;
  }
  const count = t === "round-trip" ? 2 : 1;
  legsContainer.innerHTML = Array.from({ length: count }, (_, i) => `
    <div class="leg-card">
      <h4>${count === 2 ? `Trip ${i + 1}` : "Trip"}</h4>
      <label>Transfer From<input type="text" name="transferFrom${i + 1}" required /></label>
      <label>Transfer To<input type="text" name="transferTo${i + 1}" required /></label>
    </div>
  `).join("");
}
transferType.addEventListener("change", renderLegInputs);

async function callApi(method, payload = {}) {
  const res = await fetch(GAS_WEB_APP_URL, {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "GET" ? undefined : JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function loadRequests() {
  const data = await callApi("POST", { action: "list" });
  state.requests = data.items || [];
  renderHistory();
  renderSelectors();
  renderCharts();
}

function toCurrency(n) {
  return Number(n || 0).toLocaleString("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });
}

function renderHistory() {
  historyBody.innerHTML = "";
  state.requests.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.requestNumber || "-"}</td><td>${r.staffName || "-"}</td><td>${r.department || "-"}</td><td>${r.transferType || "-"}</td><td>${toCurrency(r.totalBaht)}</td><td>${r.status || "pending"}</td><td>${r.requestDate || "-"}</td>`;
    historyBody.appendChild(tr);
  });
}

function renderSelectors() {
  const options = ['<option value="">เลือก Request Number</option>']
    .concat(state.requests.map((r) => `<option value="${r.requestNumber}">${r.requestNumber}</option>`));
  approvalSelect.innerHTML = options.join("");
  exportSelect.innerHTML = options.join("");
}

function findRequest() {
  return state.requests.find((r) => r.requestNumber === this.value);
}

function renderDetail(target, r) {
  if (!r) {
    target.innerHTML = "<p class='message'>ยังไม่ได้เลือกรายการ</p>";
    return;
  }
  target.innerHTML = `
    <h3>${r.requestNumber}</h3>
    <p><strong>Staff:</strong> ${r.staffName} | <strong>Hotel:</strong> ${r.hotel} | <strong>Dept:</strong> ${r.department}</p>
    <p><strong>Type:</strong> ${r.transferType} | <strong>Service Date:</strong> ${r.serviceDate} | <strong>Carrier Time:</strong> ${r.carrierTime}</p>
    <p><strong>Trip 1:</strong> ${r.transferFrom1 || "-"} → ${r.transferTo1 || "-"}</p>
    <p><strong>Trip 2:</strong> ${r.transferFrom2 || "-"} → ${r.transferTo2 || "-"}</p>
    <p><strong>Expense:</strong> ${r.expense} | <strong>Total:</strong> ${toCurrency(r.totalBaht)} | <strong>Reason:</strong> ${r.reason}</p>
    <p><strong>Requested by:</strong> ${r.requestBy} at ${r.requestDate}</p>
    <p><strong>Status:</strong> ${r.status || "pending"}</p>
  `;
}

approvalSelect.addEventListener("change", function() { renderDetail(approvalDetail, findRequest.call(this)); });
exportSelect.addEventListener("change", function() { renderDetail(exportForm, findRequest.call(this)); });

approveBtn.addEventListener("click", async () => {
  const requestNumber = approvalSelect.value;
  if (!requestNumber) return;
  try {
    await callApi("POST", { action: "approve", requestNumber });
    approvalMessage.textContent = "Approve เรียบร้อยแล้ว";
    approvalMessage.classList.remove("error");
    await loadRequests();
    approvalSelect.value = requestNumber;
    renderDetail(approvalDetail, state.requests.find((r) => r.requestNumber === requestNumber));
  } catch (e) {
    approvalMessage.textContent = `Approve ไม่ผ่าน: ${e.message}`;
    approvalMessage.classList.add("error");
  }
});

requestForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(requestForm);
  const payload = Object.fromEntries(fd.entries());
  payload.action = "create";
  payload.totalBaht = Number(payload.totalBaht);

  try {
    const result = await callApi("POST", payload);
    requestMessage.textContent = `บันทึกสำเร็จ: ${result.requestNumber}`;
    requestMessage.classList.remove("error");
    requestForm.reset();
    renderLegInputs();
    await loadRequests();
  } catch (error) {
    requestMessage.textContent = `บันทึกไม่สำเร็จ: ${error.message}`;
    requestMessage.classList.add("error");
  }
});

printBtn.addEventListener("click", () => {
  if (!exportSelect.value) return;
  window.print();
});

function createOrUpdateChart(key, type, canvasId, labels, datasets) {
  const ctx = document.getElementById(canvasId);
  if (state[key]) state[key].destroy();
  state[key] = new Chart(ctx, { type, data: { labels, datasets }, options: { responsive: true, maintainAspectRatio: false } });
}

function renderCharts() {
  const byMonth = Array(12).fill(0);
  const byDeptTotal = {};
  const deptMonthMap = {};

  state.requests.forEach((r) => {
    const d = new Date(r.requestDate || r.serviceDate || Date.now());
    const m = d.getMonth();
    byMonth[m] += 1;
    byDeptTotal[r.department] = (byDeptTotal[r.department] || 0) + 1;
    deptMonthMap[r.department] ??= Array(12).fill(0);
    deptMonthMap[r.department][m] += 1;
  });

  createOrUpdateChart("lineChart", "line", "year-line-chart", months, [{ label: "Requests / Month", data: byMonth, borderColor: "#0ea5e9", backgroundColor: "rgba(14,165,233,.2)", fill: true, tension: .35 }]);

  const deptDatasets = Object.entries(deptMonthMap).map(([dept, arr], idx) => ({
    label: dept,
    data: arr,
    backgroundColor: `hsl(${(idx * 42) % 360} 80% 60%)`
  }));
  createOrUpdateChart("deptMonthChart", "bar", "dept-month-chart", months, deptDatasets);

  createOrUpdateChart("deptTotalChart", "bar", "dept-total-chart", Object.keys(byDeptTotal), [{ label: "Total", data: Object.values(byDeptTotal), backgroundColor: "#0284c7" }]);
}

loadRequests();
renderLegInputs();
