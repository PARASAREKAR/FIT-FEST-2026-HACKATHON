/**
 * PulseSync Blood Availability & Requirement Management Module
 * Blood Stock Matrix, Bank Directory, Patient Requirements, and Donor Registry
 */

class BloodModule {
  constructor() {
    this.selectedBloodGroup = 'ALL';
    this.searchZone = '';
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    // Blood group matrix quick selector buttons
    const groupPills = document.querySelectorAll('.blood-matrix-btn');
    groupPills.forEach(btn => {
      btn.addEventListener('click', (e) => {
        groupPills.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedBloodGroup = btn.getAttribute('data-blood-group');
        this.renderBloodBanks();
        this.renderRequirements();
        this.renderDonors();
      });
    });

    const zoneSearch = document.getElementById('blood-zone-search');
    if (zoneSearch) {
      zoneSearch.addEventListener('input', (e) => {
        this.searchZone = e.target.value.toLowerCase().trim();
        this.renderBloodBanks();
      });
    }
  }

  render() {
    this.renderStockSummaryCards();
    this.renderRequirements();
    this.renderBloodBanks();
    this.renderDonors();
  }

  // Calculate total units available across all blood banks for each group
  getTotalStockPerGroup() {
    const banks = window.pulseStore.data.bloodBanks || [];
    const totals = { "A+": 0, "A-": 0, "B+": 0, "B-": 0, "O+": 0, "O-": 0, "AB+": 0, "AB-": 0 };

    banks.forEach(b => {
      if (b.stock) {
        Object.keys(totals).forEach(grp => {
          totals[grp] += (b.stock[grp] || 0);
        });
      }
    });

    return totals;
  }

