/**
 * PulseSync Live Emergency & Healthcare Map Module (India Edition)
 * High-Definition Satellite GIS strictly bounded to India with zero API key dependencies.
 * Real-time 24/7 hospitals, live ambulance fleets, regional medical corridors, and Doctor Home Visits.
 */

class LiveMapModule {
  constructor() {
    this.map = null;
    this.markersGroup = null;
    this.baseTileLayer = null;
    this.referenceTileLayer = null;
    this.currentFilter = 'all'; // 'all', 'ambulance', 'hospital', 'homevisit', 'icu'
    this.currentBaseLayer = 'satellite_real'; // 'satellite_real', 'satellite_photo', 'google_satellite', 'osm'
    this.satelliteOverlayLayer = null;
    this.currentCity = 'india'; // Default to Pan-India National Overview (Image 2 style)
    
    // Active Clinic Hub in India: AuraCare Primary Health & Emergency Hub (Delhi-NCR Corridor)
    this.centerLat = 28.5355;
    this.centerLng = 77.2410;

    // Strict India Geographical Bounding Box (Kanyakumari to Kashmir, Gujarat to Arunachal)
    this.indiaBounds = [
      [6.5, 68.0],
      [37.5, 97.5]
    ];

    // Major Indian Healthcare Corridors for Quick Jump
    this.indianCities = {
      india: { name: "Pan-India National Overview", lat: 21.7679, lng: 78.8718, zoom: 5 },
      delhi: { name: "Delhi-NCR (AuraCare HQ)", lat: 28.5355, lng: 77.2410, zoom: 13 },
      mumbai: { name: "Mumbai Metropolitan Corridor", lat: 19.0760, lng: 72.8777, zoom: 12 },
      bengaluru: { name: "Bengaluru Tech-Care Hub", lat: 12.9716, lng: 77.5946, zoom: 12 },
      hyderabad: { name: "Hyderabad Health District", lat: 17.3850, lng: 78.4867, zoom: 12 },
      kolkata: { name: "Kolkata Medical Belt", lat: 22.5726, lng: 88.3639, zoom: 12 },
      chennai: { name: "Chennai Healthcare Hub", lat: 13.0827, lng: 80.2707, zoom: 12 }
    };

    // Regional Major Partner Medical Hubs across India (Visible in Pan-India Satellite View)
    this.regionalHubs = [
      {
        id: "HUB-DEL",
        name: "AuraCare Primary Care & Emergency HQ",
        city: "New Delhi",
        cityKey: "delhi",
        lat: 28.5355,
        lng: 77.2410,
        type: "National Command Hub",
        ambulances: "5 GPS Units Active",
        icu: "14 Beds Available",
        phone: "+91 98765 00108"
      },
      {
        id: "HUB-BOM",
        name: "Lilavati Trauma & Heart Center",
        city: "Mumbai",
        cityKey: "mumbai",
        lat: 19.0515,
        lng: 72.8295,
        type: "Metro Trauma Center",
        ambulances: "4 GPS Units",
        icu: "6 Beds Available",
        phone: "+91 22 2675 1000"
      },
      {
        id: "HUB-BLR",
        name: "Narayana Multi-Specialty Health City",
        city: "Bengaluru",
        cityKey: "bengaluru",
        lat: 12.8028,
        lng: 77.6974,
        type: "Cardio-Thoracic & ICU Hub",
        ambulances: "4 GPS Units",
        icu: "8 Beds Available",
        phone: "+91 80 7122 2222"
      },
      {
        id: "HUB-HYD",
        name: "Apollo Health City Jubilee Hills",
        city: "Hyderabad",
        cityKey: "hyderabad",
        lat: 17.4265,
        lng: 78.4128,
        type: "Emergency & Neuro Care Hub",
        ambulances: "3 GPS Units",
        icu: "5 Beds Available",
        phone: "+91 40 2360 7777"
      },
      {
        id: "HUB-CCU",
        name: "AMRI Emergency Trauma Corridor",
        city: "Kolkata",
        cityKey: "kolkata",
        lat: 22.5186,
        lng: 88.3644,
        type: "Regional Emergency Base",
        ambulances: "3 GPS Units",
        icu: "4 Beds Available",
        phone: "+91 33 6680 0000"
      },
      {
        id: "HUB-MAA",
        name: "Chennai National Medical Corridor",
        city: "Chennai",
        cityKey: "chennai",
        lat: 13.0604,
        lng: 80.2508,
        type: "Multi-Specialty & Organ Center",
        ambulances: "4 GPS Units",
        icu: "7 Beds Available",
        phone: "+91 44 2829 0200"
      }
    ];

    // Patient Home Visit Geocodes (mapped to actual neighborhoods relative to Clinic HQ)
    this.patientHomeCoords = {
      "PT-1001": { lat: 28.5420, lng: 77.2380, landmark: "Near Green Park Metro, Sector 18", homeVisitReq: "Diabetic Foot Inspection & BP Check" },
      "PT-1002": { lat: 28.5490, lng: 77.2150, landmark: "Lotus Towers, West Extn", homeVisitReq: "Post-Viral Wheeze & Auscultation" },
      "PT-1003": { lat: 28.5610, lng: 77.2510, landmark: "Opposite Community Park, Model Town", homeVisitReq: "Lumbar Disc Herniation Mobility Review" },
      "PT-1004": { lat: 28.5280, lng: 77.2480, landmark: "Gate 2, Defense Enclave", homeVisitReq: "Elderly Cardiac Monitoring & INR Review" },
      "PT-1005": { lat: 28.5190, lng: 77.2280, landmark: "Main Market, Surya Vihar", homeVisitReq: "Post-Op Surgical Wound Dressing" },
      "PT-1006": { lat: 28.5320, lng: 77.2650, landmark: "Lane 4, Gandhi Nagar", homeVisitReq: "Senior Citizen Palliative Checkup" }
    };
  }

