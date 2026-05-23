/* =====================================================
   MedConnect – app.js
   Lógica de navegación, sesión, formularios y UI
   ===================================================== */

// ── Estado de sesión (persiste en sessionStorage) ────────────────
const SESSION_KEY = 'medconnect_user';
const APPOINTMENT_KEY = 'medconnect_appointment';
const DOCUMENTS_KEY = 'medconnect_documents';
const HISTORY_KEY = 'medconnect_history';

function getSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}
function setSession(user) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}
function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
// ── Gestión de citas ─────────────────────────────
function saveAppointment(data) {
  sessionStorage.setItem(APPOINTMENT_KEY, JSON.stringify(data));
}
function getAppointment() {
  try { return JSON.parse(sessionStorage.getItem(APPOINTMENT_KEY)); }
  catch { return null; }
}
function clearAppointment() {
  sessionStorage.removeItem(APPOINTMENT_KEY);
}
// ── Gestión de documentos ─────────────────────────────
function getDocuments() {
  try { return JSON.parse(sessionStorage.getItem(DOCUMENTS_KEY)) || []; }
  catch { return []; }
}
function saveDocuments(docs) {
  sessionStorage.setItem(DOCUMENTS_KEY, JSON.stringify(docs));
}
// ── Gestión historial médico ─────────────────────────────
function getHistory() {
  try { return JSON.parse(sessionStorage.getItem(HISTORY_KEY)) || []; }
  catch { return []; }
}
function saveHistory(history) {
  sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

// ── Usuarios simulados ────────────────────────────────────────────
const MOCK_USERS = [
  { email: 'maria@correo.com', password: '12345678', name: 'María Pérez', initials: 'MP' },
  { email: 'demo@medconnect.co', password: 'demo1234', name: 'Demo Usuario', initials: 'DU' },
];

// ── Citas ocupadas ─────────────────────────────
let appointments = JSON.parse(
  sessionStorage.getItem('medconnect_all_appointments')
) || [];

function saveAppointments() {
  sessionStorage.setItem('medconnect_all_appointments', JSON.stringify(appointments));
}

// ── Navegación entre pantallas ────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('screen-' + id);
  if (target) target.classList.add('active');
  window.scrollTo(0, 0);
}

// ── Toast ─────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 350);
  }, duration);
}

// ── Helpers de formulario ─────────────────────────────────────────
function setError(fieldId, errorId, msg) {
  const field = document.getElementById(fieldId);
  const err   = document.getElementById(errorId);
  if (field) field.classList.add('error');
  if (err)   { err.textContent = msg; err.classList.remove('hidden'); }
}
function clearError(fieldId, errorId) {
  const field = document.getElementById(fieldId);
  const err   = document.getElementById(errorId);
  if (field) field.classList.remove('error');
  if (err)   { err.textContent = ''; err.classList.add('hidden'); }
}
function clearAllErrors(...pairs) {
  pairs.forEach(([f, e]) => clearError(f, e));
}

// ── Toggle mostrar/ocultar contraseña ─────────────────────────────
document.querySelectorAll('.toggle-password').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      btn.setAttribute('aria-label', 'Ocultar contraseña');
    } else {
      input.type = 'password';
      btn.setAttribute('aria-label', 'Mostrar contraseña');
    }
  });
});

// ── Botones de navegación entre auth ─────────────────────────────
document.getElementById('btn-go-register').addEventListener('click', () => showScreen('register'));
document.getElementById('btn-go-login').addEventListener('click', () => showScreen('login'));

// ══════════════════════════════════════════════════════════════════
// ONBOARDING
// ══════════════════════════════════════════════════════════════════
let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const dots   = document.querySelectorAll('.dot');
const TOTAL_SLIDES = slides.length;

