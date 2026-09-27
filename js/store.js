/**
 * PulseSync Store - Reactive Centralized State Management
 * Persistent in localStorage with realistic healthcare & emergency seed data
 */

const STORAGE_KEY = 'pulsesync_healthcare_store_v1';

// Calculate relative dates for realistic dynamic schedule
function getRelativeDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

const DEFAULT_DATA = {
  clinic: {
    name: "AuraCare Health Clinic & Emergency Hub",
    code: "CLINIC-704",
    phone: "+91 98765 43210",
    emergencyHotline: "+91 98765 00108 / 108",
    email: "emergency@auracarehealth.org",
    address: "Block 4, Metro Medical Enclave, Central Avenue",
    operatingHours: "OPD: 08:30 AM - 08:30 PM | Emergency & Ambulance: 24x7",
    activeStaffCount: 14
  },
  patients: [
    {
      id: "PT-1001",
      name: "Ramesh Sharma",
      age: 58,
      gender: "Male",
      phone: "+91 98231 44521",
      bloodGroup: "O+",
      address: "12/B Sector 18, Green Park",
      emergencyContact: "+91 98231 99881 (Wife)",
      chronicNotes: "Type 2 Diabetes, Mild Hypertension",
      allergies: "Penicillin",
      registeredDate: getRelativeDate(-45),
      visitHistory: [
        {
          id: "VH-801",
          date: getRelativeDate(-45),
          doctor: "Dr. Rajesh Sharma",
          department: "General Medicine",
          purpose: "Initial Consultation for persistent fatigue",
          adminNotes: "Prescribed routine metabolic panel. Advised low glycemic diet.",
          followUpDate: getRelativeDate(-15)
        },
        {
          id: "VH-802",
          date: getRelativeDate(-15),
          doctor: "Dr. Rajesh Sharma",
          department: "General Medicine",
          purpose: "Fasting sugar review",
          adminNotes: "HbA1c steady at 6.8. Continue current medication.",
          followUpDate: getRelativeDate(14)
        }
      ]
    },
    {
      id: "PT-1002",
      name: "Ananya Iyer",
      age: 29,
      gender: "Female",
      phone: "+91 97112 34567",
      bloodGroup: "B+",
      address: "Flat 402, Lotus Towers, West Extension",
      emergencyContact: "+91 97112 99001 (Husband)",
      chronicNotes: "None",
      allergies: "Sulfa drugs",
      registeredDate: getRelativeDate(-20),
      visitHistory: [
        {
          id: "VH-803",
          date: getRelativeDate(-20),
          doctor: "Dr. Priya Nair",
          department: "Pediatrics & Family Care",
          purpose: "Post-viral respiratory check",
          adminNotes: "Clear chest sounds. Inhaler advised for mild wheeze.",
          followUpDate: getRelativeDate(0)
        }
      ]
    },
    {
      id: "PT-1003",
      name: "Gurpreet Singh",
      age: 44,
      gender: "Male",
      phone: "+91 98450 78912",
      bloodGroup: "AB+",
      address: "74 Model Town, North Zone",
      emergencyContact: "+91 98450 11223 (Brother)",
      chronicNotes: "Lumbar Disc Herniation L4-L5",
      allergies: "No known allergies",
      registeredDate: getRelativeDate(-60),
      visitHistory: [
        {
          id: "VH-804",
          date: getRelativeDate(-7),
          doctor: "Dr. Amit Verma",
          department: "Orthopedics & Trauma",
          purpose: "Lower back pain aggravation",
          adminNotes: "Scheduled for physiotherapy review. Recommended ergonomics kit.",
          followUpDate: getRelativeDate(7)
        }
      ]
    },
    {
      id: "PT-1004",
      name: "Fatima Zehra",
      age: 34,
      gender: "Female",
      phone: "+91 98991 22334",
      bloodGroup: "A+",
      address: "Lane 5, Hazratganj Colony",
      emergencyContact: "+91 98991 77665 (Father)",
      chronicNotes: "Asthma (Mild persistent)",
      allergies: "Dust mites, Aspirin",
      registeredDate: getRelativeDate(-12),
      visitHistory: []
    },
    {
      id: "PT-1005",
      name: "Devendra Patil",
      age: 67,
      gender: "Male",
      phone: "+91 98110 55667",
      bloodGroup: "O-",
      address: "Plot 88, Sunrise Enclave",
      emergencyContact: "+91 98110 88990 (Son)",
      chronicNotes: "Coronary Stent (2023), Blood Thinners",
      allergies: "Iodine contrast dye",
      registeredDate: getRelativeDate(-90),
      visitHistory: [
        {
          id: "VH-805",
          date: getRelativeDate(-30),
          doctor: "Dr. Rajesh Sharma",
          department: "Cardiology & General Medicine",
          purpose: "ECG Follow-up & BP Check",
          adminNotes: "BP 132/84 mmHg. Blood tests normal. Advised walk 20 min/day.",
          followUpDate: getRelativeDate(0)
        }
      ]
    },
    {
      id: "PT-1006",
      name: "Snehal Kulkarni",
      age: 22,
      gender: "Female",
      phone: "+91 99220 12345",
      bloodGroup: "A-",
      address: "Hostel 3, University Campus",
      emergencyContact: "+91 99220 54321 (Mother)",
      chronicNotes: "Migraine with aura",
      allergies: "None",
      registeredDate: getRelativeDate(-5),
      visitHistory: []
    },
    {
      id: "PT-1007",
      name: "Vikramaditya Roy",
      age: 51,
      gender: "Male",
      phone: "+91 98300 98765",
      bloodGroup: "B-",
      address: "18-C Park Street Colony",
      emergencyContact: "+91 98300 45678 (Wife)",
      chronicNotes: "Chronic Gastritis",
      allergies: "Ibuprofen",
      registeredDate: getRelativeDate(-35),
      visitHistory: []
    }
  ],
  appointments: [
    {
      id: "APT-501",
      patientId: "PT-1001",
      patientName: "Ramesh Sharma",
      doctor: "Dr. Rajesh Sharma",
      department: "General Medicine",
      date: getRelativeDate(0),
      timeSlot: "09:30 AM",
      priority: "Routine",
      status: "Checked-In",
      reason: "Diabetes 3-month review and fasting sugar reports",
      notes: "Arrived at 9:20 AM. Waiting in Lounge A.",
      followUpReminder: getRelativeDate(30),
      createdAt: getRelativeDate(-2)
    },
    {
      id: "APT-502",
      patientId: "PT-1002",
      patientName: "Ananya Iyer",
      doctor: "Dr. Priya Nair",
      department: "Pediatrics & Family Care",
      date: getRelativeDate(0),
      timeSlot: "10:15 AM",
      priority: "Follow-up",
      status: "In-Consultation",
      reason: "Post-viral respiratory check and spirometry review",
      notes: "In Room 2 with Dr. Priya Nair.",
      followUpReminder: getRelativeDate(14),
      createdAt: getRelativeDate(-3)
    },
    {
      id: "APT-503",
      patientId: "PT-1005",
      patientName: "Devendra Patil",
      doctor: "Dr. Rajesh Sharma",
      department: "General Medicine",
      date: getRelativeDate(0),
      timeSlot: "11:00 AM",
      priority: "Urgent",
      status: "Scheduled",
      reason: "Mild chest heaviness post-exercise, needs ECG check",
      notes: "High priority. Front desk to prep ECG lead kit.",
      followUpReminder: "",
      createdAt: getRelativeDate(-1)
    },
    {
      id: "APT-504",
      patientId: "PT-1004",
      patientName: "Fatima Zehra",
      doctor: "Dr. Priya Nair",
      department: "Pediatrics & Family Care",
      date: getRelativeDate(0),
      timeSlot: "11:45 AM",
      priority: "Routine",
      status: "Scheduled",
      reason: "Annual wellness checkup and allergy consultation",
      notes: "Has allergy test slip from prior hospital.",
      followUpReminder: "",
      createdAt: getRelativeDate(-4)
    },
    {
      id: "APT-505",
      patientId: "PT-1003",
      patientName: "Gurpreet Singh",
      doctor: "Dr. Amit Verma",
      department: "Orthopedics & Trauma",
      date: getRelativeDate(0),
      timeSlot: "02:30 PM",
      priority: "Follow-up",
      status: "Scheduled",
      reason: "Lumbar spine rehab review & posture assessment",
      notes: "Physio progress reports attached.",
      followUpReminder: getRelativeDate(21),
      createdAt: getRelativeDate(-5)
    },
    {
      id: "APT-506",
      patientId: "PT-1006",
      patientName: "Snehal Kulkarni",
      doctor: "Dr. Rajesh Sharma",
      department: "General Medicine",
      date: getRelativeDate(1),
      timeSlot: "10:00 AM",
      priority: "Routine",
      status: "Scheduled",
      reason: "Frequent headache and neck strain consultation",
      notes: "Student discount voucher applicable.",
      followUpReminder: "",
      createdAt: getRelativeDate(-1)
    },
    {
      id: "APT-507",
      patientId: "PT-1007",
      patientName: "Vikramaditya Roy",
      doctor: "Dr. Amit Verma",
      department: "Orthopedics & Trauma",
      date: getRelativeDate(1),
      timeSlot: "11:30 AM",
      priority: "Routine",
      status: "Scheduled",
      reason: "Right knee arthroscopy follow-up",
      notes: "Bring X-ray envelope.",
      followUpReminder: "",
      createdAt: getRelativeDate(-2)
    },
    {
      id: "APT-508",
      patientId: "PT-1001",
      patientName: "Ramesh Sharma",
      doctor: "Dr. Rajesh Sharma",
      department: "General Medicine",
      date: getRelativeDate(-15),
      timeSlot: "09:30 AM",
      priority: "Routine",
      status: "Completed",
      reason: "Fasting sugar review",
      notes: "Completed successfully. Advised follow-up today.",
      followUpReminder: getRelativeDate(0),
      createdAt: getRelativeDate(-20)
    },
    {
      id: "APT-509",
      patientId: "PT-1003",
      patientName: "Gurpreet Singh",
      doctor: "Dr. Amit Verma",
      department: "Orthopedics & Trauma",
      date: getRelativeDate(-7),
      timeSlot: "03:00 PM",
      priority: "Urgent",
      status: "Completed",
      reason: "Lower back pain emergency relief",
      notes: "Pain relief administered, referred to physio clinic.",
      followUpReminder: getRelativeDate(0),
      createdAt: getRelativeDate(-10)
    }
  ],
  ambulances: [
    {
      id: "AMB-101",
      vehicleNumber: "DL-01-EQ-9102",
      type: "ALS (Advanced Life Support)",
      baseStation: "AuraCare Clinic HQ Base",
      currentZone: "Central Metro - Station 1",
      status: "On Mission",
      driverName: "Suraj Rathore",
      driverPhone: "+91 98100 23456",
      paramedic: "Nurse Vikas Mehra",
      equipment: ["Defibrillator (AED)", "Transport Ventilator", "Cardiac Monitor", "Oxygen Tank 10L", "Trauma Kit"],
      coordinates: { x: 38, y: 46 } // Percentage on visualizer map
    },
    {
      id: "AMB-102",
      vehicleNumber: "DL-01-EQ-4421",
      type: "BLS (Basic Life Support)",
      baseStation: "North Zone Health Post",
      currentZone: "Model Town Sector 9",
      status: "Available",
      driverName: "Kewal Krishan",
      driverPhone: "+91 98111 87654",
      paramedic: "EMT Pooja Saxena",
      equipment: ["Automated AED", "Pulse Oximeter", "Oxygen Cylinder", "Spine Board", "Suction Unit"],
      coordinates: { x: 72, y: 28 }
    },
    {
      id: "AMB-103",
      vehicleNumber: "DL-01-EQ-7788",
      type: "ICU on Wheels (Critical ALS)",
      baseStation: "Apex Multi-Specialty Trauma Center",
      currentZone: "Highway Corridor Ring Rd",
      status: "Dispatched",
      driverName: "Harish Chander",
      driverPhone: "+91 98222 34567",
      paramedic: "EMT Dr. Sahil Taneja",
      equipment: ["Syringe Pumps", "ICU Ventilator", "12-Lead ECG Telemetry", "C-Spine Collars", "Emergency Drugs Box"],
      coordinates: { x: 58, y: 70 }
    },
    {
      id: "AMB-104",
      vehicleNumber: "DL-01-EQ-1190",
      type: "Patient Transport Vehicle (PTS)",
      baseStation: "AuraCare Clinic HQ Base",
      currentZone: "South Ext. Enclave",
      status: "Available",
      driverName: "Mohd. Tariq",
      driverPhone: "+91 98333 45678",
      paramedic: "Care Attendant Raju",
      equipment: ["Wheelchair Ramp", "Oxygen Concentrator", "Basic First Aid", "Hydraulic Stretcher"],
      coordinates: { x: 25, y: 78 }
    },
    {
      id: "AMB-105",
      vehicleNumber: "DL-01-EQ-5532",
      type: "Neonatal & Pediatric ALS",
      baseStation: "City Child & Maternity Wing",
      currentZone: "Civil Hospital Outer Bay",
      status: "Available",
      driverName: "Praveen Yadav",
      driverPhone: "+91 98444 56789",
      paramedic: "NICU Nurse Geeta",
      equipment: ["Infant Transport Incubator", "Pediatric Resuscitator", "Micro-ventilator", "Warming Blanket"],
      coordinates: { x: 80, y: 64 }
    }
  ],
  ambulanceRequests: [
    {
      id: "DISP-301",
      patientName: "Sanjay Singhania",
      age: 62,
      contact: "+91 98711 00223",
      pickupAddress: "House 24, Pocket C, Sarita Vihar",
      destinationFacility: "Apex Multi-Specialty Trauma Center",
      severity: "Critical",
      triageCode: "Red",
      reason: "Suspected Acute Myocardial Infarction (Chest Pain & Dyspnea)",
      assignedUnitId: "AMB-101",
      status: "En Route",
      requestedAt: "12:18 PM",
      estimatedEtaMinutes: 6,
      notes: "Paramedic reports oxygen saturation 89%, 4L/min O2 started."
    },
    {
      id: "DISP-302",
      patientName: "Meenakshi Sundaram",
      age: 48,
      contact: "+91 98122 33445",
      pickupAddress: "Plot 9, IT Park Main Gate",
      destinationFacility: "City Civil Government Hospital",
      severity: "Urgent",
      triageCode: "Amber",
      reason: "Road Traffic Accident (Pelvic & lower limb lacerations, conscious)",
      assignedUnitId: "AMB-103",
      status: "Dispatched",
      requestedAt: "12:32 PM",
      estimatedEtaMinutes: 11,
      notes: "Bystanders applied pressure dressing. Ambulance speeding on Ring Rd."
    },
    {
      id: "DISP-303",
      patientName: "Kishore Kumar",
      age: 71,
      contact: "+91 98233 44556",
      pickupAddress: "Elder Care Home, Sector 12",
      destinationFacility: "AuraCare Clinic HQ Base",
      severity: "Non-Critical",
      triageCode: "Green",
      reason: "Scheduled dialysis patient inter-facility transport",
      assignedUnitId: "AMB-104",
      status: "Completed",
      requestedAt: "10:15 AM",
      estimatedEtaMinutes: 0,
      notes: "Safely delivered to AuraCare dialysis unit at 10:48 AM."
    }
  ],
  bloodBanks: [
    {
      id: "BB-01",
      name: "Red Cross Central Regional Blood Center",
      zone: "Central District",
      address: "1 Red Cross Road, Near Government Secretariat",
      contact: "+91 11 2371 6441 / +91 98188 00111",
      emergency24x7: true,
      distanceKm: 2.4,
      verifiedAt: "Today, 10:00 AM",
      stock: {
        "A+": 18,
        "A-": 4,
        "B+": 24,
        "B-": 3,
        "O+": 31,
        "O-": 2, // Critical shortage
        "AB+": 12,
        "AB-": 1  // Critical shortage
      }
    },
    {
      id: "BB-02",
      name: "Apex Trauma Blood Bank & Component Separation",
      zone: "Highway Corridor",
      address: "Wing C, Apex Trauma Center, Ring Road",
      contact: "+91 11 2658 8500 / +91 98299 11222",
      emergency24x7: true,
      distanceKm: 4.8,
      verifiedAt: "Today, 11:30 AM",
      stock: {
        "A+": 14,
        "A-": 6,
        "B+": 19,
        "B-": 5,
        "O+": 22,
        "O-": 4,
        "AB+": 9,
        "AB-": 2
      }
    },
    {
      id: "BB-03",
      name: "City Civil Hospital Blood Bank",
      zone: "Civil Lines",
      address: "Gate 3, District Hospital Compound",
      contact: "+91 11 2291 3000",
      emergency24x7: true,
      distanceKm: 5.6,
      verifiedAt: "Today, 08:45 AM",
      stock: {
        "A+": 28,
        "A-": 8,
        "B+": 32,
        "B-": 6,
        "O+": 40,
        "O-": 5,
        "AB+": 15,
        "AB-": 3
      }
    },
    {
      id: "BB-04",
      name: "Rotary Charitable Blood Bank & Storage Center",
      zone: "West Extension",
      address: "Rotary Bhawan, Block F, Subhash Nagar",
      contact: "+91 11 2511 7788",
      emergency24x7: false,
      hours: "08:00 AM - 09:00 PM",
      distanceKm: 7.1,
      verifiedAt: "Yesterday, 07:00 PM",
      stock: {
        "A+": 9,
        "A-": 2,
        "B+": 15,
        "B-": 2,
        "O+": 18,
        "O-": 1,
        "AB+": 6,
        "AB-": 0 // Empty
      }
    }
  ],
  bloodRequirements: [
    {
      id: "BREQ-401",
      patientName: "Arunav Sen",
      age: 38,
      bloodGroup: "O-",
      unitsRequired: 2,
      urgency: "Immediate (Within 2 Hours)",
      status: "Critical - Open",
      hospital: "Apex Multi-Specialty Trauma Center",
      contactPerson: "Dr. Sen / ICU Coordinator",
      contactPhone: "+91 98111 44556",
      reason: "Emergency aortic repair surgery bleeding",
      reportedAt: "Today, 11:40 AM"
    },
    {
      id: "BREQ-402",
      patientName: "Sita Kumari",
      age: 27,
      bloodGroup: "AB-",
      unitsRequired: 1,
      urgency: "Today (Within 6 Hours)",
      status: "Donor In Route",
      hospital: "City Maternity & General Hospital",
      contactPerson: "Rajesh (Husband)",
      contactPhone: "+91 98222 55667",
      reason: "Post-partum hemorrhage management",
      reportedAt: "Today, 10:15 AM"
    },
    {
      id: "BREQ-403",
      patientName: "Master Kabir",
      age: 7,
      bloodGroup: "B+",
      unitsRequired: 1,
      urgency: "Tomorrow Morning",
      status: "Fulfilled",
      hospital: "AuraCare Clinic & Day Surgery",
      contactPerson: "Dr. Priya Nair",
      contactPhone: "+91 98765 43210",
      reason: "Thalassemia monthly transfusion protocol",
      reportedAt: "Yesterday, 04:00 PM"
    }
  ],
  volunteerDonors: [
    {
      id: "DON-01",
      name: "Akash Singhal",
      age: 31,
      bloodGroup: "O-",
      zone: "Central Metro",
      phone: "+91 98101 12345",
      lastDonated: getRelativeDate(-120),
      eligibility: "Eligible Now",
      emergencyAvailable: true
    },
    {
      id: "DON-02",
      name: "Tanya Chawla",
      age: 26,
      bloodGroup: "AB-",
      zone: "Civil Lines",
      phone: "+91 98202 23456",
      lastDonated: getRelativeDate(-150),
      eligibility: "Eligible Now",
      emergencyAvailable: true
    },
    {
      id: "DON-03",
      name: "Manish Kothari",
      age: 39,
      bloodGroup: "O+",
      zone: "West Extension",
      phone: "+91 98303 34567",
      lastDonated: getRelativeDate(-40),
      eligibility: "Eligible in 50 days",
      emergencyAvailable: false
    },
    {
      id: "DON-04",
      name: "Zoya Akhtar",
      age: 28,
      bloodGroup: "A-",
      zone: "North Zone",
      phone: "+91 98404 45678",
      lastDonated: getRelativeDate(-100),
      eligibility: "Eligible Now",
      emergencyAvailable: true
    },
    {
      id: "DON-05",
      name: "Deepak Choudhary",
      age: 34,
      bloodGroup: "B-",
      zone: "Highway Corridor",
      phone: "+91 98505 56789",
      lastDonated: getRelativeDate(-135),
      eligibility: "Eligible Now",
      emergencyAvailable: true
    }
  ],
  facilities: [
    {
      id: "FAC-01",
      name: "AuraCare Clinic & Emergency First-Response",
      type: "Primary Care & Day Surgery Hub",
      distanceKm: 0.1,
      address: "Block 4, Metro Medical Enclave",
      emergency24x7: true,
      icuAvailable: false,
      bedsInfo: "6 Day-Observation Beds (3 Available)",
      phone: "+91 98765 43210",
      emergencyPhone: "+91 98765 00108",
      specialties: ["General Medicine", "Pediatrics", "Trauma First-Aid", "Minor Procedures", "Pathology Lab"]
    },
    {
      id: "FAC-02",
      name: "Apex Multi-Specialty & Tertiary Trauma Center",
      type: "Tertiary Multi-Specialty Hospital",
      distanceKm: 4.8,
      address: "Plot 1, Outer Ring Road Corridor",
      emergency24x7: true,
      icuAvailable: true,
      bedsInfo: "ICU: 3 Available | General: 24 Available",
      phone: "+91 11 2658 8500",
      emergencyPhone: "+91 11 2658 9999",
      specialties: ["Level-1 Trauma", "Cardiology & Cath Lab", "Neurosurgery", "Blood Bank", "Burn ICU"]
    },
    {
      id: "FAC-03",
      name: "City Civil Government Hospital",
      type: "District Public Hospital",
      distanceKm: 5.6,
      address: "Civil Hospital Chowk, Gate 1",
      emergency24x7: true,
      icuAvailable: true,
      bedsInfo: "ICU: 2 Available | Emergency Bay: 8 Available",
      phone: "+91 11 2291 3000",
      emergencyPhone: "+91 11 2291 108",
      specialties: ["Emergency Casualty", "General Surgery", "Orthopedics", "Government Blood Bank", "Pediatrics"]
    },
    {
      id: "FAC-04",
      name: "St. Luke Maternity & Children's Clinic",
      type: "Specialized Maternity & Pediatric Center",
      distanceKm: 3.2,
      address: "15 Mother Teresa Avenue, West Extension",
      emergency24x7: true,
      icuAvailable: true,
      bedsInfo: "NICU: 4 Available | Maternity: 11 Available",
      phone: "+91 11 2544 3322",
      emergencyPhone: "+91 11 2544 9911",
      specialties: ["Obstetrics", "Pediatric Emergency", "Neonatal Intensive Care (NICU)", "Immunization"]
    },
    {
      id: "FAC-05",
      name: "LifeLine Dialysis & Day Care Center",
      type: "Specialized Chronic Care Facility",
      distanceKm: 2.9,
      address: "Sector 19, Commercial Complex",
      emergency24x7: false,
      icuAvailable: false,
      bedsInfo: "16 Dialysis Stations (Operating 07 AM - 10 PM)",
      phone: "+91 11 2788 1234",
      emergencyPhone: "+91 98111 88990",
      specialties: ["Hemodialysis", "Nephrology Consultation", "Vascular Access Care"]
    }
  ],
  emergencyAlerts: [
    {
      id: "EMERG-01",
      code: "CODE RED",
      title: "Active ALS Dispatch for Cardiac Emergency",
      location: "Sarita Vihar -> Apex Trauma Center",
      unit: "AMB-101",
      time: "6 mins ETA",
      active: true
    },
    {
      id: "EMERG-02",
      code: "CODE AMBER",
      title: "Urgent O- Negative Blood Required (2 Units)",
      location: "Apex Trauma ICU",
      unit: "BREQ-401",
      time: "Reported 11:40 AM",
      active: true
    }
  ]
};

