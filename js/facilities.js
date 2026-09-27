/**
 * PulseSync Nearby Healthcare Facilities Directory Module
 * Clinics, Tertiary Hospitals, Bed/ICU Availability, and Emergency Triage
 */

class FacilitiesModule {
  constructor() {
    this.filterType = 'all';
    this.only24x7 = false;
    this.onlyIcu = false;
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    const typeSelect = document.getElementById('facility-type-filter');
    if (typeSelect) {
      typeSelect.addEventListener('change', (e) => {
        this.filterType = e.target.value;
        this.render();
      });
    }

    const check24x7 = document.getElementById('facility-24x7-toggle');
    if (check24x7) {
      check24x7.addEventListener('change', (e) => {
        this.only24x7 = e.target.checked;
        this.render();
      });
    }

    const checkIcu = document.getElementById('facility-icu-toggle');
    if (checkIcu) {
      checkIcu.addEventListener('change', (e) => {
        this.onlyIcu = e.target.checked;
        this.render();
      });
    }
  }

  getFilteredFacilities() {
    const list = window.pulseStore.data.facilities || [];
    return list.filter(fac => {
      if (this.only24x7 && !fac.emergency24x7) return false;
      if (this.onlyIcu && !fac.icuAvailable) return false;
      if (this.filterType !== 'all') {
        if (!fac.type.toLowerCase().includes(this.filterType.toLowerCase())) return false;
      }
      return true;
    });
  }

  render() {
    const container = document.getElementById('facilities-list-container');
    const badge = document.getElementById('facilities-count-badge');
    if (!container) return;

    const list = this.getFilteredFacilities();
    if (badge) badge.textContent = `${list.length} Facilities`;

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🏥</div>
          <p>No facilities match the chosen filters.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(fac => {
      return `
        <div class="facility-card glass-panel" data-id="${fac.id}">
          <div class="facility-header">
            <div>
              <div class="facility-type-tag">${fac.type}</div>
              <h3 class="facility-name">${fac.name}</h3>
              <p class="facility-address">📍 ${fac.address}</p>
            </div>
            <div class="facility-distance">
              <span class="dist-num">${fac.distanceKm}</span>
              <span class="dist-unit">km away</span>
            </div>
          </div>

          <div class="facility-badges-row">
            <span class="badge ${fac.emergency24x7 ? 'badge-success' : 'badge-neutral'}">
              ${fac.emergency24x7 ? '🚨 24x7 Emergency Casualty' : '🕒 Limited Hours'}
            </span>
            <span class="badge ${fac.icuAvailable ? 'badge-info' : 'badge-neutral'}">
              ${fac.icuAvailable ? '🛏️ ICU On-Site' : 'General Care Only'}
            </span>
            <span class="beds-indicator">
              <strong>Live Beds:</strong> ${fac.bedsInfo}
            </span>
          </div>

          <div class="facility-specialties">
            <span class="label-tiny">Departments & Capabilities:</span>
            <div class="specialty-pills">
              ${fac.specialties.map(s => `<span class="spec-pill">${s}</span>`).join('')}
            </div>
          </div>

          <div class="facility-actions-row">
            <a href="tel:${fac.emergencyPhone || fac.phone}" class="btn btn-primary btn-sm">
              🚨 Emergency Hotline (${fac.emergencyPhone || fac.phone})
            </a>
            <button class="btn btn-secondary btn-sm" onclick="facilitiesModule.dispatchTo('${fac.name}')">
              🚑 Request Ambulance to Here
            </button>
            <a href="https://maps.google.com/?q=${encodeURIComponent(fac.name + ' ' + fac.address)}" target="_blank" class="btn btn-outline btn-sm">
              📍 Navigate
            </a>
          </div>
        </div>
      `;
    }).join('');
  }

  dispatchTo(facilityName) {
    pulseApp.openModal('new-ambulance-request-modal');
    const input = document.querySelector('input[name="destinationFacility"]');
    if (input) {
      input.value = facilityName;
    }
  }
}

window.facilitiesModule = new FacilitiesModule();
