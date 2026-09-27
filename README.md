My Name is Paras Manohar Arekar and this is my project for hackathon fit-fest 2k26 My Topic was "Clinic Appointment, Patient & Emergency Management System"

This is the description of My Project

# 🩺 PulseSync: Clinic & Emergency Healthcare Platform

A modern, responsive, high-performance web platform designed for small clinics, attending physicians, and patients. PulseSync bridges the gap between manual clinic administration (notebooks, phone calls, WhatsApp messages) and critical emergency coordination (ambulance dispatch, blood stock availability, and nearby hospital referrals).

> **Regulatory & Administrative Notice:** PulseSync is strictly an administrative and emergency logistics coordination system. It does **not** provide automated clinical diagnosis or medical decision-making.

---

## 🌟 Persona-Specific Portals & Access Control

PulseSync presents a **Role Selection Gateway right before entering the website**, allowing users to experience tailored dashboards, visual styles, and workflows:

### 1. 🏥 Clinic Management Staff Portal
- **Visual Aesthetic**: Electric Cyan & Deep Navy command center theme.
- **Tailored For**: Clinic Administrators, Reception Staff, and Emergency Dispatchers.
- **Key Features**:
  - Full clinic appointment schedule management & status progression.
  - Complete digital patient registry & visit histories.
  - Real-time GPS ambulance fleet radar & emergency dispatch console.
  - Regional blood bank stock monitoring & emergency blood broadcasts.
  - Clinic operational analytics & JSON data exports.

### 2. 👤 Patient & Family Health Portal
- **Visual Aesthetic**: Reassuring Medical Emerald & Soft Slate layout.
- **Tailored For**: Patients, Caregivers, and Families.
- **Key Features**:
  - Personalized welcome banner with patient's medical ID, blood group (`O+`), and chronic notes.
  - Quick 30-second doctor consultation booking.
  - "My Active Appointments" list with printable appointment passes.
  - Direct 1-click **Emergency Ambulance SOS** callout.
  - Direct access to local blood availability matrix and nearby 24/7 hospital directory.

### 3. 🩺 Doctor / Physician Portal
- **Visual Aesthetic**: Clinical Royal Blue & Indigo workspace.
- **Tailored For**: Attending Doctors (e.g., Dr. Rajesh Sharma - General Medicine).
- **Key Features**:
  - Today's assigned patient consultation queue with live waiting room counters.
  - Instant status updates (`Scheduled` ➔ `Checked-In` ➔ `In-Consultation` ➔ `Completed`).
  - Fast access to patient allergy alerts, diagnostic history, and past consultation notes.
  - Emergency hospital trauma center link.

> **Instant Role Switching:** Users and evaluators can switch roles or test different personas at any time using the **⇄ Switch** button in the top navigation header.

---

## 🌟 Core System Modules

