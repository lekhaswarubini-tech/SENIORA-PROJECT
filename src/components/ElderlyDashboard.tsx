import React, { useEffect, useState } from 'react';
import {
  Activity,
  Bell,
  Briefcase,
  Calendar,
  Car,
  Check,
  CheckCircle2,
  Clock,
  Droplets,
  FileText,
  Globe2,
  Heart,
  HeartHandshake,
  Home,
  Mic,
  PhoneCall,
  Pill,
  Plus,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Trash2,
  UserCheck,
  Volume2,
  Watch,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TRANSLATIONS, VOICE_PERSONAS, getGreeting } from '../i18n/translations';
import { safeApiFetch } from '../services/apiClient';
import { voiceEngine } from '../services/voiceEngine';
import type {
  ElderProfile,
  LanguageCode,
  SharedPlatformState,
  VoicePersonaId,
} from '../types';
import { GlobalImpactPage } from './GlobalImpactPage';

export type ElderTab =
  | 'home'
  | 'health'
  | 'appointments'
  | 'watch'
  | 'transport'
  | 'companionship'
  | 'opportunities'
  | 'reminders'
  | 'impact'
  | 'settings';

interface ElderlyDashboardProps {
  token: string;
  state: SharedPlatformState;
  onRefreshState: (next: SharedPlatformState) => void;
  onTokenRefreshed?: (nextToken: string, nextState?: SharedPlatformState) => void;
  onOpenVideoCompanion: () => void;
  onOpenEmergency: () => void;
  onOpenRoleLogin: () => void;
  onReopenOnboarding: () => void;
}

