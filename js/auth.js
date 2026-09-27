/**
 * PulseSync Role-Based Authentication & Gateway System
 * Manages 3 distinct personas: Clinic Management Staff, Doctors, and Patients
 * Controls access, dynamic dashboard views, and tailored role themes.
 */

const ROLES = {
  STAFF: {
    id: 'clinic_staff',
    name: 'Clinic Management Staff',
    subtitle: 'Full Administrative, Dispatch & Blood Coordination Access',
    badge: '🏥 Clinic Admin & Staff',
    avatar: '🏥',
    themeClass: 'role-theme-staff',
    user: {
      name: 'Sunita Mehra',
      designation: 'Head Clinic Administrator & Dispatcher',
      department: 'Central Administration'
    }
  },
  DOCTOR: {
    id: 'doctor',
    name: 'Dr. Rajesh Sharma, MD',
    subtitle: 'Consulting Physician & Clinical Queue Portal',
    badge: '🩺 Dr. Rajesh Sharma',
    avatar: '👨‍⚕️',
    themeClass: 'role-theme-doctor',
    user: {
      name: 'Dr. Rajesh Sharma',
      designation: 'Senior Consultant - General Medicine',
      department: 'General Medicine & Cardiology Review'
    }
  },
  PATIENT: {
    id: 'patient',
    name: 'Ramesh Sharma (Patient)',
    subtitle: 'Appointments, Medical History, Ambulance & Blood Search',
    badge: '👤 Patient: Ramesh Sharma',
    avatar: '👤',
    themeClass: 'role-theme-patient',
    user: {
      patientId: 'PT-1001',
      name: 'Ramesh Sharma',
      age: 58,
      gender: 'Male',
      bloodGroup: 'O+',
      phone: '+91 98231 44521'
    }
  }
};

class AuthSystem {
  constructor() {
    this.currentRole = localStorage.getItem('pulsesync_role') || null;
    this.currentUser = null;
  }

  init() {
    if (!this.currentRole) {
      // First visit: Show Entry Role Gateway right before accessing the site
      this.showGateway();
    } else {
      this.applyRole(this.currentRole);
    }
  }

  showGateway() {
    const gateway = document.getElementById('role-entry-gateway');
    if (gateway) {
      gateway.style.display = 'flex';
      document.body.classList.add('gateway-active');
    }
  }

  hideGateway() {
    const gateway = document.getElementById('role-entry-gateway');
    if (gateway) {
      gateway.style.display = 'none';
      document.body.classList.remove('gateway-active');
    }
  }

  selectRole(roleId) {
    let normalized = roleId.toUpperCase();
    if (roleId === 'clinic_staff') normalized = 'STAFF';
    const roleConfig = ROLES[normalized];
    if (!roleConfig) {
      console.warn("Invalid role:", roleId);
      return;
    }
    if (!roleConfig) return;

    this.currentRole = roleConfig.id;
    this.currentUser = roleConfig.user;
    localStorage.setItem('pulsesync_role', this.currentRole);

    this.hideGateway();
    this.applyRole(this.currentRole);

    window.pulseAudio.playSuccessNotification();
    pulseApp.showToast(`Logged in as ${roleConfig.name}`, 'success');
  }

  switchRoleModal() {
    this.showGateway();
  }

  logout() {
    localStorage.removeItem('pulsesync_role');
    this.currentRole = null;
    this.currentUser = null;
    this.showGateway();

    pulseApp.showToast('Logged out. Please select your portal.', 'info');
  }

  applyRole(roleId) {
    const html = document.documentElement;
    html.setAttribute('data-user-role', roleId);

    const config = Object.values(ROLES).find(r => r.id === roleId) || ROLES.STAFF;
    this.currentUser = config.user;

    // Update Header Role Badge
    const roleBadgeEl = document.getElementById('hdr-user-role-badge');
    if (roleBadgeEl) {
      roleBadgeEl.innerHTML = `
        <span class="role-avatar-chip">${config.avatar}</span>
        <span class="role-text-chip">${config.badge}</span>
        <button class="role-switch-btn" onclick="pulseAuth.switchRoleModal()" title="Switch User Role / Portal">⇄ Switch</button>
      `;
    }

    // Role-specific View Filtering
    this.updateRoleViews(roleId);

    // Refresh relevant components
    if (window.pulseApp) {
      window.pulseApp.updateDashboardStats();
    }
  }