  init() {
    this.initMap();
  }

  // Exact Haversine Distance & Driving Time from Clinic to Target
  getDistanceInfo(targetLat, targetLng) {
    const R = 6371; // Earth's mean radius in km
    const dLat = (targetLat - this.centerLat) * Math.PI / 180;
    const dLon = (targetLng - this.centerLng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.centerLat * Math.PI / 180) * Math.cos(targetLat * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const km = parseFloat((R * c).toFixed(1));
    const etaMins = Math.max(3, Math.round(km * 2.3)); // Avg Indian metro traffic benchmark (approx 26 km/h)
    return { km, etaMins };
  }

  initMap() {
    let container = document.getElementById('live-emergency-map');
    const dedicated = document.getElementById('dedicated-emergency-map-view');
    const dedicatedSection = document.getElementById('view-map');
    
    if (dedicatedSection && dedicatedSection.classList.contains('active') && dedicated) {
      container = dedicated;
    }
    if (!container) return;

    // If Leaflet is not available, trigger robust vector fallback
    if (!window.L) {
      this.initFallbackMap(container);
      return;
    }

    // Clean up existing map instance cleanly
    if (this.map) {
      try {
        this.map.remove();
      } catch (err) {
        console.warn("Map teardown notice:", err);
      }
      this.map = null;
      this.baseTileLayer = null;
      this.referenceTileLayer = null;
      this.satelliteOverlayLayer = null;
    }

    try {
      const bounds = L.latLngBounds(this.indiaBounds[0], this.indiaBounds[1]);
      const initialLocation = this.indianCities[this.currentCity] || this.indianCities.india;

      this.map = L.map(container, {
        center: [initialLocation.lat, initialLocation.lng],
        zoom: initialLocation.zoom,
        minZoom: 4,
        maxZoom: 19,
        maxBounds: bounds,
        maxBoundsViscosity: 0.8,
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true, // Significant performance boost on low-spec systems
        scrollWheelZoom: false // Prevents map from hijacking webpage scroll!
      });

      L.control.zoom({ position: 'topright' }).addTo(this.map);

      // Mount the chosen Satellite Basemap (defaults to High-Definition Satellite Hybrid matching Image 2)
      this.mountBaseLayer(this.currentBaseLayer);

      this.markersGroup = L.layerGroup().addTo(this.map);
      this.renderMarkers();

      // Trigger size recalculation after layout settles
      setTimeout(() => {
        if (this.map) this.map.invalidateSize();
      }, 150);

    } catch (e) {
      console.error("Leaflet initialization error, switching to vector mode:", e);
      this.initFallbackMap(container);
    }
  }

  // Mount or Switch Basemap Tile Layer
  mountBaseLayer(layerKey) {
    if (!this.map) return;
    this.currentBaseLayer = layerKey || 'satellite_real';

    if (this.baseTileLayer) {
      try { this.map.removeLayer(this.baseTileLayer); } catch (e) {}
      this.baseTileLayer = null;
    }
    if (this.referenceTileLayer) {
      try { this.map.removeLayer(this.referenceTileLayer); } catch (e) {}
      this.referenceTileLayer = null;
    }
    if (this.satelliteOverlayLayer) {
      try { this.map.removeLayer(this.satelliteOverlayLayer); } catch (e) {}
      this.satelliteOverlayLayer = null;
    }

    const bounds = L.latLngBounds(this.indiaBounds[0], this.indiaBounds[1]);
    const photoBounds = L.latLngBounds([[4.0, 60.0], [38.0, 98.5]]);

    if (this.currentBaseLayer === 'satellite_photo') {
      // Authentic Internet-sourced Space Agency Satellite Photo Overlay of the Indian Subcontinent
      this.baseTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        bounds: bounds,
        attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics'
      }).addTo(this.map);

      this.satelliteOverlayLayer = L.imageOverlay('assets/india-satellite.png', photoBounds, {
        opacity: 0.95,
        interactive: false
      }).addTo(this.map);

      this.referenceTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        bounds: bounds
      }).addTo(this.map);

    } else if (this.currentBaseLayer === 'satellite_real' || this.currentBaseLayer === 'satellite') {
      // High-Definition Esri World Satellite Imagery from Internet + Crisp Boundaries & City Places (Guaranteed to work, no API keys)
      this.baseTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        bounds: bounds,
        attribution: 'Satellite Imagery &copy; Esri, Maxar, Earthstar Geographics, USDA, USGS'
      }).addTo(this.map);

      // Boundaries, state lines, and city typography layer
      this.referenceTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        bounds: bounds
      }).addTo(this.map);

    } else if (this.currentBaseLayer === 'google_satellite') {
      // Google Hybrid Satellite
      this.baseTileLayer = L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['0', '1', '2', '3'],
        bounds: bounds,
        attribution: 'Satellite Imagery &copy; Google, Maxar Technologies'
      }).addTo(this.map);

    } else {
      // OpenStreetMap standard street navigation
      this.baseTileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        bounds: bounds,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);
    }

    // Keep all basemap dropdowns synchronized in UI
    document.querySelectorAll('.map-basemap-selector').forEach(sel => {
      sel.value = this.currentBaseLayer;
    });
  }

  setBaseLayer(layerKey) {
    this.mountBaseLayer(layerKey);
    const names = {
      satellite_real: 'Real Satellite Imagery (HD & Boundaries)',
      satellite_photo: 'NASA/ISRO Satellite Photo Overlay',
      google_satellite: 'Google Hybrid Satellite',
      osm: 'Street Navigation (OSM)'
    };
    pulseApp.showToast(`Switched map basemap to ${names[layerKey] || layerKey}`, 'info');
  }
  }

  // Quick Jump between Indian Healthcare Cities or Whole India
  jumpToCity(cityKey) {
    this.currentCity = cityKey;
    const city = this.indianCities[cityKey];
    if (!city) return;

    if (this.map) {
      this.map.flyTo([city.lat, city.lng], city.zoom, { duration: 1.2 });
      pulseApp.showToast(`Switched map view to ${city.name}`, 'info');
    }

    // Keep all region selectors synchronized
    document.querySelectorAll('.map-city-selector:not(.map-basemap-selector)').forEach(sel => {
      sel.value = cityKey;
    });
  }

  // Facility Coordinates in India
  getFacilityCoordinates(fac) {
    const coordsMap = {
      "FAC-01": [28.5355, 77.2410], // AuraCare Clinic HQ (Green Park / Sector 14)
      "FAC-02": [28.5520, 77.2210], // Apex Trauma Center (Outer Ring Road, AIIMS Trauma Corridor)
      "FAC-03": [28.5180, 77.2550], // City Civil Hospital (Civil Lines)
      "FAC-04": [28.5440, 77.2080], // St. Luke Maternity (West Extension)
      "FAC-05": [28.5290, 77.2710]  // LifeLine Dialysis & Specialty
    };
    return coordsMap[fac.id] || [this.centerLat + (Math.random() - 0.5) * 0.04, this.centerLng + (Math.random() - 0.5) * 0.04];
  }

  // Live Ambulance Coordinates
  getAmbulanceCoordinates(amb) {
    const coordsMap = {
      "AMB-101": [28.5410, 77.2340], // En Route Ring Road
      "AMB-102": [28.5580, 77.2490], // Model Town Available
      "AMB-103": [28.5240, 77.2180], // Dispatched NH-48
      "AMB-104": [28.5190, 77.2430], // South Extension Available
      "AMB-105": [28.5310, 77.2620]  // Civil Hospital Stationed
    };
    return coordsMap[amb.id] || [this.centerLat + (amb.coordinates.x - 50) * 0.0008, this.centerLng + (amb.coordinates.y - 50) * 0.0008];
  }

  renderMarkers() {
    if (!this.map || !this.markersGroup || !window.L) return;
    this.markersGroup.clearLayers();

    const ambulances = window.pulseStore.data.ambulances || [];
    const facilities = window.pulseStore.data.facilities || [];
    const patients = window.pulseStore.data.patients || [];

    // 1. PLOT REGIONAL NATIONAL HEALTHCARE HUBS ACROSS INDIA (Visible in Pan-India satellite view)
    if (this.currentFilter === 'all' || this.currentFilter === 'hospital' || this.currentFilter === 'icu') {
      this.regionalHubs.forEach(hub => {
        // Skip Delhi hub from this list because FAC-01 already represents HQ in Delhi
        if (hub.id === 'HUB-DEL') return;

        const markerHtml = `
          <div class="custom-map-pin pin-hospital pin-regional-hub" style="background: linear-gradient(135deg, #0284c7 0%, #1e40af 100%); border-color: #67e8f9;">
            <span class="pin-symbol">🏛️</span>
            <span class="pin-pulse"></span>
          </div>
        `;

        const icon = L.divIcon({
          html: markerHtml,
          className: 'map-div-icon',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -20]
        });

        const popupContent = `
          <div class="map-popup-card">
            <div class="map-popup-header">
              <span class="map-popup-type">${hub.type}</span>
              <h4 class="map-popup-title">${hub.name}</h4>
              <p class="map-popup-address">📍 ${hub.city}, India</p>
            </div>
            
            <div class="map-popup-badges">
              <span class="badge badge-info">🛏️ ${hub.icu}</span>
              <span class="badge badge-success">🚑 ${hub.ambulances}</span>
            </div>

            <div class="map-popup-actions" style="margin-top: 8px;">
              <button class="btn btn-sm btn-primary w-100" onclick="liveMapModule.jumpToCity('${hub.cityKey}')">
                🔍 Zoom to ${hub.city} Healthcare Corridor
              </button>
              <a href="tel:${hub.phone}" class="btn btn-sm btn-outline w-100" style="margin-top: 4px;">
                📞 Call Referral Desk (${hub.phone})
              </a>
            </div>
          </div>
        `;

        L.marker([hub.lat, hub.lng], { icon })
          .bindPopup(popupContent, { maxWidth: 320, className: 'pulsesync-popup' })
          .addTo(this.markersGroup);
      });
    }

    // 2. PLOT LOCAL HOSPITALS & CLINICS IN DISTRICT
    if (this.currentFilter === 'all' || this.currentFilter === 'hospital' || this.currentFilter === 'icu') {
      facilities.forEach(fac => {
        if (this.currentFilter === 'icu' && !fac.icuAvailable) return;

        const coords = this.getFacilityCoordinates(fac);
        const dist = this.getDistanceInfo(coords[0], coords[1]);
        const isHq = fac.id === 'FAC-01';
        const isTrauma = fac.specialties.some(s => s.toLowerCase().includes('trauma'));

        const markerHtml = `
          <div class="custom-map-pin pin-hospital ${isHq ? 'pin-hq' : isTrauma ? 'pin-trauma' : ''}">
            <span class="pin-symbol">${isHq ? '⭐' : isTrauma ? '🚨' : '🏥'}</span>
            <span class="pin-pulse"></span>
          </div>
        `;

        const icon = L.divIcon({
          html: markerHtml,
          className: 'map-div-icon',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -20]
        });

        const popupContent = `
          <div class="map-popup-card">
            <div class="map-popup-header">
              <span class="map-popup-type">${isHq ? 'PRIMARY CLINIC HQ' : fac.type}</span>
              <h4 class="map-popup-title">${fac.name}</h4>
              <p class="map-popup-address">📍 ${fac.address}</p>
              <div class="distance-badge-pill" style="margin-top: 4px;">
                ⚡ <strong>${dist.km} km</strong> away • ~<strong>${dist.etaMins} mins</strong> drive
              </div>
            </div>
            
            <div class="map-popup-badges">
              <span class="badge ${fac.emergency24x7 ? 'badge-danger' : 'badge-neutral'}">
                ${fac.emergency24x7 ? '🚨 24x7 Casualty' : 'Day OPD'}
              </span>
              <span class="badge ${fac.icuAvailable ? 'badge-info' : 'badge-neutral'}">
                ${fac.icuAvailable ? '🛏️ ICU Available' : 'No ICU'}
              </span>
            </div>

            <div class="map-popup-beds">
              <strong>Live Facility Capacity:</strong> ${fac.bedsInfo}
            </div>

            <div class="map-popup-actions">
              <a href="tel:${fac.emergencyPhone || fac.phone}" class="btn btn-sm btn-primary">
                📞 Call 24x7 (${fac.emergencyPhone || fac.phone})
              </a>
              <button class="btn btn-sm btn-danger" onclick="facilitiesModule.dispatchTo('${fac.name}')">
                🚑 Dispatch Ambulance Here
              </button>
              <a href="https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}" target="_blank" class="btn btn-sm btn-outline">
                🗺️ Navigate (Google Maps)
              </a>
            </div>
          </div>
        `;

        L.marker(coords, { icon })
          .bindPopup(popupContent, { maxWidth: 330, className: 'pulsesync-popup' })
          .addTo(this.markersGroup);
      });
    }

    // 3. PLOT AMBULANCES (LIVE GPS & TELEMETRY)
    if (this.currentFilter === 'all' || this.currentFilter === 'ambulance') {
      ambulances.forEach(amb => {
        const coords = this.getAmbulanceCoordinates(amb);
        const dist = this.getDistanceInfo(coords[0], coords[1]);
        const isOnMission = amb.status === 'On Mission' || amb.status === 'Dispatched';
        const isAvailable = amb.status === 'Available';

        const markerHtml = `
          <div class="custom-map-pin pin-ambulance ${isOnMission ? 'pin-amb-mission' : isAvailable ? 'pin-amb-available' : 'pin-amb-maintenance'}">
            <span class="pin-symbol">🚑</span>
            <span class="pin-pulse"></span>
          </div>
        `;

        const icon = L.divIcon({
          html: markerHtml,
          className: 'map-div-icon',
          iconSize: [34, 34],
          iconAnchor: [17, 17],
          popupAnchor: [0, -18]
        });

        const popupContent = `
          <div class="map-popup-card">
            <div class="map-popup-header">
              <div class="fleet-title-row">
                <span class="fleet-id">${amb.id} (${amb.vehicleNumber})</span>
                <span class="badge ${isAvailable ? 'badge-success' : isOnMission ? 'badge-danger' : 'badge-warning'}">
                  ${amb.status}
                </span>
              </div>
              <h4 class="map-popup-title">${amb.type}</h4>
              <p class="map-popup-address">📍 Base: <strong>${amb.baseStation}</strong> (Zone: ${amb.currentZone})</p>
              <div class="distance-badge-pill" style="margin-top: 4px;">
                📍 <strong>${dist.km} km</strong> away • Response ETA: ~<strong>${dist.etaMins} mins</strong>
              </div>
            </div>

            <div class="map-popup-crew">
              <div>👨‍✈️ Driver: <strong>${amb.driverName}</strong> (<a href="tel:${amb.driverPhone}">${amb.driverPhone}</a>)</div>
              <div>🩺 Paramedic: <strong>${amb.paramedic}</strong></div>
            </div>

            <div class="map-popup-equipment">
              <span class="label-tiny">Equipped:</span> ${amb.equipment.slice(0, 3).join(', ')}...
            </div>

            <div class="map-popup-actions">
              ${isAvailable ? `
                <button class="btn btn-sm btn-primary w-100" onclick="ambulanceModule.quickDispatchUnit('${amb.id}')">
                  🚀 1-Click Dispatch This Ambulance
                </button>
              ` : `
                <a href="tel:${amb.driverPhone}" class="btn btn-sm btn-outline w-100">
                  📞 Call Ambulance Driver
                </a>
              `}
            </div>
          </div>
        `;

        L.marker(coords, { icon })
          .bindPopup(popupContent, { maxWidth: 310, className: 'pulsesync-popup' })
          .addTo(this.markersGroup);
      });
    }

    // 4. PLOT DOCTOR HOME VISITS & PATIENT HOMES (PATIENT DATA ON MAP)
    if (this.currentFilter === 'all' || this.currentFilter === 'homevisit') {
      patients.forEach(pat => {
        const homeMeta = this.patientHomeCoords[pat.id];
        if (!homeMeta) return;

        const dist = this.getDistanceInfo(homeMeta.lat, homeMeta.lng);

        const markerHtml = `
          <div class="custom-map-pin pin-patient-home">
            <span class="pin-symbol">🏠</span>
            <span class="pin-pulse"></span>
          </div>
        `;

        const icon = L.divIcon({
          html: markerHtml,
          className: 'map-div-icon',
          iconSize: [34, 34],
          iconAnchor: [17, 17],
          popupAnchor: [0, -18]
        });

        const popupContent = `
          <div class="map-popup-card">
            <div class="map-popup-header">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span class="badge badge-id">${pat.id}</span>
                <span class="blood-badge-inline">${pat.bloodGroup}</span>
              </div>
              <h4 class="map-popup-title" style="margin-top: 4px;">${pat.name} (${pat.age}y, ${pat.gender})</h4>
              <p class="map-popup-address">🏠 ${pat.address} (${homeMeta.landmark})</p>
              <div class="distance-badge-pill" style="margin-top: 4px; background: rgba(139, 92, 246, 0.15); color: #a78bfa; border-color: rgba(139, 92, 246, 0.3);">
                🚗 <strong>${dist.km} km</strong> from clinic • ~<strong>${dist.etaMins} mins</strong> drive
              </div>
            </div>

            <div style="font-size: 0.82rem; background: var(--bg-surface); padding: 0.5rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
              <div style="color: var(--warning); font-weight: 600;">🩺 Home Care Need:</div>
              <div>${homeMeta.homeVisitReq}</div>
              <div style="color: var(--text-muted); font-size: 0.76rem; margin-top: 4px;">Chronic: ${pat.chronicNotes || 'None'} | Allergies: ${pat.allergies || 'None'}</div>
            </div>

            <div class="map-popup-actions">
              <button class="btn btn-sm btn-primary" onclick="liveMapModule.openHomeVisitModal('${pat.id}')">
                🩺 Log Doctor Home Visit
              </button>
              <a href="tel:${pat.phone}" class="btn btn-sm btn-outline">
                📞 Call (${pat.phone})
              </a>
              <button class="btn btn-sm btn-danger" onclick="liveMapModule.sendAmbulanceToPatientHome('${pat.id}')">
                🚑 Send Ambulance Here
              </button>
            </div>
          </div>
        `;

        L.marker([homeMeta.lat, homeMeta.lng], { icon })
          .bindPopup(popupContent, { maxWidth: 320, className: 'pulsesync-popup' })
          .addTo(this.markersGroup);
      });
    }
  }

  setFilter(filterType) {
    this.currentFilter = filterType;
    document.querySelectorAll('.map-filter-pill').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-map-filter') === filterType);
    });

    if (this.map) {
      this.renderMarkers();
    } else {
      this.renderFallbackMarkers();
    }
  }

  locateNearestFacility() {
    const facilities = window.pulseStore.data.facilities || [];
    let nearest = null;
    let minKm = 9999;

    facilities.forEach(fac => {
      const coords = this.getFacilityCoordinates(fac);
      const d = this.getDistanceInfo(coords[0], coords[1]);
      if (parseFloat(d.km) < minKm) {
        minKm = parseFloat(d.km);
        nearest = { fac, coords, dist: d };
      }
    });

    if (nearest && this.map) {
      this.map.setView(nearest.coords, 15, { animate: true });
      pulseApp.showToast(`Nearest Hospital: ${nearest.fac.name} (${nearest.dist.km} km away • ~${nearest.dist.etaMins} min drive)`, 'info');
    }
  }

  locateNearestAmbulance() {
    const ambulances = window.pulseStore.data.ambulances || [];
    const available = ambulances.filter(a => a.status === 'Available');

    if (available.length === 0) {
      pulseApp.showToast('All regional units currently on mission. Contact 108 Emergency Grid.', 'warning');
      return;
    }

    let nearest = null;
    let minKm = 9999;

    available.forEach(amb => {
      const coords = this.getAmbulanceCoordinates(amb);
      const d = this.getDistanceInfo(coords[0], coords[1]);
      if (parseFloat(d.km) < minKm) {
        minKm = parseFloat(d.km);
        nearest = { amb, coords, dist: d };
      }
    });

    if (nearest && this.map) {
      this.map.setView(nearest.coords, 15, { animate: true });
      pulseApp.showToast(`Nearest Unit: ${nearest.amb.id} (${nearest.amb.type}) in ${nearest.amb.currentZone} (${nearest.dist.km} km • ETA ~${nearest.dist.etaMins} mins)`, 'success');
    }
  }

  // Pre-fill ambulance dispatch to patient home
  sendAmbulanceToPatientHome(patientId) {
    const patient = window.pulseStore.getPatient(patientId);
    if (!patient) return;

    pulseApp.openModal('new-ambulance-request-modal');
    
    // Auto-fill form
    setTimeout(() => {
      const form = document.getElementById('new-ambulance-form');
      if (!form) return;
      if (form.elements['patientName']) form.elements['patientName'].value = patient.name;
      if (form.elements['age']) form.elements['age'].value = patient.age;
      if (form.elements['contact']) form.elements['contact'].value = patient.phone;
      if (form.elements['pickupAddress']) form.elements['pickupAddress'].value = `${patient.address} (${this.patientHomeCoords[patientId]?.landmark || ''})`;
      if (form.elements['reason']) form.elements['reason'].value = `Emergency Home Extraction: Patient ${patient.name} (${patient.chronicNotes || 'Urgent Condition'})`;
    }, 100);
  }

  // Modal / Prompt to Log Doctor Home Visit
  openHomeVisitModal(patientId) {
    const patient = window.pulseStore.getPatient(patientId);
    if (!patient) return;

    const doctorName = (window.pulseAuth && window.pulseAuth.currentRole === 'doctor') 
      ? 'Dr. Rajesh Sharma, MD' 
      : 'Dr. Rajesh Sharma (Attending Physician)';

    const bp = prompt(`[Doctor Home Visit for ${patient.name}]\nEnter Blood Pressure (e.g. 128/82 mmHg):`, "120/80 mmHg");
    if (!bp) return;

    const sugar = prompt("Enter Blood Glucose (e.g. 110 mg/dL):", "115 mg/dL");
    const notes = prompt("Enter Doctor Clinical Observations & Instructions:", "Home vitals stable. Continued prescribed maintenance regimen.");

    if (notes) {
      const newVisit = {
        id: `HV-${Math.floor(100 + Math.random() * 900)}`,
        date: new Date().toISOString().split('T')[0],
        doctor: doctorName,
        department: "Doctor Home Visit Care",
        purpose: "Scheduled Doctor Home Clinical Review",
        adminNotes: `[Home Visit Recorded] BP: ${bp} | Sugar: ${sugar || 'N/A'} | Clinical Notes: ${notes}`,
        followUpDate: ""
      };

      if (!patient.visitHistory) patient.visitHistory = [];
      patient.visitHistory.unshift(newVisit);
      window.pulseStore.save();

      pulseApp.showToast(`Home visit recorded for ${patient.name} by ${doctorName}`, 'success');
      window.pulseAudio.playSuccessNotification();
    }
  }

  // High-Precision SVG / Canvas Indian Vector Map Fallback (Loads Instantly with 0 Network Latency)
  initFallbackMap(container) {
    if (!container) return;
    container.innerHTML = `
      <div class="vector-map-fallback" style="position: relative; width: 100%; height: 100%; min-height: 440px; background: #0b1329; overflow: hidden;">
        <!-- India Regional Geo Grid Lines -->
        <svg viewBox="0 0 1000 600" style="position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0.15;" preserveAspectRatio="none">
          <line x1="0" y1="150" x2="1000" y2="150" stroke="#06b6d4" stroke-width="1" stroke-dasharray="4"/>
          <line x1="0" y1="300" x2="1000" y2="300" stroke="#06b6d4" stroke-width="1.5"/>
          <line x1="0" y1="450" x2="1000" y2="450" stroke="#06b6d4" stroke-width="1" stroke-dasharray="4"/>
          <line x1="250" y1="0" x2="250" y2="600" stroke="#06b6d4" stroke-width="1" stroke-dasharray="4"/>
          <line x1="500" y1="0" x2="500" y2="600" stroke="#06b6d4" stroke-width="1.5"/>
          <line x1="750" y1="0" x2="750" y2="600" stroke="#06b6d4" stroke-width="1" stroke-dasharray="4"/>
          <!-- India Northern/Central Healthcare Corridor Arterial Roads -->
          <path d="M 150,180 Q 500,300 850,420" stroke="#38bdf8" stroke-width="2" fill="none" opacity="0.6"/>
          <path d="M 500,50 L 500,550" stroke="#38bdf8" stroke-width="2" fill="none" opacity="0.6"/>
        </svg>

        <div style="position: absolute; top: 12px; left: 16px; background: rgba(15, 23, 42, 0.85); padding: 6px 12px; border-radius: 8px; border: 1px solid rgba(6, 182, 212, 0.3); font-size: 0.8rem; color: #38bdf8; z-index: 10;">
          📍 India Regional Healthcare Corridor (Delhi-NCR Hub) • Vector Engine Active
        </div>

        <div class="vector-map-center-hub" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; z-index: 5;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #0284c7; color: #fff; display: flex; align-items: center; justify-content: center; margin: 0 auto; box-shadow: 0 0 20px #06b6d4;">⭐</div>
          <span style="font-size: 0.75rem; font-weight: 700; color: #fff; background: rgba(0,0,0,0.7); padding: 2px 6px; border-radius: 4px; margin-top: 4px; display: inline-block;">AuraCare Clinic HQ</span>
        </div>

        <div id="vector-map-markers" class="vector-map-markers-layer" style="position: absolute; inset: 0; z-index: 6;"></div>
      </div>
    `;

    this.renderFallbackMarkers();
  }

  renderFallbackMarkers() {
    const layer = document.getElementById('vector-map-markers');
    if (!layer) return;

    const ambulances = window.pulseStore.data.ambulances || [];
    const facilities = window.pulseStore.data.facilities || [];
    const patients = window.pulseStore.data.patients || [];

    let html = '';

    // Render facilities
    if (this.currentFilter === 'all' || this.currentFilter === 'hospital' || this.currentFilter === 'icu') {
      facilities.forEach(fac => {
        if (this.currentFilter === 'icu' && !fac.icuAvailable) return;
        const coords = this.getFacilityCoordinates(fac);
        const dist = this.getDistanceInfo(coords[0], coords[1]);
        const top = Math.min(Math.max(50 - (coords[0] - this.centerLat) * 1200, 10), 85);
        const left = Math.min(Math.max(50 + (coords[1] - this.centerLng) * 1200, 10), 88);

        html += `
          <div class="vector-marker marker-hospital" style="position: absolute; top: ${top}%; left: ${left}%; transform: translate(-50%, -50%); cursor: pointer;" onclick="facilitiesModule.dispatchTo('${fac.name}')" title="${fac.name} - ${dist.km} km (${fac.bedsInfo})">
            <span style="background: #2563eb; color: #fff; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; border: 1px solid #93c5fd; box-shadow: 0 2px 8px rgba(0,0,0,0.5);">🏥 ${fac.name.split(' ')[0]} (${dist.km}km)</span>
          </div>
        `;
      });
    }

    // Render ambulances
    if (this.currentFilter === 'all' || this.currentFilter === 'ambulance') {
      ambulances.forEach(amb => {
        const coords = this.getAmbulanceCoordinates(amb);
        const dist = this.getDistanceInfo(coords[0], coords[1]);
        const top = Math.min(Math.max(50 - (coords[0] - this.centerLat) * 1200, 12), 85);
        const left = Math.min(Math.max(50 + (coords[1] - this.centerLng) * 1200, 12), 88);
        const isOnMission = amb.status === 'On Mission' || amb.status === 'Dispatched';

        html += `
          <div class="vector-marker marker-amb" style="position: absolute; top: ${top}%; left: ${left}%; transform: translate(-50%, -50%); cursor: pointer;" onclick="ambulanceModule.quickDispatchUnit('${amb.id}')" title="${amb.id} (${amb.status}) - ${dist.km}km">
            <span style="background: ${isOnMission ? '#f43f5e' : '#10b981'}; color: #fff; padding: 3px 7px; border-radius: 10px; font-size: 0.72rem; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.5);">🚑 ${amb.id}</span>
          </div>
        `;
      });
    }

    // Render patient home visits
    if (this.currentFilter === 'all' || this.currentFilter === 'homevisit') {
      patients.forEach(pat => {
        const homeMeta = this.patientHomeCoords[pat.id];
        if (!homeMeta) return;
        const dist = this.getDistanceInfo(homeMeta.lat, homeMeta.lng);
        const top = Math.min(Math.max(50 - (homeMeta.lat - this.centerLat) * 1200, 12), 85);
        const left = Math.min(Math.max(50 + (homeMeta.lng - this.centerLng) * 1200, 12), 88);

        html += `
          <div class="vector-marker marker-patient" style="position: absolute; top: ${top}%; left: ${left}%; transform: translate(-50%, -50%); cursor: pointer;" onclick="liveMapModule.openHomeVisitModal('${pat.id}')" title="Doctor Home Visit: ${pat.name} - ${dist.km}km">
            <span style="background: #8b5cf6; color: #fff; padding: 3px 7px; border-radius: 10px; font-size: 0.72rem; font-weight: bold; border: 1px solid #c4b5fd; box-shadow: 0 2px 8px rgba(0,0,0,0.5);">🏠 ${pat.name.split(' ')[0]} (${dist.km}km)</span>
          </div>
        `;
      });
    }

    layer.innerHTML = html;
  }
}

window.liveMapModule = new LiveMapModule();