export const ElderlyDashboard: React.FC<ElderlyDashboardProps> = ({
  token,
  state,
  onRefreshState,
  onTokenRefreshed,
  onOpenVideoCompanion,
  onOpenEmergency,
  onOpenRoleLogin,
  onReopenOnboarding,
}) => {
  const [tab, setTab] = useState<ElderTab>('home');
  const [now, setNow] = useState(new Date());
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Forms state
  const [mealText, setMealText] = useState('');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');

  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medTime, setMedTime] = useState('09:00');
  const [medFood, setMedFood] = useState<'before_food' | 'after_food'>('after_food');

  const [repTitle, setRepTitle] = useState('');
  const [repSummary, setRepSummary] = useState('');

  const [apptDoctorId, setApptDoctorId] = useState(state.doctors[0]?.id || 'doc-arjun');
  const [apptMode, setApptMode] = useState<'in_person' | 'teleconsult'>('in_person');
  const [apptDate, setApptDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [apptTime, setApptTime] = useState('10:30');
  const [apptReason, setApptReason] = useState('');

  const [ridePurpose, setRidePurpose] = useState<'doctor' | 'hospital' | 'pharmacy' | 'shopping' | 'personal'>('doctor');
  const [ridePickup, setRidePickup] = useState(state.profile.address);
  const [rideDest, setRideDest] = useState(state.profile.preferredHospital);
  const [rideDate, setRideDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [rideTime, setRideTime] = useState('09:30');
  const [rideVehicle, setRideVehicle] = useState<'accessible_van' | 'car' | 'auto_rickshaw' | 'ambulance'>('accessible_van');

  const [memCategory, setMemCategory] = useState<'food' | 'music' | 'hobby' | 'family' | 'other'>('food');
  const [memLabel, setMemLabel] = useState('');
  const [memValue, setMemValue] = useState('');
  const [memType, setMemType] = useState<'like' | 'dislike' | 'fact'>('like');

  const [remTitle, setRemTitle] = useState('');
  const [remTime, setRemTime] = useState('16:00');
  const [shopName, setShopName] = useState('');
  const [shopQty, setShopQty] = useState('1');
  const [bluetoothMsg, setBluetoothMsg] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const lang: LanguageCode = state.profile.language || 'en';
  const t = TRANSLATIONS[lang];
  const profile = state.profile;

  const fontSizeClass =
    profile.fontScale === 'xlarge'
      ? 'text-lg md:text-xl'
      : profile.fontScale === 'large'
      ? 'text-base md:text-lg'
      : 'text-sm md:text-base';

  const containerContrast = profile.highContrast
    ? 'bg-white text-black'
    : 'bg-[#FAF3E8] text-[#382C27]';

  const apiCall = async (url: string, method: string, body?: unknown, banner?: string) => {
    const result = await safeApiFetch<{ state?: SharedPlatformState; error?: string }>(url, {
      method,
      token,
      role: 'elder',
      onTokenRefreshed,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (result.ok && result.data?.state) {
      onRefreshState(result.data.state);
      if (banner) {
        setStatusBanner(banner);
        window.setTimeout(() => setStatusBanner(null), 4000);
      }
    } else if (!result.ok && result.error) {
      setStatusBanner(result.error);
      window.setTimeout(() => setStatusBanner(null), 4500);
    }
  };

  const updateProfile = (updates: Partial<ElderProfile>, banner?: string) =>
    apiCall('/api/profile', 'PATCH', updates, banner);

  const speakMessage = (text: string) => {
    voiceEngine.speak(text, {
      voicePersona: profile.voicePersona,
      language: lang,
      rate: profile.speechRate,
      volume: profile.volume,
      token,
    });
  };

  const handleBluetoothConnect = async () => {
    setBluetoothMsg(null);
    const nav = navigator as unknown as {
      bluetooth?: { requestDevice: (opts: unknown) => Promise<{ name?: string; gatt?: { connect: () => Promise<unknown> } }> };
    };
    if (!nav.bluetooth) {
      setBluetoothMsg('Web Bluetooth is not supported in this browser. Using clearly labelled DEMO DATA simulator.');
      return;
    }
    try {
      const device = await nav.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
        optionalServices: ['battery_service'],
      });
      await device.gatt?.connect();
      await apiCall('/api/wearable/sync', 'POST', {
        connectionMode: 'web_bluetooth',
        deviceName: device.name || 'Bluetooth Heart-Rate Sensor',
      });
      setBluetoothMsg(`Connected to ${device.name || 'Bluetooth Watch'}.`);
    } catch {
      setBluetoothMsg('Bluetooth pairing cancelled or unavailable. Simulator remains in DEMO DATA mode.');
    }
  };

  const foodInstructionText = (f: string) => {
    if (f === 'before_food') return t.dashboard.beforeFood;
    if (f === 'after_food') return t.dashboard.afterFood;
    if (f === 'with_food') return t.dashboard.withFood;
    return t.dashboard.anytime;
  };

  const pendingPrescriptions = state.prescriptionUpdates.filter((p) => p.status === 'pending_consent');
  const nextAppt = state.appointments.find((a) => a.status === 'scheduled');
  const dateFormatted = now.toLocaleDateString(
    lang === 'ta' ? 'ta-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN',
    { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
  );
  const timeFormatted = now.toLocaleTimeString(
    lang === 'ta' ? 'ta-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN',
    { hour: '2-digit', minute: '2-digit' }
  );

  const navItems: Array<{ id: ElderTab; label: string; icon: React.ReactNode }> = [
    { id: 'home', label: t.nav.home, icon: <Home className="w-5 h-5" /> },
    { id: 'health', label: t.nav.health, icon: <Pill className="w-5 h-5" /> },
    { id: 'appointments', label: t.nav.appointments, icon: <Calendar className="w-5 h-5" /> },
    { id: 'watch', label: t.nav.watch, icon: <Watch className="w-5 h-5" /> },
    { id: 'transport', label: t.nav.transport, icon: <Car className="w-5 h-5" /> },
    { id: 'companionship', label: t.nav.companionship, icon: <HeartHandshake className="w-5 h-5" /> },
    { id: 'opportunities', label: t.nav.opportunities, icon: <Briefcase className="w-5 h-5" /> },
    { id: 'reminders', label: t.nav.reminders, icon: <Bell className="w-5 h-5" /> },
    { id: 'impact', label: t.nav.impact, icon: <Globe2 className="w-5 h-5" /> },
    { id: 'settings', label: t.nav.settings, icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className={`min-h-screen flex flex-col ${containerContrast} ${fontSizeClass}`}>
      {/* Clean 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#FFFDF9]/95 backdrop-blur border-b border-[#E8D5B5] px-4 md:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 shrink-0">
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-full object-cover border-2 border-[#E8D5B5]"
            />
            <div>
              <div className="text-lg font-bold tracking-tight text-[#382C27] whitespace-nowrap">
                SENIORA
              </div>
              <div className="text-xs text-[#63534B] whitespace-nowrap">
                {profile.name} · {dateFormatted}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Instant Language Switcher */}
            <div className="flex items-center bg-[#FAF3E8] border border-[#E8D5B5] rounded-xl p-1">
              {(['en', 'ta', 'hi'] as LanguageCode[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => updateProfile({ language: code })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                    lang === code
                      ? 'bg-[#783F45] text-[#FAF3E8]'
                      : 'text-[#382C27] hover:bg-[#F3E7D2]'
                  }`}
                >
                  {code === 'en' ? 'EN' : code === 'ta' ? 'தமிழ்' : 'हिन्दी'}
                </button>
              ))}
            </div>

            {/* Accessible Talk CTA in Header */}
            <button
              type="button"
              onClick={onOpenVideoCompanion}
              className="px-4 py-2.5 rounded-xl bg-[#C46A4A] hover:bg-[#AE583A] text-white font-bold text-sm flex items-center gap-2 whitespace-nowrap shadow-sm"
            >
              <Mic className="w-4 h-4" />
              {t.talkToCompanion}
            </button>

            {/* Emergency SOS Button on Every Screen */}
            <button
              type="button"
              onClick={onOpenEmergency}
              className="px-4 py-2.5 rounded-xl bg-[#783F45] hover:bg-[#613136] text-[#FAF3E8] font-bold text-sm flex items-center gap-1.5 whitespace-nowrap"
            >
              <ShieldAlert className="w-4 h-4" />
              {t.emergencySos}
            </button>

            <button
              type="button"
              onClick={onOpenRoleLogin}
              className="px-3.5 py-2.5 rounded-xl border border-[#D9C098] bg-[#FFFDF9] hover:bg-[#F3E7D2] text-[#382C27] font-semibold text-sm whitespace-nowrap"
            >
              {t.switchRole}
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout: Large Accessible Navigation + Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Navigation Rail */}
        <aside className="lg:col-span-3 space-y-3">
          <nav className="bg-[#FFFDF9] rounded-3xl border border-[#E8D5B5] p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1.5 shadow-sm">
            {navItems.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`w-full px-4 py-3.5 rounded-2xl font-semibold text-left flex items-center gap-3 transition-colors ${
                    active
                      ? 'bg-[#783F45] text-[#FAF3E8] shadow-sm'
                      : 'text-[#382C27] hover:bg-[#F3E7D2]'
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Persistent Voice Companion Shortcut Card */}
          <div className="bg-gradient-to-br from-[#FFFDF9] to-[#F3E7D2] rounded-3xl border border-[#E8D5B5] p-5 space-y-3 shadow-sm">
            <div className="font-bold text-[#382C27]">{t.talkToCompanion}</div>
            <p className="text-sm text-[#63534B]">
              {t.brandTagline}
            </p>
            <button
              type="button"
              onClick={onOpenVideoCompanion}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#C46A4A] hover:bg-[#AE583A] text-white font-bold flex items-center justify-center gap-2 shadow-sm"
            >
              <Mic className="w-5 h-5" />
              {t.talkToCompanion}
            </button>
          </div>
        </aside>

        {/* Main Workspace Viewport */}
        <main className="lg:col-span-9 space-y-6">
          {statusBanner && (
            <div className="p-4 rounded-2xl bg-[#EFF3EC] border border-[#A8B89A] text-[#382C27] font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#355C48] shrink-0" />
              <span>{statusBanner}</span>
            </div>
          )}

          {/* HOME TAB */}
          {tab === 'home' && (
            <div className="space-y-6">
              {/* Personalized Hero Greeting + Dominant Talk CTA */}
              <section className="bg-gradient-to-br from-[#FFFDF9] via-[#FAF3E8] to-[#F3E4CC] rounded-3xl border border-[#E8D5B5] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                <div className="space-y-2 max-w-xl">
                  <div className="text-sm font-semibold text-[#783F45] tabular-nums">
                    {dateFormatted} · {timeFormatted}
                  </div>
                  <h1 className="text-2xl md:text-4xl font-bold text-[#382C27]">
                    {getGreeting(lang)}, {profile.name}!
                  </h1>
                  <p className="text-[#63534B] leading-relaxed">{t.dashboard.greetingSub}</p>
                </div>

                <div className="flex flex-col gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={onOpenVideoCompanion}
                    className="px-7 py-5 rounded-2xl bg-[#C46A4A] hover:bg-[#AE583A] text-white font-bold text-lg flex items-center justify-center gap-3 shadow-sm"
                  >
                    <Mic className="w-6 h-6" />
                    {t.talkToCompanion}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      speakMessage(
                        `${getGreeting(lang)}, ${profile.name}. ${t.dashboard.greetingSub}`
                      )
                    }
                    className="px-5 py-2.5 rounded-xl bg-[#F3E7D2] hover:bg-[#E8D5B5] border border-[#D9C098] text-[#382C27] font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <Volume2 className="w-4 h-4 text-[#9E4B30]" />
                    Read Aloud
                  </button>
                </div>
              </section>

              {/* Pending Doctor Prescription Consent Alert */}
              {pendingPrescriptions.map((rx) => (
                <section
                  key={rx.id}
                  className="bg-gradient-to-br from-[#FAF0DD] to-[#E8D5B5]/70 rounded-3xl border-2 border-[#D4B483] p-6 space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-bold text-[#783F45]">
                        {t.dashboard.pendingPrescriptionTitle}
                      </div>
                      <h3 className="text-xl font-bold text-[#382C27] mt-1">
                        {rx.medicineName} — {rx.dosage}
                      </h3>
                      <p className="text-[#382C27] mt-1">{rx.plainExplanation}</p>
                      <p className="text-sm text-[#63534B] mt-1">
                        {rx.doctorName} · {rx.frequency} · {rx.reason}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        apiCall(
                          `/api/prescriptions/${rx.id}/respond`,
                          'POST',
                          { decision: 'consented', orderFromPharmacy: true },
                          `${rx.medicineName} confirmed and sent to MedPlus Care Pharmacy (DEMO).`
                        )
                      }
                      className="px-5 py-3 rounded-xl bg-[#355C48] hover:bg-[#294838] text-white font-bold shadow-sm"
                    >
                      {t.dashboard.confirmPrescriptionBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        apiCall(
                          `/api/prescriptions/${rx.id}/respond`,
                          'POST',
                          { decision: 'declined', orderFromPharmacy: false },
                          `Sent back to ${rx.doctorName} for review.`
                        )
                      }
                      className="px-5 py-3 rounded-xl bg-[#FFFDF9] border border-[#D9C098] hover:bg-[#FAF3E8] text-[#382C27] font-semibold"
                    >
                      {t.dashboard.declinePrescriptionBtn}
                    </button>
                  </div>
                </section>
              ))}

              {/* Grid: Medications + Next Appointment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Today's Medications */}
                <section className="bg-[#FFFDF9] rounded-3xl border border-[#E8D5B5] p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[#382C27] flex items-center gap-2">
                      <Pill className="w-5 h-5 text-[#355C48]" />
                      {t.dashboard.todaysMedicines}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setTab('health')}
                      className="text-sm font-semibold text-[#9E4B30] hover:underline"
                    >
                      {t.nav.health}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {state.medications.map((med) => (
                      <div
                        key={med.id}
                        className="p-4 rounded-2xl bg-[#FAF3E8] border border-[#E8D5B5] space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-[#382C27]">
                              {med.name} · {med.dosage}
                            </div>
                            <div className="text-sm text-[#63534B] tabular-nums">
                              {med.scheduledTime} · {foodInstructionText(med.foodInstruction)}
                            </div>
                          </div>
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                              med.status === 'taken'
                                ? 'bg-[#EFF3EC] text-[#355C48] border border-[#A8B89A]'
                                : med.status === 'missed'
                                ? 'bg-[#F7ECEE] text-[#783F45] border border-[#783F45]/30'
                                : 'bg-[#F3E7D2] text-[#382C27] border border-[#D4B483]'
                            }`}
                          >
                            {med.status === 'taken' ? t.dashboard.takenLabel : t.dashboard.pendingLabel}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              apiCall(`/api/medications/${med.id}/status`, 'POST', { status: 'taken' })
                            }
                            className="px-4 py-2 rounded-xl bg-[#355C48] hover:bg-[#294838] text-white text-sm font-semibold"
                          >
                            {t.dashboard.markTaken}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              apiCall(`/api/medications/${med.id}/status`, 'POST', { status: 'snoozed' })
                            }
                            className="px-3.5 py-2 rounded-xl bg-[#FFFDF9] border border-[#D9C098] hover:bg-[#F3E7D2] text-[#382C27] text-sm font-semibold"
                          >
                            {t.dashboard.snooze}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Next Appointment + Quick Care Actions */}
                <div className="space-y-6">
                  <section className="bg-[#FFFDF9] rounded-3xl border border-[#E8D5B5] p-6 space-y-3 shadow-sm">
                    <h2 className="text-xl font-bold text-[#382C27] flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[#783F45]" />
                      {t.dashboard.nextAppointment}
                    </h2>
                    {nextAppt ? (
                      <div className="p-4 rounded-2xl bg-[#EFF3EC] border border-[#A8B89A] space-y-1.5">
                        <div className="font-bold text-[#382C27]">{nextAppt.doctorName}</div>
                        <div className="text-sm text-[#382C27]">{nextAppt.specialty}</div>
                        <div className="text-sm font-semibold text-[#355C48] tabular-nums">
                          {nextAppt.date} · {nextAppt.time}
                        </div>
                        <div className="text-xs text-[#63534B]">{nextAppt.hospital}</div>
                      </div>
                    ) : (
                      <p className="text-[#63534B]">{t.dashboard.noAppointments}</p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setTab('transport')}
                        className="p-3 rounded-xl bg-[#F3E7D2] hover:bg-[#E8D5B5] border border-[#D9C098] font-semibold text-sm text-[#382C27] flex items-center justify-center gap-1.5"
                      >
                        <Car className="w-4 h-4 text-[#9E4B30]" />
                        {t.dashboard.bookRide}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab('watch')}
                        className="p-3 rounded-xl bg-[#F3E7D2] hover:bg-[#E8D5B5] border border-[#D9C098] font-semibold text-sm text-[#382C27] flex items-center justify-center gap-1.5"
                      >
                        <Watch className="w-4 h-4 text-[#355C48]" />
                        {t.dashboard.openWatch}
                      </button>
                      <a
                        href="tel:+919845022334"
                        className="p-3 rounded-xl bg-[#F3E7D2] hover:bg-[#E8D5B5] border border-[#D9C098] font-semibold text-sm text-[#382C27] flex items-center justify-center gap-1.5"
                      >
                        <PhoneCall className="w-4 h-4 text-[#783F45]" />
                        {t.dashboard.callFamily}
                      </a>
                    </div>
                  </section>

                  {/* Active Medicine Delivery Tracker */}
                  {state.pharmacyOrders.length > 0 && (
                    <section className="bg-[#FFFDF9] rounded-3xl border border-[#E8D5B5] p-6 space-y-3 shadow-sm">
                      <h2 className="text-lg font-bold text-[#382C27]">
                        {t.dashboard.pharmacyTrackerTitle}
                      </h2>
                      {state.pharmacyOrders.slice(0, 2).map((ord) => (
                        <div key={ord.id} className="p-3.5 rounded-2xl bg-[#FAF3E8] border border-[#E8D5B5]">
                          <div className="font-semibold text-[#382C27]">{ord.itemsSummary}</div>
                          <div className="text-sm text-[#355C48] font-semibold mt-1">
                            {ord.stage.replace(/_/g, ' ').toUpperCase()}
                          </div>
                          <div className="text-xs text-[#63534B] mt-1">
                            {ord.pharmacyName} · {ord.deliveryPartnerName}
                          </div>
                        </div>
                      ))}
                    </section>
                  )}
                </div>
              </div>

              {/* Water, Meals, and Voices of Love */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hydration & Meals */}
                <section className="bg-[#FFFDF9] rounded-3xl border border-[#E8D5B5] p-6 space-y-4 shadow-sm">
                  <h2 className="text-xl font-bold text-[#382C27] flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-[#355C48]" />
                    {t.dashboard.hydrationMeals}
                  </h2>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-[#EFF3EC] border border-[#A8B89A]">
                    <div>
                      <div className="text-2xl font-bold text-[#382C27] tabular-nums">
                        {state.waterGlasses} / {state.waterGoal}
                      </div>
                      <div className="text-sm text-[#382C27]">{t.dashboard.glassesOfWater}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => apiCall('/api/nutrition/water', 'POST', { delta: 1 })}
                      className="px-4 py-3 rounded-xl bg-[#355C48] hover:bg-[#294838] text-white font-bold text-sm"
                    >
                      {t.dashboard.addWater}
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!mealText.trim()) return;
                      apiCall('/api/nutrition/meals', 'POST', {
                        type: mealType,
                        description: mealText,
                      });
                      setMealText('');
                    }}
                    className="space-y-2.5"
                  >
                    <div className="flex gap-2">
                      <select
                        value={mealType}
                        onChange={(e) =>
                          setMealType(e.target.value as 'breakfast' | 'lunch' | 'dinner' | 'snack')
                        }
                        className="px-3 py-2.5 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-sm font-medium"
                      >
                        <option value="breakfast">Breakfast</option>
                        <option value="lunch">Lunch</option>
                        <option value="dinner">Dinner</option>
                        <option value="snack">Snack</option>
                      </select>
                      <input
                        type="text"
                        value={mealText}
                        onChange={(e) => setMealText(e.target.value)}
                        placeholder={t.dashboard.mealPlaceholder}
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#D9C098] bg-[#FAF3E8] text-[#382C27] text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#382C27] hover:bg-[#2A201C] text-[#FAF3E8] font-semibold text-sm"
                    >
                      {t.dashboard.saveMeal}
                    </button>
                  </form>

                  <div className="space-y-1.5 text-sm text-[#382C27]">
                    {state.meals.slice(0, 3).map((m) => (
                      <div key={m.id} className="py-1.5 border-b border-[#E8D5B5] last:border-0">
                        <span className="font-semibold capitalize">{m.type}:</span> {m.description}{' '}
                        <span className="text-xs text-[#63534B] tabular-nums">({m.time})</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Voices of Love */}
                <section className="bg-[#FFFDF9] rounded-3xl border border-[#E8D5B5] p-6 space-y-4 shadow-sm">
                  <h2 className="text-xl font-bold text-[#382C27] flex items-center gap-2">
                    <Heart className="w-5 h-5 text-[#783F45]" />
                    {t.dashboard.voicesOfLove}
                  </h2>
                  <div className="space-y-3">
                    {state.voicesOfLove.map((msg) => (
                      <div
                        key={msg.id}
                        className="p-4 rounded-2xl bg-gradient-to-br from-[#FAF3E8] to-[#F3E4CC] border border-[#E8D5B5] space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="font-bold text-[#382C27]">
                              {msg.title} — {msg.fromName} ({msg.relationship})
                            </div>
                          </div>
                          {msg.listened && (
                            <span className="text-xs font-semibold text-[#355C48]">
                              {t.dashboard.listenedLabel}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#382C27]">“{msg.transcript}”</p>
                        <button
                          type="button"
                          onClick={() => {
                            if (msg.audioDataUrl) {
                              const audio = new Audio(msg.audioDataUrl);
                              audio.play().catch(() => speakMessage(msg.transcript));
                            } else {
                              speakMessage(msg.transcript);
                            }
                            apiCall(`/api/voices-of-love/${msg.id}/listened`, 'POST');
                          }}
                          className="px-4 py-2 rounded-xl bg-[#C46A4A] hover:bg-[#AE583A] text-white text-sm font-semibold inline-flex items-center gap-1.5"
                        >
                          <Volume2 className="w-4 h-4" />
                          {t.dashboard.listenMessage}
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Habits & Daily Routine */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section className="bg-[#FFFDF9] rounded-3xl border border-[#E8D5B5] p-6 space-y-3 shadow-sm">
                  <h2 className="text-xl font-bold text-[#382C27]">{t.dashboard.dailyHabits}</h2>
                  {state.habits.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => apiCall(`/api/habits/${h.id}/toggle`, 'POST')}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-colors ${
                        h.completedToday
                          ? 'bg-[#EFF3EC] border-[#A8B89A]'
                          : 'bg-[#FAF3E8] border-[#E8D5B5] hover:bg-[#F3E7D2]'
                      }`}
                    >
                      <span className="font-semibold text-[#382C27]">{h.title}</span>
                      <span className="text-xs font-mono-num text-[#355C48] font-semibold shrink-0">
                        {h.streakDays}d streak {h.completedToday ? '✓' : ''}
                      </span>
                    </button>
                  ))}
                </section>

                <section className="bg-[#FFFDF9] rounded-3xl border border-[#E8D5B5] p-6 space-y-3 shadow-sm">
                  <h2 className="text-xl font-bold text-[#382C27]">{t.dashboard.dailyRoutine}</h2>
                  {state.routines.map((rt) => (
                    <button
                      key={rt.id}
                      type="button"
                      onClick={() => apiCall(`/api/routines/${rt.id}/toggle`, 'POST')}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-colors ${
                        rt.completed
                          ? 'bg-[#EFF3EC] border-[#A8B89A]'
                          : 'bg-[#FAF3E8] border-[#E8D5B5] hover:bg-[#F3E7D2]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono-num text-sm font-bold text-[#783F45]">{rt.time}</span>
                        <span className={rt.completed ? 'line-through text-[#63534B]' : 'font-medium text-[#382C27]'}>
                          {rt.title}
                        </span>
                      </div>
                      {rt.completed && <Check className="w-5 h-5 text-[#355C48] shrink-0" />}
                    </button>
                  ))}
                </section>
              </div>
            </div>
          )}

          {/* HEALTHCARE & MEDICATIONS TAB */}
          {tab === 'health' && (
            <div className="space-y-6">
              <div className="bg-[#FFFDF9] rounded-3xl border border-[#E8D5B5] p-6 space-y-4 shadow-sm">
                <h2 className="text-2xl font-bold text-[#382C27]">{t.health.title}</h2>
                <p className="text-[#63534B]">{t.health.subtitle}</p>
                <div className="p-4 rounded-2xl bg-[#EFF3EC] border border-[#A8B89A] text-sm text-[#382C27]">
                  {t.health.nonDiagnosticNote}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-[#FAF3E8] border border-[#E8D5B5]">
                    <div className="text-xs font-semibold text-[#63534B]">{t.health.conditions}</div>
                    <div className="font-semibold text-[#382C27] mt-1">
                      {profile.conditions.join(' · ')}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#FAF3E8] border border-[#E8D5B5]">
                    <div className="text-xs font-semibold text-[#63534B]">{t.health.allergies}</div>
                    <div className="font-semibold text-[#783F45] mt-1">
                      {profile.allergies.join(' · ')}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#FAF3E8] border border-[#E8D5B5]">
                    <div className="text-xs font-semibold text-[#63534B]">{t.health.primaryDoctor}</div>
                    <div className="font-semibold text-[#382C27] mt-1">{profile.preferredDoctorName}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#FAF3E8] border border-[#E8D5B5]">
                    <div className="text-xs font-semibold text-[#63534B]">{t.health.preferredHospital}</div>
                    <div className="font-semibold text-[#382C27] mt-1">{profile.preferredHospital}</div>
                  </div>
                </div>
              </div>

              {/* Medication Schedule & Add Form */}
              <div className="bg-[#FFFDF9] rounded-3xl border border-[#E8D5B5] p-6 space-y-4 shadow-sm">
                <h3 className="text-xl font-bold text-[#382C27]">{t.health.medicationSchedule}</h3>
                <div className="space-y-3">
                  {state.medications.map((med) => (
                    <div
                      key={med.id}
                      className="p-4 rounded-2xl bg-[#FAF3E8] border border-[#E8D5B5] flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-bold text-[#382C27]">
                          {med.name} — {med.dosage}
                        </div>
                        <div className="text-sm text-[#63534B]">
                          {med.scheduledTime} · {med.frequency} · {foodInstructionText(med.foodInstruction)} ·{' '}
                          <span className="tabular-nums">{med.refillDaysLeft} days left</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          apiCall(`/api/medications/${med.id}/status`, 'POST', { status: 'taken' })
                        }
                        className="px-4 py-2 rounded-xl bg-[#355C48] hover:bg-[#294838] text-white text-sm font-semibold"
                      >
                        {t.dashboard.markTaken}
                      </button>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!medName.trim() || !medDosage.trim()) return;
                    apiCall(
                      '/api/medications',
                      'POST',
                      { name: medName, dosage: medDosage, scheduledTime: medTime, foodInstruction: medFood },
                      'Medication added to your schedule.'
                    );
                    setMedName('');
                    setMedDosage('');
                  }}
                  className="p-4 rounded-2xl bg-[#FAF3E8] border border-[#E8D5B5] space-y-3"
                >
                  <div className="font-bold text-sm text-[#382C27]">{t.health.addMedicine}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <input
                      type="text"
                      value={medName}
                      onChange={(e) => setMedName(e.target.value)}
                      placeholder={t.health.medicineName}
                      className="px-3.5 py-2.5 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-sm"
                    />
                    <input
                      type="text"
                      value={medDosage}
                      onChange={(e) => setMedDosage(e.target.value)}
                      placeholder={t.health.dosage}
                      className="px-3.5 py-2.5 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-sm"
                    />
                    <input
                      type="time"
                      value={medTime}
                      onChange={(e) => setMedTime(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-sm"
                    />
                    <select
                      value={medFood}
                      onChange={(e) => setMedFood(e.target.value as 'before_food' | 'after_food')}
                      className="px-3.5 py-2.5 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-sm"
                    >
                      <option value="after_food">{t.dashboard.afterFood}</option>
                      <option value="before_food">{t.dashboard.beforeFood}</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#382C27] hover:bg-[#2A201C] text-[#FAF3E8] text-sm font-semibold inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    {t.health.addMedicine}
                  </button>
                </form>
              </div>

              {/* Medical Reports */}
              <div className="bg-[#FFFDF9] rounded-3xl border border-[#E8D5B5] p-6 space-y-4 shadow-sm">
                <h3 className="text-xl font-bold text-[#382C27] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#783F45]" />
                  {t.health.medicalReports}
                </h3>
                {state.reports.map((rep) => (
                  <div key={rep.id} className="p-4 rounded-2xl bg-[#FAF3E8] border border-[#E8D5B5] space-y-1">
                    <div className="font-bold text-[#382C27]">
                      {rep.title} · <span className="text-xs text-[#63534B]">{rep.uploadedAt}</span>
                    </div>
                    <p className="text-sm text-[#382C27]">{rep.summary}</p>
                    {rep.doctorNote && (
                      <p className="text-sm text-[#355C48] font-medium">Dr. Arjun: {rep.doctorNote}</p>
                    )}
                  </div>
                ))}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!repTitle.trim() || !repSummary.trim()) return;
                    apiCall(
                      '/api/reports',
                      'POST',
                      { title: repTitle, summary: repSummary, category: 'lab_report' },
                      'Medical report shared with your doctor.'
                    );
                    setRepTitle('');
                    setRepSummary('');
                  }}
                  className="p-4 rounded-2xl bg-[#FAF3E8] border border-[#E8D5B5] space-y-3"
                >
                  <div className="font-bold text-sm text-[#382C27]">{t.health.uploadReport}</div>
                  <input
                    type="text"
                    value={repTitle}
                    onChange={(e) => setRepTitle(e.target.value)}
                    placeholder={t.health.reportTitle}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-sm"
                  />
                  <textarea
                    value={repSummary}
                    onChange={(e) => setRepSummary(e.target.value)}
                    placeholder={t.health.reportSummary}
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-sm"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#C46A4A] hover:bg-[#AE583A] text-white text-sm font-semibold"
                  >
                    {t.health.uploadReport}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* APPOINTMENTS TAB */}
          {tab === 'appointments' && (
            <div className="space-y-6">
              <div className="bg-[#FFFDF9] rounded-3xl border border-[#E8D5B5] p-6 space-y-5 shadow-sm">
                <div>
                  <h2 className="text-2xl font-bold text-[#382C27]">{t.appointments.title}</h2>
                  <p className="text-[#63534B]">{t.appointments.subtitle}</p>
                  <div className="mt-2 text-xs font-semibold text-[#382C27] bg-[#F3E7D2] border border-[#D4B483] rounded-xl px-3 py-2 inline-block">
                    {t.appointments.demoLabel}
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const doc = state.doctors.find((d) => d.id === apptDoctorId) || state.doctors[0];
                    apiCall(
                      '/api/appointments',
                      'POST',
                      {
                        doctorId: doc.id,
                        doctorName: doc.name,
                        specialty: doc.specialty,
                        hospital: doc.hospital,
                        mode: apptMode,
                        date: apptDate,
                        time: apptTime,
                        reason: apptReason || 'Routine health consultation',
                      },
                      `Appointment confirmed with ${doc.name} (DEMO).`
                    );
                    setApptReason('');
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-bold text-[#382C27] mb-2">
                      {t.appointments.chooseDoctor}
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {state.doctors.map((doc) => (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => setApptDoctorId(doc.id)}
                          className={`p-4 rounded-2xl border-2 text-left flex items-center gap-3 transition-colors ${
                            apptDoctorId === doc.id
                              ? 'border-[#783F45] bg-[#F7ECEE]'
                              : 'border-[#E8D5B5] bg-[#FAF3E8] hover:bg-[#F3E7D2]'
                          }`}
                        >
                          <img
                            src={doc.avatarUrl}
                            alt={doc.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-full object-cover shrink-0 border border-[#E8D5B5]"
                          />
                          <div>
                            <div className="font-bold text-[#382C27]">{doc.name}</div>
                            <div className="text-xs text-[#63534B]">
                              {doc.specialty} · {doc.distanceKm} km
                            </div>
                            <div className="text-xs text-[#355C48] font-semibold mt-0.5">{doc.hospital}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <select
                      value={apptMode}
                      onChange={(e) => setApptMode(e.target.value as 'in_person' | 'teleconsult')}
                      className="px-3.5 py-3 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-sm font-semibold"
                    >
                      <option value="in_person">{t.appointments.modeInPerson}</option>
                      <option value="teleconsult">{t.appointments.modeTele}</option>
                    </select>
                    <input
                      type="date"
                      value={apptDate}
                      onChange={(e) => setApptDate(e.target.value)}
                      className="px-3.5 py-3 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-sm"
                    />
                    <input
                      type="time"
                      value={apptTime}
                      onChange={(e) => setApptTime(e.target.value)}
                      className="px-3.5 py-3 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-sm"
                    />
                    <input
                      type="text"
                      value={apptReason}
                      onChange={(e) => setApptReason(e.target.value)}
                      placeholder={t.appointments.reasonLabel}
                      className="px-3.5 py-3 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-3.5 rounded-2xl bg-[#355C48] hover:bg-[#294838] text-white font-bold shadow-sm"
                  >
                    {t.appointments.bookButton}
                  </button>
                </form>
              </div>

              <div className="bg-[#FFFDF9] rounded-3xl border border-[#E8D5B5] p-6 space-y-3 shadow-sm">
                <h3 className="text-xl font-bold text-[#382C27]">{t.appointments.upcomingTitle}</h3>
                {state.appointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-4 rounded-2xl bg-[#FAF3E8] border border-[#E8D5B5] flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-[#382C27]">
                        {appt.doctorName} ({appt.specialty})
                      </div>
                      <div className="text-sm text-[#382C27] tabular-nums">
                        {appt.date} at {appt.time} · {appt.mode.replace('_', ' ')} ·{' '}
                        <span className="font-semibold text-[#355C48]">{appt.status}</span>
                      </div>
                      <div className="text-xs text-[#63534B]">{appt.reason}</div>
                    </div>
                    {appt.status === 'scheduled' && (
                      <button
                        type="button"
                        onClick={() =>
                          apiCall(`/api/appointments/${appt.id}`, 'PATCH', { status: 'cancelled' })
                        }
                        className="px-3.5 py-2 rounded-xl border border-[#D9C098] bg-[#FFFDF9] hover:bg-[#F3E7D2] text-sm font-semibold text-[#382C27]"
                      >
                        {t.appointments.cancelButton}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HEALTH WATCH TAB */}
          {tab === 'watch' && (
            <div className="space-y-6">
              <div className="bg-[#FFFDF9] rounded-3xl border border-[#E8D5B5] p-6 space-y-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-bold text-[#382C27]">{t.watch.title}</h2>
                    <p className="text-[#63534B]">{state.wearable.deviceName}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleBluetoothConnect}
                      className="px-4 py-2.5 rounded-xl bg-[#382C27] hover:bg-[#2A201C] text-[#FAF3E8] text-sm font-semibold"
                    >
                      {t.watch.connectBluetooth}
                    </button>
                    <button
                      type="button"
                      onClick={() => apiCall('/api/wearable/sync', 'POST', { connectionMode: 'demo' })}
                      className="px-4 py-2.5 rounded-xl bg-[#355C48] hover:bg-[#294838] text-white text-sm font-semibold"
                    >
                      {t.watch.syncNow}
                    </button>
                  </div>
                </div>

                {state.wearable.isDemoData && (
                  <div className="p-4 rounded-2xl bg-[#F3E7D2] border border-[#D4B483] text-[#382C27] text-sm font-semibold">
                    {t.watch.demoBanner}
                  </div>
                )}
                {bluetoothMsg && (
                  <div className="p-3 rounded-xl bg-[#EFF3EC] border border-[#A8B89A] text-[#382C27] text-sm">
                    {bluetoothMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-[#FAF3E8] border border-[#E8D5B5]">
                    <div className="text-xs font-semibold text-[#63534B]">{t.watch.heartRate}</div>
                    <div className="text-3xl font-bold font-mono-num text-[#382C27] mt-1">
                      {state.wearable.heartRate} bpm
                    </div>
                    <div className="text-xs text-[#63534B] mt-1">
                      {t.watch.restingHr}: {state.wearable.restingHeartRate} bpm (DEMO DATA)
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#FAF3E8] border border-[#E8D5B5]">
                    <div className="text-xs font-semibold text-[#63534B]">{t.watch.spo2}</div>
                    <div className="text-3xl font-bold font-mono-num text-[#382C27] mt-1">
                      {state.wearable.spo2Supported ? `${state.wearable.spo2}%` : 'Not Supported'}
                    </div>
                    <div className="text-xs text-[#63534B] mt-1">Supported sensor mode (DEMO DATA)</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#FAF3E8] border border-[#E8D5B5]">
                    <div className="text-xs font-semibold text-[#63534B]">{t.watch.bloodPressure}</div>
                    <div className="text-3xl font-bold font-mono-num text-[#382C27] mt-1">
                      {state.wearable.bpSystolic}/{state.wearable.bpDiastolic}
                    </div>
                    <div className="text-xs text-[#63534B] mt-1">{t.watch.bpNote}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#FAF3E8] border border-[#E8D5B5]">
                    <div className="text-xs font-semibold text-[#63534B]">{t.watch.stepsToday}</div>
                    <div className="text-3xl font-bold font-mono-num text-[#382C27] mt-1">
                      {state.wearable.steps.toLocaleString()}
                    </div>
                    <div className="text-xs text-[#63534B] mt-1">Goal: {state.wearable.stepsGoal} steps</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#FAF3E8] border border-[#E8D5B5]">
                    <div className="text-xs font-semibold text-[#63534B]">{t.watch.sleepLastNight}</div>
                    <div className="text-3xl font-bold font-mono-num text-[#382C27] mt-1">
                      {state.wearable.sleepHours} hrs
                    </div>
                    <div className="text-xs text-[#63534B] mt-1">Restful sleep window (DEMO DATA)</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#FAF3E8] border border-[#E8D5B5] flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-[#382C27]">{t.watch.shareDoctor}</div>
                      <div className="text-xs text-[#63534B]">Consent-controlled</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={state.wearable.shareWithDoctor}
                      onChange={(e) =>
                        apiCall('/api/wearable/sync', 'POST', { shareWithDoctor: e.target.checked })
                      }
                      className="w-5 h-5 accent-[#355C48]"
                    />
                  </div>
                </div>

                {/* 7-Day Trend Graph */}
                <div className="h-64 p-4 rounded-2xl bg-[#FAF3E8] border border-[#E8D5B5]">
                  <div className="text-sm font-bold text-[#382C27] mb-2">{t.watch.trendsTitle}</div>
                  <ResponsiveContainer width="100%" height="88%">
                    <LineChart data={state.wearable.history7Days}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8D5B5" />
                      <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#382C27' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#382C27' }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="heartRate" stroke="#355C48" strokeWidth={2.5} name="Heart Rate (bpm)" />
                      <Line type="monotone" dataKey="bpSystolic" stroke="#C46A4A" strokeWidth={2.2} name="Systolic BP" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="p-4 rounded-2xl bg-[#EFF3EC] border border-[#A8B89A] text-sm text-[#382C27] flex items-center justify-between gap-3 flex-wrap">
                  <span>{t.watch.guidanceNote}</span>
                  <button
                    type="button"
                    onClick={onOpenEmergency}
                    className="px-4 py-2 rounded-xl bg-[#783F45] hover:bg-[#613136] text-[#FAF3E8] font-semibold text-xs shrink-0"
                  >
                    {t.emergencySos}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TRANSPORT TAB */}
          {tab === 'transport' && (
            <div className="space-y-6">
              <div className="bg-[#FFFDF9] rounded-3xl border border-[#E8D5B5] p-6 space-y-4 shadow-sm">
                <h2 className="text-2xl font-bold text-[#382C27]">{t.transport.title}</h2>
                <p className="text-[#63534B]">{t.transport.subtitle}</p>
                <div className="p-3 rounded-xl bg-[#F3E7D2] border border-[#D4B483] text-[#382C27] text-xs font-semibold">
                  {t.transport.demoNotice}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    apiCall(
                      '/api/transport',
                      'POST',
                      {
                        purpose: ridePurpose,
                        pickup: ridePickup,
                        destination: rideDest,
                        date: rideDate,
                        time: rideTime,
                        vehicleType: rideVehicle,
                        accessibleRequired: rideVehicle === 'accessible_van',
                      },
                      'Transport booking submitted (DEMO).'
                    );
                  }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#63534B]">{t.transport.purposeLabel}</label>
                      <select
                        value={ridePurpose}
                        onChange={(e) =>
                          setRidePurpose(e.target.value as 'doctor' | 'hospital' | 'pharmacy' | 'shopping' | 'personal')
                        }
                        className="w-full mt-1 px-3.5 py-3 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-sm"
                      >
                        <option value="doctor">Doctor Appointment</option>
                        <option value="hospital">Hospital Visit</option>
                        <option value="pharmacy">Pharmacy Visit</option>
                        <option value="shopping">Shopping</option>
                        <option value="personal">Personal Activity</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#63534B]">{t.transport.vehicleLabel}</label>
                      <select
                        value={rideVehicle}
                        onChange={(e) =>
                          setRideVehicle(e.target.value as 'accessible_van' | 'car' | 'auto_rickshaw' | 'ambulance')
                        }
                        className="w-full mt-1 px-3.5 py-3 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-sm"
                      >
                        <option value="accessible_van">Wheelchair-Accessible Van (~₹220)</option>
                        <option value="car">Comfortable Sedan Car (~₹160)</option>
                        <option value="auto_rickshaw">Auto-Rickshaw (~₹110)</option>
                        <option value="ambulance">Medical Ambulance (~₹450)</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={ridePickup}
                      onChange={(e) => setRidePickup(e.target.value)}
                      placeholder={t.transport.pickupLabel}
                      className="px-3.5 py-3 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-sm"
                    />
                    <input
                      type="text"
                      value={rideDest}
                      onChange={(e) => setRideDest(e.target.value)}
                      placeholder={t.transport.destinationLabel}
                      className="px-3.5 py-3 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="date"
                      value={rideDate}
                      onChange={(e) => setRideDate(e.target.value)}
                      className="px-3.5 py-3 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-sm"
                    />
                    <input
                      type="time"
                      value={rideTime}
                      onChange={(e) => setRideTime(e.target.value)}
                      className="px-3.5 py-3 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3.5 rounded-2xl bg-[#C46A4A] hover:bg-[#AE583A] text-white font-bold shadow-sm"
                  >
                    {t.transport.bookRideBtn}
                  </button>
                </form>
              </div>

              <div className="bg-[#FFFDF9] rounded-3xl border border-[#E8D5B5] p-6 space-y-3 shadow-sm">
                <h3 className="text-xl font-bold text-[#382C27]">{t.transport.recentBookings}</h3>
                {state.transportBookings.map((trip) => (
                  <div
                    key={trip.id}
                    className="p-4 rounded-2xl bg-[#FAF3E8] border border-[#E8D5B5] flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-[#382C27]">
                        {trip.destination} ({trip.vehicleType.replace(/_/g, ' ')})
                      </div>
                      <div className="text-sm text-[#382C27] tabular-nums">
                        {trip.date} at {trip.time} · {t.transport.estFare}: ₹{trip.estimatedFareInr} ·{' '}
                        <span className="font-semibold text-[#355C48]">{trip.status}</span>
                      </div>
                      <div className="text-xs text-[#63534B]">
                        {t.transport.driverLabel}: {trip.driverName} · {trip.vehicleNumber}
                      </div>
                    </div>
                    {trip.status !== 'cancelled' && trip.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => apiCall(`/api/transport/${trip.id}`, 'PATCH', { status: 'cancelled' })}
                        className="px-3.5 py-2 rounded-xl border border-[#D9C098] bg-[#FFFDF9] hover:bg-[#F3E7D2] text-[#382C27] text-sm font-semibold"
                      >
                        {t.transport.cancelRide}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* COMPANIONSHIP & MEMORY TAB */}
          {tab === 'companionship' && (
            <div className="space-y-6">
              <div className="bg-[#FFFDF9] rounded-3xl border border-[#E8D5B5] p-6 space-y-4 shadow-sm">
                <h2 className="text-2xl font-bold text-[#382C27]">{t.companionship.title}</h2>
                <p className="text-[#63534B]">{t.companionship.subtitle}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-[#FAF3E8] to-[#F3E4CC] border border-[#E8D5B5] space-y-3">
                    <div className="font-bold text-[#382C27]">{t.companionship.musicSuggestions}</div>
                    <p className="text-sm text-[#63534B]">{t.companionship.playMusicHint}:</p>
                    <ul className="text-sm font-semibold text-[#382C27] space-y-1">
                      {profile.favouriteMusic.map((m) => (
                        <li key={m}>• {m}</li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={onOpenVideoCompanion}
                      className="px-4 py-2.5 rounded-xl bg-[#C46A4A] hover:bg-[#AE583A] text-white text-sm font-semibold inline-flex items-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4" />
                      {t.talkToCompanion}
                    </button>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#EFF3EC] border border-[#A8B89A] space-y-3">
                    <div className="font-bold text-[#382C27]">{t.companionship.ngoSupportTitle}</div>
                    <p className="text-sm text-[#382C27]">
                      Friendly verified volunteers speak Tamil, Hindi, and English for hospital escorts or social visits.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        apiCall(
                          '/api/ngo/requests',
                          'POST',
                          {
                            type: 'companionship',
                            description: `${profile.name} would welcome a friendly volunteer tea & storytelling visit this week.`,
                          },
                          'Friendly volunteer request sent to Meena (NGO Coordinator).'
                        )
                      }
                      className="px-4 py-2.5 rounded-xl bg-[#355C48] hover:bg-[#294838] text-white text-sm font-semibold inline-flex items-center gap-1.5"
                    >
                      <UserCheck className="w-4 h-4" />
                      {t.companionship.requestVolunteerBtn}
                    </button>
                  </div>
                </div>
              </div>

              {/* Personal Memory Profile */}
              <div className="bg-[#FFFDF9] rounded-3xl border border-[#E8D5B5] p-6 space-y-4 shadow-sm">
                <div>
                  <h3 className="text-xl font-bold text-[#382C27]">{t.companionship.memoryTitle}</h3>
                  <p className="text-sm text-[#63534B]">{t.companionship.memorySub}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {profile.memories.map((mem) => (
                    <div
                      key={mem.id}
                      className="p-4 rounded-2xl bg-[#FAF3E8] border border-[#E8D5B5] flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="text-xs font-semibold text-[#783F45] uppercase">
                          {mem.category} · {mem.preferenceType}
                        </div>
                        <div className="font-bold text-[#382C27]">{mem.label}</div>
                        <div className="text-sm text-[#382C27]">{mem.value}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => apiCall(`/api/memories/${mem.id}`, 'DELETE')}
                        className="p-2 rounded-lg text-[#63534B] hover:text-[#783F45] hover:bg-[#F7ECEE]"
                        aria-label={t.companionship.deleteBtn}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!memLabel.trim() || !memValue.trim()) return;
                    apiCall('/api/memories', 'POST', {
                      category: memCategory,
                      label: memLabel,
                      value: memValue,
                      preferenceType: memType,
                    });
                    setMemLabel('');
                    setMemValue('');
                  }}
                  className="p-4 rounded-2xl bg-[#FAF3E8] border border-[#E8D5B5] grid grid-cols-1 sm:grid-cols-4 gap-2.5"
                >
                  <select
                    value={memCategory}
                    onChange={(e) =>
                      setMemCategory(e.target.value as 'food' | 'music' | 'hobby' | 'family' | 'other')
                    }
                    className="px-3 py-2.5 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-sm"
                  >
                    <option value="food">Food</option>
                    <option value="music">Music</option>
                    <option value="hobby">Hobby</option>
                    <option value="family">Family</option>
                    <option value="other">Other</option>
                  </select>
                  <select
                    value={memType}
                    onChange={(e) => setMemType(e.target.value as 'like' | 'dislike' | 'fact')}
                    className="px-3 py-2.5 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-sm"
                  >
                    <option value="like">Like</option>
                    <option value="dislike">Dislike</option>
                    <option value="fact">Personal Note</option>
                  </select>
                  <input
                    type="text"
                    value={memLabel}
                    onChange={(e) => setMemLabel(e.target.value)}
                    placeholder="Title (e.g. Tea preference)"
                    className="px-3 py-2.5 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-sm"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={memValue}
                      onChange={(e) => setMemValue(e.target.value)}
                      placeholder="Detail"
                      className="flex-1 px-3 py-2.5 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-sm"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-[#C46A4A] hover:bg-[#AE583A] text-white text-sm font-semibold shrink-0"
                    >
                      {t.companionship.addMemoryBtn}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* OPPORTUNITIES TAB */}
          {tab === 'opportunities' && (
            <div className="bg-[#FFFDF9] rounded-3xl border border-[#E8D5B5] p-6 space-y-5 shadow-sm">
              <div>
                <h2 className="text-2xl font-bold text-[#382C27]">{t.opportunities.title}</h2>
                <p className="text-[#63534B]">{t.opportunities.subtitle}</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#EFF3EC] border border-[#A8B89A] text-[#382C27] text-sm font-semibold">
                {t.opportunities.scamWarning}
              </div>

              <div className="space-y-4">
                {state.opportunities.map((opp) => {
                  const applied = state.applications.some((a) => a.opportunityId === opp.id);
                  return (
                    <div
                      key={opp.id}
                      className="p-5 rounded-2xl bg-[#FAF3E8] border border-[#E8D5B5] space-y-2"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold text-[#783F45] uppercase">
                            {opp.category.replace('_', ' ')} · {opp.schedule}
                          </div>
                          <h3 className="text-lg font-bold text-[#382C27]">{opp.title}</h3>
                          <div className="text-sm text-[#63534B]">{opp.organization}</div>
                        </div>
                        <div className="text-base font-mono-num font-bold text-[#382C27]">
                          {opp.stipendInr}
                        </div>
                      </div>
                      <p className="text-sm text-[#382C27]">{opp.description}</p>
                      <div className="text-xs text-[#63534B]">{opp.safetyNote}</div>
                      <div className="pt-1">
                        {applied ? (
                          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#355C48]">
                            <CheckCircle2 className="w-4 h-4" />
                            {t.opportunities.appliedLabel}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              apiCall(
                                '/api/opportunities/apply',
                                'POST',
                                { opportunityId: opp.id },
                                `Application submitted for ${opp.title}.`
                              )
                            }
                            className="px-4 py-2.5 rounded-xl bg-[#C46A4A] hover:bg-[#AE583A] text-white text-sm font-semibold"
                          >
                            {t.opportunities.applyBtn}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* REMINDERS & SHOPPING TAB */}
          {tab === 'reminders' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#FFFDF9] rounded-3xl border border-[#E8D5B5] p-6 space-y-4 shadow-sm">
                <h2 className="text-xl font-bold text-[#382C27] flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#9E4B30]" />
                  {t.reminders.title}
                </h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!remTitle.trim()) return;
                    apiCall('/api/reminders', 'POST', { title: remTitle, time: remTime, category: 'task' });
                    setRemTitle('');
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={remTitle}
                    onChange={(e) => setRemTitle(e.target.value)}
                    placeholder="Reminder..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#D9C098] bg-[#FAF3E8] text-[#382C27] text-sm"
                  />
                  <input
                    type="time"
                    value={remTime}
                    onChange={(e) => setRemTime(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-[#D9C098] bg-[#FAF3E8] text-[#382C27] text-sm"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#C46A4A] hover:bg-[#AE583A] text-white text-sm font-semibold"
                  >
                    {t.reminders.addReminder}
                  </button>
                </form>

                <div className="space-y-2">
                  {state.reminders.map((rem) => (
                    <button
                      key={rem.id}
                      type="button"
                      onClick={() => apiCall(`/api/reminders/${rem.id}/toggle`, 'POST')}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-2 ${
                        rem.completed ? 'bg-[#EFF3EC] border-[#A8B89A]' : 'bg-[#FAF3E8] border-[#E8D5B5] hover:bg-[#F3E7D2]'
                      }`}
                    >
                      <div>
                        <div className={rem.completed ? 'line-through text-[#63534B]' : 'font-semibold text-[#382C27]'}>
                          {rem.title}
                        </div>
                        <div className="text-xs text-[#63534B] tabular-nums">
                          {rem.date} · {rem.time}
                        </div>
                      </div>
                      {rem.completed && <Check className="w-4 h-4 text-[#355C48]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#FFFDF9] rounded-3xl border border-[#E8D5B5] p-6 space-y-4 shadow-sm">
                <h2 className="text-xl font-bold text-[#382C27] flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#355C48]" />
                  {t.reminders.shoppingTitle}
                </h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!shopName.trim()) return;
                    apiCall('/api/shopping', 'POST', { name: shopName, quantity: shopQty });
                    setShopName('');
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="Item name..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#D9C098] bg-[#FAF3E8] text-[#382C27] text-sm"
                  />
                  <input
                    type="text"
                    value={shopQty}
                    onChange={(e) => setShopQty(e.target.value)}
                    placeholder="Qty"
                    className="w-20 px-3 py-2.5 rounded-xl border border-[#D9C098] bg-[#FAF3E8] text-[#382C27] text-sm"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#382C27] hover:bg-[#2A201C] text-[#FAF3E8] text-sm font-semibold"
                  >
                    {t.reminders.addItem}
                  </button>
                </form>

                <div className="space-y-2">
                  {state.shoppingList.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => apiCall(`/api/shopping/${item.id}/toggle`, 'POST')}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between ${
                        item.checked ? 'bg-[#EFF3EC] border-[#A8B89A]' : 'bg-[#FAF3E8] border-[#E8D5B5] hover:bg-[#F3E7D2]'
                      }`}
                    >
                      <span className={item.checked ? 'line-through text-[#63534B]' : 'font-semibold text-[#382C27]'}>
                        {item.name} ({item.quantity})
                      </span>
                      {item.checked && <Check className="w-4 h-4 text-[#355C48]" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* GLOBAL IMPACT TAB */}
          {tab === 'impact' && <GlobalImpactPage language={lang} />}

          {/* SETTINGS & PRIVACY TAB */}
          {tab === 'settings' && (
            <div className="bg-[#FFFDF9] rounded-3xl border border-[#E8D5B5] p-6 md:p-8 space-y-6 shadow-sm">
              <div>
                <h2 className="text-2xl font-bold text-[#382C27]">{t.settings.title}</h2>
                <p className="text-[#63534B]">{t.settings.subtitle}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Language & Text Size */}
                <div className="space-y-4">
                  <div>
                    <div className="font-bold text-[#382C27] mb-2">{t.settings.languageLabel}</div>
                    <div className="flex gap-2">
                      {(['en', 'ta', 'hi'] as LanguageCode[]).map((code) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => updateProfile({ language: code })}
                          className={`px-4 py-2.5 rounded-xl font-semibold border ${
                            lang === code
                              ? 'bg-[#783F45] text-[#FAF3E8] border-[#783F45]'
                              : 'bg-[#FAF3E8] text-[#382C27] border-[#E8D5B5] hover:bg-[#F3E7D2]'
                          }`}
                        >
                          {code === 'en' ? 'English' : code === 'ta' ? 'தமிழ்' : 'हिन्दी'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="font-bold text-[#382C27] mb-2">{t.settings.fontSizeLabel}</div>
                    <div className="flex gap-2">
                      {(['normal', 'large', 'xlarge'] as const).map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => updateProfile({ fontScale: sz })}
                          className={`px-4 py-2 rounded-xl font-semibold border capitalize ${
                            profile.fontScale === sz
                              ? 'bg-[#783F45] text-[#FAF3E8] border-[#783F45]'
                              : 'bg-[#FAF3E8] text-[#382C27] border-[#E8D5B5] hover:bg-[#F3E7D2]'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center gap-3 font-semibold text-[#382C27] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.highContrast}
                      onChange={(e) => updateProfile({ highContrast: e.target.checked })}
                      className="w-5 h-5 accent-[#355C48]"
                    />
                    {t.settings.highContrastLabel}
                  </label>
                </div>

                {/* Speed & Volume */}
                <div className="space-y-4">
                  <div>
                    <div className="font-bold text-[#382C27] mb-1">
                      {t.settings.speedLabel}: {profile.speechRate.toFixed(2)}x
                    </div>
                    <input
                      type="range"
                      min="0.7"
                      max="1.1"
                      step="0.05"
                      value={profile.speechRate}
                      onChange={(e) => updateProfile({ speechRate: parseFloat(e.target.value) })}
                      className="w-full accent-[#C46A4A]"
                    />
                  </div>
                  <div>
                    <div className="font-bold text-[#382C27] mb-1">
                      {t.settings.volumeLabel}: {Math.round(profile.volume * 100)}%
                    </div>
                    <input
                      type="range"
                      min="0.3"
                      max="1"
                      step="0.05"
                      value={profile.volume}
                      onChange={(e) => updateProfile({ volume: parseFloat(e.target.value) })}
                      className="w-full accent-[#C46A4A]"
                    />
                  </div>
                </div>
              </div>

              {/* 4 Selectable Voices */}
              <div>
                <div className="font-bold text-[#382C27] mb-3">{t.settings.voiceLabel}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {VOICE_PERSONAS.map((vp) => (
                    <div
                      key={vp.id}
                      className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-3 ${
                        profile.voicePersona === vp.id
                          ? 'border-[#783F45] bg-[#F7ECEE]'
                          : 'border-[#E8D5B5] bg-[#FAF3E8]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => updateProfile({ voicePersona: vp.id as VoicePersonaId })}
                        className="text-left flex-1"
                      >
                        <div className="font-bold text-[#382C27]">{vp.label[lang]}</div>
                        <div className="text-xs text-[#63534B]">{vp.description[lang]}</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => speakMessage(vp.sampleLine[lang])}
                        className="px-3 py-2 rounded-xl bg-[#FFFDF9] border border-[#D9C098] hover:bg-[#F3E7D2] text-xs font-semibold text-[#382C27] shrink-0 flex items-center gap-1"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-[#9E4B30]" />
                        {t.settings.listenSample}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy & Sharing Consent */}
              <div className="p-5 rounded-2xl bg-[#FAF3E8] border border-[#E8D5B5] space-y-3">
                <div className="font-bold text-[#382C27] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#355C48]" />
                  {t.settings.privacyTitle}
                </div>
                {(
                  [
                    ['shareHealthWithFamily', 'Share health trends & reports with Family (Priya)'],
                    ['shareAppointmentsWithFamily', 'Share doctor appointments with Family'],
                    ['shareNutritionWithFamily', 'Share daily meals & hydration with Family'],
                    ['shareWithNgoCoordinator', 'Share support summary with assigned NGO coordinator (Meena)'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-3 text-sm text-[#382C27] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.privacy[key]}
                      onChange={(e) =>
                        updateProfile({
                          privacy: { ...profile.privacy, [key]: e.target.checked },
                        })
                      }
                      className="w-4 h-4 accent-[#355C48]"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={onReopenOnboarding}
                  className="px-4 py-2.5 rounded-xl border border-[#D9C098] bg-[#FFFDF9] hover:bg-[#F3E7D2] text-[#382C27] font-semibold text-sm"
                >
                  {t.settings.reopenOnboardingBtn}
                </button>
                <a
                  href="/api/privacy/export"
                  onClick={async (e) => {
                    e.preventDefault();
                    try {
                      const res = await fetch('/api/privacy/export', {
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      if (!res.ok) return;
                      const blob = new Blob([await res.text()], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `seniora-${profile.name.toLowerCase()}-export.json`;
                      a.click();
                    } catch {
                      setStatusBanner('Unable to export data right now. Please try again.');
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#382C27] hover:bg-[#2A201C] text-[#FAF3E8] font-semibold text-sm"
                >
                  {t.settings.exportDataBtn}
                </a>
                <button
                  type="button"
                  onClick={() => apiCall('/api/demo/reset', 'POST', undefined, 'Demo dataset reset.')}
                  className="px-4 py-2.5 rounded-xl border border-[#783F45]/40 bg-[#F7ECEE] hover:bg-[#EFE0E3] text-[#783F45] font-semibold text-sm"
                >
                  {t.settings.resetDemoBtn}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