  updateRoleViews(roleId) {
    const isPatient = roleId === 'patient';
    const isDoctor = roleId === 'doctor';
    const isStaff = roleId === 'clinic_staff';

    // Toggle nav items according to role
    document.querySelectorAll('[data-role-perm]').forEach(el => {
      const allowedRoles = el.getAttribute('data-role-perm').split(',');
      if (allowedRoles.includes(roleId) || allowedRoles.includes('all')) {
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    });

    // Update greeting and banner tailored to the user
    const bannerTitle = document.querySelector('.hero-title');
    const bannerSubtitle = document.querySelector('.hero-subtitle');
    const roleHeroPill = document.getElementById('role-custom-hero-pill');

    if (isPatient) {
      if (bannerTitle) bannerTitle.innerHTML = `Welcome to Your <span class="gradient-text">Patient Health Portal</span>`;
      if (bannerSubtitle) bannerSubtitle.textContent = `Hello Ramesh! Book clinic consultations with AuraCare doctors, track your medical visit history, request emergency ambulances, and find blood availability instantly.`;
      if (roleHeroPill) roleHeroPill.innerHTML = `👤 Logged in as: <strong>Ramesh Sharma (ID: PT-1001 • Blood: O+)</strong>`;

      // Render Patient-specific sections
      this.renderPatientPersonalizedDashboard();
    } else if (isDoctor) {
      if (bannerTitle) bannerTitle.innerHTML = `Physician Workspace: <span class="gradient-text">Dr. Rajesh Sharma, MD</span>`;
      if (bannerSubtitle) bannerSubtitle.textContent = `Review today's scheduled consultations, examine patient medical histories, update clinical status, and review emergency trauma alerts.`;
      if (roleHeroPill) roleHeroPill.innerHTML = `🩺 Department: <strong>General Medicine & Cardiology Review • Room 1</strong>`;

      this.renderDoctorPersonalizedDashboard();
    } else {
      // Clinic Management Staff
      if (bannerTitle) bannerTitle.innerHTML = `Unified Healthcare & <span class="gradient-text">Emergency Command Center</span>`;
      if (bannerSubtitle) bannerSubtitle.textContent = `Administrative operations hub for managing clinic appointment schedules, ambulance fleet telemetry, local hospital beds, and regional blood bank inventories.`;
      if (roleHeroPill) roleHeroPill.innerHTML = `🏥 Central Administration & Ambulance Dispatch Console`;

      this.renderStaffPersonalizedDashboard();
    }
  }

  renderPatientPersonalizedDashboard() {
    const container = document.getElementById('role-personalized-section');
    if (!container) return;

    const patient = window.pulseStore.getPatient('PT-1001');
    const appointments = (window.pulseStore.data.appointments || []).filter(a => a.patientId === 'PT-1001');

    container.innerHTML = `
      <div class="glass-panel patient-welcome-box mb-4" style="border-left: 4px solid #10b981; margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <div class="patient-avatar-big" style="width: 56px; height: 56px; border-radius: 50%; background: #10b981; color: #fff; font-size: 1.5rem; display: flex; align-items: center; justify-content: center; font-weight: bold;">
              ${patient ? patient.name.charAt(0) : 'R'}
            </div>
            <div>
              <h3 style="font-size: 1.3rem; margin-bottom: 0.2rem;">Hello, ${patient ? patient.name : 'Ramesh Sharma'}</h3>
              <p class="text-sm text-muted">
                Patient ID: <strong>PT-1001</strong> • Age: <strong>${patient ? patient.age : 58}y</strong> • Blood Group: <span class="blood-badge-inline">O+</span> • Chronic: <strong>${patient ? patient.chronicNotes : 'Diabetes Type 2'}</strong>
              </p>
            </div>
          </div>
          <div style="display: flex; gap: 0.6rem;">
            <button class="btn btn-primary btn-sm" onclick="pulseApp.openModal('new-appointment-modal')">
              📅 Book Consultation
            </button>
            <button class="btn btn-outline btn-sm" onclick="patientModule.viewProfile('PT-1001')">
              📄 View My Full Medical File
            </button>
            <button class="btn btn-danger btn-sm" onclick="pulseApp.openEmergencySosModal()">
              🚨 Emergency Ambulance SOS
            </button>
          </div>
        </div>

        <div style="margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--border-subtle);">
          <h4 style="font-size: 0.95rem; margin-bottom: 0.6rem; color: var(--primary);">My Active Appointments (${appointments.length})</h4>
          <div class="dash-preview-list">
            ${appointments.map(a => `
              <div class="dash-preview-item" style="border-left: 3px solid var(--primary);">
                <span class="dash-preview-time">${a.timeSlot}</span>
                <div class="dash-preview-info">
                  <strong>${a.doctor} (${a.department})</strong>
                  <span class="text-sm text-muted">${a.reason} • Date: ${a.date}</span>
                </div>
                <span class="badge badge-info">${a.status}</span>
                <button class="btn btn-sm btn-ghost" onclick="appointmentModule.printSlip('${a.id}')">🖨️ Pass</button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  renderDoctorPersonalizedDashboard() {
    const container = document.getElementById('role-personalized-section');
    if (!container) return;

    const myAppointments = (window.pulseStore.data.appointments || []).filter(a => a.doctor.includes('Rajesh Sharma'));
    const inWaiting = myAppointments.filter(a => a.status === 'Checked-In' || a.status === 'In-Consultation');

    container.innerHTML = `
      <div class="glass-panel doctor-welcome-box mb-4" style="border-left: 4px solid #3b82f6; margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <div style="width: 56px; height: 56px; border-radius: 50%; background: #3b82f6; color: #fff; font-size: 1.5rem; display: flex; align-items: center; justify-content: center; font-weight: bold;">
              👨‍⚕️
            </div>
            <div>
              <h3 style="font-size: 1.3rem; margin-bottom: 0.2rem;">Dr. Rajesh Sharma, MD</h3>
              <p class="text-sm text-muted">
                OPD Room 1 • Senior Physician • <strong>${myAppointments.length} Consultations Assigned Today</strong> (<strong class="text-warning">${inWaiting.length} In Queue</strong>)
              </p>
            </div>
          </div>
          <div style="display: flex; gap: 0.6rem;">
            <button class="btn btn-primary btn-sm" onclick="pulseApp.switchView('appointments')">
              🩺 Open Clinical Queue
            </button>
            <button class="btn btn-outline btn-sm" onclick="pulseApp.switchView('patients')">
              👥 Search Patient Records
            </button>
          </div>
        </div>

        <div style="margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--border-subtle);">
          <h4 style="font-size: 0.95rem; margin-bottom: 0.6rem; color: #3b82f6;">Patients Waiting for Dr. Rajesh Sharma:</h4>
          <div class="dash-preview-list">
            ${myAppointments.slice(0, 3).map(a => `
              <div class="dash-preview-item" style="border-left: 3px solid #3b82f6;">
                <span class="dash-preview-time">${a.timeSlot}</span>
                <div class="dash-preview-info">
                  <strong>${a.patientName} (${a.patientId})</strong>
                  <span class="text-sm text-muted">Complaint: ${a.reason}</span>
                </div>
                <select class="form-select form-select-sm" style="width: 140px;" onchange="appointmentModule.updateStatus('${a.id}', this.value)">
                  <option value="Scheduled" ${a.status === 'Scheduled' ? 'selected' : ''}>Scheduled</option>
                  <option value="Checked-In" ${a.status === 'Checked-In' ? 'selected' : ''}>Checked-In</option>
                  <option value="In-Consultation" ${a.status === 'In-Consultation' ? 'selected' : ''}>In-Consultation</option>
                  <option value="Completed" ${a.status === 'Completed' ? 'selected' : ''}>Completed</option>
                </select>
                <button class="btn btn-sm btn-outline" onclick="patientModule.viewProfile('${a.patientId}')">History</button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  renderStaffPersonalizedDashboard() {
    const container = document.getElementById('role-personalized-section');
    if (!container) return;
    // For clinic management staff, show clinic operations bar
    container.innerHTML = `
      <div class="glass-panel mb-4" style="border-left: 4px solid var(--primary); margin-bottom: 1.5rem; background: rgba(6, 182, 212, 0.06);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h4 style="font-size: 1.05rem; margin-bottom: 0.2rem; color: var(--primary);">🏥 Clinic Administrative Operations Console</h4>
            <p class="text-sm text-muted">Welcome, Sunita Mehra (Clinic Coordinator). Full administrative dispatch and appointment modification rights active.</p>
          </div>
          <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
            <button class="btn btn-sm btn-primary" onclick="pulseApp.openModal('new-appointment-modal')">+ Book Appointment</button>
            <button class="btn btn-sm btn-secondary" onclick="pulseApp.openModal('new-patient-modal')">+ Register Patient</button>
            <button class="btn btn-sm btn-danger" onclick="pulseApp.openEmergencySosModal()">🚨 Dispatch Ambulance</button>
            <button class="btn btn-sm btn-outline" onclick="pulseApp.openModal('post-blood-requirement-modal')">🩸 Broadcast Blood Need</button>
          </div>
        </div>
      </div>
    `;
  }
}

window.pulseAuth = new AuthSystem();