  renderStockSummaryCards() {
    const container = document.getElementById('blood-stock-matrix-grid');
    if (!container) return;

    const totals = this.getTotalStockPerGroup();
    const groups = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

    container.innerHTML = groups.map(grp => {
      const count = totals[grp];
      const isCritical = count < 5;
      const isModerate = count >= 5 && count < 15;
      const statusText = count === 0 ? 'CRITICAL: EMPTY' : isCritical ? 'Critical Shortage' : isModerate ? 'Moderate Supply' : 'Adequate Supply';
      const statusColor = count === 0 ? 'status-empty' : isCritical ? 'status-critical' : isModerate ? 'status-moderate' : 'status-adequate';

      return `
        <div class="blood-matrix-card glass-panel ${statusColor} ${this.selectedBloodGroup === grp ? 'selected-matrix-card' : ''}" onclick="bloodModule.filterByGroup('${grp}')">
          <div class="matrix-card-header">
            <span class="matrix-blood-badge">${grp}</span>
            <span class="matrix-status-dot"></span>
          </div>
          <div class="matrix-count-row">
            <span class="matrix-units">${count}</span>
            <span class="matrix-label">Units Available</span>
          </div>
          <div class="matrix-status-bar">
            <span class="matrix-status-pill">${statusText}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  filterByGroup(grp) {
    this.selectedBloodGroup = grp;
    const groupPills = document.querySelectorAll('.blood-matrix-btn');
    groupPills.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-blood-group') === grp);
    });
    this.renderStockSummaryCards();
    this.renderBloodBanks();
    this.renderRequirements();
    this.renderDonors();
  }

  renderRequirements() {
    const container = document.getElementById('blood-requirements-list-container');
    const badge = document.getElementById('blood-req-count-badge');
    if (!container) return;

    const reqs = window.pulseStore.data.bloodRequirements || [];
    const filtered = reqs.filter(r => {
      if (this.selectedBloodGroup !== 'ALL' && r.bloodGroup !== this.selectedBloodGroup) return false;
      return true;
    });

    if (badge) badge.textContent = `${filtered.length} Requests`;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🩸</div>
          <p>No active blood requirements matching selection.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(req => {
      const isCritical = req.status.toLowerCase().includes('critical') || req.urgency.toLowerCase().includes('immediate');
      const isFulfilled = req.status.toLowerCase().includes('fulfilled');

      return `
        <div class="blood-req-card glass-panel ${isCritical ? 'border-critical' : ''} ${isFulfilled ? 'req-fulfilled' : ''}">
          <div class="req-header">
            <div class="req-patient-box">
              <span class="blood-badge-large">${req.bloodGroup}</span>
              <div>
                <h4 class="req-patient-name">${req.patientName} (${req.age} yrs)</h4>
                <p class="req-meta text-muted">${req.hospital}</p>
              </div>
            </div>
            <div class="req-units-needed">
              <span class="units-number">${req.unitsRequired}</span>
              <span class="units-txt">Units Needed</span>
            </div>
          </div>

          <div class="req-urgency-row">
            <span class="urgency-pill ${isCritical ? 'urgency-critical' : 'urgency-normal'}">
              ⚠️ ${req.urgency}
            </span>
            <span class="req-status-tag ${isFulfilled ? 'tag-fulfilled' : 'tag-active'}">
              ${req.status}
            </span>
          </div>

          <p class="req-reason">
            <strong>Clinical Requirement:</strong> ${req.reason}
          </p>

          <div class="req-contact-box">
            <span>📞 Contact: <strong>${req.contactPerson}</strong> (<a href="tel:${req.contactPhone}">${req.contactPhone}</a>)</span>
            <span class="text-sm text-muted">${req.reportedAt}</span>
          </div>

          <div class="req-actions">
            ${!isFulfilled ? `
              <button class="btn btn-sm btn-outline" onclick="bloodModule.matchDonorsFor('${req.bloodGroup}', '${req.id}')">
                🔍 Find Matching Donors
              </button>
              <button class="btn btn-sm btn-success" onclick="bloodModule.markFulfilled('${req.id}')">
                ✓ Mark Fulfilled
              </button>
            ` : `
              <span class="badge badge-success">✓ Requirement Fulfilled</span>
            `}
          </div>
        </div>
      `;
    }).join('');
  }

  renderBloodBanks() {
    const container = document.getElementById('blood-banks-list-container');
    if (!container) return;

    const banks = window.pulseStore.data.bloodBanks || [];
    const filtered = banks.filter(bank => {
      if (this.searchZone && !bank.zone.toLowerCase().includes(this.searchZone) && !bank.name.toLowerCase().includes(this.searchZone) && !bank.address.toLowerCase().includes(this.searchZone)) {
        return false;
      }
      return true;
    });

    container.innerHTML = filtered.map(bank => {
      const targetStock = this.selectedBloodGroup !== 'ALL' 
        ? `${this.selectedBloodGroup}: <strong>${bank.stock[this.selectedBloodGroup] || 0} Units</strong>`
        : '';

      return `
        <div class="blood-bank-card glass-panel">
          <div class="bank-card-header">
            <div>
              <h4 class="bank-name">${bank.name}</h4>
              <p class="bank-address">📍 ${bank.address}</p>
            </div>
            <span class="bank-dist-badge">${bank.distanceKm} km</span>
          </div>

          <div class="bank-meta-row">
            <span class="badge ${bank.emergency24x7 ? 'badge-success' : 'badge-neutral'}">
              ${bank.emergency24x7 ? '🟢 24x7 Emergency Bank' : '🕒 ' + (bank.hours || 'Regular Hours')}
            </span>
            <span class="text-sm text-muted">Stock Verified: ${bank.verifiedAt}</span>
          </div>

          ${targetStock ? `
            <div class="bank-highlight-stock glass-inset">
              🎯 Available Stock for ${targetStock}
            </div>
          ` : ''}

          <div class="bank-stock-pills">
            ${Object.keys(bank.stock).map(grp => {
              const qty = bank.stock[grp];
              const low = qty < 3;
              return `
                <div class="stock-mini-pill ${low ? 'pill-low' : ''} ${grp === this.selectedBloodGroup ? 'pill-highlight' : ''}">
                  <span class="mini-grp">${grp}</span>
                  <span class="mini-qty">${qty}</span>
                </div>
              `;
            }).join('')}
          </div>

          <div class="bank-card-actions">
            <a href="tel:${bank.contact.split('/')[0].trim()}" class="btn btn-primary btn-sm">
              📞 Call Blood Bank (${bank.contact.split('/')[0].trim()})
            </a>
            <a href="https://maps.google.com/?q=${encodeURIComponent(bank.name + ' ' + bank.address)}" target="_blank" class="btn btn-outline btn-sm">
              📍 Map Directions
            </a>
          </div>
        </div>
      `;
    }).join('');
  }

  renderDonors() {
    const container = document.getElementById('volunteer-donors-container');
    if (!container) return;

    const donors = window.pulseStore.data.volunteerDonors || [];
    const filtered = donors.filter(d => {
      if (this.selectedBloodGroup !== 'ALL' && d.bloodGroup !== this.selectedBloodGroup) return false;
      return true;
    });

    container.innerHTML = filtered.map(donor => `
      <div class="donor-card glass-panel">
        <div class="donor-top">
          <div class="donor-info">
            <span class="blood-badge">${donor.bloodGroup}</span>
            <div>
              <h5 class="donor-name">${donor.name} (${donor.age}y)</h5>
              <span class="donor-zone text-muted">📍 ${donor.zone}</span>
            </div>
          </div>
          <span class="badge ${donor.emergencyAvailable ? 'badge-success' : 'badge-neutral'}">
            ${donor.emergencyAvailable ? '⚡ Emergency Volunteer' : 'Standard Donor'}
          </span>
        </div>

        <div class="donor-status-line text-sm">
          <span>Status: <strong>${donor.eligibility}</strong></span>
          <span class="text-muted">• Last Donated: ${donor.lastDonated}</span>
        </div>

        <div class="donor-actions">
          <a href="tel:${donor.phone}" class="btn btn-outline btn-sm">
            📞 Call ${donor.phone}
          </a>
          <a href="https://wa.me/${donor.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hello ' + donor.name + ', AuraCare Emergency Coordination Hub is reaching out regarding a blood requirement for group ' + donor.bloodGroup + '.')}" target="_blank" class="btn btn-ghost btn-sm">
            💬 WhatsApp
          </a>
        </div>
      </div>
    `).join('');
  }

  markFulfilled(reqId) {
    window.pulseStore.updateBloodRequirementStatus(reqId, 'Fulfilled');
    window.pulseAudio.playSuccessNotification();
    pulseApp.showToast(`Blood requirement ${reqId} marked as Fulfilled`, 'success');
    this.render();
    if (window.pulseApp) window.pulseApp.updateDashboardStats();
  }

  matchDonorsFor(bloodGroup, reqId) {
    this.filterByGroup(bloodGroup);
    pulseApp.showToast(`Filtered blood banks & voluntary donors for group ${bloodGroup}`, 'info');
    // Scroll to donor section
    const donorSection = document.getElementById('volunteer-donors-container');
    if (donorSection) {
      donorSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  handlePostRequirement(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    const req = {
      patientName: formData.get('patientName').trim(),
      age: parseInt(formData.get('age') || '30', 10),
      bloodGroup: formData.get('bloodGroup'),
      unitsRequired: parseInt(formData.get('unitsRequired'), 10),
      urgency: formData.get('urgency'),
      hospital: formData.get('hospital').trim(),
      contactPerson: formData.get('contactPerson').trim(),
      contactPhone: formData.get('contactPhone').trim(),
      reason: formData.get('reason').trim()
    };

    const newReq = window.pulseStore.postBloodRequirement(req);
    window.pulseAudio.playEmergencyTone();
    pulseApp.showToast(`Emergency Blood Requirement posted for ${req.patientName} (${req.unitsRequired} Units ${req.bloodGroup})`, 'success');

    form.reset();
    pulseApp.closeModal('post-blood-requirement-modal');
    this.render();
    if (window.pulseApp) window.pulseApp.updateDashboardStats();
  }

  handleRegisterDonor(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    const donor = {
      name: formData.get('name').trim(),
      age: parseInt(formData.get('age'), 10),
      bloodGroup: formData.get('bloodGroup'),
      zone: formData.get('zone').trim(),
      phone: formData.get('phone').trim(),
      lastDonated: formData.get('lastDonated') || new Date().toISOString().split('T')[0]
    };

    window.pulseStore.addVolunteerDonor(donor);
    window.pulseAudio.playSuccessNotification();
    pulseApp.showToast(`Thank you! ${donor.name} registered as a blood donor`, 'success');

    form.reset();
    pulseApp.closeModal('register-donor-modal');
    this.render();
  }
}

window.bloodModule = new BloodModule();