class Store {
  constructor() {
    this.data = this.load();
    this.listeners = new Set();
  }

  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Could not read from localStorage, using initial mock data", e);
    }
    // Deep clone default data
    const initial = JSON.parse(JSON.stringify(DEFAULT_DATA));
    this.save(initial);
    return initial;
  }

  save(data = this.data) {
    this.data = data;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error("Failed to write to localStorage", e);
    }
    this.notify();
  }

  resetToDefault() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    this.save();
    return this.data;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(fn => {
      try {
        fn(this.data);
      } catch (err) {
        console.error("Error in store subscriber:", err);
      }
    });
  }

  // PATIENT METHODS
  addPatient(patient) {
    const id = 'PT-' + Math.floor(1000 + Math.random() * 9000);
    const newPatient = {
      ...patient,
      id,
      registeredDate: new Date().toISOString().split('T')[0],
      visitHistory: []
    };
    this.data.patients.unshift(newPatient);
    this.save();
    return newPatient;
  }

  getPatient(id) {
    return this.data.patients.find(p => p.id === id);
  }

  addPatientVisit(patientId, visit) {
    const patient = this.getPatient(patientId);
    if (!patient) return null;
    const visitRecord = {
      id: 'VH-' + Math.floor(800 + Math.random() * 900),
      date: visit.date || new Date().toISOString().split('T')[0],
      doctor: visit.doctor || 'Dr. On-Duty',
      department: visit.department || 'General Medicine',
      purpose: visit.purpose || 'Follow-up',
      adminNotes: visit.adminNotes || '',
      followUpDate: visit.followUpDate || ''
    };
    if (!patient.visitHistory) patient.visitHistory = [];
    patient.visitHistory.unshift(visitRecord);
    this.save();
    return visitRecord;
  }

  // APPOINTMENT METHODS
  addAppointment(appointment) {
    const id = 'APT-' + Math.floor(500 + Math.random() * 900);
    const newAppointment = {
      ...appointment,
      id,
      status: appointment.status || 'Scheduled',
      priority: appointment.priority || 'Routine',
      createdAt: new Date().toISOString().split('T')[0]
    };
    this.data.appointments.unshift(newAppointment);
    this.save();
    return newAppointment;
  }

  updateAppointmentStatus(id, newStatus) {
    const apt = this.data.appointments.find(a => a.id === id);
    if (apt) {
      apt.status = newStatus;
      this.save();
      return apt;
    }
    return null;
  }

  // AMBULANCE METHODS
  requestAmbulance(request) {
    const id = 'DISP-' + Math.floor(300 + Math.random() * 900);
    const newReq = {
      ...request,
      id,
      status: 'Dispatched',
      requestedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estimatedEtaMinutes: request.estimatedEtaMinutes || Math.floor(5 + Math.random() * 8)
    };
    this.data.ambulanceRequests.unshift(newReq);

    // Update assigned ambulance status
    if (request.assignedUnitId) {
      const amb = this.data.ambulances.find(a => a.id === request.assignedUnitId);
      if (amb) amb.status = 'On Mission';
    }

    // Add emergency banner alert if critical
    if (request.severity === 'Critical') {
      this.data.emergencyAlerts.unshift({
        id: 'EMERG-' + Math.floor(10 + Math.random() * 90),
        code: 'CODE RED',
        title: `URGENT: ${request.reason || 'Critical Transport'}`,
        location: `${request.pickupAddress} -> ${request.destinationFacility}`,
        unit: request.assignedUnitId || 'AMB DISPATCH',
        time: `${newReq.estimatedEtaMinutes}m ETA`,
        active: true
      });
    }

    this.save();
    return newReq;
  }

  updateAmbulanceStatus(unitId, newStatus) {
    const amb = this.data.ambulances.find(a => a.id === unitId);
    if (amb) {
      amb.status = newStatus;
      this.save();
      return amb;
    }
    return null;
  }

  updateDispatchStatus(dispatchId, newStatus) {
    const req = this.data.ambulanceRequests.find(r => r.id === dispatchId);
    if (req) {
      req.status = newStatus;
      if (newStatus === 'Completed' && req.assignedUnitId) {
        const amb = this.data.ambulances.find(a => a.id === req.assignedUnitId);
        if (amb) amb.status = 'Available';
      }
      this.save();
      return req;
    }
    return null;
  }

  // BLOOD METHODS
  postBloodRequirement(req) {
    const id = 'BREQ-' + Math.floor(400 + Math.random() * 900);
    const newReq = {
      ...req,
      id,
      status: req.urgency?.toLowerCase().includes('immediate') ? 'Critical - Open' : 'Open',
      reportedAt: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    };
    this.data.bloodRequirements.unshift(newReq);

    if (newReq.status.includes('Critical')) {
      this.data.emergencyAlerts.unshift({
        id: 'EMERG-' + Math.floor(10 + Math.random() * 90),
        code: 'CODE AMBER',
        title: `Blood Alert: ${req.unitsRequired} Unit(s) of ${req.bloodGroup} Needed`,
        location: req.hospital,
        unit: id,
        time: 'Active',
        active: true
      });
    }

    this.save();
    return newReq;
  }

  updateBloodRequirementStatus(id, newStatus) {
    const req = this.data.bloodRequirements.find(r => r.id === id);
    if (req) {
      req.status = newStatus;
      this.save();
      return req;
    }
    return null;
  }

  addVolunteerDonor(donor) {
    const id = 'DON-' + Math.floor(10 + Math.random() * 90);
    const newDonor = {
      ...donor,
      id,
      lastDonated: donor.lastDonated || new Date().toISOString().split('T')[0],
      eligibility: donor.eligibility || 'Eligible Now',
      emergencyAvailable: true
    };
    this.data.volunteerDonors.unshift(newDonor);
    this.save();
    return newDonor;
  }

  // EMERGENCY ALERT DISMISS
  dismissAlert(id) {
    this.data.emergencyAlerts = this.data.emergencyAlerts.filter(a => a.id !== id);
    this.save();
  }

  // BACKUP & RESTORE
  exportJSON() {
    return JSON.stringify(this.data, null, 2);
  }

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.patients && parsed.appointments) {
        this.save(parsed);
        return true;
      }
    } catch (e) {
      console.error("Invalid JSON imported", e);
    }
    return false;
  }
}

// Global singleton instance
window.pulseStore = new Store();
