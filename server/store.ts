import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type {
  Appointment,
  AuditLogEntry,
  DemoAccountInfo,
  EmergencyEvent,
  NgoAssistanceRequest,
  NotificationItem,
  PharmacyOrder,
  PrescriptionUpdate,
  Role,
  SharedPlatformState,
  TransportBooking,
} from '../src/types';

export interface StoredUserAccount {
  id: string;
  role: Role;
  name: string;
  email: string;
  label: string;
  passwordHash: string;
  salt: string;
  linkedPatientId: string;
  verified: boolean;
  demoPasswordHint: string;
}

interface PersistedDatabase {
  users: StoredUserAccount[];
  state: SharedPlatformState;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'seniora-db.json');

const EPHEMERAL_SESSION_SECRET = crypto.randomBytes(32).toString('hex');
function getSessionSecret(): string {
  return process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length > 0
    ? process.env.SESSION_SECRET
    : EPHEMERAL_SESSION_SECRET;
}

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, actualSalt, 64).toString('hex');
  return { hash: derived, salt: actualSalt };
}

export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  const derived = crypto.scryptSync(password, salt, 64);
  const target = Buffer.from(storedHash, 'hex');
  if (derived.length !== target.length) return false;
  return crypto.timingSafeEqual(derived, target);
}

export interface SessionPayload {
  userId: string;
  role: Role;
  name: string;
  email: string;
  exp: number;
}

export function signSessionToken(payload: Omit<SessionPayload, 'exp'>): string {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  };
  const encoded = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token || !token.includes('.')) return null;
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return null;
  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encoded)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (decoded.exp < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}

function makeAccount(
  id: string,
  role: Role,
  name: string,
  email: string,
  label: string,
  demoPassword: string
): StoredUserAccount {
  const { hash, salt } = hashPassword(demoPassword);
  return {
    id,
    role,
    name,
    email,
    label,
    passwordHash: hash,
    salt,
    linkedPatientId: 'elder-lakshmi',
    verified: true,
    demoPasswordHint: demoPassword,
  };
}