function goToSlide(n) {
  slides[currentSlide].classList.remove('active');
  dots[currentSlide].classList.remove('active');
  dots[currentSlide].setAttribute('aria-selected', 'false');
  currentSlide = n;
  slides[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');
  dots[currentSlide].setAttribute('aria-selected', 'true');
  const btnNext = document.getElementById('btn-next-slide');
  btnNext.textContent = currentSlide === TOTAL_SLIDES - 1 ? 'Comenzar' : 'Siguiente';
}

document.getElementById('btn-next-slide').addEventListener('click', () => {
  if (currentSlide < TOTAL_SLIDES - 1) {
    goToSlide(currentSlide + 1);
  } else {
    endOnboarding();
  }
});

document.getElementById('btn-skip-onboarding').addEventListener('click', endOnboarding);
dots.forEach((dot, i) => dot.addEventListener('click', () => goToSlide(i)));

function endOnboarding() {
  const session = getSession();
  showScreen(session ? 'home' : 'login');
}

// ══════════════════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════════════════
document.getElementById('login-form').addEventListener('submit', e => {
  e.preventDefault();
  clearAllErrors(['login-email','login-email-error'], ['login-password','login-password-error']);
  document.getElementById('login-banner').classList.add('hidden');

  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  let valid = true;

  if (!email) {
    setError('login-email', 'login-email-error', 'Por favor escribe tu correo electrónico.');
    valid = false;
  } else if (!isValidEmail(email)) {
    setError('login-email', 'login-email-error', 'Ese correo no parece válido. Ej: nombre@correo.com');
    valid = false;
  }
  if (!password) {
    setError('login-password', 'login-password-error', 'Por favor escribe tu contraseña.');
    valid = false;
  }
  if (!valid) return;

  const user = MOCK_USERS.find(u => u.email === email && u.password === password);
  if (!user) {
    document.getElementById('login-banner').classList.remove('hidden');
    return;
  }

  setSession(user);
  updateUserUI(user);
  showScreen('home');
  showToast('¡Bienvenido de vuelta, ' + user.name.split(' ')[0] + '! 👋');
});

// ══════════════════════════════════════════════════════════════════
// REGISTRO
// ══════════════════════════════════════════════════════════════════
document.getElementById('register-form').addEventListener('submit', e => {
  e.preventDefault();
  let valid = true;

  const name  = document.getElementById('reg-name').value.trim();
  const dob   = document.getElementById('reg-dob').value;
  const email = document.getElementById('reg-email').value.trim();
  const pass  = document.getElementById('reg-password').value;
  const pass2 = document.getElementById('reg-password2').value;

  clearAllErrors(
    ['reg-name','reg-name-error'],['reg-dob','reg-dob-error'],
    ['reg-email','reg-email-error'],['reg-password','reg-password-error'],
    ['reg-password2','reg-password2-error']
  );

  if (!name || name.length < 3) {
    setError('reg-name', 'reg-name-error', 'Por favor escribe tu nombre completo.');
    valid = false;
  }
  if (!dob) {
    setError('reg-dob', 'reg-dob-error', 'Por favor indica tu fecha de nacimiento.');
    valid = false;
  }
  if (!email || !isValidEmail(email)) {
    setError('reg-email', 'reg-email-error', 'Ese correo no parece válido. Ej: nombre@correo.com');
    valid = false;
  }
  if (!pass || pass.length < 8) {
    setError('reg-password', 'reg-password-error', 'Tu contraseña debe tener al menos 8 caracteres.');
    valid = false;
  }
  if (pass !== pass2) {
    setError('reg-password2', 'reg-password2-error', 'Las contraseñas no coinciden. Revísalas.');
    valid = false;
  }
  if (!valid) return;

  const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  const newUser = { email, password: pass, name, initials };
  MOCK_USERS.push(newUser);
  setSession(newUser);
  updateUserUI(newUser);
  showScreen('home');
  showToast('¡Cuenta creada con éxito! Bienvenido/a, ' + name.split(' ')[0] + ' 🎉');
});

// ══════════════════════════════════════════════════════════════════
// HOME – MENÚ DE USUARIO
// ══════════════════════════════════════════════════════════════════
function updateUserUI(user) {
  const avatar = document.querySelector('.avatar');
  if (avatar) avatar.textContent = user.initials;
  const greetingName = document.getElementById('greeting-heading');
  if (greetingName) greetingName.innerHTML = user.name.split(' ')[0] + ' <span aria-hidden="true">👋</span>';
  const menuName = document.getElementById('menu-user-name');
  const menuEmail = document.getElementById('menu-user-email');
  if (menuName) menuName.textContent = user.name;
  if (menuEmail) menuEmail.textContent = user.email;
}

const btnUserMenu = document.getElementById('btn-user-menu');
const userMenu    = document.getElementById('user-menu');

btnUserMenu.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = !userMenu.classList.contains('hidden');
  userMenu.classList.toggle('hidden', isOpen);
  btnUserMenu.setAttribute('aria-expanded', String(!isOpen));
});

