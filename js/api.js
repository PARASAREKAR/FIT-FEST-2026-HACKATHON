/**
 * PulseSync REST API Client & Native C++ Engine Bridge
 * Communicates with the Python backend & SQLite database with C++ geospatial engine.
 */

const API_BASE = window.location.origin;

window.PulseAPI = {
  // Check backend health & C++ native engine status
  async getStatus() {
    try {
      const res = await fetch(`${API_BASE}/api/status`);
      return await res.json();
    } catch (err) {
      console.warn("Backend offline, using local fallback:", err);
      return { status: "local", native_engine: { loaded: false } };
    }
  },

  // Key platform stats
  async getStats() {
    try {
      const res = await fetch(`${API_BASE}/api/stats`);
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  // Patients CRUD
  async getPatients(search = "") {
    try {
      const q = search ? `?q=${encodeURIComponent(search)}` : "";
      const res = await fetch(`${API_BASE}/api/patients${q}`);
      return await res.json();
    } catch (err) {
      return [];
    }
  },

  async addPatient(patient) {
    try {
      const res = await fetch(`${API_BASE}/api/patients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patient)
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // Appointments CRUD
  async getAppointments(status = "") {
    try {
      const q = status ? `?status=${encodeURIComponent(status)}` : "";
      const res = await fetch(`${API_BASE}/api/appointments${q}`);
      return await res.json();
    } catch (err) {
      return [];
    }
  },

  async addAppointment(apt) {
    try {
      const res = await fetch(`${API_BASE}/api/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apt)
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async updateAppointmentStatus(id, status) {
    try {
      const res = await fetch(`${API_BASE}/api/appointments/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // Ambulances
  async getAmbulances() {
    try {
      const res = await fetch(`${API_BASE}/api/ambulances`);
      return await res.json();
    } catch (err) {
      return [];
    }
  },

  async updateAmbulanceStatus(id, status, destination = "Base Station") {
    try {
      const res = await fetch(`${API_BASE}/api/ambulances/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, destination })
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // Facilities
  async getFacilities() {
    try {
      const res = await fetch(`${API_BASE}/api/facilities`);
      return await res.json();
    } catch (err) {
      return [];
    }
  },

  // Blood Inventory
  async getBlood(group = "") {
    try {
      const q = group ? `?group=${encodeURIComponent(group)}` : "";
      const res = await fetch(`${API_BASE}/api/blood${q}`);
      return await res.json();
    } catch (err) {
      return [];
    }
  },

  async requestBlood(recipientGroup, units = 1, patientName = "Emergency Patient") {
    try {
      const res = await fetch(`${API_BASE}/api/blood/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient_group: recipientGroup, units, patient_name: patientName })
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // High-Priority Emergency SOS with C++ Triage & Dispatch
  async triggerSOS(sosData) {
    try {
      const res = await fetch(`${API_BASE}/api/emergency/sos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sosData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // Call C++ Native Geodesic Engine Directly
  async calculateRoute(lat1, lon1, lat2, lon2, isEmergency = true) {
    try {
      const res = await fetch(`${API_BASE}/api/engine/calculate-route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat1, lon1, lat2, lon2, is_emergency: isEmergency })
      });
      return await res.json();
    } catch (err) {
      return { distance_km: 0, eta_mins: 0 };
    }
  },

  // ==========================================
  // AUTHENTICATION & PERSONA SESSION CONTROL
  // ==========================================
  async login(email, password, role = "") {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      if (data.success && data.user) {
        localStorage.setItem("pulsesync_user", JSON.stringify(data.user));
        localStorage.setItem("pulsesync_session_id", data.session_id);
      }
      return data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async register(userData) {
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      if (data.success && data.user) {
        localStorage.setItem("pulsesync_user", JSON.stringify(data.user));
        localStorage.setItem("pulsesync_session_id", data.session_id);
      }
      return data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getCurrentUser() {
    try {
      const stored = localStorage.getItem("pulsesync_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  logout() {
    localStorage.removeItem("pulsesync_user");
    localStorage.removeItem("pulsesync_session_id");
  },

  async getSessions() {
    try {
      const res = await fetch(`${API_BASE}/api/auth/sessions`);
      return await res.json();
    } catch {
      return [];
    }
  },

  async getUsers() {
    try {
      const res = await fetch(`${API_BASE}/api/auth/users`);
      return await res.json();
    } catch {
      return [];
    }
  }
};

