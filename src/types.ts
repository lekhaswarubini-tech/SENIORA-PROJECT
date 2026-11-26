export type Role =
  | 'elder'
  | 'doctor'
  | 'family'
  | 'pharmacy'
  | 'delivery'
  | 'transport'
  | 'ngo'
  | 'admin';

export type LanguageCode = 'en' | 'ta' | 'hi';

export type TamilDialectId =
  | 'neutral'
  | 'chennai'
  | 'kongu'
  | 'madurai'
  | 'tirunelveli'
  | 'thanjavur'
  | 'salem'
  | 'kanyakumari';

export type VoicePersonaId =
  | 'female_soft'
  | 'female_warm'
  | 'female_mature'
  | 'male_calm'
  | 'male_gentle'
  | 'male_reassuring';

export interface VoicePersonaMeta {
  id: VoicePersonaId;
  gender: 'female' | 'male';
  geminiVoice: 'Kore' | 'Zephyr' | 'Puck' | 'Fenrir' | 'Charon';
  portraitUrl: string;
}

export interface PrivacySettings {
  shareHealthWithFamily: boolean;
  shareAppointmentsWithFamily: boolean;
  shareNutritionWithFamily: boolean;
  shareLocationInEmergencyOnly: boolean;
  shareWithNgoCoordinator: boolean;
  allowGentleCheckIns: boolean;
}

export interface MemoryItem {
  id: string;
  category: 'food' | 'music' | 'hobby' | 'family' | 'topic' | 'routine' | 'other';
  label: string;
  value: string;
  preferenceType: 'like' | 'dislike' | 'fact';
  createdAt: string;
}

export interface ElderProfile {
  id: string;
  name: string;
  age: number;
  city: string;
  address: string;
  language: LanguageCode;
  tamilDialect: TamilDialectId;
  voicePersona: VoicePersonaId;
  speechRate: number; // 0.78 slow, 1.0 normal
  volume: number; // 0.3 to 1.0
  fontScale: 'normal' | 'large' | 'xlarge';
  highContrast: boolean;
  communicationStyle: 'warm_casual' | 'respectful_formal';
  wakeTime: string;
  sleepTime: string;
  livesAlone: boolean;
  livingArrangement: 'alone' | 'with_family' | 'with_caregiver';
  supportAreas: string[];
  favouriteFoods: string[];
  dislikedFoods: string[];
  dietaryRestrictions: string[];
  hobbies: string[];
  favouriteMusic: string[];
  favouriteTopics: string[];
  mobilityNeeds: string;
  conditions: string[];
  allergies: string[];
  preferredDoctorName: string;
  preferredHospital: string;
  onboardingCompleted: boolean;
  memories: MemoryItem[];
  privacy: PrivacySettings;
  avatarUrl: string;
}

export interface MedicationHistoryEntry {
  date: string;
  time: string;
  status: 'taken' | 'snoozed' | 'missed';
  confirmedBy: string;
}

export interface MedicationItem {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  foodInstruction: 'before_food' | 'after_food' | 'with_food' | 'anytime';
  scheduledTime: string;
  status: 'pending' | 'taken' | 'snoozed' | 'missed';
  refillDaysLeft: number;
  prescribedBy: string;
  purpose: string;
  lastUpdatedAt: string;
  history: MedicationHistoryEntry[];
}

export interface PrescriptionUpdate {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  foodInstruction: 'before_food' | 'after_food' | 'with_food' | 'anytime';
  scheduledTime: string;
  reason: string;
  plainExplanation: string;
  status: 'pending_consent' | 'consented' | 'declined';
  consentTimestamp?: string;
  createdAt: string;
  isDemo: boolean;
}

export type DeliveryStage =
  | 'prescription_received'
  | 'awaiting_confirmation'
  | 'pharmacy_preparing'
  | 'delivery_assigned'
  | 'out_for_delivery'
  | 'delivered';

export interface PharmacyOrder {
  id: string;
  prescriptionId: string;
  patientId: string;
  patientName: string;
  pharmacyName: string;
  itemsSummary: string;
  stage: DeliveryStage;
  deliveryPartnerName: string;
  deliveryPhone: string;
  deliveryAddress: string;
  estimatedAmountInr: number;
  availabilityConfirmed: boolean;
  notes: string;
  updatedAt: string;
  createdAt: string;
  isDemo: boolean;
}

