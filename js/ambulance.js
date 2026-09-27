/**
 * PulseSync Ambulance & Emergency Dispatch Module
 * Fleet Live Tracking, Emergency Request Coordination, Simulated Radar Map, and ETA Ticker
 */

class AmbulanceModule {
  constructor() {
    this.fleetFilter = 'all';
    this.radarInterval = null;
    this.radarCanvas = null;
    this.radarCtx = null;
    this.radarSweepAngle = 0;
  }

  init() {
    this.bindEvents();
    this.render();
    this.initRadarCanvas();
    this.startEtaTicker();
  }

  bindEvents() {
    const fleetFilterSelect = document.getElementById('ambulance-fleet-filter');
    if (fleetFilterSelect) {
      fleetFilterSelect.addEventListener('change', (e) => {
        this.fleetFilter = e.target.value;
        this.renderFleet();
      });
    }
  }

  render() {
    this.renderActiveRequests();
    this.renderFleet();
    this.populateAmbulanceSelect();
  }

  renderActiveRequests() {
    const container = document.getElementById('active-ambulance-requests-container');
    const countBadge = document.getElementById('active-ambulance-count-badge');
    if (!container) return;

    const requests = window.pulseStore.data.ambulanceRequests || [];
    const activeReqs = requests.filter(r => r.status !== 'Completed' && r.status !== 'Cancelled');
    
    if (countBadge) countBadge.textContent = `${activeReqs.length} Active Missions`;

    if (requests.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🚑</div>
          <h3>No ambulance requests logged</h3>
          <p>Request an ambulance dispatch to coordinate emergency or patient transport.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = requests.map(req => {
      const isCompleted = req.status === 'Completed';
      const assignedAmbulance = window.pulseStore.data.ambulances.find(a => a.id === req.assignedUnitId);

      return `
        <div class="dispatch-card glass-panel dispatch-severity-${req.severity ? req.severity.toLowerCase() : 'urgent'} ${isCompleted ? 'dispatch-completed' : ''}" data-id="${req.id}">
          <div class="dispatch-header">
            <div class="dispatch-title-block">
              <span class="dispatch-triage-badge triage-${req.triageCode ? req.triageCode.toLowerCase() : 'red'}">
                ${req.severity || 'Urgent'}
              </span>
              <h4 class="dispatch-patient">${req.patientName} (${req.age}y)</h4>
              <span class="badge badge-id">${req.id}</span>
            </div>

            <div class="dispatch-status-badge status-${req.status.toLowerCase().replace(' ', '-')}">
              ${req.status === 'En Route' ? '⚡ ' : ''}${req.status}
            </div>
          </div>

          <div class="dispatch-route-flow">
            <div class="route-point pickup">
              <span class="route-icon">📍</span>
              <div>
                <span class="route-label">Pickup Location:</span>
                <span class="route-val">${req.pickupAddress}</span>
              </div>
            </div>
            <div class="route-arrow">➔</div>
            <div class="route-point destination">
              <span class="route-icon">🏥</span>
              <div>
                <span class="route-label">Destination Facility:</span>
                <span class="route-val">${req.destinationFacility}</span>
              </div>
            </div>
          </div>

          <div class="dispatch-meta-grid">
            <div class="meta-box">
              <span class="meta-label">Assigned Vehicle</span>
              <span class="meta-val highlight-val">${req.assignedUnitId} ${assignedAmbulance ? `(${assignedAmbulance.type.split(' ')[0]})` : ''}</span>
            </div>
            <div class="meta-box">
              <span class="meta-label">Est. Response ETA</span>
              <span class="meta-val eta-countdown" id="eta-${req.id}">
                ${isCompleted ? 'Arrived & Closed' : `${req.estimatedEtaMinutes} mins`}
              </span>
            </div>
            <div class="meta-box">
              <span class="meta-label">Reported Time</span>
              <span class="meta-val">${req.requestedAt}</span>
            </div>
            <div class="meta-box">
              <span class="meta-label">Contact</span>
              <span class="meta-val">
                <a href="tel:${req.contact}" class="link-phone">${req.contact}</a>
              </span>
            </div>
          </div>

          <p class="dispatch-reason">
            <strong>Condition / Purpose:</strong> ${req.reason}
          </p>

          ${req.notes ? `
            <div class="dispatch-paramedic-notes">
              <span class="note-pill">Paramedic Telemetry</span> ${req.notes}
            </div>
          ` : ''}

          <div class="dispatch-actions">
            ${!isCompleted ? `
              ${req.status === 'Dispatched' ? `
                <button class="btn btn-warning btn-sm" onclick="ambulanceModule.updateRequestStatus('${req.id}', 'En Route')">
                  ⚡ Mark En Route
                </button>
              ` : ''}
              ${req.status === 'En Route' ? `
                <button class="btn btn-info btn-sm" onclick="ambulanceModule.updateRequestStatus('${req.id}', 'On Scene')">
                  📍 Mark On Scene
                </button>
              ` : ''}
              ${req.status === 'On Scene' ? `
                <button class="btn btn-success btn-sm" onclick="ambulanceModule.updateRequestStatus('${req.id}', 'Completed')">
                  ✅ Complete Mission
                </button>
              ` : ''}
              <button class="btn btn-ghost btn-sm text-danger" onclick="ambulanceModule.updateRequestStatus('${req.id}', 'Cancelled')">
                Cancel
              </button>
            ` : `
              <span class="badge badge-success">✓ Mission Complete</span>
            `}

            ${assignedAmbulance ? `
              <a href="tel:${assignedAmbulance.driverPhone}" class="btn btn-outline btn-sm">
                📞 Call Driver (${assignedAmbulance.driverName})
              </a>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  renderFleet() {
    const container = document.getElementById('ambulance-fleet-container');
    if (!container) return;

    const fleet = window.pulseStore.data.ambulances || [];
    const filtered = fleet.filter(amb => {
      if (this.fleetFilter === 'all') return true;
      return amb.status === this.fleetFilter;
    });

    container.innerHTML = filtered.map(amb => {
      const isAvailable = amb.status === 'Available';
      const isOnMission = amb.status === 'On Mission' || amb.status === 'Dispatched';

      return `
        <div class="fleet-unit-card glass-panel status-amb-${amb.status.toLowerCase().replace(' ', '-')}" data-unit="${amb.id}">
          <div class="fleet-unit-header">
            <div>
              <div class="fleet-title-row">
                <span class="fleet-id">${amb.id}</span>
                <span class="fleet-plate">${amb.vehicleNumber}</span>
              </div>
              <h5 class="fleet-type">${amb.type}</h5>
            </div>
            <span class="badge badge-amb-status ${isAvailable ? 'badge-success' : isOnMission ? 'badge-warning' : 'badge-neutral'}">
              ${isAvailable ? '🟢 Available' : isOnMission ? '🚨 On Mission' : '🔧 ' + amb.status}
            </span>
          </div>

          <div class="fleet-details">
            <div class="fleet-row">
              <span class="label-tiny">Base Hub:</span>
              <span>${amb.baseStation}</span>
            </div>
            <div class="fleet-row">
              <span class="label-tiny">Current Zone:</span>
              <span class="font-semibold text-primary">📍 ${amb.currentZone}</span>
            </div>
            <div class="fleet-row">
              <span class="label-tiny">Crew:</span>
              <span>${amb.driverName} (Driver) • ${amb.paramedic}</span>
            </div>
          </div>

          <div class="fleet-equipment">
            <span class="label-tiny">Equipped With:</span>
            <div class="equipment-tags">
              ${amb.equipment.map(eq => `<span class="eq-tag">${eq}</span>`).join('')}
            </div>
          </div>

          <div class="fleet-actions">
            ${isAvailable ? `
              <button class="btn btn-primary btn-sm w-100" onclick="ambulanceModule.quickDispatchUnit('${amb.id}')">
                🚑 Dispatch This Unit
              </button>
            ` : `
              <button class="btn btn-outline btn-sm w-100" onclick="ambulanceModule.toggleUnitStatus('${amb.id}')">
                Change Status to ${isAvailable ? 'On Mission' : 'Available'}
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');
  }

  populateAmbulanceSelect() {
    const select = document.getElementById('ambulance-unit-select');
    if (!select) return;
    const fleet = window.pulseStore.data.ambulances || [];
    select.innerHTML = '<option value="">-- Auto-Assign Nearest Available --</option>' + 
      fleet.map(a => `
        <option value="${a.id}" ${a.status !== 'Available' ? 'disabled' : ''}>
          ${a.id} - ${a.type.split('(')[0]} [${a.status}] (${a.currentZone})
        </option>
      `).join('');
  }

  quickDispatchUnit(unitId) {
    pulseApp.openModal('new-ambulance-request-modal');
    const select = document.getElementById('ambulance-unit-select');
    if (select) select.value = unitId;
  }

  toggleUnitStatus(unitId) {
    const amb = window.pulseStore.data.ambulances.find(a => a.id === unitId);
    if (!amb) return;
    const nextStatus = amb.status === 'Available' ? 'On Mission' : 'Available';
    window.pulseStore.updateAmbulanceStatus(unitId, nextStatus);
    pulseApp.showToast(`${unitId} status updated to ${nextStatus}`, 'info');
    this.render();
  }

  updateRequestStatus(requestId, newStatus) {
    window.pulseStore.updateDispatchStatus(requestId, newStatus);
    window.pulseAudio.playSuccessNotification();
    pulseApp.showToast(`Emergency Mission ${requestId} marked as ${newStatus}`, 'info');
    this.render();
    if (window.pulseApp) window.pulseApp.updateDashboardStats();
  }

  handleRequestSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    let assignedUnit = formData.get('assignedUnitId');
    if (!assignedUnit) {
      // Find first available unit
      const available = window.pulseStore.data.ambulances.find(a => a.id && a.status === 'Available');
      assignedUnit = available ? available.id : 'AMB-101';
    }

    const severity = formData.get('severity') || 'Critical';
    const triageCode = severity === 'Critical' ? 'Red' : severity === 'Urgent' ? 'Amber' : 'Green';

    const request = {
      patientName: formData.get('patientName').trim(),
      age: parseInt(formData.get('age') || '30', 10),
      contact: formData.get('contact').trim(),
      pickupAddress: formData.get('pickupAddress').trim(),
      destinationFacility: formData.get('destinationFacility').trim(),
      severity,
      triageCode,
      reason: formData.get('reason').trim(),
      assignedUnitId: assignedUnit,
      notes: formData.get('notes')?.trim() || ''
    };

    const newReq = window.pulseStore.requestAmbulance(request);
    
    // Play sound based on urgency
    if (severity === 'Critical') {
      window.pulseAudio.playEmergencyTone();
    } else {
      window.pulseAudio.playDispatchTone();
    }

    pulseApp.showToast(`Ambulance ${assignedUnit} dispatched to ${request.pickupAddress}! ETA ~${newReq.estimatedEtaMinutes} min`, 'success');

    form.reset();
    pulseApp.closeModal('new-ambulance-request-modal');
    this.render();
    if (window.pulseApp) window.pulseApp.updateDashboardStats();
  }

  startEtaTicker() {
    // Decrement ETA every 60 seconds for active units
    setInterval(() => {
      const requests = window.pulseStore.data.ambulanceRequests || [];
      let changed = false;
      requests.forEach(r => {
        if (r.status === 'Dispatched' || r.status === 'En Route') {
          if (r.estimatedEtaMinutes > 1) {
            r.estimatedEtaMinutes -= 1;
            changed = true;
          }
        }
      });
      if (changed) {
        window.pulseStore.save();
        this.renderActiveRequests();
      }
    }, 45000);
  }

  // Interactive Live Radar Canvas for fleet visualization (Performance-Optimized for Low-Spec PCs)
  initRadarCanvas() {
    const canvas = document.getElementById('ambulance-radar-canvas');
    if (!canvas) return;

    this.radarCanvas = canvas;
    this.radarCtx = canvas.getContext('2d');
    this.lastRadarDraw = 0;

    const resize = () => {
      if (!this.radarCanvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      // Cap devicePixelRatio to 1.5 to prevent GPU stalls on integrated graphics
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      this.drawRadar();
    };

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 200);
    }, { passive: true });
    resize();

    // Radar sweep animation throttled to 25 FPS and pauses when off-tab or hidden
    const animate = (timestamp) => {
      const isVisible = !document.hidden && (!window.pulseApp || window.pulseApp.currentView === 'ambulance');
      if (isVisible) {
        if (!this.lastRadarDraw || timestamp - this.lastRadarDraw >= 40) { // ~25 FPS
          this.lastRadarDraw = timestamp;
          this.radarSweepAngle += 0.035;
          if (this.radarSweepAngle > Math.PI * 2) this.radarSweepAngle = 0;
          this.drawRadar();
        }
      }
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  drawRadar() {
    if (!this.radarCanvas || !this.radarCtx) return;
    const ctx = this.radarCtx;
    const w = this.radarCanvas.width;
    const h = this.radarCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(cx, cy) * 0.88;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Background circle grid
    ctx.strokeStyle = 'rgba(2, 132, 199, 0.2)';
    ctx.lineWidth = 1;
    for (let r = 1; r <= 4; r++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (radius / 4) * r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(cx - radius, cy);
    ctx.lineTo(cx + radius, cy);
    ctx.moveTo(cx, cy - radius);
    ctx.lineTo(cx, cy + radius);
    ctx.stroke();

    // Radar sweep line & glow sector
    const sweepX = cx + radius * Math.cos(this.radarSweepAngle);
    const sweepY = cy + radius * Math.sin(this.radarSweepAngle);

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, 'rgba(6, 182, 212, 0.15)');
    grad.addColorStop(1, 'rgba(6, 182, 212, 0.02)');

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, this.radarSweepAngle - 0.4, this.radarSweepAngle);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(sweepX, sweepY);
    ctx.stroke();

    // Draw Clinic HQ Hub in center
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '10px sans-serif';
    ctx.fillText('AuraCare HQ', cx + 10, cy + 4);

    // Plot Ambulances
    const fleet = window.pulseStore.data.ambulances || [];
    fleet.forEach(amb => {
      // Map percentage coordinates (0-100) to canvas
      const px = (amb.coordinates.x / 100) * (w * 0.8) + (w * 0.1);
      const py = (amb.coordinates.y / 100) * (h * 0.8) + (h * 0.1);

      const isOnMission = amb.status === 'On Mission' || amb.status === 'Dispatched';
      const isAvailable = amb.status === 'Available';

      // Pulse ring for on-mission
      if (isOnMission) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, 12, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = isOnMission ? '#ef4444' : isAvailable ? '#10b981' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '11px sans-serif';
      ctx.fillText(amb.id, px + 9, py + 4);
    });
  }
}

window.ambulanceModule = new AmbulanceModule();