document.addEventListener('click', () => {
  userMenu.classList.add('hidden');
  btnUserMenu.setAttribute('aria-expanded', 'false');
});

document.getElementById('btn-logout').addEventListener('click', () => {
  clearSession();
  showToast('Sesión cerrada. ¡Hasta pronto!');
  setTimeout(() => showScreen('login'), 800);
});

document.getElementById('btn-goto-history').addEventListener('click', () => {
  renderHistory();
  renderDocuments();
  showScreen('history');
});
document.getElementById('btn-goto-history2').addEventListener('click', () => {
  renderHistory();
  renderDocuments();
  showScreen('history');
});

document.getElementById('btn-goto-schedule').addEventListener('click', () => showScreen('schedule'));
document.getElementById('btn-goto-call').addEventListener('click', () => {
  const appointment = getAppointment();
  if (!appointment) {
    showToast('⚠️ No tienes citas programadas. Agenda una cita primero.');
    return;
  }
  showScreen('videocall');
  startCallSimulation();
});

// ══════════════════════════════════════════════════════════════════
// SUBIR DOCUMENTOS
// ══════════════════════════════════════════════════════════════════
document.getElementById('btn-upload-doc').addEventListener('click', () => {
  document.getElementById('upload-modal').classList.remove('hidden');
});
document.getElementById('close-upload-modal').addEventListener('click', () => {
  document.getElementById('upload-modal').classList.add('hidden');
  resetUploadModal();
});

const dropZone  = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const btnConfirmUpload = document.getElementById('btn-confirm-upload');

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragging'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('dragging');
  handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', e => handleFile(e.target.files[0]));

function handleFile(file) {
  if (!file) return;
  window.selectedFile = file;
  const allowed = ['application/pdf','image/jpeg','image/png'];
  if (!allowed.includes(file.type)) {
    showToast('Solo se aceptan archivos PDF, JPG o PNG.');
    return;
  }
  dropZone.querySelector('.drop-text').innerHTML =
    `<strong>${file.name}</strong><br><span class="drop-sub">${(file.size/1024).toFixed(0)} KB — listo para subir</span>`;
  btnConfirmUpload.disabled = false;
  btnConfirmUpload.removeAttribute('aria-disabled');
}

btnConfirmUpload.addEventListener('click', () => {
  const file = window.selectedFile;
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const documents = getDocuments();
    const newDoc = {
      id: Date.now(),
      name: file.name,
      size: (file.size / 1024).toFixed(0) + ' KB',
      type: file.type,
      date: new Date().toLocaleDateString('es-CO'),
      data: e.target.result
    };
    documents.push(newDoc);
    saveDocuments(documents);
    renderDocuments();
    document.getElementById('upload-success').classList.remove('hidden');
    btnConfirmUpload.disabled = true;
    btnConfirmUpload.setAttribute('aria-disabled', 'true');
    setTimeout(() => {
      document.getElementById('upload-modal').classList.add('hidden');
      resetUploadModal();
      showToast('✅ Documento subido correctamente.');
    }, 1800);
  };
  reader.readAsDataURL(file);
});

function resetUploadModal() {
  document.getElementById('upload-success').classList.add('hidden');
  dropZone.querySelector('.drop-text').innerHTML =
    'Arrastra tu archivo aquí<br><span class="drop-sub">o haz clic para buscarlo en tu dispositivo</span>';
  btnConfirmUpload.disabled = true;
  btnConfirmUpload.setAttribute('aria-disabled', 'true');
  fileInput.value = '';
}

// ══════════════════════════════════════════════════════════════════
// AGENDAR CITA  ← BLOQUE CORREGIDO
// ══════════════════════════════════════════════════════════════════
const dateInput = document.getElementById('appt-date');
if (dateInput) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  dateInput.min = tomorrow.toISOString().split('T')[0];
}