function createInitialDatabase(): PersistedDatabase {
  const nowIso = new Date().toISOString();
  const todayStr = nowIso.slice(0, 10);
  const tomorrowDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const users: StoredUserAccount[] = [
    makeAccount('user-elder', 'elder', 'Lakshmi', 'lakshmi@seniora.demo', 'Elderly Person (Lakshmi)', 'lakshmi123'),
    makeAccount('user-doctor', 'doctor', 'Dr. Arjun Menon', 'arjun.doctor@seniora.demo', 'Doctor (Dr. Arjun)', 'doctor123'),
    makeAccount('user-family', 'family', 'Priya (Daughter)', 'priya.family@seniora.demo', 'Family Member (Priya)', 'family123'),
    makeAccount('user-pharmacy', 'pharmacy', 'MedPlus Care Pharmacy', 'pharmacy@seniora.demo', 'Pharmacy Partner', 'pharmacy123'),
    makeAccount('user-delivery', 'delivery', 'Karthik R.', 'karthik.delivery@seniora.demo', 'Delivery Partner (Karthik)', 'delivery123'),
    makeAccount('user-transport', 'transport', 'CityCare Mobility', 'transport@seniora.demo', 'Transport Partner', 'transport123'),
    makeAccount('user-ngo', 'ngo', 'Meena Sundaram', 'meena.ngo@seniora.demo', 'NGO Care Coordinator (Meena)', 'ngo123'),
    makeAccount('user-admin', 'admin', 'Platform Admin', 'admin@seniora.demo', 'Administrator', 'admin123'),
  ];

  const state: SharedPlatformState = {
    profile: {
      id: 'elder-lakshmi',
      name: 'Lakshmi',
      age: 72,
      city: 'Chennai, Tamil Nadu',
      address: '14 Lotus Garden Street, Mylapore, Chennai 600004 (DEMO Address)',
      language: 'en',
      tamilDialect: 'neutral',
      voicePersona: 'female_warm',
      speechRate: 0.85,
      volume: 0.95,
      fontScale: 'large',
      highContrast: false,
      communicationStyle: 'warm_casual',
      wakeTime: '06:30',
      sleepTime: '21:30',
      livesAlone: true,
      livingArrangement: 'alone',
      supportAreas: ['healthcare', 'daily_activities', 'transportation', 'social_connections'],
      favouriteFoods: ['Idli with sambar', 'Pongal', 'Steamed vegetables', 'Curd rice (afternoon)'],
      dislikedFoods: ['Milk-based drinks', 'Excessively spicy fried snacks'],
      dietaryRestrictions: ['Low sodium (doctor-advised for hypertension)', 'Moderate sugar'],
      hobbies: ['Listening to classic Tamil film songs', 'Temple courtyard walks', 'Gardening jasmine'],
      favouriteMusic: ['Old Tamil melodies (MS Viswanathan, Ilaiyaraaja classics)'],
      favouriteTopics: ['Family stories', 'South Indian classical arts', 'Gardening'],
      mobilityNeeds: 'Mild right knee stiffness — prefers wheelchair-accessible or low-step cars for hospital visits.',
      conditions: ['Essential Hypertension (controlled)', 'Mild Knee Osteoarthritis'],
      allergies: ['Penicillin (mild rash)'],
      preferredDoctorName: 'Dr. Arjun Menon',
      preferredHospital: 'Kauvery Senior Care Clinic, Mylapore (DEMO)',
      onboardingCompleted: false,
      avatarUrl: '/src/assets/images/elder_lakshmi_avatar_1795710402796.jpg',
      memories: [
        {
          id: 'mem-1',
          category: 'food',
          label: 'Breakfast Favourite',
          value: 'Warm soft idli with mild sambar',
          preferenceType: 'like',
          createdAt: nowIso,
        },
        {
          id: 'mem-2',
          category: 'food',
          label: 'Beverage Dislike',
          value: 'Warm milk or milk-based health drinks',
          preferenceType: 'dislike',
          createdAt: nowIso,
        },
        {
          id: 'mem-3',
          category: 'music',
          label: 'Favourite Music',
          value: 'Old Tamil songs from the 1970s and 1980s',
          preferenceType: 'like',
          createdAt: nowIso,
        },
        {
          id: 'mem-4',
          category: 'family',
          label: 'Daughter',
          value: 'Priya lives in Bengaluru and calls every evening',
          preferenceType: 'fact',
          createdAt: nowIso,
        },
      ],
      privacy: {
        shareHealthWithFamily: true,
        shareAppointmentsWithFamily: true,
        shareNutritionWithFamily: true,
        shareLocationInEmergencyOnly: true,
        shareWithNgoCoordinator: true,
        allowGentleCheckIns: true,
      },
    },
    medications: [
      {
        id: 'med-amlodipine',
        patientId: 'elder-lakshmi',
        name: 'Amlodipine',
        dosage: '5 mg (1 tablet)',
        frequency: 'Once daily (Morning)',
        foodInstruction: 'after_food',
        scheduledTime: '08:00',
        status: 'pending',
        refillDaysLeft: 12,
        prescribedBy: 'Dr. Arjun Menon',
        purpose: 'Blood pressure management',
        lastUpdatedAt: nowIso,
        history: [
          { date: todayStr, time: '08:00', status: 'taken', confirmedBy: 'Lakshmi' },
        ],
      },
      {
        id: 'med-calcium',
        patientId: 'elder-lakshmi',
        name: 'Calcium + Vitamin D3',
        dosage: '500 mg (1 tablet)',
        frequency: 'Once daily (Afternoon)',
        foodInstruction: 'after_food',
        scheduledTime: '13:30',
        status: 'pending',
        refillDaysLeft: 6,
        prescribedBy: 'Dr. Arjun Menon',
        purpose: 'Bone and joint support',
        lastUpdatedAt: nowIso,
        history: [],
      },
      {
        id: 'med-rosuvastatin',
        patientId: 'elder-lakshmi',
        name: 'Rosuvastatin',
        dosage: '10 mg (1 tablet)',
        frequency: 'Once daily (Night)',
        foodInstruction: 'after_food',
        scheduledTime: '21:00',
        status: 'pending',
        refillDaysLeft: 18,
        prescribedBy: 'Dr. Arjun Menon',
        purpose: 'Cholesterol balance',
        lastUpdatedAt: nowIso,
        history: [],
      },
    ],
    prescriptionUpdates: [
      {
        id: 'rx-demo-1',
        patientId: 'elder-lakshmi',
        patientName: 'Lakshmi',
        doctorId: 'user-doctor',
        doctorName: 'Dr. Arjun Menon',
        medicineName: 'Topical Diclofenac Gel',
        dosage: 'Apply thin layer twice daily',
        frequency: 'Morning & Night',
        foodInstruction: 'anytime',
        scheduledTime: '08:30',
        reason: 'Gentle relief for right knee stiffness without stomach irritation',
        plainExplanation: 'Dr. Arjun recommends a soothing knee gel twice a day. Nothing in your morning BP tablet changes. Would you like to confirm and order it from MedPlus Care Pharmacy?',
        status: 'pending_consent',
        createdAt: nowIso,
        isDemo: true,
      },
    ],
    pharmacyOrders: [
      {
        id: 'ord-demo-101',
        prescriptionId: 'rx-baseline',
        patientId: 'elder-lakshmi',
        patientName: 'Lakshmi',
        pharmacyName: 'MedPlus Care Pharmacy (DEMO)',
        itemsSummary: 'Amlodipine 5 mg (30 tabs) + Calcium D3 (30 tabs)',
        stage: 'delivery_assigned',
        deliveryPartnerName: 'Karthik R.',
        deliveryPhone: '+91 98400 11223 (DEMO)',
        deliveryAddress: '14 Lotus Garden Street, Mylapore, Chennai 600004',
        estimatedAmountInr: 285,
        availabilityConfirmed: true,
        notes: 'Ring doorbell gently; call before arriving.',
        updatedAt: nowIso,
        createdAt: nowIso,
        isDemo: true,
      },
    ],
    doctors: [
      {
        id: 'doc-arjun',
        name: 'Dr. Arjun Menon',
        specialty: 'General Physician & Geriatric Care',
        hospital: 'Kauvery Senior Care Clinic, Mylapore (DEMO)',
        distanceKm: 1.8,
        languages: ['Tamil', 'English', 'Hindi'],
        accessibleFacility: true,
        teleconsultAvailable: true,
        nextSlots: [`${tomorrowDate} 10:00`, `${tomorrowDate} 11:30`, `${tomorrowDate} 16:30`],
        avatarUrl: '/src/assets/images/doctor_arjun_avatar_1795710403514.jpg',
      },
      {
        id: 'doc-kavitha',
        name: 'Dr. Kavitha Subramanian',
        specialty: 'Orthopaedic Specialist',
        hospital: 'Mylapore Bone & Joint Centre (DEMO)',
        distanceKm: 2.4,
        languages: ['Tamil', 'English'],
        accessibleFacility: true,
        teleconsultAvailable: true,
        nextSlots: [`${tomorrowDate} 10:30`, `${tomorrowDate} 15:00`],
        avatarUrl: '/src/assets/images/doctor_arjun_avatar_1795710403514.jpg',
      },
      {
        id: 'doc-raghav',
        name: 'Dr. Raghavan Iyer',
        specialty: 'Cardiologist',
        hospital: 'Apollo Elder Heart Wing, Greams Road (DEMO)',
        distanceKm: 4.5,
        languages: ['Tamil', 'English', 'Hindi'],
        accessibleFacility: true,
        teleconsultAvailable: true,
        nextSlots: [`${tomorrowDate} 09:30`, `${tomorrowDate} 14:00`],
        avatarUrl: '/src/assets/images/doctor_arjun_avatar_1795710403514.jpg',
      },
      {
        id: 'doc-ananya',
        name: 'Dr. Ananya Rao',
        specialty: 'Diabetologist',
        hospital: 'Madras Metabolic Care Clinic (DEMO)',
        distanceKm: 3.1,
        languages: ['English', 'Hindi', 'Tamil'],
        accessibleFacility: true,
        teleconsultAvailable: true,
        nextSlots: [`${tomorrowDate} 11:00`, `${tomorrowDate} 17:00`],
        avatarUrl: '/src/assets/images/doctor_arjun_avatar_1795710403514.jpg',
      },
      {
        id: 'doc-suresh',
        name: 'Dr. Suresh Natarajan',
        specialty: 'Ophthalmologist',
        hospital: 'Sankara Vision Senior Clinic (DEMO)',
        distanceKm: 3.8,
        languages: ['Tamil', 'English'],
        accessibleFacility: true,
        teleconsultAvailable: false,
        nextSlots: [`${tomorrowDate} 12:00`, `${tomorrowDate} 16:00`],
        avatarUrl: '/src/assets/images/doctor_arjun_avatar_1795710403514.jpg',
      },
    ],
    appointments: [
      {
        id: 'appt-demo-1',
        patientId: 'elder-lakshmi',
        patientName: 'Lakshmi',
        doctorId: 'doc-arjun',
        doctorName: 'Dr. Arjun Menon',
        specialty: 'General Physician & Geriatric Care',
        hospital: 'Kauvery Senior Care Clinic, Mylapore (DEMO)',
        mode: 'in_person',
        date: tomorrowDate,
        time: '10:00',
        reason: 'Routine blood pressure review & right knee stiffness check',
        status: 'scheduled',
        createdAt: nowIso,
        isDemo: true,
      },
    ],
    reports: [
      {
        id: 'rep-1',
        patientId: 'elder-lakshmi',
        title: 'Quarterly Blood Pressure & Lipid Panel (DEMO)',
        category: 'lab_report',
        uploadedAt: todayStr,
        summary: 'Total Cholesterol 178 mg/dL, Fasting Glucose 96 mg/dL, Creatinine 0.85 mg/dL — within target senior range.',
        reviewedByDoctor: true,
        doctorNote: 'Continue current Amlodipine 5mg and gentle morning hydration.',
      },
    ],
    transportBookings: [
      {
        id: 'trip-demo-1',
        patientId: 'elder-lakshmi',
        patientName: 'Lakshmi',
        purpose: 'doctor',
        pickup: '14 Lotus Garden Street, Mylapore',
        destination: 'Kauvery Senior Care Clinic, Mylapore',
        date: tomorrowDate,
        time: '09:20',
        vehicleType: 'accessible_van',
        accessibleRequired: true,
        estimatedFareInr: 180,
        driverName: 'Senthil Kumar',
        driverPhone: '+91 98401 44556 (DEMO)',
        vehicleNumber: 'TN 09 SC 4210 (DEMO)',
        status: 'confirmed',
        createdAt: nowIso,
        isDemo: true,
      },
    ],
    wearable: {
      connected: true,
      connectionMode: 'demo',
      deviceName: 'SENIORA CareBand S2 (DEMO Simulator)',
      isDemoData: true,
      heartRate: 74,
      restingHeartRate: 68,
      spo2: 98,
      spo2Supported: true,
      bpSystolic: 126,
      bpDiastolic: 78,
      bpDeviceValidated: true,
      steps: 3420,
      stepsGoal: 4500,
      sleepHours: 7.2,
      activityMinutes: 32,
      fallDetected: false,
      shareWithDoctor: true,
      lastSyncedAt: nowIso,
      history7Days: [
        { day: 'Thu', heartRate: 72, restingHeartRate: 67, steps: 3900, sleepHours: 7.4, spo2: 98, bpSystolic: 124, bpDiastolic: 78 },
        { day: 'Fri', heartRate: 75, restingHeartRate: 68, steps: 4120, sleepHours: 7.1, spo2: 98, bpSystolic: 128, bpDiastolic: 80 },
        { day: 'Sat', heartRate: 71, restingHeartRate: 66, steps: 3250, sleepHours: 7.6, spo2: 99, bpSystolic: 122, bpDiastolic: 76 },
        { day: 'Sun', heartRate: 73, restingHeartRate: 67, steps: 3600, sleepHours: 7.5, spo2: 98, bpSystolic: 125, bpDiastolic: 78 },
        { day: 'Mon', heartRate: 76, restingHeartRate: 69, steps: 3810, sleepHours: 6.9, spo2: 97, bpSystolic: 130, bpDiastolic: 82 },
        { day: 'Tue', heartRate: 74, restingHeartRate: 68, steps: 4050, sleepHours: 7.3, spo2: 98, bpSystolic: 126, bpDiastolic: 79 },
        { day: 'Today', heartRate: 74, restingHeartRate: 68, steps: 3420, sleepHours: 7.2, spo2: 98, bpSystolic: 126, bpDiastolic: 78 },
      ],
    },
    meals: [
      {
        id: 'meal-1',
        type: 'breakfast',
        description: '2 soft steamed idlis with mild moong sambar & coriander chutney',
        time: '08:15',
        caloriesApprox: 290,
        notes: 'Easy to digest, low salt',
      },
    ],
    waterGlasses: 4,
    waterGoal: 7,
    habits: [
      { id: 'hab-1', title: 'Gentle morning walk (15 min)', category: 'walking', completedToday: true, streakDays: 5, weeklyCompleted: 5 },
      { id: 'hab-2', title: 'Breathing & calm meditation', category: 'meditation', completedToday: true, streakDays: 7, weeklyCompleted: 6 },
      { id: 'hab-3', title: 'Drink 7 glasses of water', category: 'water', completedToday: false, streakDays: 4, weeklyCompleted: 5 },
      { id: 'hab-4', title: 'Listen to favourite Tamil melodies', category: 'hobby', completedToday: false, streakDays: 6, weeklyCompleted: 6 },
      { id: 'hab-5', title: 'Evening call with family or friend', category: 'social', completedToday: false, streakDays: 3, weeklyCompleted: 4 },
    ],
    routines: [
      { id: 'rt-1', time: '07:00', title: 'Wake up & gentle stretching', category: 'movement', completed: true },
      { id: 'rt-2', time: '08:00', title: 'Morning BP medicine (after breakfast)', category: 'medication', completed: false },
      { id: 'rt-3', time: '09:00', title: 'Morning walk in courtyard', category: 'movement', completed: true },
      { id: 'rt-4', time: '13:00', title: 'Nutritious lunch & Calcium D3', category: 'meal', completed: false },
      { id: 'rt-5', time: '16:30', title: 'Old Tamil songs & jasmine tea', category: 'rest', completed: false },
      { id: 'rt-6', time: '19:30', title: 'Call with daughter Priya', category: 'social', completed: false },
      { id: 'rt-7', time: '21:00', title: 'Night medicine & restful sleep', category: 'medication', completed: false },
    ],
    voicesOfLove: [
      {
        id: 'vol-1',
        fromName: 'Priya',
        relationship: 'Daughter',
        title: 'Good Morning Amma!',
        transcript: 'Good morning Amma! Hope your knees feel lighter today. Remember to take your tablet after idli and drink plenty of water. I will call you at 7:30 PM tonight!',
        durationSec: 16,
        scheduledTime: '08:00',
        createdAt: nowIso,
        listened: false,
      },
      {
        id: 'vol-2',
        fromName: 'Aarav',
        relationship: 'Grandson',
        title: 'Weekend Visit Surprise',
        transcript: 'Paati! I learned a new song on the flute to play for you this Sunday when we visit. Take care and smile!',
        durationSec: 12,
        scheduledTime: '17:00',
        createdAt: nowIso,
        listened: false,
      },
    ],
    emergencyContacts: [
      { id: 'ec-112', patientId: 'elder-lakshmi', name: 'National Emergency Response', relationship: 'national_emergency', relationshipDetail: 'National Helpline', phone: '112', isSystemDefault: true, notifyOnSos: true },
      { id: 'ec-108', patientId: 'elder-lakshmi', name: 'Ambulance Service', relationship: 'ambulance', relationshipDetail: 'Medical Emergency', phone: '108', isSystemDefault: true, notifyOnSos: false },
      { id: 'ec-101', patientId: 'elder-lakshmi', name: 'Fire & Rescue', relationship: 'fire', relationshipDetail: 'Fire Emergency', phone: '101', isSystemDefault: true, notifyOnSos: false },
      { id: 'ec-100', patientId: 'elder-lakshmi', name: 'Police Helpline', relationship: 'police', relationshipDetail: 'Police Emergency', phone: '100', isSystemDefault: true, notifyOnSos: false },
      { id: 'ec-priya', patientId: 'elder-lakshmi', name: 'Priya', relationship: 'family', relationshipDetail: 'Daughter (DEMO)', phone: '+91 98450 22334', priority: 'primary', isDemoSample: true, notifyOnSos: true },
      { id: 'ec-neighbour', patientId: 'elder-lakshmi', name: 'Mrs. Radhika', relationship: 'neighbour', relationshipDetail: 'Next-door Neighbour (DEMO)', phone: '+91 98402 77889', priority: 'secondary', isDemoSample: true, notifyOnSos: true },
      { id: 'ec-doctor', patientId: 'elder-lakshmi', name: 'Dr. Arjun Menon', relationship: 'doctor', relationshipDetail: 'Personal Physician (DEMO)', phone: '+91 44 2498 1122', isDemoSample: true, notifyOnSos: true },
    ],
    emergencyEvents: [],
    volunteers: [
      { id: 'volun-1', name: 'Anandhi Krishnan', languages: ['Tamil', 'English'], skills: ['Hospital Escort', 'Reading & Companionship'], area: 'Mylapore', available: true, assignedElderId: 'elder-lakshmi' },
      { id: 'volun-2', name: 'Ramesh Babu', languages: ['Tamil', 'Hindi', 'English'], skills: ['Grocery Delivery', 'Mobility Assistance'], area: 'Alwarpet', available: true },
      { id: 'volun-3', name: 'Deepa Narayanan', languages: ['Tamil', 'Malayalam', 'English'], skills: ['Medication Pickup', 'Check-in Calls'], area: 'Adyar', available: true },
    ],
    ngoRequests: [
      {
        id: 'ngo-req-1',
        patientId: 'elder-lakshmi',
        patientName: 'Lakshmi',
        area: 'Mylapore, Chennai',
        type: 'hospital_visit',
        description: 'Friendly companion escort for tomorrow 10:00 AM clinic visit at Kauvery Senior Care Clinic.',
        preferredDate: tomorrowDate,
        status: 'pending',
        createdAt: nowIso,
      },
    ],
    opportunities: [
      {
        id: 'opp-1',
        title: 'Tamil Storytelling & Heritage Mentor (Online)',
        organization: 'Banyan Senior Wisdom Collective (Verified DEMO Partner)',
        category: 'mentoring',
        schedule: '3 hours / week · Flexible mornings',
        stipendInr: '₹4,500 / month',
        verified: true,
        description: 'Share classic Tamil proverbs, cultural stories, and life advice with school students over guided video sessions.',
        safetyNote: 'Verified NGO partner · Zero registration fee required.',
      },
      {
        id: 'opp-2',
        title: 'Part-Time Home Garden Advisor',
        organization: 'Mylapore Community Terrace Gardens (DEMO)',
        category: 'local',
        schedule: '2 mornings / week · Local neighbourhood',
        stipendInr: '₹3,000 / month',
        verified: true,
        description: 'Guide neighbourhood volunteers on growing jasmine, tulsi, and kitchen herbs safely without heavy lifting.',
        safetyNote: 'Local verified community co-op · Never share bank OTPs.',
      },
      {
        id: 'opp-3',
        title: 'Remote Recipe & Culinary Proofreader (Tamil / English)',
        organization: 'Heritage Kitchen Archive (DEMO)',
        category: 'remote',
        schedule: 'Self-paced · 4 hours / week',
        stipendInr: '₹5,000 / month',
        verified: true,
        description: 'Review traditional South Indian home-style recipes from home and record voice notes on authentic methods.',
        safetyNote: 'Verified partner · No upfront deposits or software purchases.',
      },
    ],
    applications: [],
    reminders: [
      { id: 'rem-1', title: 'Take Amlodipine 5mg after breakfast', time: '08:00', date: todayStr, category: 'medication', completed: false },
      { id: 'rem-2', title: 'Drink a glass of warm water', time: '11:00', date: todayStr, category: 'hydration', completed: false },
      { id: 'rem-3', title: 'Doctor Visit — Dr. Arjun Menon', time: '10:00', date: tomorrowDate, category: 'appointment', completed: false },
      { id: 'rem-4', title: "Grandson Aarav's School Concert Call", time: '18:30', date: tomorrowDate, category: 'family', completed: false },
    ],
    shoppingList: [
      { id: 'shop-1', name: 'Idli rice & urad dal', quantity: '1 kg each', checked: false },
      { id: 'shop-2', name: 'Fresh jasmine strands', quantity: '2 strings', checked: true },
      { id: 'shop-3', name: 'Tender coconut water', quantity: '3', checked: false },
    ],
    notifications: [
      {
        id: 'notif-1',
        targetRoles: ['elder', 'family'],
        title: 'New Voice Message from Priya',
        message: 'Priya recorded a Good Morning greeting in Voices of Love.',
        category: 'family',
        read: false,
        createdAt: nowIso,
      },
      {
        id: 'notif-2',
        targetRoles: ['elder'],
        title: 'Doctor Prescription Needs Your Confirmation',
        message: 'Dr. Arjun Menon recommended Topical Diclofenac Gel for your knee. Please review and confirm.',
        category: 'prescription',
        read: false,
        createdAt: nowIso,
      },
    ],
    auditLogs: [
      {
        id: 'aud-1',
        actorRole: 'doctor',
        actorName: 'Dr. Arjun Menon',
        action: 'Created prescription recommendation (Topical Diclofenac Gel) pending elder consent',
        targetResource: 'elder-lakshmi',
        approvalStatus: 'pending',
        timestamp: nowIso,
      },
    ],
    familyNotificationPrefs: {
      missedMedication: true,
      emergencyAlerts: true,
      appointmentReminders: true,
      ngoVisitUpdates: true,
    },
  };

  return { users, state };
}

