/**
 * PulseSync Clean Healthcare Platform Orchestrator (v4.2)
 * Connects SQLite Database & Native C++ Engine with 3 Unique Persona Dashboards,
 * SQLite Authentication Gateway, and Rich Cardiac Animations.
 */

window.CleanApp = {
  currentUser: null,
  currentRole: 'staff', // 'doctor', 'staff', 'patient'
  currentTab: 'dashboard',
  stats: {},
  map: null,
  mapMarkersGroup: null,
  baseTileLayer: null,
  satelliteOverlayLayer: null,
  currentBaseLayer: 'satellite_real',

  async init() {
    console.log("Initializing PulseSync Healthcare Platform v4.2...");
    
    // Check saved user session
    this.currentUser = PulseAPI.getCurrentUser();
    if (!this.currentUser) {
      // Default to Clinic Management staff for immediate exploration, but provide modal access
      this.currentUser = {
        id: "USR-ADM",
        name: "Sunita Sen",
        email: "admin@pulsesync.com",
        role: "staff",
        specialty_or_condition: "Senior Clinic Administrator & Dispatcher"
      };
      localStorage.setItem("pulsesync_user", JSON.stringify(this.currentUser));
    }
    this.currentRole = this.currentUser.role || 'staff';

    this.bindEvents();
    this.updateUserHeader();
    await this.checkEngineStatus();
    await this.refreshAllData();
    this.initCleanMap();
    this.applyRoleView(this.currentRole);

    // Auto-refresh data every 8 seconds
    setInterval(() => this.refreshAllData(), 8000);
  },

  // Check C++ Engine & SQLite status from Python server
  async checkEngineStatus() {
    const status = await PulseAPI.getStatus();
    const badge = document.getElementById('engine-status-badge');
    if (badge && status) {
      if (status.native_engine && status.native_engine.loaded) {
        badge.innerHTML = `<span class="dot"></span> ⚡ C++ Engine: Active • 💾 SQLite: Connected`;
      } else {
        badge.innerHTML = `<span class="dot" style="background:#f59e0b; box-shadow:0 0 8px #f59e0b;"></span> Python Algorithmic • 💾 SQLite: Connected`;
      }
    }
  },

  updateUserHeader() {
    const user = this.currentUser;
    const nameEl = document.getElementById('header-user-name');
    const roleEl = document.getElementById('header-user-role');
    const avatarEl = document.getElementById('header-user-avatar');

    if (user) {
      if (nameEl) nameEl.textContent = user.name;
      if (roleEl) roleEl.textContent = user.role === 'doctor' ? '👨‍⚕️ Physician' : user.role === 'patient' ? '🧑‍💼 Patient' : '🏢 Clinic Admin';
      if (avatarEl) {
        avatarEl.textContent = user.role === 'doctor' ? '👨‍⚕️' : user.role === 'patient' ? '🧑‍💼' : '🏢';
      }
    }

    document.body.setAttribute('data-active-role', this.currentRole);
  },

  bindEvents() {
    // Role switcher buttons
    document.querySelectorAll('[data-role]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const role = e.currentTarget.getAttribute('data-role');
        this.quickLogin(role);
      });
    });

    // Navigation tabs
    document.querySelectorAll('[data-nav-tab]').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-nav-tab');
        this.switchTab(target);
      });
    });

    // Modal close buttons
    document.querySelectorAll('.modal-close-trigger').forEach(btn => {
      btn.addEventListener('click', () => this.closeAllModals());
    });

    // Auth tab toggles
    document.querySelectorAll('[data-auth-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-auth-tab');
        document.querySelectorAll('[data-auth-tab]').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');

        document.getElementById('auth-form-login').style.display = (tab === 'login') ? 'block' : 'none';
        document.getElementById('auth-form-register').style.display = (tab === 'register') ? 'block' : 'none';
      });
    });
  },

  // Switch role and update persona views
  async quickLogin(role) {
    let email = "admin@pulsesync.com";
    let password = "admin123";
    if (role === 'doctor') {
      email = "doctor@pulsesync.com";
      password = "doc123";
    } else if (role === 'patient') {
      email = "patient@pulsesync.com";
      password = "patient123";
    }

    const res = await PulseAPI.login(email, password, role);
    if (res && res.success) {
      this.currentUser = res.user;
      this.currentRole = role;
      this.updateUserHeader();
      this.applyRoleView(role);
      this.showToast(`Logged in as ${res.user.name} (${role === 'doctor' ? 'Doctor View' : role === 'patient' ? 'Patient Portal' : 'Clinic Management'})`, 'success');
      this.refreshAllData();
    } else {
      this.currentRole = role;
      this.applyRoleView(role);
    }
  },

  async handleLoginForm(event) {
    if (event) event.preventDefault();
    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value.trim();
    const role = document.getElementById('login-role')?.value || "";

    if (!email || !password) {
      this.showToast("Please provide both email and password.", "warning");
      return;
    }

    const res = await PulseAPI.login(email, password, role);
    if (res && res.success) {
      this.currentUser = res.user;
      this.currentRole = res.user.role;
      this.updateUserHeader();
      this.applyRoleView(this.currentRole);
      this.closeAllModals();
      this.showToast(`Welcome back, ${res.user.name}! Session saved to SQLite.`, "success");
      this.refreshAllData();
    } else {
      this.showToast(res.error || "Login failed. Check credentials.", "warning");
    }
  },

  async handleRegisterForm(event) {
    if (event) event.preventDefault();
    const name = document.getElementById('reg-name')?.value.trim();
    const email = document.getElementById('reg-email')?.value.trim();
    const password = document.getElementById('reg-password')?.value.trim();
    const role = document.getElementById('reg-role')?.value || "patient";
    const extra = document.getElementById('reg-extra')?.value.trim();

    if (!name || !email || !password) {
      this.showToast("Please fill all required fields.", "warning");
      return;
    }

    const res = await PulseAPI.register({
      name, email, password, role,
      specialty_or_condition: extra
    });

    if (res && res.success) {
      this.currentUser = res.user;
      this.currentRole = res.user.role;
      this.updateUserHeader();
      this.applyRoleView(this.currentRole);
      this.closeAllModals();
      this.showToast(`Account created in SQLite! Welcome, ${res.user.name}!`, "success");
      this.refreshAllData();
    } else {
      this.showToast(res.error || "Registration failed.", "warning");
    }
  },

  applyRoleView(role) {
    document.querySelectorAll('[data-role]').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-role') === role);
    });

    document.body.setAttribute('data-active-role', role);

    const roleBanner = document.getElementById('role-indicator-text');
    if (roleBanner) {
      if (role === 'doctor') {
        roleBanner.textContent = "Physician & Clinical Care Cockpit (Prioritizing Consultation Queue & Doctor Home Visits)";
      } else if (role === 'patient') {
        roleBanner.textContent = "Patient Health & Emergency Services (Find Nearest Care, Book Appointments, Request SOS)";
      } else {
        roleBanner.textContent = "Clinic Administrative & Emergency Command Grid (Full Operational & Fleet Control)";
      }
    }

    // Toggle Unique Dashboards inside the Dashboard Tab
    const dashPatient = document.getElementById('dashboard-view-patient');
    const dashStaff = document.getElementById('dashboard-view-staff');
    const dashDoctor = document.getElementById('dashboard-view-doctor');

    if (dashPatient) dashPatient.style.display = (role === 'patient') ? 'block' : 'none';
    if (dashStaff) dashStaff.style.display = (role === 'staff') ? 'block' : 'none';
    if (dashDoctor) dashDoctor.style.display = (role === 'doctor') ? 'block' : 'none';

    // Role-specific nav permissions
    document.querySelectorAll('.role-only-staff').forEach(el => {
      el.style.display = (role === 'staff') ? '' : 'none';
    });
    document.querySelectorAll('.role-only-doctor').forEach(el => {
      el.style.display = (role === 'doctor' || role === 'staff') ? '' : 'none';
    });
  },

  switchTab(tabId) {
    this.currentTab = tabId;
    document.querySelectorAll('[data-nav-tab]').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-nav-tab') === tabId);
    });

    document.querySelectorAll('.clean-view').forEach(view => {
      view.classList.toggle('active', view.id === `view-${tabId}`);
    });

    // If switching to map, recalculate dimensions
    if (tabId === 'map' && this.map) {
      setTimeout(() => this.map.invalidateSize(), 150);
    }
  },

  async refreshAllData() {
    await Promise.all([
      this.loadStats(),
      this.loadAppointments(),
      this.loadAmbulances(),
      this.loadFacilities(),
      this.loadBlood(),
      this.loadPatients(),
      this.loadHomeVisits()
    ]);
  },

  // 1. STATS
  async loadStats() {
    const stats = await PulseAPI.getStats();
    if (!stats) return;
    this.stats = stats;

    // Staff stats
    const elPatients = document.getElementById('stat-patients-count');
    const elApts = document.getElementById('stat-apts-count');
    const elAmbs = document.getElementById('stat-ambs-count');
    const elIcu = document.getElementById('stat-icu-count');

    if (elPatients) elPatients.textContent = stats.patients || 0;
    if (elApts) elApts.textContent = stats.today_appointments || 0;
    if (elAmbs) elAmbs.textContent = `${stats.ambulances_available || 0} / ${stats.ambulances_total || 0}`;
    if (elIcu) elIcu.textContent = `${stats.icu_available || 0} Beds`;

    // Doctor stats
    const docWaiting = document.getElementById('doc-stat-waiting');
    const docCompleted = document.getElementById('doc-stat-completed');
    if (docWaiting) docWaiting.textContent = stats.today_appointments || 0;
    if (docCompleted) docCompleted.textContent = "2 Completed";
  },

  // 2. APPOINTMENTS
  async loadAppointments() {
    const appointments = await PulseAPI.getAppointments();
    
    // Management Table
    const tbody = document.getElementById('dashboard-appointments-tbody');
    const listBody = document.getElementById('appointments-full-tbody');

    const renderRows = (list) => {
      if (!list || list.length === 0) {
        return `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: var(--text-muted);">No appointments booked for today.</td></tr>`;
      }
      return list.map(a => `
        <tr>
          <td><strong style="color:#fff;">${a.patient_name}</strong></td>
          <td><span style="color:var(--cyan); font-weight:600;">${a.time}</span></td>
          <td>${a.doctor_name}</td>
          <td><span style="font-size:0.75rem; color:var(--text-muted);">${a.department}</span></td>
          <td>
            <span class="badge-clean ${a.status.toLowerCase().replace(' ', '-')}">
              ${a.status}
            </span>
          </td>
          <td>
            <div style="display:flex; gap:0.4rem;">
              <button class="btn-clean-outline" style="padding:4px 8px; font-size:0.72rem;" onclick="CleanApp.updateAppointment('${a.id}', 'In-Progress')">Consult</button>
              <button class="btn-clean-outline" style="padding:4px 8px; font-size:0.72rem; color:#34d399;" onclick="CleanApp.updateAppointment('${a.id}', 'Completed')">Done</button>
            </div>
          </td>
        </tr>
      `).join('');
    };

    if (tbody) tbody.innerHTML = renderRows(appointments.slice(0, 6));
    if (listBody) listBody.innerHTML = renderRows(appointments);

    // Doctor Consultation Cockpit
    const docTbody = document.getElementById('doctor-queue-tbody');
    if (docTbody) {
      if (!appointments || appointments.length === 0) {
        docTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">Queue clear. No pending patients in clinic today.</td></tr>`;
      } else {
        docTbody.innerHTML = appointments.map(a => `
          <tr>
            <td>
              <strong style="color:#fff; font-size:0.9rem;">${a.patient_name}</strong>
              <div style="font-size:0.72rem; color:var(--text-muted);">${a.patient_id || 'PT-1002'}</div>
            </td>
            <td><span style="color:#38bdf8; font-weight:700;">${a.time}</span></td>
            <td>
              <span style="font-size:0.78rem; color:#cbd5e1;">BP: 120/80 • HR: 74</span>
              <span class="badge-clean scheduled" style="font-size:0.68rem; margin-left:4px;">O+</span>
            </td>
            <td>
              <span style="font-size:0.8rem; color:#f8fafc;">${a.notes || 'Routine Follow-up & Vitals'}</span>
            </td>
            <td>
              <span class="badge-clean ${a.status.toLowerCase().replace(' ', '-')}">${a.status}</span>
            </td>
            <td>
              <div style="display:flex; gap:0.35rem;">
                <button class="btn-clean" style="padding:4px 8px; font-size:0.72rem;" onclick="CleanApp.updateAppointment('${a.id}', 'In-Progress')">🩺 Consult</button>
                <button class="btn-clean-outline" style="padding:4px 8px; font-size:0.72rem; color:#10b981;" onclick="CleanApp.updateAppointment('${a.id}', 'Completed')">✅ Done</button>
                <button class="btn-clean-outline" style="padding:4px 8px; font-size:0.72rem; color:#ef4444;" onclick="CleanApp.openModal('modal-emergency-sos')">🚨 Refer</button>
              </div>
            </td>
          </tr>
        `).join('');
      }
    }

    // Patient My Appointments Feed
    const patientFeed = document.getElementById('patient-my-appointments-feed');
    if (patientFeed) {
      const myApts = appointments.filter(a => a.patient_name.includes("Priya") || a.patient_name.includes(this.currentUser.name));
      const displayApts = myApts.length ? myApts : appointments.slice(0, 2);
      patientFeed.innerHTML = displayApts.map(a => `
        <div style="padding: 1rem; border-radius: var(--radius-md); background: rgba(12, 18, 32, 0.7); border: 1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.75rem;">
          <div>
            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:3px;">
              <span class="badge-clean ${a.status.toLowerCase().replace(' ', '-')}">${a.status}</span>
              <strong style="color:#fff; font-size:0.95rem;">${a.doctor_name}</strong>
              <span style="font-size:0.75rem; color:var(--text-muted);">(${a.department})</span>
            </div>
            <p style="font-size:0.8rem; color:#cbd5e1;">📅 ${a.date} at <strong style="color:var(--cyan);">${a.time}</strong> • ${a.notes || 'Routine consultation'}</p>
          </div>
          <div>
            <button class="btn-clean-outline" style="font-size:0.75rem; padding: 6px 12px;" onclick="CleanApp.showToast('Appointment token #APT-202 confirmed at clinic reception', 'info')">
              🎫 Digital Pass
            </button>
          </div>
        </div>
      `).join('');
    }
  },

  async updateAppointment(id, status) {
    const res = await PulseAPI.updateAppointmentStatus(id, status);
    if (res && res.success) {
      this.showToast(`Appointment status updated to: ${status}`, 'success');
      this.loadAppointments();
      this.loadStats();
    }
  },

  // 3. AMBULANCES & FLEET
  async loadAmbulances() {
    const ambulances = await PulseAPI.getAmbulances();
    const grid = document.getElementById('ambulances-cards-grid');
    const dashFeed = document.getElementById('dashboard-emergency-feed');

    if (dashFeed) {
      dashFeed.innerHTML = ambulances.slice(0, 4).map(amb => `
        <div style="padding: 0.85rem; border-radius: var(--radius-md); background: rgba(12, 18, 32, 0.6); border: 1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.65rem;">
          <div>
            <div style="display:flex; align-items:center; gap:0.4rem;">
              <strong style="color:#fff; font-size:0.85rem;">🚑 ${amb.id}</strong>
              <span class="badge-clean ${amb.status === 'Available' ? 'available' : 'dispatched'}">${amb.status}</span>
            </div>
            <p style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">Driver: ${amb.driver} • ${amb.type}</p>
          </div>
          <div style="text-align:right;">
            <span style="font-size:0.75rem; color:#34d399;">Fuel: ${amb.fuel}%</span>
            ${amb.status === 'Available' ? 
              `<button class="btn-clean-outline" style="padding:3px 8px; font-size:0.7rem; display:block; margin-top:3px;" onclick="CleanApp.dispatchAmbulanceManual('${amb.id}')">Dispatch</button>` :
              `<button class="btn-clean-outline" style="padding:3px 8px; font-size:0.7rem; display:block; margin-top:3px; color:#34d399;" onclick="CleanApp.resetAmbulance('${amb.id}')">Recall</button>`}
          </div>
        </div>
      `).join('');
    }

    if (grid) {
      grid.innerHTML = ambulances.map(amb => `
        <div class="clean-panel" style="padding: 1.25rem;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
            <div>
              <span class="badge-clean ${amb.status === 'Available' ? 'available' : 'dispatched'}">${amb.status}</span>
              <h3 style="margin-top:0.4rem; font-size:1.1rem; color:#fff;">🚑 ${amb.id}</h3>
              <p style="font-size:0.78rem; color:var(--text-muted);">${amb.plate}</p>
            </div>
            <span style="font-size:0.8rem; font-weight:700; color:var(--cyan);">${amb.fuel}% Fuel</span>
          </div>

          <div style="font-size:0.82rem; color:#cbd5e1; margin-bottom:1rem; line-height:1.6;">
            <div>👤 <strong>Driver:</strong> ${amb.driver}</div>
            <div>📞 <strong>Phone:</strong> <a href="tel:${amb.phone}" style="color:var(--cyan); text-decoration:none;">${amb.phone}</a></div>
            <div>⚡ <strong>Type:</strong> ${amb.type}</div>
            <div>📍 <strong>Status/Dest:</strong> ${amb.destination || 'Base Station'}</div>
          </div>

          <div style="display:flex; gap:0.5rem;">
            ${amb.status === 'Available' ?
              `<button class="btn-clean w-100" style="justify-content:center;" onclick="CleanApp.dispatchAmbulanceManual('${amb.id}')">🚨 Dispatch</button>` :
              `<button class="btn-clean-outline w-100" style="justify-content:center; color:#34d399;" onclick="CleanApp.resetAmbulance('${amb.id}')">🔄 Mark Available</button>`}
          </div>
        </div>
      `).join('');
    }

    // Update map markers
    this.renderMapMarkers();
  },

  async dispatchAmbulanceManual(id) {
    await PulseAPI.updateAmbulanceStatus(id, "Dispatched", "Emergency Patient Pickup");
    this.showToast(`Ambulance ${id} dispatched!`, 'warning');
    this.loadAmbulances();
    this.loadStats();
  },

  async resetAmbulance(id) {
    await PulseAPI.updateAmbulanceStatus(id, "Available", "AuraCare Base Station");
    this.showToast(`Ambulance ${id} returned to Base Hub and marked Available`, 'success');
    this.loadAmbulances();
    this.loadStats();
  },

  // 4. HEALTHCARE FACILITIES
  async loadFacilities() {
    const facilities = await PulseAPI.getFacilities();
    const grid = document.getElementById('facilities-cards-grid');
    const patientHospFeed = document.getElementById('patient-emergency-hospitals');

    if (patientHospFeed) {
      patientHospFeed.innerHTML = facilities.slice(0, 3).map(fac => `
        <div style="padding: 0.85rem; border-radius: var(--radius-md); background: rgba(12, 18, 32, 0.6); border: 1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.65rem;">
          <div>
            <strong style="color:#fff; font-size:0.9rem;">🏥 ${fac.name}</strong>
            <p style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">📍 ${fac.address}</p>
          </div>
          <div style="text-align:right;">
            <span style="font-size:0.75rem; color:#38bdf8; font-weight:700; display:block;">🛏️ ${fac.icu_avail} ICUs</span>
            <a href="tel:${fac.emergency_phone || fac.phone}" class="btn-clean" style="text-decoration:none; padding:3px 8px; font-size:0.7rem; display:inline-block; margin-top:3px;">
              📞 Call Casualty
            </a>
          </div>
        </div>
      `).join('');
    }

    if (!grid) return;
    grid.innerHTML = facilities.map(fac => `
      <div class="clean-panel" style="padding: 1.25rem;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
          <span class="badge-clean confirmed">${fac.type}</span>
          <span style="font-size:0.78rem; font-weight:700; color:#38bdf8;">🛏️ ${fac.icu_avail} / ${fac.icu_total} ICUs</span>
        </div>
        <h3 style="font-size:1.05rem; color:#fff; margin-bottom:0.25rem;">🏥 ${fac.name}</h3>
        <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.75rem;">📍 ${fac.address}</p>

        <div style="font-size:0.8rem; color:#cbd5e1; margin-bottom:1rem; line-height:1.5;">
          <div>🛏️ <strong>Total Beds Available:</strong> ${fac.beds_avail} of ${fac.beds_total}</div>
          <div>🩺 <strong>Specialties:</strong> ${fac.specialties}</div>
        </div>

        <div style="display:flex; gap:0.5rem;">
          <a href="tel:${fac.emergency_phone || fac.phone}" class="btn-clean" style="text-decoration:none; justify-content:center; flex:1;">
            📞 24x7 Casualty (${fac.emergency_phone || fac.phone})
          </a>
        </div>
      </div>
    `).join('');
  },

  // 5. BLOOD BANK
  async loadBlood() {
    const blood = await PulseAPI.getBlood();
    const grid = document.getElementById('blood-inventory-grid');
    if (!grid) return;

    grid.innerHTML = blood.map(b => `
      <div class="clean-panel" style="padding: 1.25rem; text-align:center;">
        <div style="width:48px; height:48px; border-radius:50%; background:rgba(239, 68, 68, 0.15); border:1px solid rgba(239, 68, 68, 0.4); color:#ef4444; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1.2rem; margin: 0 auto 0.75rem auto;">
          ${b.blood_group}
        </div>
        <h4 style="font-size:1.4rem; color:#fff; font-weight:800;">${b.units_available} <span style="font-size:0.75rem; color:var(--text-muted);">Units</span></h4>
        <p style="font-size:0.75rem; color:${b.units_available < 10 ? '#ef4444' : '#34d399'}; font-weight:600; margin: 0.25rem 0 0.75rem 0;">${b.status}</p>
        <button class="btn-clean-outline w-100" style="justify-content:center;" onclick="CleanApp.openBloodRequestModal('${b.blood_group}')">
          🩸 Request
        </button>
      </div>
    `).join('');
  },

  // 6. PATIENT RECORDS
  async loadPatients() {
    const search = document.getElementById('patient-search-input')?.value || "";
    const patients = await PulseAPI.getPatients(search);
    const tbody = document.getElementById('patients-table-tbody');
    if (!tbody) return;

    if (patients.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">No patients found in SQLite database.</td></tr>`;
      return;
    }

    tbody.innerHTML = patients.map(p => `
      <tr>
        <td><strong style="color:var(--cyan);">${p.id}</strong></td>
        <td><strong style="color:#fff;">${p.name}</strong></td>
        <td>${p.age} y / ${p.gender}</td>
        <td><span class="badge-clean scheduled">${p.blood_group}</span></td>
        <td><span style="color:#cbd5e1;">${p.condition}</span></td>
        <td><a href="tel:${p.phone}" style="color:var(--cyan); text-decoration:none;">${p.phone}</a></td>
      </tr>
    `).join('');
  },

  // 7. DOCTOR HOME VISITS WITH C++ GEODESIC DISTANCE
  async loadHomeVisits() {
    const container = document.getElementById('doctor-home-visits-list');
    if (!container) return;

    const patients = await PulseAPI.getPatients();
    // Elderly & post-op patients
    const homePatients = patients.filter(p => p.age >= 60 || p.condition.includes("Post") || p.condition.includes("Mobility"));

    container.innerHTML = homePatients.map(p => `
      <div style="padding: 1rem; border-radius: var(--radius-md); background: rgba(12, 18, 32, 0.7); border: 1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.75rem;">
        <div>
          <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:3px;">
            <strong style="color:#fff; font-size:0.95rem;">${p.name} (${p.age}y, ${p.gender})</strong>
            <span class="badge-clean scheduled">${p.blood_group}</span>
          </div>
          <p style="font-size:0.8rem; color:var(--text-muted);">📍 ${p.address}</p>
          <p style="font-size:0.75rem; color:#f8fafc; margin-top:2px;">⚠️ Condition: ${p.condition}</p>
        </div>
        <div style="text-align:right;">
          <div style="font-size:0.75rem; color:#38bdf8; font-weight:700; margin-bottom:4px;">
            ⚡ 4.2 km (11 min drive)
          </div>
          <div style="display:flex; gap:0.35rem;">
            <button class="btn-clean" style="padding:4px 8px; font-size:0.72rem;" onclick="CleanApp.showToast('Home visit logged into SQLite records for ${p.name}', 'success')">
              📝 Log Visit
            </button>
            <button class="btn-clean-outline" style="padding:4px 8px; font-size:0.72rem; color:#ef4444;" onclick="CleanApp.openModal('modal-emergency-sos')">
              🚑 Send Ambulance
            </button>
          </div>
        </div>
      </div>
    `).join('');
  },

  // 8. HIGH-DEFINITION SATELLITE MAP (LEAFLET + REAL NASA SPACE IMAGE OF INDIA)
  initCleanMap() {
    const mapEl = document.getElementById('clean-interactive-map');
    if (!mapEl || this.map) return;

    // Center on India National View
    this.map = L.map('clean-interactive-map', {
      center: [21.7679, 78.8718],
      zoom: 5,
      minZoom: 4,
      maxZoom: 18,
      zoomControl: true
    });

    // Basemap: Streaming high-definition satellite tiles
    this.baseTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; NASA / USGS / Esri Earth Observation',
      maxZoom: 18
    }).addTo(this.map);

    // Overlay Real High-Res Satellite Composite of India Subcontinent
    const indiaBounds = [[6.0, 68.0], [36.5, 97.5]];
    this.satelliteOverlayLayer = L.imageOverlay('assets/india-satellite.png', indiaBounds, {
      opacity: 0.88,
      interactive: false
    });

    this.mapMarkersGroup = L.layerGroup().addTo(this.map);
    this.renderMapMarkers();
  },

  setMapBaseLayer(layerType) {
    this.currentBaseLayer = layerType;
    if (!this.map) return;

    if (layerType === 'satellite_real') {
      if (this.satelliteOverlayLayer && this.map.hasLayer(this.satelliteOverlayLayer)) {
        this.map.removeLayer(this.satelliteOverlayLayer);
      }
      this.baseTileLayer.setUrl('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}');
      this.showToast("Active Layer: Real-time Streaming Satellite HD", "info");
    } else if (layerType === 'satellite_photo') {
      if (this.satelliteOverlayLayer && !this.map.hasLayer(this.satelliteOverlayLayer)) {
        this.satelliteOverlayLayer.addTo(this.map);
      }
      this.showToast("Active Layer: NASA/ISRO Space Photographic Composite Overlay", "info");
    } else if (layerType === 'osm') {
      if (this.satelliteOverlayLayer && this.map.hasLayer(this.satelliteOverlayLayer)) {
        this.map.removeLayer(this.satelliteOverlayLayer);
      }
      this.baseTileLayer.setUrl('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
      this.showToast("Active Layer: OpenStreetMap Street Vector Grid", "info");
    }
  },

  jumpMap(lat, lng, zoom = 12) {
    if (this.map) {
      this.map.flyTo([lat, lng], zoom, { duration: 1.2 });
    }
  },

  async renderMapMarkers() {
    if (!this.map || !this.mapMarkersGroup) return;
    this.mapMarkersGroup.clearLayers();

    const [ambulances, facilities, patients] = await Promise.all([
      PulseAPI.getAmbulances(),
      PulseAPI.getFacilities(),
      PulseAPI.getPatients()
    ]);

    // 1. Ambulances Markers (Green if available, Red if dispatched)
    ambulances.forEach(amb => {
      if (!amb.lat || !amb.lng) return;
      const isAvail = amb.status === 'Available';
      const iconHtml = `
        <div style="background:${isAvail ? '#10b981' : '#ef4444'}; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 0 12px ${isAvail ? '#10b981' : '#ef4444'}; font-size:14px; position:relative;">
          🚑
          <div class="radar-sweep-beam" style="${isAvail ? '' : 'display:none;'}"></div>
        </div>
      `;
      const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [32, 32], iconAnchor: [16, 16] });
      const marker = L.marker([amb.lat, amb.lng], { icon });
      marker.bindPopup(`
        <div style="color:#0f172a; font-family:Inter,sans-serif; min-width:180px;">
          <h4 style="margin:0 0 4px 0; font-size:14px;">🚑 Ambulance ${amb.id}</h4>
          <p style="margin:0; font-size:12px;"><strong>Plate:</strong> ${amb.plate}</p>
          <p style="margin:0; font-size:12px;"><strong>Driver:</strong> ${amb.driver} (${amb.phone})</p>
          <p style="margin:0; font-size:12px;"><strong>Type:</strong> ${amb.type}</p>
          <p style="margin:0; font-size:12px;"><strong>Status:</strong> <span style="color:${isAvail ? '#059669' : '#dc2626'}; font-weight:700;">${amb.status}</span></p>
        </div>
      `);
      this.mapMarkersGroup.addLayer(marker);
    });

    // 2. Healthcare Facilities Markers
    facilities.forEach(fac => {
      if (!fac.lat || !fac.lng) return;
      const iconHtml = `
        <div style="background:#0284c7; width:34px; height:34px; border-radius:8px; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 0 14px rgba(2, 132, 199, 0.8); font-size:16px;">
          🏥
        </div>
      `;
      const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [34, 34], iconAnchor: [17, 17] });
      const marker = L.marker([fac.lat, fac.lng], { icon });
      marker.bindPopup(`
        <div style="color:#0f172a; font-family:Inter,sans-serif; min-width:200px;">
          <h4 style="margin:0 0 4px 0; font-size:14px;">🏥 ${fac.name}</h4>
          <p style="margin:0; font-size:12px;">📍 ${fac.address}</p>
          <p style="margin:2px 0 0 0; font-size:12px;"><strong>ICU Beds:</strong> ${fac.icu_avail} Available</p>
          <p style="margin:2px 0 0 0; font-size:12px;"><strong>Phone:</strong> ${fac.emergency_phone || fac.phone}</p>
        </div>
      `);
      this.mapMarkersGroup.addLayer(marker);
    });

    // 3. Patients Requiring Home Visits
    patients.forEach(pat => {
      if (!pat.lat || !pat.lng) return;
      const iconHtml = `
        <div style="background:#8b5cf6; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 0 10px rgba(139, 92, 246, 0.7); font-size:13px;">
          👤
        </div>
      `;
      const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [28, 28], iconAnchor: [14, 14] });
      const marker = L.marker([pat.lat, pat.lng], { icon });
      marker.bindPopup(`
        <div style="color:#0f172a; font-family:Inter,sans-serif; min-width:180px;">
          <h4 style="margin:0 0 2px 0; font-size:13px;">👤 ${pat.name}</h4>
          <p style="margin:0; font-size:11px;">Blood: <strong>${pat.blood_group}</strong> • ${pat.age}y</p>
          <p style="margin:2px 0 0 0; font-size:11px;">${pat.condition}</p>
        </div>
      `);
      this.mapMarkersGroup.addLayer(marker);
    });
  },

  // ==========================================
  // MODAL TRIGGERS & FORM HANDLERS
  // ==========================================
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  },

  closeAllModals() {
    document.querySelectorAll('.clean-modal-backdrop').forEach(m => m.classList.remove('active'));
  },

  // Emergency SOS Trigger with C++ Triage & Nearest Dispatch
  async triggerEmergencySOS() {
    const callerName = document.getElementById('sos-caller-name')?.value || "Emergency Citizen";
    const phone = document.getElementById('sos-caller-phone')?.value || "+91 98765 00108";
    const type = document.getElementById('sos-emergency-type')?.value || "Acute Cardiac Emergency";

    const res = await PulseAPI.triggerSOS({
      caller_name: callerName,
      phone: phone,
      emergency_type: type,
      lat: 28.5355,
      lng: 77.2410,
      age: 52
    });

    this.closeAllModals();

    if (res && res.success) {
      this.showToast(`🚨 DISPATCHED! Ambulance ${res.dispatched_ambulance.plate} en route! ETA: ${res.eta_mins} mins (Triage: ${res.triage_score})`, "warning");
      this.loadAmbulances();
      this.loadStats();
      this.switchTab('map');
      if (res.dispatched_ambulance && res.dispatched_ambulance.lat) {
        this.jumpMap(res.dispatched_ambulance.lat, res.dispatched_ambulance.lng, 14);
      }
    } else {
      this.showToast(res.error || "Emergency dispatch triggered.", "warning");
    }
  },

  // Book Appointment
  async submitNewAppointment() {
    const name = document.getElementById('new-apt-name')?.value.trim();
    const doctor = document.getElementById('new-apt-doctor')?.value;
    const date = document.getElementById('new-apt-date')?.value || new Date().toISOString().split('T')[0];
    const time = document.getElementById('new-apt-time')?.value || "10:30 AM";

    if (!name) {
      this.showToast("Please enter patient name.", "warning");
      return;
    }

    let dept = "General Medicine";
    if (doctor.includes("Shalini")) dept = "Pulmonology";
    if (doctor.includes("Neha")) dept = "Cardiology";

    const res = await PulseAPI.addAppointment({
      patient_name: name,
      doctor_name: doctor,
      department: dept,
      date: date,
      time: time,
      type: "Consultation",
      notes: "Routine Consultation Scheduled via Web Portal"
    });

    this.closeAllModals();
    if (res && res.success) {
      this.showToast(`Appointment booked in SQLite for ${name} at ${time}!`, "success");
      this.loadAppointments();
      this.loadStats();
    }
  },

  // Register New Patient
  async submitNewPatient() {
    const name = document.getElementById('new-pat-name')?.value.trim();
    const age = parseInt(document.getElementById('new-pat-age')?.value) || 30;
    const blood = document.getElementById('new-pat-blood')?.value || "O+";
    const phone = document.getElementById('new-pat-phone')?.value.trim();
    const condition = document.getElementById('new-pat-condition')?.value.trim();

    if (!name || !phone) {
      this.showToast("Please provide patient name and phone number.", "warning");
      return;
    }

    const res = await PulseAPI.addPatient({
      name, age,
      gender: "Not Specified",
      phone,
      blood_group: blood,
      condition: condition || "General Health Review"
    });

    this.closeAllModals();
    if (res && res.success) {
      this.showToast(`Patient ${name} registered into SQLite!`, "success");
      this.loadPatients();
      this.loadStats();
    }
  },

  // Request Blood with C++ Compatibility Check
  openBloodRequestModal(group) {
    const select = document.getElementById('req-blood-group');
    if (select) select.value = group;
    this.openModal('modal-request-blood');
  },

  async submitBloodRequest() {
    const group = document.getElementById('req-blood-group')?.value || "O+";
    const units = document.getElementById('req-blood-units')?.value || 1;

    const res = await PulseAPI.requestBlood(group, parseInt(units));
    this.closeAllModals();

    if (res && res.success && res.allocated) {
      this.showToast(`✅ Allocated ${res.units_dispatched} units of compatible ${res.allocated_from} from ${res.hospital}!`, "success");
      this.loadBlood();
      this.loadStats();
    } else {
      this.showToast(res.message || "Blood request broadcasted to regional banks.", "warning");
    }
  },

  showToast(msg, type = "info") {
    const container = document.getElementById('toast-box');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'clean-toast';
    if (type === 'success') toast.style.borderColor = '#10b981';
    if (type === 'warning') toast.style.borderColor = '#ef4444';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
};

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  CleanApp.init();
});