document.getElementById('schedule-form').addEventListener('submit', e => {
  e.preventDefault();

  // ── FIX: limpiar errores de radio-buttons directamente por ID ──
  const typeErrorEl = document.getElementById('type-error');
  const timeErrorEl = document.getElementById('time-error');
  if (typeErrorEl) { typeErrorEl.textContent = ''; typeErrorEl.classList.add('hidden'); }
  if (timeErrorEl) { timeErrorEl.textContent = ''; timeErrorEl.classList.add('hidden'); }
  clearError('doctor-select', 'doctor-select-error');
  clearError('appt-date', 'appt-date-error');

  const typeVal   = document.querySelector('input[name="consult-type"]:checked')?.value;
  const doctorVal = document.getElementById('doctor-select').value;
  const dateVal   = document.getElementById('appt-date').value;
  const timeVal   = document.querySelector('input[name="time-slot"]:checked')?.value;

  let valid = true;

  if (!typeVal) {
    if (typeErrorEl) { typeErrorEl.textContent = 'Por favor elige el tipo de consulta.'; typeErrorEl.classList.remove('hidden'); }
    valid = false;
  }
  if (!doctorVal) {
    setError('doctor-select', 'doctor-select-error', 'Por favor elige un médico de la lista.');
    valid = false;
  }
  if (!dateVal) {
    setError('appt-date', 'appt-date-error', 'Por favor elige la fecha de tu cita.');
    valid = false;
  }
  if (!timeVal) {
    if (timeErrorEl) { timeErrorEl.textContent = 'Por favor elige una hora.'; timeErrorEl.classList.remove('hidden'); }
    valid = false;
  }

  if (!valid) {
    document.querySelector('.field-error:not(.hidden)')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // Verificar disponibilidad
  const alreadyBooked = appointments.find(appt =>
    appt.doctor === doctorVal &&
    appt.date === dateVal &&
    appt.time === timeVal
  );
  if (alreadyBooked) {
    showToast('⚠️ Ese médico ya tiene una cita en esa fecha y hora.');
    return;
  }

  // Mapeos legibles
  const typeLabels = {
    general: 'Medicina general', psych: 'Salud mental',
    nutri: 'Nutrición', pediatric: 'Pediatría'
  };
  const doctorLabels = {
    dr_ramirez: 'Dr. Andrés Ramírez', dra_torres: 'Dra. Camila Torres',
    dra_morales: 'Dra. Luisa Morales', dr_castillo: 'Dr. Felipe Castillo'
  };

  const dateFormatted = new Date(dateVal + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const dateCapitalized = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);

  // Llenar pantalla de confirmación
  document.getElementById('conf-doctor').textContent = doctorLabels[doctorVal] || doctorVal;
  document.getElementById('conf-type').textContent   = typeLabels[typeVal] || typeVal;
  document.getElementById('conf-date').textContent   = dateCapitalized;
  document.getElementById('conf-time').textContent   = formatTime(timeVal);

  // Guardar cita
  const appointmentData = {
    doctor: doctorLabels[doctorVal],
    type:   typeLabels[typeVal],
    date:   dateCapitalized,
    time:   formatTime(timeVal),
    rawDoctor: doctorVal,
    rawDate:   dateVal,
    rawTime:   timeVal
  };

  window.currentAppointment = appointmentData;

  appointments.push({ doctor: doctorVal, date: dateVal, time: timeVal });
  saveAppointments();
  saveAppointment(appointmentData);

  // Actualizar quick-status en home
  const nextAppt = document.getElementById('next-appointment');
  if (nextAppt) nextAppt.textContent = appointmentData.date + ' · ' + appointmentData.time;

  showScreen('confirm');
});

function formatTime(t) {
  const [h, m] = t.split(':').map(Number);
  const period = h < 12 ? 'a.m.' : 'p.m.';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2,'0')} ${period}`;
}

// Botones desde confirmación
document.getElementById('btn-goto-videocall-from-confirm').addEventListener('click', () => {
  showScreen('videocall');
  startCallSimulation();
});
document.getElementById('btn-back-home-from-confirm').addEventListener('click', () => showScreen('home'));

// ══════════════════════════════════════════════════════════════════
// VIDEOLLAMADA
// ══════════════════════════════════════════════════════════════════
let callTimerInterval = null;
let callSeconds = 0;

function startCallSimulation() {
  callSeconds = 0;
  clearInterval(callTimerInterval);

  const statusBadge = document.getElementById('call-status-badge');
  statusBadge.textContent = 'Conectando…';
  setTimeout(() => { statusBadge.textContent = 'En consulta'; }, 2500);

  callTimerInterval = setInterval(() => {
    callSeconds++;
    const timerEl = document.getElementById('call-timer');
    const mins = String(Math.floor(callSeconds / 60)).padStart(2, '0');
    const secs = String(callSeconds % 60).padStart(2, '0');
    timerEl.textContent = `${mins}:${secs}`;
    timerEl.setAttribute('aria-label', `Tiempo de llamada: ${mins} minutos y ${secs} segundos`);
  }, 1000);

  setTimeout(() => {
    addChatMessage('Dr. Andrés Ramírez', '¡Hola! ¿Cómo te has sentido? Cuéntame qué te trajo hoy.', false);
  }, 3500);
}

// Micrófono
const btnMic = document.getElementById('btn-toggle-mic');
btnMic.addEventListener('click', () => {
  const isOff = btnMic.getAttribute('aria-pressed') === 'true';
  btnMic.setAttribute('aria-pressed', String(!isOff));
  btnMic.classList.toggle('active', !isOff);
  btnMic.setAttribute('aria-label', !isOff ? 'Activar micrófono' : 'Silenciar micrófono');
  btnMic.querySelector('span:first-child').textContent = !isOff ? '🔇' : '🎤';
  showToast(!isOff ? 'Micrófono silenciado.' : 'Micrófono activado.');
});

// Cámara
const btnCam = document.getElementById('btn-toggle-cam');
btnCam.addEventListener('click', () => {
  const isOff = btnCam.getAttribute('aria-pressed') === 'true';
  btnCam.setAttribute('aria-pressed', String(!isOff));
  btnCam.classList.toggle('active', !isOff);
  btnCam.setAttribute('aria-label', !isOff ? 'Encender cámara' : 'Apagar cámara');
  btnCam.querySelector('span:first-child').textContent = !isOff ? '🚫' : '📹';
  showToast(!isOff ? 'Cámara apagada.' : 'Cámara encendida.');
});

// Chat
const btnChat  = document.getElementById('btn-toggle-chat');
const callChat = document.getElementById('call-chat');
btnChat.addEventListener('click', () => {
  const isOpen = !callChat.classList.contains('hidden');
  callChat.classList.toggle('hidden', isOpen);
  btnChat.setAttribute('aria-pressed', String(!isOpen));
  btnChat.setAttribute('aria-label', !isOpen ? 'Abrir chat de la llamada' : 'Cerrar chat de la llamada');
});
document.getElementById('close-chat').addEventListener('click', () => {
  callChat.classList.add('hidden');
  btnChat.setAttribute('aria-pressed', 'false');
});

document.getElementById('btn-send-chat').addEventListener('click', sendChatMsg);
document.getElementById('chat-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') sendChatMsg();
});
function sendChatMsg() {
  const input = document.getElementById('chat-input');
  const text  = input.value.trim();
  if (!text) return;
  addChatMessage('Tú', text, true);
  input.value = '';
  setTimeout(() => {
    addChatMessage('Dr. Ramírez', 'Entendido, gracias por contarme. Continuemos en la llamada.', false);
  }, 1500);
}
function addChatMessage(sender, text, isSelf) {
  const container = document.getElementById('chat-messages');
  const msg = document.createElement('div');
  msg.className = 'chat-msg' + (isSelf ? ' self' : '');
  msg.innerHTML = `<div class="chat-msg-meta">${sender}</div>${escapeHTML(text)}`;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

// Terminar llamada
document.getElementById('btn-end-call').addEventListener('click', () => {
  document.getElementById('endcall-modal').classList.remove('hidden');
});
document.getElementById('btn-cancel-end-call').addEventListener('click', () => {
  document.getElementById('endcall-modal').classList.add('hidden');
});

document.getElementById('btn-confirm-end-call').addEventListener('click', () => {
  clearInterval(callTimerInterval);

  if (window.currentAppointment) {
    const history = getHistory();
    const simulatedNotes = [
      'Paciente estable y en buenas condiciones generales.',
      'Se recomienda hidratación y descanso.',
      'Control preventivo realizado correctamente.',
      'Se enviaron recomendaciones médicas generales.',
      'No se observan signos de alarma.'
    ];
    const randomNote = simulatedNotes[Math.floor(Math.random() * simulatedNotes.length)];

    history.unshift({
      id: Date.now(),
      doctor: window.currentAppointment.doctor,
      type: window.currentAppointment.type,
      date: window.currentAppointment.date,
      time: window.currentAppointment.time,
      duration: document.getElementById('call-timer').textContent,
      notes: randomNote
    });
    saveHistory(history);
    renderHistory();

    appointments = appointments.filter(appt =>
      !(appt.doctor === window.currentAppointment.rawDoctor &&
        appt.date   === window.currentAppointment.rawDate &&
        appt.time   === window.currentAppointment.rawTime)
    );
    saveAppointments();
    clearAppointment();
    window.currentAppointment = null;

    const nextAppt = document.getElementById('next-appointment');
    if (nextAppt) nextAppt.textContent = 'No tienes citas pendientes';
  }

  document.getElementById('endcall-modal').classList.add('hidden');
  showScreen('home');
  showToast('Consulta finalizada. ¡Que te mejores pronto! 💚');
  document.getElementById('chat-messages').innerHTML = '';
  document.getElementById('call-timer').textContent = '00:00';
});

// ══════════════════════════════════════════════════════════════════
// HISTORIAL – tabs
// ══════════════════════════════════════════════════════════════════
document.getElementById('tab-btn-consultas').addEventListener('click', () => switchTab('consultas'));
document.getElementById('tab-btn-docs').addEventListener('click', () => switchTab('docs'));

function switchTab(name) {
  ['consultas','docs'].forEach(t => {
    const btn   = document.getElementById('tab-btn-' + t);
    const panel = document.getElementById('tab-' + t);
    const active = t === name;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
    panel.classList.toggle('hidden', !active);
  });
}

// ══════════════════════════════════════════════════════════════════
// HISTORIAL MÉDICO
// ══════════════════════════════════════════════════════════════════
function renderHistory() {
  const container = document.getElementById('tab-consultas');
  if (!container) return;
  const history = getHistory();

  if (history.length === 0) {
    container.innerHTML = '<p class="empty-state">Aún no tienes consultas registradas.</p>';
    return;
  }

  container.innerHTML = history.map(item => `
    <div class="history-item">
      <div class="history-item-icon">🩺</div>
      <div class="history-item-content">
        <div class="history-item-title">${item.type}</div>
        <div class="history-item-meta">${item.date} · ${item.time}</div>
        <div class="history-item-note">
          <strong>${item.doctor}</strong><br>
          Duración: ${item.duration}<br>
          ${item.notes}
        </div>
      </div>
    </div>
  `).join('');
}

// ══════════════════════════════════════════════════════════════════
// DOCUMENTOS
// ══════════════════════════════════════════════════════════════════
function renderDocuments() {
  const container = document.getElementById('tab-docs');
  if (!container) return;
  const documents = getDocuments();

  if (documents.length === 0) {
    container.innerHTML = '<p class="empty-state">No has subido documentos todavía.</p>';
    return;
  }

  container.innerHTML = documents.map(doc => `
    <div class="history-item">
      <div class="history-item-icon">📄</div>
      <div class="history-item-content">
        <div class="history-item-title">${doc.name}</div>
        <div class="history-item-meta">${doc.date} · ${doc.size}</div>
      </div>
      <button class="btn-ghost small download-doc" data-id="${doc.id}" type="button">Descargar</button>
    </div>
  `).join('');
}

// ══════════════════════════════════════════════════════════════════
// BOTONES BACK
// ══════════════════════════════════════════════════════════════════
document.querySelectorAll('[data-back]').forEach(btn => {
  btn.addEventListener('click', () => showScreen(btn.dataset.back));
});

// ══════════════════════════════════════════════════════════════════
// DESCARGAR DOCUMENTO
// ══════════════════════════════════════════════════════════════════
document.addEventListener('click', (e) => {
  if (!e.target.classList.contains('download-doc')) return;
  const docId = Number(e.target.dataset.id);
  const documents = getDocuments();
  const doc = documents.find(d => d.id === docId);
  if (!doc) return;
  const link = document.createElement('a');
  link.href = doc.data;
  link.download = doc.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// ══════════════════════════════════════════════════════════════════
// UTILIDADES
// ══════════════════════════════════════════════════════════════════
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function escapeHTML(str) {
  return str.replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])
  );
}

// ══════════════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ══════════════════════════════════════════════════════════════════
(function init() {
  const session = getSession();
  if (session) {
    updateUserUI(session);
    renderDocuments();
    renderHistory();

    const appointment = getAppointment();
    if (appointment) {
      window.currentAppointment = appointment;
      const nextAppt = document.getElementById('next-appointment');
      if (nextAppt) nextAppt.textContent = appointment.date + ' · ' + appointment.time;
    }

    showScreen('home');
  } else {
    showScreen('onboarding');
  }
})();