class SenioraStore {
  private db: PersistedDatabase;

  constructor() {
    this.db = this.load();
  }

  private load(): PersistedDatabase {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw) as PersistedDatabase;
        if (parsed && parsed.state && Array.isArray(parsed.users)) {
          if (!parsed.state.profile.tamilDialect) {
            parsed.state.profile.tamilDialect = 'neutral';
          }
          if (Array.isArray(parsed.state.emergencyContacts)) {
            parsed.state.emergencyContacts = parsed.state.emergencyContacts.map((c) => ({
              ...c,
              patientId: c.patientId || parsed.state.profile.id,
            }));
          }
          if (Array.isArray(parsed.state.emergencyEvents)) {
            parsed.state.emergencyEvents = parsed.state.emergencyEvents.map((ev) => ({
              ...ev,
              deliveryStatus: ev.deliveryStatus || 'delivered',
            }));
          }
          return parsed;
        }
      }
    } catch {
      // Fallback to fresh seed
    }
    const fresh = createInitialDatabase();
    this.save(fresh);
    return fresh;
  }

  private save(data: PersistedDatabase = this.db): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmp = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tmp, DB_FILE);
    } catch (err) {
      console.error('Failed to persist store:', err);
    }
  }

  public getDemoAccounts(): DemoAccountInfo[] {
    return this.db.users.map((u) => ({
      id: u.id,
      role: u.role,
      name: u.name,
      email: u.email,
      label: u.label,
      demoPasswordHint: u.demoPasswordHint,
    }));
  }

  public authenticate(email: string, password: string): StoredUserAccount | null {
    const user = this.db.users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (!user) return null;
    if (!verifyPassword(password, user.passwordHash, user.salt)) return null;
    return user;
  }

  public getUserById(userId: string): StoredUserAccount | undefined {
    return this.db.users.find((u) => u.id === userId);
  }

  public getStateForRole(role: Role): SharedPlatformState {
    const s = structuredClone(this.db.state);

    // Apply role-based privacy scoping
    if (role === 'family') {
      if (!s.profile.privacy.shareHealthWithFamily) {
        s.reports = [];
        s.prescriptionUpdates = [];
      }
      if (!s.profile.privacy.shareAppointmentsWithFamily) {
        s.appointments = [];
      }
      if (!s.profile.privacy.shareNutritionWithFamily) {
        s.meals = [];
      }
    } else if (role === 'pharmacy') {
      // Pharmacy only sees consented prescriptions & pharmacy orders, never personal family contacts
      s.prescriptionUpdates = s.prescriptionUpdates.filter((p) => p.status === 'consented');
      s.reports = [];
      s.meals = [];
      s.voicesOfLove = [];
      s.emergencyContacts = s.emergencyContacts.filter((c) => c.isSystemDefault);
    } else if (role === 'delivery') {
      s.reports = [];
      s.medications = [];
      s.prescriptionUpdates = [];
      s.meals = [];
      s.voicesOfLove = [];
      s.emergencyContacts = s.emergencyContacts.filter((c) => c.isSystemDefault);
    } else if (role === 'transport') {
      s.reports = [];
      s.medications = [];
      s.prescriptionUpdates = [];
      s.pharmacyOrders = [];
      s.meals = [];
      s.voicesOfLove = [];
      s.emergencyContacts = s.emergencyContacts.filter((c) => c.isSystemDefault);
    } else if (role === 'ngo') {
      if (!s.profile.privacy.shareWithNgoCoordinator) {
        s.reports = [];
        s.medications = [];
      }
    }

    return s;
  }

  public getRawState(): SharedPlatformState {
    return this.db.state;
  }

  public addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
    const item: AuditLogEntry = {
      ...entry,
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.db.state.auditLogs.unshift(item);
    if (this.db.state.auditLogs.length > 100) {
      this.db.state.auditLogs = this.db.state.auditLogs.slice(0, 100);
    }
  }

  public addNotification(notif: Omit<NotificationItem, 'id' | 'read' | 'createdAt'>): void {
    this.db.state.notifications.unshift({
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      read: false,
      createdAt: new Date().toISOString(),
    });
    if (this.db.state.notifications.length > 60) {
      this.db.state.notifications = this.db.state.notifications.slice(0, 60);
    }
  }

  public mutate(
    actorRole: Role,
    actorName: string,
    actionDesc: string,
    targetResource: string,
    approvalStatus: AuditLogEntry['approvalStatus'],
    fn: (state: SharedPlatformState) => void
  ): SharedPlatformState {
    fn(this.db.state);
    this.addAuditLog({
      actorRole,
      actorName,
      action: actionDesc,
      targetResource,
      approvalStatus,
    });
    this.save();
    return this.getStateForRole(actorRole);
  }

  public resetDemo(): SharedPlatformState {
    const fresh = createInitialDatabase();
    this.db = fresh;
    this.save();
    return this.db.state;
  }
}

export const store = new SenioraStore();
export type { Appointment, EmergencyEvent, NgoAssistanceRequest, PharmacyOrder, PrescriptionUpdate, TransportBooking };
