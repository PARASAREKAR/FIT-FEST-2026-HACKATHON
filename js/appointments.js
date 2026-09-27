/**
 * PulseSync Appointment Management Module
 * Scheduling, Calendar Filtering, Status Updates, and Follow-up Reminders
 */

class AppointmentModule {
  constructor() {
    this.dateFilter = 'today'; // 'today', 'upcoming', 'past', 'all'
    this.statusFilter = 'all';
    this.doctorFilter = 'all';
    this.searchQuery = '';
  }

  init() {
    this.bindEvents();
    this.render();
    this.populatePatientSelect();
  }

  bindEvents() {
    const searchInput = document.getElementById('appointment-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.render();
      });
    }

    const statusSelect = document.getElementById('appointment-status-filter');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        this.statusFilter = e.target.value;
        this.render();
      });
    }

    const docSelect = document.getElementById('appointment-doctor-filter');
    if (docSelect) {
      docSelect.addEventListener('change', (e) => {
        this.doctorFilter = e.target.value;
        this.render();
      });
    }

    // Date tabs (Today / Upcoming / Past / All)
    const tabs = document.querySelectorAll('.apt-date-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.dateFilter = tab.getAttribute('data-date-filter');
        this.render();
      });
    });
  }

  getFilteredAppointments() {
    const list = window.pulseStore.data.appointments || [];
    const todayStr = new Date().toISOString().split('T')[0];

    return list.filter(apt => {
      // Date filter
      if (this.dateFilter === 'today' && apt.date !== todayStr) return false;
      if (this.dateFilter === 'upcoming' && apt.date < todayStr) return false;
      if (this.dateFilter === 'past' && apt.date >= todayStr) return false;

      // Status filter
      if (this.statusFilter !== 'all' && apt.status !== this.statusFilter) return false;

      // Doctor filter
      if (this.doctorFilter !== 'all' && apt.doctor !== this.doctorFilter) return false;

      // Text search
      if (this.searchQuery) {
        const matches = apt.patientName.toLowerCase().includes(this.searchQuery) ||
                        apt.id.toLowerCase().includes(this.searchQuery) ||
                        apt.reason.toLowerCase().includes(this.searchQuery) ||
                        apt.doctor.toLowerCase().includes(this.searchQuery);
        if (!matches) return false;
      }

      return true;
    });
  }

  render() {
    const container = document.getElementById('appointments-list-container');
    const countBadge = document.getElementById('appointment-count-badge');
    if (!container) return;

    const list = this.getFilteredAppointments();
    if (countBadge) countBadge.textContent = `${list.length} Records`;

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <h3>No appointments found</h3>
          <p>No appointments match the selected filter criteria.</p>
          <button class="btn btn-primary" onclick="pulseApp.openModal('new-appointment-modal')">
            + Schedule New Appointment
          </button>
        </div>
      `;
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    container.innerHTML = list.map(apt => {
      const isToday = apt.date === todayStr;
      const patient = window.pulseStore.getPatient(apt.patientId);
      const phone = patient ? patient.phone : '';

      return `
        <div class="appointment-card glass-panel status-border-${this.getStatusClass(apt.status)}" data-id="${apt.id}">
          <div class="apt-card-top">
            <div class="apt-time-box">
              <span class="apt-time">${apt.timeSlot}</span>
              <span class="apt-date ${isToday ? 'apt-today-badge' : ''}">${isToday ? 'Today' : apt.date}</span>
            </div>

            <div class="apt-patient-info">
              <div class="apt-patient-title-line">
                <h4 class="apt-patient-name" onclick="patientModule.viewProfile('${apt.patientId}')" title="Click to view full patient profile">
                  ${apt.patientName}
                </h4>
                <span class="badge badge-id">${apt.id}</span>
                <span class="badge badge-priority-${apt.priority.toLowerCase()}">${apt.priority}</span>
              </div>
              <p class="apt-doctor-info">
                <strong>${apt.doctor}</strong> • <span class="text-muted">${apt.department}</span>
              </p>
            </div>

            <div class="apt-status-control">
              <label class="status-select-label">Status:</label>
              <select class="form-select form-select-sm status-dropdown status-tag-${this.getStatusClass(apt.status)}" onchange="appointmentModule.updateStatus('${apt.id}', this.value)">
                <option value="Scheduled" ${apt.status === 'Scheduled' ? 'selected' : ''}>⏳ Scheduled</option>
                <option value="Checked-In" ${apt.status === 'Checked-In' ? 'selected' : ''}>🏥 Checked-In</option>
                <option value="In-Consultation" ${apt.status === 'In-Consultation' ? 'selected' : ''}>🩺 In-Consultation</option>
                <option value="Completed" ${apt.status === 'Completed' ? 'selected' : ''}>✅ Completed</option>
                <option value="Cancelled" ${apt.status === 'Cancelled' ? 'selected' : ''}>❌ Cancelled</option>
                <option value="No-Show" ${apt.status === 'No-Show' ? 'selected' : ''}>⚠️ No-Show</option>
              </select>
            </div>
          </div>

          <div class="apt-details-body">
            <p class="apt-reason">
              <span class="label-tiny">Reason for Visit:</span> ${apt.reason}
            </p>
            ${apt.notes ? `<p class="apt-notes"><span class="label-tiny">Staff Notes:</span> ${apt.notes}</p>` : ''}
          </div>

          <div class="apt-card-footer">
            <div class="apt-reminders">
              ${apt.followUpReminder ? `
                <span class="follow-up-pill">
                  🔔 Follow-up Reminder: <strong>${apt.followUpReminder}</strong>
                </span>
              ` : `
                <button class="btn-link-action" onclick="appointmentModule.promptFollowUp('${apt.id}')">
                  + Add Follow-up Alert
                </button>
              `}
            </div>

            <div class="apt-actions">
              <button class="btn btn-ghost btn-sm" onclick="appointmentModule.printSlip('${apt.id}')" title="Print Appointment Slip">
                🖨️ Print Slip
              </button>
              ${phone ? `
                <a href="https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${apt.patientName}, your appointment at ${window.pulseStore.data.clinic.name} with ${apt.doctor} is confirmed for ${apt.date} at ${apt.timeSlot}. Please arrive 10 minutes prior.`)}" target="_blank" class="btn btn-outline btn-sm" title="Send WhatsApp Reminder">
                  💬 Send Reminder
                </a>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  getStatusClass(status) {
    switch (status) {
      case 'Scheduled': return 'scheduled';
      case 'Checked-In': return 'checkedin';
      case 'In-Consultation': return 'inconsultation';
      case 'Completed': return 'completed';
      case 'Cancelled': return 'cancelled';
      case 'No-Show': return 'noshow';
      default: return 'scheduled';
    }
  }

  updateStatus(appointmentId, newStatus) {
    const updated = window.pulseStore.updateAppointmentStatus(appointmentId, newStatus);
    if (updated) {
      window.pulseAudio.playSuccessNotification();
      pulseApp.showToast(`Appointment ${appointmentId} updated to ${newStatus}`, 'info');
      this.render();
      if (window.pulseApp) window.pulseApp.updateDashboardStats();
    }
  }

  promptFollowUp(appointmentId) {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 14);
    const suggested = defaultDate.toISOString().split('T')[0];

    const inputDate = prompt("Enter follow-up reminder date (YYYY-MM-DD):", suggested);
    if (inputDate) {
      const apt = window.pulseStore.data.appointments.find(a => a.id === appointmentId);
      if (apt) {
        apt.followUpReminder = inputDate;
        window.pulseStore.save();
        pulseApp.showToast(`Follow-up reminder set for ${inputDate}`, 'success');
        this.render();
      }
    }
  }

  openBookingFor(patientId) {
    const patient = window.pulseStore.getPatient(patientId);
    pulseApp.openModal('new-appointment-modal');

    // Pre-populate patient select
    const select = document.getElementById('apt-patient-select');
    if (select && patient) {
      select.value = patientId;
    }
  }

  populatePatientSelect() {
    const select = document.getElementById('apt-patient-select');
    if (!select) return;
    const patients = window.pulseStore.data.patients || [];
    select.innerHTML = '<option value="">-- Choose Registered Patient --</option>' + 
      patients.map(p => `
        <option value="${p.id}">${p.name} (${p.id} - ${p.bloodGroup})</option>
      `).join('');
  }

  handleBookingSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    const patientId = formData.get('patientId');
    const patient = window.pulseStore.getPatient(patientId);
    if (!patient) {
      pulseApp.showToast('Please select a valid registered patient', 'error');
      return;
    }

    const appointment = {
      patientId: patient.id,
      patientName: patient.name,
      doctor: formData.get('doctor'),
      department: formData.get('department'),
      date: formData.get('date'),
      timeSlot: formData.get('timeSlot'),
      priority: formData.get('priority') || 'Routine',
      status: 'Scheduled',
      reason: formData.get('reason'),
      notes: formData.get('notes') || '',
      followUpReminder: formData.get('followUpReminder') || ''
    };

    const newApt = window.pulseStore.addAppointment(appointment);
    window.pulseAudio.playSuccessNotification();
    pulseApp.showToast(`Appointment booked successfully for ${patient.name} on ${newApt.date} at ${newApt.timeSlot}`, 'success');

    form.reset();
    pulseApp.closeModal('new-appointment-modal');
    this.render();
    if (window.pulseApp) window.pulseApp.updateDashboardStats();
  }

  printSlip(appointmentId) {
    const apt = window.pulseStore.data.appointments.find(a => a.id === appointmentId);
    if (!apt) return;
    const patient = window.pulseStore.getPatient(apt.patientId);

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Appointment Slip - ${apt.id}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #1e293b; }
          .header { border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 20px; }
          .clinic-name { font-size: 22px; font-weight: bold; color: #0284c7; }
          .title { font-size: 14px; margin-top: 5px; color: #64748b; letter-spacing: 1px; font-weight: 600; }
          .box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
          .row { display: flex; margin-bottom: 12px; }
          .col { flex: 1; }
          .label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; }
          .val { font-size: 15px; font-weight: 600; color: #0f172a; margin-top: 3px; }
          .highlight { color: #0284c7; font-size: 18px; }
          .disclaimer { font-size: 11px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">${window.pulseStore.data.clinic.name}</div>
          <div class="title">OFFICIAL APPOINTMENT PASS / SLIP</div>
        </div>
        <div class="box">
          <div class="row">
            <div class="col"><div class="label">Appointment ID</div><div class="val highlight">${apt.id}</div></div>
            <div class="col"><div class="label">Date & Time</div><div class="val">${apt.date} at ${apt.timeSlot}</div></div>
            <div class="col"><div class="label">Priority</div><div class="val">${apt.priority}</div></div>
          </div>
          <div class="row">
            <div class="col"><div class="label">Patient Name</div><div class="val">${apt.patientName} (${apt.patientId})</div></div>
            <div class="col"><div class="label">Doctor / Department</div><div class="val">${apt.doctor} (${apt.department})</div></div>
          </div>
          <div class="row">
            <div class="col"><div class="label">Reason for Visit</div><div class="val">${apt.reason}</div></div>
          </div>
          ${patient ? `
          <div class="row">
            <div class="col"><div class="label">Blood Group</div><div class="val">${patient.bloodGroup}</div></div>
            <div class="col"><div class="label">Patient Phone</div><div class="val">${patient.phone}</div></div>
            <div class="col"><div class="label">Allergies</div><div class="val">${patient.allergies || 'None'}</div></div>
          </div>
          ` : ''}
        </div>
        <div class="disclaimer">
          Please arrive 10 minutes prior to scheduled time. For appointment reschedule or queries, call clinic reception at ${window.pulseStore.data.clinic.phone}.
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }
}

window.appointmentModule = new AppointmentModule();
