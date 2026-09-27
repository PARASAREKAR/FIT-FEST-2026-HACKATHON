/**
 * PulseSync Application Controller
 * Handles Navigation, Global Dashboard KPIs, Emergency Banners, Charts, Modals, and Theming
 */

class PulseSyncApp {
  constructor() {
    this.currentView = 'dashboard';
    this.theme = localStorage.getItem('pulsesync_theme') || 'dark';
  }

  init() {
    this.applyTheme(this.theme);
    this.bindNavigation();
    this.bindGlobalEvents();
    this.bindModals();
    this.renderEmergencyAlerts();
    this.updateDashboardStats();
    this.initCharts();

    // Subscribe to store updates to keep UI synchronized
    window.pulseStore.subscribe(() => {
      this.renderEmergencyAlerts();
      this.updateDashboardStats();
    });

    // Check URL hash for direct tab linking
    const hash = window.location.hash.replace('#', '');
    if (hash && ['dashboard', 'map', 'appointments', 'patients', 'ambulance', 'blood', 'facilities', 'analytics'].includes(hash)) {
      this.switchView(hash);
    } else {
      this.switchView('dashboard');
    }

    console.log("PulseSync Healthcare Platform initialized successfully.");
  }

  applyTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pulsesync_theme', theme);
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.innerHTML = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
    }
  }

  toggleTheme() {
    const nextTheme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextTheme);
    this.renderCharts();
  }

  bindNavigation() {
    const navItems = document.querySelectorAll('.nav-link, .bottom-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = item.getAttribute('data-view');
        if (targetView) {
          this.switchView(targetView);
        }
      });
    });
  }

  switchView(viewName) {
    this.currentView = viewName;
    window.location.hash = viewName;

    // Update active nav styling
    document.querySelectorAll('.nav-link, .bottom-nav-item').forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-view') === viewName);
    });

    // Toggle view containers
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.toggle('active', sec.id === `view-${viewName}`);
    });

    // View-specific re-renders
    if (viewName === 'appointments' && window.appointmentModule) {
      window.appointmentModule.populatePatientSelect();
      window.appointmentModule.render();
    } else if (viewName === 'patients' && window.patientModule) {
      window.patientModule.render();
    } else if (viewName === 'ambulance' && window.ambulanceModule) {
      window.ambulanceModule.render();
    } else if (viewName === 'blood' && window.bloodModule) {
      window.bloodModule.render();
    } else if (viewName === 'facilities' && window.facilitiesModule) {
      window.facilitiesModule.render();
    } else if (viewName === 'map' && window.liveMapModule) {
      window.liveMapModule.init();
    } else if (viewName === 'dashboard') {
      this.updateDashboardStats();
      this.renderCharts();
      if (window.liveMapModule) {
        window.liveMapModule.init();
      }
    } else if (viewName === 'analytics') {
      this.updateDashboardStats();
      this.renderCharts();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  bindGlobalEvents() {
    // Sound mute toggle
    const audioBtn = document.getElementById('audio-mute-btn');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const isMuted = window.pulseAudio.toggleMute();
        audioBtn.innerHTML = isMuted ? '🔇 Audio Off' : '🔊 Audio On';
        this.showToast(isMuted ? 'Emergency Audio Alerts Muted' : 'Audio Alerts Enabled', 'info');
      });
    }

    // Global Fast Search
    const globalSearchInput = document.getElementById('global-quick-search');
    if (globalSearchInput) {
      globalSearchInput.addEventListener('input', (e) => {
        this.handleGlobalSearch(e.target.value.toLowerCase().trim());
      });
      globalSearchInput.addEventListener('focus', () => {
        const resultsBox = document.getElementById('global-search-results');
        if (resultsBox && globalSearchInput.value.trim()) resultsBox.style.display = 'block';
      });
    }

    // Close search on outside click
    document.addEventListener('click', (e) => {
      const searchBox = document.querySelector('.global-search-wrapper');
      const resultsBox = document.getElementById('global-search-results');
      if (searchBox && !searchBox.contains(e.target) && resultsBox) {
        resultsBox.style.display = 'none';
      }
    });

    // Keyboard shortcuts (Escape closes modals, '?' shows shortcuts)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
  }

  handleGlobalSearch(query) {
    const resultsBox = document.getElementById('global-search-results');
    if (!resultsBox) return;

    if (!query) {
      resultsBox.style.display = 'none';
      return;
    }

    resultsBox.style.display = 'block';

    const patients = window.pulseStore.data.patients || [];
    const appointments = window.pulseStore.data.appointments || [];
    const bloodBanks = window.pulseStore.data.bloodBanks || [];

    const matchedPatients = patients.filter(p => 
      p.name.toLowerCase().includes(query) || p.phone.includes(query) || p.id.toLowerCase().includes(query) || p.bloodGroup.toLowerCase() === query
    ).slice(0, 4);

    const matchedApts = appointments.filter(a => 
      a.patientName.toLowerCase().includes(query) || a.id.toLowerCase().includes(query) || a.doctor.toLowerCase().includes(query)
    ).slice(0, 3);

    const matchedBanks = bloodBanks.filter(b => 
      b.name.toLowerCase().includes(query) || b.zone.toLowerCase().includes(query)
    ).slice(0, 2);

    let html = '';

    if (matchedPatients.length > 0) {
      html += `<div class="search-category-title">👤 Patients (${matchedPatients.length})</div>`;
      html += matchedPatients.map(p => `
        <div class="search-item" onclick="pulseApp.selectSearchResult('patient', '${p.id}')">
          <span class="search-item-primary">${p.name} (${p.id})</span>
          <span class="search-item-meta">${p.phone} • Blood: <strong>${p.bloodGroup}</strong></span>
        </div>
      `).join('');
    }

    if (matchedApts.length > 0) {
      html += `<div class="search-category-title">📅 Appointments (${matchedApts.length})</div>`;
      html += matchedApts.map(a => `
        <div class="search-item" onclick="pulseApp.selectSearchResult('appointment', '${a.id}')">
          <span class="search-item-primary">${a.patientName} (${a.timeSlot} - ${a.status})</span>
          <span class="search-item-meta">${a.doctor} • ${a.date}</span>
        </div>
      `).join('');
    }

    if (matchedBanks.length > 0) {
      html += `<div class="search-category-title">🏥 Blood Banks (${matchedBanks.length})</div>`;
      html += matchedBanks.map(b => `
        <div class="search-item" onclick="pulseApp.selectSearchResult('blood', '${b.id}')">
          <span class="search-item-primary">${b.name}</span>
          <span class="search-item-meta">Zone: ${b.zone} • ${b.distanceKm} km</span>
        </div>
      `).join('');
    }

    if (!html) {
      html = `<div class="search-empty">No records matching "${query}"</div>`;
    }

    resultsBox.innerHTML = html;
  }

  selectSearchResult(type, id) {
    const resultsBox = document.getElementById('global-search-results');
    if (resultsBox) resultsBox.style.display = 'none';

    if (type === 'patient') {
      this.switchView('patients');
      window.patientModule.viewProfile(id);
    } else if (type === 'appointment') {
      this.switchView('appointments');
      const card = document.querySelector(`.appointment-card[data-id="${id}"]`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('highlight-flash');
        setTimeout(() => card.classList.remove('highlight-flash'), 2500);
      }
    } else if (type === 'blood') {
      this.switchView('blood');
    }
  }

  // Modals management
  bindModals() {
    // Backdrop click listener
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    });

    // Close buttons
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-overlay');
        if (modal) modal.classList.remove('active');
      });
    });
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      if (modalId === 'new-appointment-modal') {
        window.appointmentModule.populatePatientSelect();
      } else if (modalId === 'new-ambulance-request-modal') {
        window.ambulanceModule.populateAmbulanceSelect();
      }
      modal.classList.add('active');
      const firstInput = modal.querySelector('input:not([type=hidden]), select, textarea');
      if (firstInput) setTimeout(() => firstInput.focus(), 100);
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  }

  // EMERGENCY ALERT BANNER
  renderEmergencyAlerts() {
    const container = document.getElementById('emergency-alerts-banner-container');
    if (!container) return;

    const alerts = window.pulseStore.data.emergencyAlerts || [];
    const activeAlerts = alerts.filter(a => a.active);

    if (activeAlerts.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    container.innerHTML = `
      <div class="emergency-banner-bar">
        <div class="banner-pulse-icon">🚨</div>
        <div class="banner-ticker-content">
          ${activeAlerts.map(a => `
            <div class="banner-alert-item alert-${a.code.toLowerCase().replace(' ', '-')}">
              <span class="badge ${a.code.includes('RED') ? 'badge-danger' : 'badge-warning'}">${a.code}</span>
              <strong class="alert-title">${a.title}</strong>
              <span class="alert-loc">📍 ${a.location}</span>
              <span class="alert-eta">${a.time}</span>
              <button class="btn-dismiss-alert" onclick="pulseApp.dismissAlert('${a.id}')" title="Acknowledge & Dismiss Alert">✕</button>
            </div>
          `).join('')}
        </div>
        <div class="banner-actions">
          <button class="btn btn-sm btn-danger pulse-emergency-btn" onclick="pulseApp.openEmergencySosModal()">
            ⚡ Emergency SOS Dispatch
          </button>
        </div>
      </div>
    `;
  }

  dismissAlert(id) {
    window.pulseStore.dismissAlert(id);
    this.renderEmergencyAlerts();
  }

  openEmergencySosModal() {
    window.pulseAudio.playEmergencyTone();
    this.openModal('emergency-sos-modal');
  }

  handleEmergencySosSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    const request = {
      patientName: formData.get('patientName').trim(),
      age: parseInt(formData.get('age') || '40', 10),
      contact: formData.get('contact').trim(),
      pickupAddress: formData.get('pickupAddress').trim(),
      destinationFacility: formData.get('destinationFacility') || "Apex Multi-Specialty Trauma Center",
      severity: "Critical",
      triageCode: "Red",
      reason: "🚨 CRITICAL EMERGENCY SOS: " + formData.get('emergencyReason').trim(),
      notes: "Triggered via Instant Rapid SOS Command"
    };

    const newReq = window.pulseStore.requestAmbulance(request);
    window.pulseAudio.playEmergencyTone();
    this.showToast(`EMERGENCY SOS: Ambulance ${newReq.assignedUnitId} Dispatched to ${request.pickupAddress}!`, 'danger');

    form.reset();
    this.closeModal('emergency-sos-modal');
    this.switchView('ambulance');
  }

  // DASHBOARD KPIS & STATS
  updateDashboardStats() {
    const patients = window.pulseStore.data.patients || [];
    const appointments = window.pulseStore.data.appointments || [];
    const ambulanceReqs = window.pulseStore.data.ambulanceRequests || [];
    const bloodReqs = window.pulseStore.data.bloodRequirements || [];
    const todayStr = new Date().toISOString().split('T')[0];

    const todayApts = appointments.filter(a => a.date === todayStr);
    const checkedInCount = todayApts.filter(a => a.status === 'Checked-In' || a.status === 'In-Consultation').length;
    const activeAmbulances = ambulanceReqs.filter(a => a.status !== 'Completed' && a.status !== 'Cancelled').length;
    const openBloodReqs = bloodReqs.filter(b => !b.status.toLowerCase().includes('fulfilled')).length;

    // Update stat numbers
    this.setText('stat-today-apts', todayApts.length);
    this.setText('stat-checked-in', checkedInCount);
    this.setText('stat-active-ambulances', activeAmbulances);
    this.setText('stat-blood-requests', openBloodReqs);
    this.setText('stat-total-patients', patients.length);

    // Header badge updates
    this.setText('hdr-active-ambulances-badge', activeAmbulances);
    this.setText('hdr-today-apts-badge', todayApts.length);

    // Dashboard today appointment preview list
    const previewContainer = document.getElementById('dashboard-today-apts-preview');
    if (previewContainer) {
      if (todayApts.length === 0) {
        previewContainer.innerHTML = `<p class="text-muted text-sm p-3">No appointments scheduled for today.</p>`;
      } else {
        previewContainer.innerHTML = todayApts.slice(0, 4).map(apt => `
          <div class="dash-preview-item">
            <span class="dash-preview-time">${apt.timeSlot}</span>
            <div class="dash-preview-info">
              <span class="dash-preview-name">${apt.patientName}</span>
              <span class="dash-preview-meta text-muted">${apt.doctor}</span>
            </div>
            <span class="badge badge-status-sm ${apt.status === 'Completed' ? 'badge-success' : apt.status.includes('Consultation') ? 'badge-info' : 'badge-warning'}">
              ${apt.status}
            </span>
          </div>
        `).join('');
      }
    }

    // Dashboard active emergency preview list
    const emergContainer = document.getElementById('dashboard-emergency-preview');
    if (emergContainer) {
      const activeMissions = ambulanceReqs.filter(a => a.status !== 'Completed' && a.status !== 'Cancelled');
      if (activeMissions.length === 0) {
        emergContainer.innerHTML = `<p class="text-muted text-sm p-3">All ambulance units currently at base or available.</p>`;
      } else {
        emergContainer.innerHTML = activeMissions.map(m => `
          <div class="dash-emerg-item">
            <span class="dash-emerg-icon">🚑</span>
            <div class="dash-emerg-info">
              <strong>${m.patientName} (${m.severity})</strong>
              <span class="text-sm text-muted">To: ${m.destinationFacility}</span>
            </div>
            <span class="dash-emerg-eta">${m.estimatedEtaMinutes}m ETA</span>
          </div>
        `).join('');
      }
    }
  }

  setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  // CHARTS RENDERING (Canvas-based high performance charts)
  initCharts() {
    this.renderCharts();
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => this.renderCharts(), 200);
    }, { passive: true });
  }

  renderCharts() {
    this.drawDepartmentChart();
    this.drawBloodStockChart();
  }

  drawDepartmentChart() {
    const canvas = document.getElementById('chart-departments-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * (window.devicePixelRatio || 1);
    canvas.height = rect.height * (window.devicePixelRatio || 1);

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const appointments = window.pulseStore.data.appointments || [];
    const deptCounts = {};
    appointments.forEach(a => {
      const d = a.department || 'General Medicine';
      deptCounts[d] = (deptCounts[d] || 0) + 1;
    });

    const colors = ['#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
    const labels = Object.keys(deptCounts);
    const values = Object.values(deptCounts);
    const total = values.reduce((a, b) => a + b, 0) || 1;

    // Draw Donut
    const cx = w * 0.35;
    const cy = h / 2;
    const outerR = Math.min(cx, cy) * 0.8;
    const innerR = outerR * 0.55;

    let startAngle = -Math.PI / 2;

    labels.forEach((label, i) => {
      const sliceAngle = (values[i] / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
      ctx.arc(cx, cy, innerR, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      startAngle += sliceAngle;
    });

    // Draw Donut Center text
    ctx.fillStyle = this.theme === 'dark' ? '#f8fafc' : '#0f172a';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${total}`, cx, cy + 4);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Consults', cx, cy + 18);

    // Draw Legend on right side
    const legendX = w * 0.65;
    let legendY = 25;
    ctx.textAlign = 'left';

    labels.forEach((label, i) => {
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(legendX, legendY, 10, 10);

      ctx.fillStyle = this.theme === 'dark' ? '#cbd5e1' : '#334155';
      ctx.font = '11px sans-serif';
      const shortLabel = label.split('&')[0].trim();
      ctx.fillText(`${shortLabel} (${values[i]})`, legendX + 16, legendY + 9);
      legendY += 22;
    });
  }

  drawBloodStockChart() {
    const canvas = document.getElementById('chart-blood-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * (window.devicePixelRatio || 1);
    canvas.height = rect.height * (window.devicePixelRatio || 1);

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (!window.bloodModule) return;
    const totals = window.bloodModule.getTotalStockPerGroup();
    const groups = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
    const maxVal = Math.max(...Object.values(totals), 50);

    const barWidth = (w - 60) / groups.length - 8;
    const chartBottom = h - 30;
    const chartTop = 20;
    const chartHeight = chartBottom - chartTop;

    // Draw grid line
    ctx.strokeStyle = this.theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    ctx.beginPath();
    ctx.moveTo(35, chartBottom);
    ctx.lineTo(w - 15, chartBottom);
    ctx.stroke();

    groups.forEach((grp, i) => {
      const val = totals[grp] || 0;
      const barH = (val / maxVal) * chartHeight;
      const x = 40 + i * (barWidth + 8);
      const y = chartBottom - barH;

      // Color coding: red for critical < 5, amber for 5-14, emerald for 15+
      ctx.fillStyle = val < 5 ? '#ef4444' : val < 15 ? '#f59e0b' : '#10b981';
      ctx.fillRect(x, y, barWidth, barH);

      // Label below bar
      ctx.fillStyle = this.theme === 'dark' ? '#94a3b8' : '#64748b';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(grp, x + barWidth / 2, chartBottom + 16);

      // Value above bar
      ctx.fillStyle = this.theme === 'dark' ? '#f1f5f9' : '#0f172a';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(`${val}`, x + barWidth / 2, y - 5);
    });
  }

  // BACKUP & RESTORE
  downloadBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(window.pulseStore.exportJSON());
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `pulsesync_backup_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
    this.showToast('Backup JSON exported successfully', 'success');
  }

  resetDemoData() {
    if (confirm("Reset all patient records, appointments, and dispatches to original demo data?")) {
      window.pulseStore.resetToDefault();
      this.showToast('Platform reset to original demo data', 'info');
      setTimeout(() => window.location.reload(), 600);
    }
  }

  // TOAST NOTIFICATIONS
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    const icon = type === 'success' ? '✅' : type === 'danger' ? '🚨' : type === 'warning' ? '⚠️' : 'ℹ️';

    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-text">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-fadeout');
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  }
}

// Instantiate and expose globally
window.pulseApp = new PulseSyncApp();