export interface DoctorDirectoryEntry {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  distanceKm: number;
  languages: string[];
  accessibleFacility: boolean;
  teleconsultAvailable: boolean;
  nextSlots: string[];
  avatarUrl: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  hospital: string;
  mode: 'in_person' | 'teleconsult';
  date: string;
  time: string;
  reason: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  consultationNotes?: string;
  followUpDate?: string;
  createdAt: string;
  isDemo: boolean;
}

export interface MedicalReport {
  id: string;
  patientId: string;
  title: string;
  category: 'lab_report' | 'imaging' | 'prescription_scan' | 'discharge_summary';
  uploadedAt: string;
  summary: string;
  reviewedByDoctor: boolean;
  doctorNote?: string;
}

export interface TransportBooking {
  id: string;
  patientId: string;
  patientName: string;
  purpose: 'doctor' | 'hospital' | 'pharmacy' | 'shopping' | 'personal';
  pickup: string;
  destination: string;
  date: string;
  time: string;
  vehicleType: 'car' | 'accessible_van' | 'auto_rickshaw' | 'ambulance';
  accessibleRequired: boolean;
  estimatedFareInr: number;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  status: 'requested' | 'confirmed' | 'en_route' | 'completed' | 'cancelled';
  createdAt: string;
  isDemo: boolean;
}

export interface WearableDayPoint {
  day: string;
  heartRate: number;
  restingHeartRate: number;
  steps: number;
  sleepHours: number;
  spo2: number;
  bpSystolic: number;
  bpDiastolic: number;
}

export interface WearableState {
  connected: boolean;
  connectionMode: 'demo' | 'web_bluetooth' | 'disconnected';
  deviceName: string;
  isDemoData: boolean;
  heartRate: number;
  restingHeartRate: number;
  spo2: number;
  spo2Supported: boolean;
  bpSystolic: number;
  bpDiastolic: number;
  bpDeviceValidated: boolean;
  steps: number;
  stepsGoal: number;
  sleepHours: number;
  activityMinutes: number;
  fallDetected: boolean;
  shareWithDoctor: boolean;
  lastSyncedAt: string;
  history7Days: WearableDayPoint[];
}

export interface MealLog {
  id: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description: string;
  time: string;
  caloriesApprox: number;
  notes?: string;
}

export interface HabitItem {
  id: string;
  title: string;
  category: 'walking' | 'exercise' | 'meditation' | 'reading' | 'water' | 'sleep' | 'social' | 'hobby';
  completedToday: boolean;
  streakDays: number;
  weeklyCompleted: number;
}

export interface RoutineItem {
  id: string;
  time: string;
  title: string;
  category: 'medication' | 'meal' | 'movement' | 'social' | 'rest';
  completed: boolean;
}

export interface VoiceOfLoveMessage {
  id: string;
  fromName: string;
  relationship: string;
  title: string;
  transcript: string;
  audioDataUrl?: string;
  durationSec: number;
  scheduledTime: string;
  createdAt: string;
  listened: boolean;
}

export interface EmergencyContact {
  id: string;
  patientId?: string;
  name: string;
  relationship: 'national_emergency' | 'ambulance' | 'fire' | 'police' | 'family' | 'neighbour' | 'caregiver' | 'doctor' | 'hospital';
  relationshipDetail?: string;
  phone: string;
  priority?: 'primary' | 'secondary';
  isSystemDefault?: boolean;
  isDemoSample?: boolean;
  notifyOnSos: boolean;
}

export interface EmergencyDeliveryChannelResult {
  channel: 'care_network' | 'webhook';
  recipient: string;
  status: 'delivered' | 'failed' | 'unconfigured';
  detail: string;
}