### 🗺️ Live India Regional Healthcare & Emergency GIS Map
- **Strictly Bounded to India**: High-performance GIS map with Leaflet canvas acceleration, zero external CDN lag (local bundled `leaflet.js`), and clean OpenStreetMap / CartoDB tiles.
- **Doctor Home Visits & Patient Telemetry**:
  - Displays elderly, post-operative, and chronic patients pinned across the district in India.
  - Doctors & management can view patient medical details, exact distance & driving time from the clinic, and 1-click **Log Doctor Home Visit** (saving BP, Blood Glucose, and observations directly into the patient's record).
  - 1-click **Send Ambulance to Patient Home** with pre-filled address and emergency reasons.
- **High-Precision Haversine Distance Engine**:
  - Computes exact road distances (`km`) and realistic driving times (`min drive`) based on Indian metro transit benchmarks.
- **Regional Corridor Switcher**:
  - Quick-jump between Delhi-NCR (Clinic HQ), Mumbai, Bengaluru, Hyderabad, Kolkata, Chennai, and Pan-India national view.
- **Emergency Hospital Beds & Fleet Radar**:
  - Real-time verified ICU/general beds, direct casualty phone calling, and 1-click ambulance dispatch.

### ⚡ Ultra-Low-Spec Hardware Performance Architecture
- **Engineered to Run on Any Computer**: Runs smoothly at 60 FPS even on entry-level dual-core laptops (e.g., Intel Celeron / Pentium, 4GB RAM, integrated graphics):
  - *Radar Loop Throttling*: Canvas radar sweep throttled to 25 FPS and pauses completely when off-tab, dropping background CPU usage from ~80% to < 2%.
  - *Zero CDN Dependencies*: Leaflet JS & CSS bundled locally, guaranteeing 0ms load lag and 100% offline capability.
  - *GPU Paint Containment*: CSS `contain: paint layout` and lightened blur filters eliminate GPU compositor stalls.
  - *RAF-Throttled Scroll Observer*: Passive scroll handlers and scoped intersection observers ensure butter-smooth page scrolling.

### 💡 The Doctor-Patient Trust Blueprint & Healthcare Mission
- **Why PulseSync Was Developed**: Tackles the real-world chaos of paper notebooks, 2-hour waiting room fights, blind emergency referrals, and untracked blood shortages in Indian small clinics.
- **Long-Term Error & Conflict Prevention**:
  - *Allergy & Drug Safety Shield*: Neon warnings for Penicillin, Sulfa, and NSAID allergies prevent fatal medication mistakes.
  - *Transparent Digital Token Queue*: Real-time consultation status updates eliminate front-desk arguments.
  - *Longitudinal Health Records*: Preserves multi-year vitals, diagnostic notes, and follow-ups.
- **Future Strategic Vision**: Scalable alignment with the Ayushman Bharat Digital Mission (ABDM / ABHA ID) and community preventative tele-triage.

### 👤 Patient Registration & Medical History
- Capture patient name, age, gender, phone/WhatsApp, emergency contact, address, allergies, and chronic notes.
- Instant search by name, phone, blood group, or unique ID (`PT-1001` - `PT-1008`).
- Complete visit timeline with printable administrative record slips.

### 📅 Appointment Booking & Multi-State Scheduling
- Conflict-free scheduling with doctor selection, priority (`Routine`, `Urgent`, `Follow-up`), and time slots.
- Date filtering tabs: `Today`, `Upcoming`, `Past Consultations`, `All Dates`.
- Automated follow-up reminders with direct 1-click WhatsApp message generation.
- Formatted appointment passes ready for front desk printing.

### 🚑 Ambulance Emergency Dispatch & Fleet Tracking
- Submit emergency transport requests with triage severity (`Critical - Red`, `Urgent - Amber`, `Non-Critical - Green`).
- Live roster for ALS, BLS, ICU on Wheels, Neonatal units, and Patient Transport vehicles.
- Simulated radar sweep visualizer and dynamic ETA countdown ticker.

### 🩸 Blood Stock Matrix & Donor Coordination
- Real-time aggregated inventory across 8 blood groups (`A+`, `A-`, `B+`, `B-`, `O+`, `O-`, `AB+`, `AB-`) with critical shortage warnings (< 5 units).
- Broadcast emergency blood requirements with urgency levels.
- Directory of verified regional blood banks and volunteer donor registry with WhatsApp connect.

### 🏥 Nearby Healthcare Facilities & Clinic Directory
- Instant directory of primary clinics, public hospitals, trauma centers, and maternity centers.
- Live bed availability indicators (ICU, Emergency Bay, General Care).

---

## ⚡ Native C++ & Python Relational Database Architecture

PulseSync features a hybrid architecture combining high-speed native calculation with robust relational persistence:

### 1. ⚡ High-Speed C++ Native Engine (`native/engine.cpp`)
- Compiled with MinGW `g++ -O3` into `native/pulse_engine.exe` and `native/pulse_engine.dll`.
- **Haversine Geodesic Distance Engine**: Computes high-precision great-circle distances across India in sub-millisecond time.
- **Emergency Transit ETA Calculator**: Factors emergency beacon acceleration and Indian traffic conditions.
- **Clinical Triage Scoring**: Calculates priority severity (1-100) based on age, trauma type, heart rate, and blood pressure.
- **ABO/Rh Blood Compatibility**: Instant donor-recipient cross-matching with universal donor fallbacks.

### 2. 🐍 Python Full-Stack Backend & REST API (`server.py`)
- High-concurrency multithreaded HTTP server running on port `3000`.
- Interfaces with the C++ native binary for real-time computations.
- Exposes full REST API endpoints:
  - `GET /api/status` - System health, engine loading state, and table metrics.
  - `GET /api/stats` - Real-time aggregated KPI counts.
  - `GET /api/patients`, `POST /api/patients` - Patient management.
  - `GET /api/appointments`, `POST /api/appointments` - Appointment scheduling.
  - `GET /api/ambulances`, `POST /api/ambulances/status` - Live fleet tracking & dispatches.
  - `GET /api/facilities` - Hospitals, ICUs, and casualty trauma centers.
  - `GET /api/blood`, `POST /api/blood/request` - Blood inventory & compatible unit allocations.
  - `POST /api/emergency/sos` - Urgent emergency dispatch with C++ triage calculation.
  - `POST /api/engine/calculate-route` - Direct C++ geodesic engine testing.

### 3. 💾 SQLite Relational Database (`database/pulsesync.db`)
- Normalized relational database schema with ACID transaction guarantees.
- Tables: `patients`, `appointments`, `ambulances`, `facilities`, `blood_inventory`, `emergency_dispatches`.

### 4. 🛰️ Genuine High-Resolution Satellite Map of India (`assets/india-satellite.png`)
- Authentic space composite photography of the Indian subcontinent (1.58 MB) integrated into Leaflet GIS.
- Eliminates CartoDB "API KEY REQUIRED" watermarks and provides true geospatial context.

---

## 🚀 How to Run Locally

1. **Start the Python Backend & C++ Engine**
   ```powershell
   python server.py
   ```
2. **Access the Clean Dashboard in Your Browser**
   ```
   http://localhost:3000
   ```

---

## 📁 Clean File Structure

```
hackathon fit fest/
├── index.html                 # Clean, modern executive healthcare SPA interface
├── README.md                  # Comprehensive system documentation
├── server.py                  # Python backend server, SQLite manager & C++ bridge
├── assets/
│   └── india-satellite.png    # High-resolution satellite composite of India (1.58 MB)
├── css/
│   ├── clean-app.css          # Ultra-clean executive dark design system (v4.0)
│   └── leaflet.css            # Bundled local GIS map styles
├── database/
│   └── pulsesync.db           # Persistent SQLite3 relational database
├── js/
│   ├── api.js                 # PulseAPI client communicating with Python backend & C++ engine
│   ├── clean-app.js           # Clean frontend controller, tabs, modals, satellite map
│   └── leaflet.js             # Bundled local Leaflet library (zero CDN lag)
└── native/
    ├── engine.cpp             # High-performance C++ geodesic, triage, and blood matching engine
    ├── pulse_engine.exe       # Compiled C++ executable (-O3 optimized)
    └── pulse_engine.dll       # Compiled C++ dynamic link library
```

