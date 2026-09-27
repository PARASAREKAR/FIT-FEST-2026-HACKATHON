/**
 * PulseSync Patient Management Module
 * Registration, Search, Medical Profile, and Visit History
 */

class PatientModule {
  constructor() {
    this.currentFilter = '';
    this.bloodGroupFilter = '';
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    const searchInput = document.getElementById('patient-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.currentFilter = e.target.value.toLowerCase().trim();
        this.render();
      });
    }

    const bloodSelect = document.getElementById('patient-blood-filter');
    if (bloodSelect) {
      bloodSelect.addEventListener('change', (e) => {
        this.bloodGroupFilter = e.target.value;
        this.render();
      });
    }
  }

  getFilteredPatients() {
    const patients = window.pulseStore.data.patients || [];
    return patients.filter(p => {
      const matchesSearch = !this.currentFilter || 
        p.name.toLowerCase().includes(this.currentFilter) ||
        p.phone.includes(this.currentFilter) ||
        p.id.toLowerCase().includes(this.currentFilter) ||
        (p.address && p.address.toLowerCase().includes(this.currentFilter));

      const matchesBlood = !this.bloodGroupFilter || p.bloodGroup === this.bloodGroupFilter;

      return matchesSearch && matchesBlood;
    });
  }

  render() {
    const container = document.getElementById('patients-list-container');
    const countBadge = document.getElementById('patient-total-badge');
    if (!container) return;

    const list = this.getFilteredPatients();
    if (countBadge) countBadge.textContent = `${list.length} Patients`;

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">👤</div>
          <h3>No patients found</h3>
          <p>Try adjusting your search criteria or register a new patient.</p>
          <button class="btn btn-primary" onclick="pulseApp.openModal('new-patient-modal')">
            + Register First Patient
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(patient => {
      const visitsCount = patient.visitHistory ? patient.visitHistory.length : 0;
      const lastVisit = visitsCount > 0 ? patient.visitHistory[0].date : 'None recorded';

      return `
        <div class="patient-card glass-panel" data-id="${patient.id}">
          <div class="patient-card-header">
            <div class="patient-identity">
              <span class="patient-avatar">${patient.name.charAt(0)}</span>
              <div>
                <h3 class="patient-name">${patient.name}</h3>
                <div class="patient-submeta">
                  <span class="badge badge-id">${patient.id}</span>
                  <span class="meta-tag">${patient.age} yrs • ${patient.gender}</span>
                </div>
              </div>
            </div>
            <span class="blood-badge blood-${patient.bloodGroup.replace('+', 'pos').replace('-', 'neg')}">
              ${patient.bloodGroup}
            </span>
          </div>

          <div class="patient-details-grid">
            <div class="detail-item">
              <span class="detail-label">📞 Phone</span>
              <span class="detail-value">${patient.phone}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">📍 Address</span>
              <span class="detail-value text-truncate" title="${patient.address}">${patient.address || 'Not specified'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">⚠️ Allergies / Notes</span>
              <span class="detail-value ${patient.allergies && patient.allergies !== 'None' ? 'text-warning' : ''}">
                ${patient.allergies || 'None'}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">🗂️ Clinic Visits</span>
              <span class="detail-value font-semibold">${visitsCount} Visits (Last: ${lastVisit})</span>
            </div>
          </div>

          <div class="patient-card-actions">
            <button class="btn btn-outline btn-sm" onclick="patientModule.viewProfile('${patient.id}')">
              📄 View Profile & History
            </button>
            <button class="btn btn-secondary btn-sm" onclick="appointmentModule.openBookingFor('${patient.id}')">
              📅 Book Appointment
            </button>
            <a href="https://wa.me/${patient.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hello ' + patient.name + ', greetings from ' + window.pulseStore.data.clinic.name + '. We are reaching out regarding your healthcare schedule.')}" target="_blank" class="btn btn-ghost btn-sm" title="Contact on WhatsApp">
              💬 WhatsApp
            </a>
          </div>
        </div>
      `;
    }).join('');
  }

  viewProfile(patientId) {
    const patient = window.pulseStore.getPatient(patientId);
    if (!patient) return;

    const modalTitle = document.getElementById('patient-profile-title');
    const modalContent = document.getElementById('patient-profile-content');
    if (!modalTitle || !modalContent) return;

    modalTitle.textContent = `${patient.name} (${patient.id})`;

    const visits = patient.visitHistory || [];
    const visitsHtml = visits.length === 0 
      ? `<p class="text-muted">No past consultation history recorded in the system.</p>`
      : visits.map(v => `
        <div class="visit-history-item">
          <div class="visit-meta">
            <span class="visit-date">📅 ${v.date}</span>
            <span class="badge badge-info">${v.department}</span>
            <span class="text-muted">• ${v.doctor}</span>
          </div>
          <p class="visit-purpose"><strong>Purpose:</strong> ${v.purpose}</p>
          ${v.adminNotes ? `<p class="visit-notes"><strong>Administrative Notes:</strong> ${v.adminNotes}</p>` : ''}
          ${v.followUpDate ? `<p class="visit-followup text-success"><strong>Next Follow-up Scheduled:</strong> ${v.followUpDate}</p>` : ''}
        </div>
      `).join('');

    modalContent.innerHTML = `
      <div class="patient-full-profile">
        <div class="profile-header-banner">
          <div class="profile-avatar-large">${patient.name.charAt(0)}</div>
          <div class="profile-header-info">
            <h2>${patient.name}</h2>
            <p class="profile-meta-line">
              <span class="badge badge-id">${patient.id}</span>
              <span>${patient.age} Years Old</span> • 
              <span>${patient.gender}</span> • 
              <span class="blood-badge-inline">${patient.bloodGroup}</span>
            </p>
            <p class="text-muted text-sm">Registered: ${patient.registeredDate}</p>
          </div>
          <div class="profile-quick-actions">
            <button class="btn btn-outline btn-sm" onclick="patientModule.printSlip('${patient.id}')">
              🖨️ Print Record
            </button>
          </div>
        </div>

        <div class="profile-sections-grid">
          <div class="profile-section-card glass-panel">
            <h4>📋 Contact & Emergency Information</h4>
            <div class="info-row">
              <span class="info-label">Primary Contact:</span>
              <span class="info-value"><strong>${patient.phone}</strong></span>
            </div>
            <div class="info-row">
              <span class="info-label">Emergency Contact:</span>
              <span class="info-value text-danger"><strong>${patient.emergencyContact || 'Not recorded'}</strong></span>
            </div>
            <div class="info-row">
              <span class="info-label">Residential Address:</span>
              <span class="info-value">${patient.address || 'N/A'}</span>
            </div>
          </div>

          <div class="profile-section-card glass-panel">
            <h4>🩺 Health Profile (Admin Reference)</h4>
            <div class="info-row">
              <span class="info-label">Known Allergies:</span>
              <span class="info-value ${patient.allergies && patient.allergies !== 'None' ? 'badge badge-warning' : ''}">${patient.allergies || 'None'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Chronic Conditions:</span>
              <span class="info-value">${patient.chronicNotes || 'None'}</span>
            </div>
            <p class="disclaimer-mini text-muted">
              * Administrative information for clinic coordination. Not a clinical diagnosis.
            </p>
          </div>
        </div>

        <div class="visit-history-section">
          <div class="section-header-inline">
            <h4>🗂️ Clinic Visit History (${visits.length})</h4>
            <button class="btn btn-sm btn-secondary" onclick="patientModule.toggleAddVisitForm('${patient.id}')">
              + Log New Visit / Follow-up
            </button>
          </div>

          <div id="add-visit-form-container" class="add-visit-box glass-panel" style="display: none;">
            <h5>Log Clinic Visit Record for ${patient.name}</h5>
            <form id="new-visit-form" onsubmit="patientModule.submitNewVisit(event, '${patient.id}')">
              <div class="form-row">
                <div class="form-group">
                  <label>Visit Date *</label>
                  <input type="date" name="visitDate" required value="${new Date().toISOString().split('T')[0]}" class="form-input">
                </div>
                <div class="form-group">
                  <label>Consulting Doctor</label>
                  <select name="doctor" class="form-select">
                    <option value="Dr. Rajesh Sharma">Dr. Rajesh Sharma (General Medicine)</option>
                    <option value="Dr. Priya Nair">Dr. Priya Nair (Pediatrics)</option>
                    <option value="Dr. Amit Verma">Dr. Amit Verma (Orthopedics/Trauma)</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label>Purpose of Visit *</label>
                <input type="text" name="purpose" placeholder="e.g. Follow-up on blood pressure, Routine dressing" required class="form-input">
              </div>
              <div class="form-group">
                <label>Administrative Notes & Recommendations</label>
                <textarea name="adminNotes" rows="2" placeholder="e.g. Tests advised, lifestyle notes..." class="form-input"></textarea>
              </div>
              <div class="form-group">
                <label>Next Follow-Up Recommended Date</label>
                <input type="date" name="followUpDate" class="form-input">
              </div>
              <div class="form-actions-inline">
                <button type="submit" class="btn btn-primary btn-sm">Save Visit Record</button>
                <button type="button" class="btn btn-ghost btn-sm" onclick="patientModule.toggleAddVisitForm('${patient.id}')">Cancel</button>
              </div>
            </form>
          </div>

          <div class="visits-timeline">
            ${visitsHtml}
          </div>
        </div>
      </div>
    `;

    pulseApp.openModal('patient-profile-modal');
  }

  toggleAddVisitForm(patientId) {
    const box = document.getElementById('add-visit-form-container');
    if (box) {
      box.style.display = box.style.display === 'none' ? 'block' : 'none';
    }
  }

  submitNewVisit(e, patientId) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    const visit = {
      date: formData.get('visitDate'),
      doctor: formData.get('doctor'),
      purpose: formData.get('purpose'),
      adminNotes: formData.get('adminNotes'),
      followUpDate: formData.get('followUpDate')
    };

    window.pulseStore.addPatientVisit(patientId, visit);
    window.pulseAudio.playSuccessNotification();
    pulseApp.showToast('Clinic visit recorded successfully', 'success');
    this.viewProfile(patientId);
    this.render();
  }

  printSlip(patientId) {
    const patient = window.pulseStore.getPatient(patientId);
    if (!patient) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Patient Registration Slip - ${patient.name}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #222; }
          .header { border-bottom: 2px solid #008080; padding-bottom: 15px; margin-bottom: 20px; }
          .clinic-name { font-size: 22px; font-weight: bold; color: #008080; }
          .title { font-size: 16px; margin-top: 5px; color: #555; }
          .patient-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
          .row { display: flex; margin-bottom: 10px; }
          .col { flex: 1; }
          .label { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600; }
          .val { font-size: 15px; font-weight: 600; color: #0f172a; }
          .disclaimer { font-size: 11px; color: #94a3b8; margin-top: 30px; border-top: 1px dashed #cbd5e1; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">${window.pulseStore.data.clinic.name}</div>
          <div class="title">PATIENT ADMINISTRATIVE RECORD SLIP</div>
        </div>
        <div class="patient-box">
          <div class="row">
            <div class="col"><div class="label">Patient ID</div><div class="val">${patient.id}</div></div>
            <div class="col"><div class="label">Full Name</div><div class="val">${patient.name}</div></div>
            <div class="col"><div class="label">Blood Group</div><div class="val">${patient.bloodGroup}</div></div>
          </div>
          <div class="row">
            <div class="col"><div class="label">Age / Gender</div><div class="val">${patient.age} Y / ${patient.gender}</div></div>
            <div class="col"><div class="label">Contact Phone</div><div class="val">${patient.phone}</div></div>
            <div class="col"><div class="label">Emergency Contact</div><div class="val">${patient.emergencyContact || 'None'}</div></div>
          </div>
          <div class="row">
            <div class="col"><div class="label">Residential Address</div><div class="val">${patient.address}</div></div>
            <div class="col"><div class="label">Allergies / Special Notes</div><div class="val">${patient.allergies || 'None'}</div></div>
          </div>
        </div>
        <div class="disclaimer">
          Notice: For clinic coordination and administrative tracking only. Not a medical diagnosis or treatment plan. Emergency Hotline: ${window.pulseStore.data.clinic.emergencyHotline}
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  handleRegisterSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    const patient = {
      name: formData.get('name').trim(),
      age: parseInt(formData.get('age'), 10),
      gender: formData.get('gender'),
      phone: formData.get('phone').trim(),
      bloodGroup: formData.get('bloodGroup'),
      address: formData.get('address').trim(),
      emergencyContact: formData.get('emergencyContact').trim(),
      allergies: formData.get('allergies').trim() || 'None',
      chronicNotes: formData.get('chronicNotes').trim() || 'None'
    };

    const newPatient = window.pulseStore.addPatient(patient);
    window.pulseAudio.playSuccessNotification();
    pulseApp.showToast(`Patient ${newPatient.name} registered with ID ${newPatient.id}`, 'success');
    
    form.reset();
    pulseApp.closeModal('new-patient-modal');
    this.render();
  }
}

window.patientModule = new PatientModule();
