// Simple localStorage-backed interactive dashboard
// Save files in same folder, open dashboard.html

// ---------- Helpers ----------
const qs = (s) => document.querySelector(s);
const qsa = (s) => Array.from(document.querySelectorAll(s));
const nowY = new Date().getFullYear();
qs('#year').innerText = nowY;

// Default seed data (only if none exist)
if (!localStorage.getItem('evura_data')) {
  const seed = {
    doctors: ['Diane Mukamana', 'Patrick Niyonzima', 'Jean B. Mugabo', 'Alice Uwimana'],
    stats: {
      consultations: 3,
      records: 5
    },
    appointments: [
      // sample upcoming appointment items
      {id: id(), doctor: 'Diane Mukamana', date: addDays(3), time: '09:30', notes: 'Follow up on surgery'},
      {id: id(), doctor: 'Patrick Niyonzima', date: addDays(7), time: '11:00', notes: 'Review labs'}
    ],
    activity: [
      {id: id(), title: 'Consultation with Dr. Diane Mukamana', date: 'Jan 10, 2025'},
      {id: id(), title: 'Consultation with Dr. Patrick Niyonzima', date: 'Feb 20, 2024'},
      {id: id(), title: 'Consultation with Dr. Jean B. Mugabo', date: 'Mar 15, 2023'}
    ]
  };
  localStorage.setItem('evura_data', JSON.stringify(seed));
}

// Utility functions
function storage() { return JSON.parse(localStorage.getItem('evura_data')); }
function saveStorage(obj){ localStorage.setItem('evura_data', JSON.stringify(obj)); }
function id(){ return 'id_' + Math.random().toString(36).substr(2,9); }
function addDays(n){ const d=new Date(); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }

// ---------- UI elements ----------
const statAppointments = qs('#stat-appointments');
const statConsults = qs('#stat-consultations');
const statDoctors = qs('#stat-doctors');
const statRecords = qs('#stat-records');

const apptsContainer = qs('#appointmentsContainer');
const activityContainer = qs('#activityContainer');
const doctorSelect = qs('#doctorSelect');

const modal = qs('#modal');
const bookBtn = qs('#bookBtn');
const cancelModal = qs('#cancelModal');
const bookForm = qs('#bookForm');

// populate dynamic UI
function renderAll() {
  const data = storage();

  // stats
  statAppointments.innerText = data.appointments.length;
  statConsults.innerText = data.stats.consultations;
  statDoctors.innerText = data.doctors.length;
  statRecords.innerText = data.stats.records;

  // appointments list
  apptsContainer.innerHTML = '';
  if (data.appointments.length === 0) {
    apptsContainer.innerHTML = `<div style="text-align:center;padding:40px;color:#94a3b8">
      <div style="font-size:42px">📅</div>
      <p style="margin-top:12px">No upcoming appointments</p>
      <div style="margin-top:12px"><button class="btn" id="quickBook">Schedule Appointment</button></div>
    </div>`;
    // attach quick book
    setTimeout(()=> {
      const qb = qs('#quickBook');
      if (qb) qb.onclick = () => openModal();
    },50);
  } else {
    data.appointments.forEach(a => {
      const div = document.createElement('div');
      div.className = 'appt';
      div.innerHTML = `
        <div>
          <strong>${a.doctor}</strong>
          <small>${formatDate(a.date)} — ${a.time}</small>
          <div style="color:var(--muted);font-size:13px;margin-top:6px">${a.notes||''}</div>
        </div>
        <div class="actions">
          <button onclick="editAppointment('${a.id}')">Edit</button>
          <button class="danger" onclick="cancelAppointment('${a.id}')">Cancel</button>
        </div>
      `;
      apptsContainer.appendChild(div);
    });
  }

  // activity feed
  activityContainer.innerHTML = '';
  data.activity.forEach(it => {
    const el = document.createElement('div');
    el.className = 'activity-item';
    el.innerHTML = `
      <div class="dot">🩺</div>
      <div>
        <p><strong>${it.title}</strong></p>
        <div class="meta">${it.date}</div>
      </div>
    `;
    activityContainer.appendChild(el);
  });

  // doctor select in modal
  doctorSelect.innerHTML = '';
  data.doctors.forEach(d => {
    const opt = document.createElement('option'); opt.value = d; opt.textContent = d;
    doctorSelect.appendChild(opt);
  });
}

// ---------- appointment actions ----------
function openModal() { modal.classList.remove('hidden'); }
function closeModal() { modal.classList.add('hidden'); bookForm.reset(); }

bookBtn.addEventListener('click', openModal);
cancelModal.addEventListener('click', closeModal);

bookForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = storage();
  const newAppt = {
    id: id(),
    doctor: qs('#doctorSelect').value,
    date: qs('#apptDate').value,
    time: qs('#apptTime').value,
    notes: qs('#apptNotes').value || ''
  };
  data.appointments.push(newAppt);
  // also push activity
  data.activity.unshift({ id: id(), title: `Booked with Dr. ${newAppt.doctor}`, date: friendlyNow() });
  saveStorage(data);
  renderAll();
  closeModal();
});

// edit appointment (simple prompt-based)
function editAppointment(apptId) {
  const data = storage();
  const ap = data.appointments.find(x => x.id === apptId);
  if (!ap) return alert('Appointment not found');
  const newDate = prompt('New date (YYYY-MM-DD):', ap.date);
  if (!newDate) return;
  const newTime = prompt('New time (HH:MM):', ap.time);
  if (!newTime) return;
  ap.date = newDate; ap.time = newTime;
  data.activity.unshift({ id: id(), title: `Edited appointment with Dr. ${ap.doctor}`, date: friendlyNow() });
  saveStorage(data); renderAll();
}

// cancel (delete)
function cancelAppointment(apptId) {
  if (!confirm('Cancel this appointment?')) return;
  const data = storage();
  data.appointments = data.appointments.filter(x => x.id !== apptId);
  data.activity.unshift({ id: id(), title: `Cancelled an appointment`, date: friendlyNow() });
  saveStorage(data); renderAll();
}

// utilities
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year:'numeric',month:'short',day:'numeric' });
}
function friendlyNow(){ const d=new Date(); return d.toLocaleDateString() }

// seed-add doctor quick function (for dev)
window.__evura_addDoctor = (name) => {
  const data = storage(); data.doctors.push(name); saveStorage(data); renderAll();
};

// expose functions to global scope needed by inline actions
window.editAppointment = editAppointment;
window.cancelAppointment = cancelAppointment;

// initial render
renderAll();