export interface EmergencyEvent {
  id: string;
  patientId: string;
  patientName: string;
  trigger: 'manual_sos' | 'fall_detection' | 'voice_distress' | 'abnormal_vital';
  severity: 'high' | 'urgent';
  notes: string;
  locationSharedConsent: boolean;
  locationLabel?: string;
  notifiedContacts: string[];
  deliveryStatus: 'delivered' | 'partial' | 'failed';
  deliveryDetails?: EmergencyDeliveryChannelResult[];
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedBy?: string;
  createdAt: string;
  isDemo: boolean;
}

export interface NgoVolunteer {
  id: string;
  name: string;
  languages: string[];
  skills: string[];
  area: string;
  available: boolean;
  assignedElderId?: string;
}

export interface NgoAssistanceRequest {
  id: string;
  patientId: string;
  patientName: string;
  area: string;
  type: 'hospital_visit' | 'medicine_delivery' | 'grocery' | 'companionship' | 'mobility' | 'emergency_followup';
  description: string;
  preferredDate: string;
  status: 'pending' | 'assigned' | 'completed';
  assignedVolunteerId?: string;
  assignedVolunteerName?: string;
  completionReport?: string;
  createdAt: string;
}

export interface OpportunityListing {
  id: string;
  title: string;
  organization: string;
  category: 'part_time' | 'remote' | 'mentoring' | 'teaching' | 'consulting' | 'local';
  schedule: string;
  stipendInr: string;
  verified: boolean;
  description: string;
  safetyNote: string;
}

export interface OpportunityApplication {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  applicantName: string;
  note: string;
  status: 'submitted' | 'under_review' | 'accepted';
  appliedAt: string;
}

export interface ReminderItem {
  id: string;
  title: string;
  time: string;
  date: string;
  category: 'medication' | 'appointment' | 'hydration' | 'family' | 'transport' | 'task';
  completed: boolean;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  checked: boolean;
}

export interface NotificationItem {
  id: string;
  targetRoles: Role[];
  title: string;
  message: string;
  category: 'prescription' | 'appointment' | 'transport' | 'emergency' | 'medication' | 'family' | 'ngo' | 'pharmacy';
  read: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorRole: Role;
  actorName: string;
  action: string;
  targetResource: string;
  approvalStatus: 'approved' | 'pending' | 'declined' | 'system';
  timestamp: string;
}

export interface AgentProposal {
  id: string;
  agentName: string;
  actionType:
    | 'book_appointment'
    | 'book_transport'
    | 'mark_medicine_taken'
    | 'log_water'
    | 'add_reminder'
    | 'save_memory'
    | 'trigger_emergency_review';
  title: string;
  summary: string;
  payload: Record<string, unknown>;
}

export interface AgentTurnResponse {
  replyText: string;
  activeAgents: string[];
  proposal?: AgentProposal;
  language: LanguageCode;
  tamilDialect?: TamilDialectId;
  detectedInputLanguage?: LanguageCode;
  usedFallback?: boolean;
}

export interface DemoAccountInfo {
  id: string;
  role: Role;
  name: string;
  email: string;
  label: string;
  demoPasswordHint: string;
}

export interface SharedPlatformState {
  profile: ElderProfile;
  medications: MedicationItem[];
  prescriptionUpdates: PrescriptionUpdate[];
  pharmacyOrders: PharmacyOrder[];
  doctors: DoctorDirectoryEntry[];
  appointments: Appointment[];
  reports: MedicalReport[];
  transportBookings: TransportBooking[];
  wearable: WearableState;
  meals: MealLog[];
  waterGlasses: number;
  waterGoal: number;
  habits: HabitItem[];
  routines: RoutineItem[];
  voicesOfLove: VoiceOfLoveMessage[];
  emergencyContacts: EmergencyContact[];
  emergencyEvents: EmergencyEvent[];
  volunteers: NgoVolunteer[];
  ngoRequests: NgoAssistanceRequest[];
  opportunities: OpportunityListing[];
  applications: OpportunityApplication[];
  reminders: ReminderItem[];
  shoppingList: ShoppingItem[];
  notifications: NotificationItem[];
  auditLogs: AuditLogEntry[];
  familyNotificationPrefs: {
    missedMedication: boolean;
    emergencyAlerts: boolean;
    appointmentReminders: boolean;
    ngoVisitUpdates: boolean;
  };
}
