const scriptUrl = 'https://script.google.com/macros/s/AKfycbwEPWbRkm0TY1sdNtYx2tvcOxwncDDQnA0KbIORCUHuJ_fZa8SjaPsU3Mo2ZzXg2fbo/exec';
let allData = [];

// Navigation
const menuToggle = document.getElementById('menuToggle');
const menu = document.getElementById('menu');
menuToggle.addEventListener('click', () => {
  menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
});
menu.querySelectorAll('li').forEach(li => {
  li.addEventListener('click', () => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(li.dataset.section).classList.add('active');
    menu.style.display = 'none';
  });
});

// Transfer type toggle
const transferType = document.getElementById('transferType');
transferType.addEventListener('change', updateTransferType);
function updateTransferType() {
  const round = transferType.value === 'round';
  document.querySelectorAll('.round-only').forEach(el => {
    el.style.display = round ? 'block' : 'none';
  });
}
updateTransferType();

// Load initial data
async function loadData() {
  const res = await fetch(`${scriptUrl}?action=read`);
  allData = await res.json();
  fillHistory();
  fillRequestNumber();
  fillDropdowns();
  buildChart();
}
loadData();

function fillHistory() {
  const tbody = document.querySelector('#historyTable tbody');
  tbody.innerHTML = '';
  allData.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${row.requestNumber}</td><td>${row.staffName}</td><td>${row.department}</td><td>${row.serviceDate}</td><td>${row.status||''}</td>`;
    tbody.appendChild(tr);
  });
}

function fillRequestNumber() {
  const next = allData.length + 1;
  document.getElementById('requestNumber').value = `REQ-${String(next).padStart(5,'0')}`;
}

function fillDropdowns() {
  const hmSelect = document.getElementById('hmRequestSelect');
  const exportSelect = document.getElementById('exportRequestSelect');
  hmSelect.innerHTML = ''; exportSelect.innerHTML='';
  allData.forEach(row => {
    const opt1 = document.createElement('option');
    opt1.value = opt1.textContent = row.requestNumber;
    hmSelect.appendChild(opt1);
    const opt2 = document.createElement('option');
    opt2.value = opt2.textContent = row.requestNumber;
    exportSelect.appendChild(opt2);
  });
}

function buildChart() {
  const counts = {};
  allData.forEach(r => counts[r.department] = (counts[r.department] || 0) + 1);
  const ctx = document.getElementById('deptChart');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(counts),
      datasets: [{
        label: 'Requests',
        data: Object.values(counts),
        backgroundColor: '#3399ff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

// Submit form
const requestForm = document.getElementById('requestForm');
requestForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    action: 'submit',
    requestNumber: document.getElementById('requestNumber').value,
    staffName: document.getElementById('staffName').value,
    hotel: document.getElementById('hotel').value,
    department: document.getElementById('department').value,
    transferType: document.getElementById('transferType').value,
    transferFrom1: document.getElementById('transferFrom1').value,
    transferTo1: document.getElementById('transferTo1').value,
    transferFrom2: document.getElementById('transferFrom2').value,
    transferTo2: document.getElementById('transferTo2').value,
    serviceDate: document.getElementById('serviceDate').value,
    carrierTime: document.getElementById('carrierTime').value,
    expense: document.getElementById('expense').value,
    total: document.getElementById('total').value,
    reason: document.getElementById('reason').value,
    requestBy: document.getElementById('requestBy').value,
    requestDate: document.getElementById('requestDate').value
  };
  try {
    const res = await fetch(scriptUrl, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    const json = await res.json();
    alert(json.result);
    loadData();
    requestForm.reset();
    updateTransferType();
  } catch (err) {
    alert('Submit failed');
  }
});

// HM approval
document.getElementById('hmRequestSelect').addEventListener('change', showHmDetails);
function showHmDetails() {
  const val = document.getElementById('hmRequestSelect').value;
  const row = allData.find(r => r.requestNumber === val);
  const div = document.getElementById('hmDetails');
  if (!row) {div.textContent=''; return;}
  div.innerHTML = `<p>Staff: ${row.staffName}</p><p>Department: ${row.department}</p>`;
}

document.getElementById('approveBtn').addEventListener('click', async () => {
  const val = document.getElementById('hmRequestSelect').value;
  if (!val) return;
  try {
    const res = await fetch(scriptUrl, {
      method: 'POST',
      body: JSON.stringify({action:'approve', requestNumber: val})
    });
    const json = await res.json();
    alert(json.result);
    loadData();
  } catch (err) {
    alert('Approve failed');
  }
});

// Export
 document.getElementById('exportRequestSelect').addEventListener('change', showExport);
 function showExport() {
   const val = document.getElementById('exportRequestSelect').value;
   const row = allData.find(r => r.requestNumber === val);
   const div = document.getElementById('exportDetails');
   if (!row) {div.textContent=''; return;}
   div.innerHTML = `<p>Request No: ${row.requestNumber}</p><p>Staff: ${row.staffName}</p><p>Department: ${row.department}</p><p>Service Date: ${row.serviceDate}</p>`;
 }
 document.getElementById('exportBtn').addEventListener('click', () => window.print());
