import React, { useRef, useState } from 'react';
import {
  Activity,
  Bell,
  Car,
  CheckCircle2,
  ClipboardList,
  FileText,
  Globe2,
  Heart,
  Mic,
  Package,
  PhoneCall,
  Pill,
  ShieldAlert,
  ShieldCheck,
  Square,
  Stethoscope,
  Truck,
  Users,
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
import { safeApiFetch } from '../services/apiClient';
import type { DeliveryStage, Role, SharedPlatformState } from '../types';
import { GlobalImpactPage } from './GlobalImpactPage';

interface RoleDashboardsProps {
  role: Exclude<Role, 'elder'>;
  userName: string;
  token: string;
  state: SharedPlatformState;
  onRefreshState: (next: SharedPlatformState) => void;
  onOpenRoleLogin: () => void;
}

export const RoleDashboards: React.FC<RoleDashboardsProps> = ({
  role,
  userName,
  token,
  state,
  onRefreshState,
  onOpenRoleLogin,
}) => {
  const [banner, setBanner] = useState<string | null>(null);
  const [showImpact, setShowImpact] = useState(false);

  // Doctor forms
  const [rxMed, setRxMed] = useState('');
  const [rxDosage, setRxDosage] = useState('');
  const [rxFreq, setRxFreq] = useState('Once daily');
  const [rxFood, setRxFood] = useState<'after_food' | 'before_food' | 'anytime'>('after_food');
  const [rxTime, setRxTime] = useState('09:00');
  const [rxReason, setRxReason] = useState('');
  const [rxPlain, setRxPlain] = useState('');
  const [consultNotes, setConsultNotes] = useState<Record<string, string>>({});
  const [reportNotes, setReportNotes] = useState<Record<string, string>>({});

  // Family Voices of Love recorder
  const [volTitle, setVolTitle] = useState('');
  const [volTranscript, setVolTranscript] = useState('');
  const [volTime, setVolTime] = useState('08:30');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | undefined>(undefined);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Transport partner driver assignment
  const [driverInputs, setDriverInputs] = useState<Record<string, { driver: string; plate: string }>>({});

  // NGO assignment
  const [selectedVolunteers, setSelectedVolunteers] = useState<Record<string, string>>({});
  const [completionNotes, setCompletionNotes] = useState<Record<string, string>>({});

  const apiCall = async (url: string, method: string, body?: unknown, msg?: string) => {
    const result = await safeApiFetch<{ state?: SharedPlatformState; error?: string }>(url, {
      method,
      token,
      role,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (result.ok && result.data?.state) {
      onRefreshState(result.data.state);
      if (msg) {
        setBanner(msg);
        window.setTimeout(() => setBanner(null), 4000);
      }
    } else if (!result.ok && result.error) {
      setBanner(result.error);
      window.setTimeout(() => setBanner(null), 4500);
    }
  };

  const toggleVoiceRecording = async () => {
    if (isRecording && mediaRecRef.current) {
      mediaRecRef.current.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setRecordedAudioUrl(reader.result as string);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((tr) => tr.stop());
      };
      mediaRecRef.current = rec;
      rec.start();
      setIsRecording(true);
    } catch {
      setBanner('Microphone permission unavailable; you can still send a written voice greeting.');
    }
  };

  const roleNotifications = state.notifications.filter((n) => n.targetRoles.includes(role));
  const activeEmergencies = state.emergencyEvents.filter((e) => e.status === 'active');

  const roleTitleMap: Record<Exclude<Role, 'elder'>, string> = {
    doctor: 'Doctor Clinical Portal',
    family: 'Family Care & Connection Portal',
    pharmacy: 'Pharmacy Prescription Fulfillment Portal',
    delivery: 'Medicine Delivery Partner Portal',
    transport: 'Accessible Transport Partner Portal',
    ngo: 'NGO Care & Volunteer Coordination Portal',
    admin: 'Platform Administrator & Audit Portal',
  };

  return (
    <div className="min-h-screen bg-[#FAF3E8] text-[#382C27]">
      {/* Clean Top Bar */}
      <header className="sticky top-0 z-30 bg-[#FFFDF9]/95 backdrop-blur border-b border-[#E8D5B5] px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#355C48] text-[#FAF3E8] flex items-center justify-center font-bold shadow-sm">
              S
            </div>
            <div>
              <div className="font-bold text-[#382C27]">SENIORA · {roleTitleMap[role]}</div>
              <div className="text-xs text-[#63534B]">
                Signed in as {userName} · Patient: {state.profile.name} ({state.profile.age}y)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setShowImpact(!showImpact)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border flex items-center gap-1.5 transition-colors ${
                showImpact
                  ? 'bg-[#783F45] text-[#FAF3E8] border-[#783F45]'
                  : 'bg-[#FFFDF9] text-[#382C27] border-[#D9C098] hover:bg-[#F3E7D2]'
              }`}
            >
              <Globe2 className="w-4 h-4" />
              {showImpact ? 'Back to Role Workspace' : 'GLOBAL IMPACT'}
            </button>
            <button
              type="button"
              onClick={onOpenRoleLogin}
              className="px-4 py-2 rounded-xl bg-[#382C27] hover:bg-[#2A201C] text-[#FAF3E8] text-sm font-semibold"
            >
              Switch Role / Login
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {banner && (
          <div className="p-4 rounded-2xl bg-[#EFF3EC] border border-[#A8B89A] text-[#382C27] font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#355C48] shrink-0" />
            <span>{banner}</span>
          </div>
        )}

        {/* Active Emergency Banner for Doctor / Family / NGO / Admin */}
        {activeEmergencies.length > 0 &&
          ['doctor', 'family', 'ngo', 'admin'].includes(role) && (
            <div className="p-5 rounded-2xl bg-[#F7ECEE] border-2 border-[#783F45] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-[#783F45] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#783F45]">
                    Active SOS Alert: {activeEmergencies[0].patientName} (DEMO)
                  </div>
                  <div className="text-sm text-[#382C27]">
                    {activeEmergencies[0].notes} · {activeEmergencies[0].locationLabel}
                  </div>
                </div>
              </div>
              {['ngo', 'family', 'doctor'].includes(role) && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      apiCall(`/api/emergency/${activeEmergencies[0].id}`, 'PATCH', {
                        status: 'acknowledged',
                      })
                    }
                    className="px-4 py-2 rounded-xl bg-[#783F45] hover:bg-[#613136] text-[#FAF3E8] text-sm font-semibold"
                  >
                    Acknowledge Alert
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      apiCall(`/api/emergency/${activeEmergencies[0].id}`, 'PATCH', {
                        status: 'resolved',
                      })
                    }
                    className="px-4 py-2 rounded-xl bg-[#FFFDF9] border border-[#783F45]/40 hover:bg-[#FAF3E8] text-[#783F45] text-sm font-semibold"
                  >
                    Mark Resolved
                  </button>
                </div>
              )}
            </div>
          )}

        {showImpact ? (
          <GlobalImpactPage language="en" />
        ) : (
          <>
            {/* Notifications Strip */}
            {roleNotifications.length > 0 && (
              <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8D5B5] p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-sm">
                  <Bell className="w-4 h-4 text-[#9E4B30] shrink-0" />
                  <span className="font-semibold text-[#382C27]">{roleNotifications[0].title}:</span>
                  <span className="text-[#63534B]">{roleNotifications[0].message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => apiCall('/api/notifications/read-all', 'POST')}
                  className="text-xs font-semibold text-[#9E4B30] hover:underline"
                >
                  Mark all read
                </button>
              </div>
            )}

            {/* 1. DOCTOR DASHBOARD */}
            {role === 'doctor' && (
              <div className="space-y-6">
                {/* Patient Summary Card */}
                <div className="bg-gradient-to-br from-[#FFFDF9] to-[#FAF3E8] rounded-2xl border border-[#E8D5B5] p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center shadow-sm">
                  <div className="lg:col-span-5 flex items-center gap-4">
                    <img
                      src={state.profile.avatarUrl}
                      alt={state.profile.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#E8D5B5]"
                    />
                    <div>
                      <div className="text-xs font-semibold text-[#355C48]">AUTHORIZED PATIENT</div>
                      <h2 className="text-2xl font-bold text-[#382C27]">
                        {state.profile.name}, {state.profile.age}
                      </h2>
                      <div className="text-sm text-[#63534B]">
                        Conditions: {state.profile.conditions.join(' · ')}
                      </div>
                      <div className="text-xs text-[#783F45] font-semibold mt-0.5">
                        Allergies: {state.profile.allergies.join(', ')}
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-[#FAF3E8] border border-[#E8D5B5]">
                      <div className="text-xs text-[#63534B]">Heart Rate (DEMO)</div>
                      <div className="text-xl font-bold font-mono-num text-[#382C27]">{state.wearable.heartRate} bpm</div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#FAF3E8] border border-[#E8D5B5]">
                      <div className="text-xs text-[#63534B]">BP Cuff (DEMO)</div>
                      <div className="text-xl font-bold font-mono-num text-[#382C27]">
                        {state.wearable.bpSystolic}/{state.wearable.bpDiastolic}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#FAF3E8] border border-[#E8D5B5]">
                      <div className="text-xs text-[#63534B]">Sleep Avg</div>
                      <div className="text-xl font-bold font-mono-num text-[#382C27]">{state.wearable.sleepHours} hrs</div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#EFF3EC] border border-[#A8B89A]">
                      <div className="text-xs text-[#355C48] font-semibold">Meds Taken</div>
                      <div className="text-xl font-bold font-mono-num text-[#355C48]">
                        {state.medications.filter((m) => m.status === 'taken').length}/{state.medications.length}
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Summary + Vitals Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 bg-[#FFFDF9] rounded-2xl border border-[#E8D5B5] p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-[#382C27] mb-3 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-[#355C48]" />
                      7-Day Patient Vitals Trend ({state.wearable.isDemoData ? 'DEMO DATA' : 'Device'})
                    </h3>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={state.wearable.history7Days}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E8D5B5" />
                          <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#382C27' }} />
                          <YAxis tick={{ fontSize: 12, fill: '#382C27' }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="bpSystolic" stroke="#783F45" strokeWidth={2.2} name="Systolic BP" />
                          <Line type="monotone" dataKey="heartRate" stroke="#355C48" strokeWidth={2.5} name="Heart Rate" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="lg:col-span-5 bg-[#FFFDF9] rounded-2xl border border-[#E8D5B5] p-6 space-y-3 shadow-sm">
                    <h3 className="text-lg font-bold text-[#382C27] flex items-center gap-2">
                      <Stethoscope className="w-5 h-5 text-[#783F45]" />
                      AI Trend Summary (For Clinical Review)
                    </h3>
                    <p className="text-sm text-[#382C27] leading-relaxed">
                      • Blood pressure readings remain steady around 122–130 / 76–82 mmHg (DEMO).
                      <br />• Patient logged soft breakfast idli and {state.waterGlasses}/{state.waterGoal} glasses of water today.
                      <br />• Mild right knee stiffness reported; topical therapy awaits patient consent.
                    </p>
                    <div className="p-3 rounded-xl bg-[#EFF3EC] border border-[#A8B89A] text-xs text-[#382C27]">
                      Non-diagnostic clinical briefing. All medication changes require explicit doctor authorization and patient consent.
                    </div>
                  </div>
                </div>

                {/* Create Digital Prescription (Requires Elder Consent!) */}
                <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8D5B5] p-6 space-y-4 shadow-sm">
                  <h3 className="text-lg font-bold text-[#382C27] flex items-center gap-2">
                    <Pill className="w-5 h-5 text-[#9E4B30]" />
                    Issue Digital Prescription (Requires Elder Consent Before Pharmacy Order)
                  </h3>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!rxMed.trim() || !rxDosage.trim() || !rxReason.trim()) return;
                      apiCall(
                        '/api/prescriptions',
                        'POST',
                        {
                          medicineName: rxMed,
                          dosage: rxDosage,
                          frequency: rxFreq,
                          foodInstruction: rxFood,
                          scheduledTime: rxTime,
                          reason: rxReason,
                          plainExplanation: rxPlain,
                        },
                        `Prescription for ${rxMed} sent to ${state.profile.name} for confirmation.`
                      );
                      setRxMed('');
                      setRxDosage('');
                      setRxReason('');
                      setRxPlain('');
                    }}
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <input
                        type="text"
                        value={rxMed}
                        onChange={(e) => setRxMed(e.target.value)}
                        placeholder="Medicine Name (e.g. Paracetamol 500mg)"
                        className="px-3.5 py-2.5 rounded-xl border border-[#D9C098] bg-[#FAF3E8] text-[#382C27] text-sm"
                      />
                      <input
                        type="text"
                        value={rxDosage}
                        onChange={(e) => setRxDosage(e.target.value)}
                        placeholder="Dosage (e.g. 1 tablet)"
                        className="px-3.5 py-2.5 rounded-xl border border-[#D9C098] bg-[#FAF3E8] text-[#382C27] text-sm"
                      />
                      <input
                        type="text"
                        value={rxFreq}
                        onChange={(e) => setRxFreq(e.target.value)}
                        placeholder="Frequency"
                        className="px-3.5 py-2.5 rounded-xl border border-[#D9C098] bg-[#FAF3E8] text-[#382C27] text-sm"
                      />
                      <div className="flex gap-2">
                        <input
                          type="time"
                          value={rxTime}
                          onChange={(e) => setRxTime(e.target.value)}
                          className="px-3 py-2.5 rounded-xl border border-[#D9C098] bg-[#FAF3E8] text-[#382C27] text-sm"
                        />
                        <select
                          value={rxFood}
                          onChange={(e) => setRxFood(e.target.value as 'after_food' | 'before_food' | 'anytime')}
                          className="flex-1 px-3 py-2.5 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-sm"
                        >
                          <option value="after_food">After food</option>
                          <option value="before_food">Before food</option>
                          <option value="anytime">Anytime</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={rxReason}
                        onChange={(e) => setRxReason(e.target.value)}
                        placeholder="Clinical reason"
                        className="px-3.5 py-2.5 rounded-xl border border-[#D9C098] bg-[#FAF3E8] text-[#382C27] text-sm"
                      />
                      <input
                        type="text"
                        value={rxPlain}
                        onChange={(e) => setRxPlain(e.target.value)}
                        placeholder="Simple explanation for elder (optional)"
                        className="px-3.5 py-2.5 rounded-xl border border-[#D9C098] bg-[#FAF3E8] text-[#382C27] text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#C46A4A] hover:bg-[#AE583A] text-white text-sm font-semibold shadow-sm"
                    >
                      Send Prescription for Patient Consent
                    </button>
                  </form>

                  <div className="pt-3 border-t border-[#E8D5B5] space-y-2">
                    <div className="text-xs font-bold text-[#63534B]">PRESCRIPTION CONSENT STATUS</div>
                    {state.prescriptionUpdates.map((rx) => (
                      <div
                        key={rx.id}
                        className="p-3 rounded-xl bg-[#FAF3E8] border border-[#E8D5B5] flex flex-wrap items-center justify-between gap-2 text-sm"
                      >
                        <div>
                          <span className="font-bold text-[#382C27]">{rx.medicineName}</span> ({rx.dosage}) — {rx.reason}
                        </div>
                        <span className="font-semibold text-[#355C48] uppercase text-xs">
                          {rx.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Appointments & Medical Reports */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8D5B5] p-6 space-y-3 shadow-sm">
                    <h3 className="text-lg font-bold text-[#382C27]">Consultations &amp; Notes</h3>
                    {state.appointments.map((appt) => (
                      <div key={appt.id} className="p-4 rounded-xl bg-[#FAF3E8] border border-[#E8D5B5] space-y-2">
                        <div className="flex justify-between text-sm font-bold">
                          <span>{appt.patientName} · {appt.date} {appt.time}</span>
                          <span className="text-[#355C48] uppercase text-xs">{appt.status}</span>
                        </div>
                        <div className="text-xs text-[#63534B]">{appt.reason}</div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={consultNotes[appt.id] ?? appt.consultationNotes ?? ''}
                            onChange={(e) =>
                              setConsultNotes((prev) => ({ ...prev, [appt.id]: e.target.value }))
                            }
                            placeholder="Record consultation note..."
                            className="flex-1 px-3 py-1.5 rounded-lg border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-xs"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              apiCall(`/api/appointments/${appt.id}`, 'PATCH', {
                                status: 'completed',
                                consultationNotes: consultNotes[appt.id] || 'Reviewed vitals and care plan.',
                              })
                            }
                            className="px-3 py-1.5 rounded-lg bg-[#355C48] hover:bg-[#294838] text-white text-xs font-semibold"
                          >
                            Save &amp; Complete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8D5B5] p-6 space-y-3 shadow-sm">
                    <h3 className="text-lg font-bold text-[#382C27] flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#783F45]" />
                      Uploaded Reports Review
                    </h3>
                    {state.reports.map((rep) => (
                      <div key={rep.id} className="p-4 rounded-xl bg-[#FAF3E8] border border-[#E8D5B5] space-y-2">
                        <div className="font-bold text-sm text-[#382C27]">{rep.title}</div>
                        <p className="text-xs text-[#382C27]">{rep.summary}</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={reportNotes[rep.id] ?? rep.doctorNote ?? ''}
                            onChange={(e) =>
                              setReportNotes((prev) => ({ ...prev, [rep.id]: e.target.value }))
                            }
                            placeholder="Clinical review note..."
                            className="flex-1 px-3 py-1.5 rounded-lg border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-xs"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              apiCall(`/api/reports/${rep.id}/review`, 'PATCH', {
                                doctorNote: reportNotes[rep.id] || 'Reviewed.',
                              })
                            }
                            className="px-3 py-1.5 rounded-lg bg-[#355C48] hover:bg-[#294838] text-white text-xs font-semibold"
                          >
                            Mark Reviewed
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. FAMILY DASHBOARD */}
            {role === 'family' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8D5B5] p-5 shadow-sm">
                    <div className="text-xs font-semibold text-[#63534B]">WELLBEING SUMMARY</div>
                    <div className="text-xl font-bold text-[#382C27] mt-1">
                      {state.profile.name} · {state.wearable.heartRate} bpm (DEMO)
                    </div>
                    <div className="text-sm text-[#63534B] mt-1">
                      Water: {state.waterGlasses}/{state.waterGoal} glasses · Habits:{' '}
                      {state.habits.filter((h) => h.completedToday).length}/{state.habits.length}
                    </div>
                  </div>
                  <div className="bg-[#EFF3EC] rounded-2xl border border-[#A8B89A] p-5 shadow-sm">
                    <div className="text-xs font-semibold text-[#355C48]">MEDICATION ADHERENCE</div>
                    <div className="text-xl font-bold text-[#382C27] mt-1">
                      {state.medications.filter((m) => m.status === 'taken').length} / {state.medications.length} taken today
                    </div>
                    <div className="text-sm text-[#355C48] mt-1">
                      Consent-controlled updates active
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-[#FFFDF9] to-[#F3E7D2] rounded-2xl border border-[#E8D5B5] p-5 shadow-sm">
                    <div className="text-xs font-semibold text-[#63534B]">NEXT APPOINTMENT</div>
                    <div className="text-lg font-bold text-[#382C27] mt-1">
                      {state.profile.privacy.shareAppointmentsWithFamily
                        ? state.appointments[0]
                          ? `${state.appointments[0].doctorName} (${state.appointments[0].date})`
                          : 'None scheduled'
                        : 'Sharing paused by elder'}
                    </div>
                  </div>
                </div>

                {/* Voices of Love Recorder */}
                <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8D5B5] p-6 space-y-4 shadow-sm">
                  <h3 className="text-lg font-bold text-[#382C27] flex items-center gap-2">
                    <Heart className="w-5 h-5 text-[#783F45]" />
                    Voices of Love — Send a Voice Greeting to {state.profile.name}
                  </h3>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!volTitle.trim() || !volTranscript.trim()) return;
                      apiCall(
                        '/api/voices-of-love',
                        'POST',
                        {
                          fromName: 'Priya',
                          relationship: 'Daughter',
                          title: volTitle,
                          transcript: volTranscript,
                          audioDataUrl: recordedAudioUrl,
                          scheduledTime: volTime,
                        },
                        `Voice greeting sent to ${state.profile.name}'s dashboard.`
                      );
                      setVolTitle('');
                      setVolTranscript('');
                      setRecordedAudioUrl(undefined);
                    }}
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={volTitle}
                        onChange={(e) => setVolTitle(e.target.value)}
                        placeholder="Title (e.g., Evening Check-In)"
                        className="px-3.5 py-2.5 rounded-xl border border-[#D9C098] bg-[#FAF3E8] text-[#382C27] text-sm"
                      />
                      <input
                        type="time"
                        value={volTime}
                        onChange={(e) => setVolTime(e.target.value)}
                        className="px-3.5 py-2.5 rounded-xl border border-[#D9C098] bg-[#FAF3E8] text-[#382C27] text-sm"
                      />
                      <button
                        type="button"
                        onClick={toggleVoiceRecording}
                        className={`px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border transition-colors ${
                          isRecording
                            ? 'bg-[#783F45] text-[#FAF3E8] border-[#783F45]'
                            : 'bg-[#FAF3E8] hover:bg-[#F3E7D2] text-[#382C27] border-[#D9C098]'
                        }`}
                      >
                        {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[#C46A4A]" />}
                        {isRecording ? 'Stop Recording' : recordedAudioUrl ? 'Audio Recorded ✓' : 'Record Voice Clip'}
                      </button>
                    </div>
                    <textarea
                      value={volTranscript}
                      onChange={(e) => setVolTranscript(e.target.value)}
                      placeholder="Write the greeting message (played aloud or displayed alongside audio)..."
                      rows={2}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9C098] bg-[#FAF3E8] text-[#382C27] text-sm"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#C46A4A] hover:bg-[#AE583A] text-white text-sm font-semibold shadow-sm"
                    >
                      Send Voices of Love Message
                    </button>
                  </form>
                </div>

                {/* Transport & Notification Preferences */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8D5B5] p-6 space-y-3 shadow-sm">
                    <h3 className="text-lg font-bold text-[#382C27]">Transport &amp; Medicine Status</h3>
                    {state.transportBookings.slice(0, 3).map((tr) => (
                      <div key={tr.id} className="p-3 rounded-xl bg-[#FAF3E8] border border-[#E8D5B5] text-sm">
                        <div className="font-bold text-[#382C27]">{tr.destination}</div>
                        <div className="text-xs text-[#63534B]">
                          {tr.date} {tr.time} · Status: {tr.status} (DEMO)
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8D5B5] p-6 space-y-3 shadow-sm">
                    <h3 className="text-lg font-bold text-[#382C27]">Family Notification Preferences</h3>
                    {(
                      [
                        ['missedMedication', 'Notify on missed critical medication'],
                        ['emergencyAlerts', 'Immediate emergency SOS notifications'],
                        ['appointmentReminders', 'Upcoming doctor appointment updates'],
                        ['ngoVisitUpdates', 'NGO volunteer visit completion updates'],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2.5 text-sm cursor-pointer text-[#382C27]">
                        <input
                          type="checkbox"
                          checked={state.familyNotificationPrefs[key]}
                          onChange={(e) =>
                            apiCall('/api/family/preferences', 'PATCH', {
                              [key]: e.target.checked,
                            })
                          }
                          className="w-4 h-4 accent-[#355C48]"
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. PHARMACY DASHBOARD */}
            {role === 'pharmacy' && (
              <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8D5B5] shadow-sm p-6 space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-[#382C27] flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#355C48]" />
                    Consented Prescription Fulfillment Queue (DEMO)
                  </h2>
                  <p className="text-sm text-[#63534B]">
                    Only prescriptions explicitly confirmed by the elderly patient appear here.
                  </p>
                </div>

                <div className="space-y-4">
                  {state.pharmacyOrders.map((ord) => (
                    <div key={ord.id} className="p-5 rounded-2xl bg-[#FAF3E8] border border-[#E8D5B5] space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-[#382C27]">{ord.itemsSummary}</div>
                          <div className="text-sm text-[#63534B]">
                            Patient: {ord.patientName} · Est. ₹{ord.estimatedAmountInr} · Current Stage:{' '}
                            <span className="font-bold text-[#355C48] uppercase">
                              {ord.stage.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(
                          [
                            ['awaiting_confirmation', 'Confirm Availability'],
                            ['pharmacy_preparing', 'Mark Preparing Medicines'],
                            ['delivery_assigned', 'Assign Delivery Partner (Karthik R.)'],
                          ] as Array<[DeliveryStage, string]>
                        ).map(([stage, label]) => {
                          const isCurrent = ord.stage === stage;
                          return (
                            <button
                              key={stage}
                              type="button"
                              onClick={() =>
                                apiCall(
                                  `/api/pharmacy-orders/${ord.id}`,
                                  'PATCH',
                                  {
                                    stage,
                                    availabilityConfirmed: true,
                                    deliveryPartnerName: stage === 'delivery_assigned' ? 'Karthik R.' : ord.deliveryPartnerName,
                                  },
                                  `Order updated to ${stage.replace(/_/g, ' ')}.`
                                )
                              }
                              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                                isCurrent
                                  ? 'bg-[#783F45] text-[#FAF3E8] border border-[#783F45]'
                                  : stage === 'awaiting_confirmation'
                                    ? 'bg-[#355C48] hover:bg-[#294838] text-white'
                                    : 'bg-[#FFFDF9] border border-[#D9C098] hover:border-[#355C48] text-[#382C27]'
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. DELIVERY PARTNER DASHBOARD */}
            {role === 'delivery' && (
              <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8D5B5] shadow-sm p-6 space-y-5">
                <h2 className="text-xl font-bold text-[#382C27] flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#355C48]" />
                  Assigned Medicine Deliveries (DEMO)
                </h2>
                <div className="space-y-4">
                  {state.pharmacyOrders.map((ord) => (
                    <div key={ord.id} className="p-5 rounded-2xl bg-[#FAF3E8] border border-[#E8D5B5] space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-[#382C27]">{ord.itemsSummary}</div>
                          <div className="text-sm text-[#382C27]">
                            Recipient: {ord.patientName} · Address: {ord.deliveryAddress}
                          </div>
                          <div className="text-xs text-[#63534B] mt-0.5">
                            Notes: {ord.notes} · Stage:{' '}
                            <span className="font-bold text-[#355C48] uppercase">{ord.stage.replace(/_/g, ' ')}</span>
                          </div>
                        </div>
                        <a
                          href={`tel:${ord.deliveryPhone.replace(/[^+\d]/g, '')}`}
                          className="px-3.5 py-2 rounded-xl bg-[#382C27] hover:bg-[#2A201C] text-[#FAF3E8] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          Contact Recipient
                        </a>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            apiCall(`/api/pharmacy-orders/${ord.id}`, 'PATCH', {
                              stage: 'out_for_delivery',
                            })
                          }
                          className="px-4 py-2 rounded-xl bg-[#E8D5B5] hover:bg-[#DEC69E] border border-[#D4B483] text-[#382C27] text-xs font-semibold transition-colors"
                        >
                          Mark Out for Delivery
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            apiCall(`/api/pharmacy-orders/${ord.id}`, 'PATCH', {
                              stage: 'delivered',
                            })
                          }
                          className="px-4 py-2 rounded-xl bg-[#355C48] hover:bg-[#294838] text-white text-xs font-semibold transition-colors"
                        >
                          Confirm Delivered
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. TRANSPORT PARTNER DASHBOARD */}
            {role === 'transport' && (
              <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8D5B5] shadow-sm p-6 space-y-5">
                <h2 className="text-xl font-bold text-[#382C27] flex items-center gap-2">
                  <Car className="w-5 h-5 text-[#C46A4A]" />
                  Accessible Ride Assignments &amp; Dispatch (DEMO)
                </h2>
                <div className="space-y-4">
                  {state.transportBookings.map((trip) => {
                    const inp = driverInputs[trip.id] || {
                      driver: trip.driverName,
                      plate: trip.vehicleNumber,
                    };
                    return (
                      <div key={trip.id} className="p-5 rounded-2xl bg-[#FAF3E8] border border-[#E8D5B5] space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="font-bold text-[#382C27]">
                              {trip.patientName}: {trip.pickup} → {trip.destination}
                            </div>
                            <div className="text-sm text-[#63534B] tabular-nums">
                              {trip.date} at {trip.time} · {trip.vehicleType.replace(/_/g, ' ')} · Fare ₹
                              {trip.estimatedFareInr} ·{' '}
                              <span className="font-bold text-[#355C48] uppercase">{trip.status}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={inp.driver}
                            onChange={(e) =>
                              setDriverInputs((prev) => ({
                                ...prev,
                                [trip.id]: { ...inp, driver: e.target.value },
                              }))
                            }
                            placeholder="Driver Name"
                            className="px-3 py-2 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-xs"
                          />
                          <input
                            type="text"
                            value={inp.plate}
                            onChange={(e) =>
                              setDriverInputs((prev) => ({
                                ...prev,
                                [trip.id]: { ...inp, plate: e.target.value },
                              }))
                            }
                            placeholder="Vehicle Number"
                            className="px-3 py-2 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-xs"
                          />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {(['confirmed', 'en_route', 'completed'] as const).map((st) => {
                            const isCurrent = trip.status === st;
                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() =>
                                  apiCall(`/api/transport/${trip.id}`, 'PATCH', {
                                    status: st,
                                    driverName: inp.driver,
                                    vehicleNumber: inp.plate,
                                  })
                                }
                                className={`px-3.5 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${
                                  isCurrent
                                    ? 'bg-[#783F45] text-[#FAF3E8]'
                                    : st === 'completed'
                                      ? 'bg-[#355C48] hover:bg-[#294838] text-white'
                                      : 'bg-[#C46A4A] hover:bg-[#AE583A] text-white'
                                }`}
                              >
                                Mark {st.replace('_', ' ')}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 6. NGO CARE COORDINATOR DASHBOARD */}
            {role === 'ngo' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8D5B5] shadow-sm p-5">
                    <div className="text-xs font-semibold text-[#63534B]">ELDERLY CARE REGISTRY</div>
                    <div className="text-xl font-bold text-[#382C27] mt-1">{state.profile.name}, {state.profile.age}</div>
                    <div className="text-sm text-[#63534B]">{state.profile.city}</div>
                  </div>
                  <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8D5B5] shadow-sm p-5">
                    <div className="text-xs font-semibold text-[#63534B]">ACTIVE VOLUNTEERS</div>
                    <div className="text-xl font-bold text-[#382C27] mt-1 font-mono-num">{state.volunteers.length}</div>
                    <div className="text-sm text-[#63534B]">Tamil, Hindi &amp; English coverage</div>
                  </div>
                  <div className="bg-[#EFF3EC] rounded-2xl border border-[#A8B89A] shadow-sm p-5">
                    <div className="text-xs font-semibold text-[#355C48]">COMPLETED VISITS (DEMO)</div>
                    <div className="text-xl font-bold text-[#382C27] mt-1 font-mono-num">
                      {state.ngoRequests.filter((r) => r.status === 'completed').length}
                    </div>
                  </div>
                </div>

                {/* Assistance Requests & Volunteer Assignment */}
                <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8D5B5] shadow-sm p-6 space-y-4">
                  <h3 className="text-lg font-bold text-[#382C27] flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#355C48]" />
                    Assistance Coordination &amp; Volunteer Visits
                  </h3>
                  {state.ngoRequests.map((req) => (
                    <div key={req.id} className="p-4 rounded-2xl bg-[#FAF3E8] border border-[#E8D5B5] space-y-3">
                      <div className="flex flex-wrap justify-between gap-2">
                        <div>
                          <div className="font-bold text-[#382C27]">
                            {req.patientName} — {req.type.replace(/_/g, ' ')} ({req.area})
                          </div>
                          <div className="text-sm text-[#382C27]">{req.description}</div>
                          <div className="text-xs text-[#63534B] mt-1">
                            Preferred Date: {req.preferredDate} · Status:{' '}
                            <span className="font-bold text-[#355C48] uppercase">{req.status}</span>
                            {req.assignedVolunteerName ? ` · Volunteer: ${req.assignedVolunteerName}` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={selectedVolunteers[req.id] || state.volunteers[0]?.id}
                          onChange={(e) =>
                            setSelectedVolunteers((prev) => ({ ...prev, [req.id]: e.target.value }))
                          }
                          className="px-3 py-2 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-xs"
                        >
                          {state.volunteers.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name} ({v.languages.join('/')})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            apiCall(
                              `/api/ngo/requests/${req.id}`,
                              'PATCH',
                              {
                                status: 'assigned',
                                assignedVolunteerId:
                                  selectedVolunteers[req.id] || state.volunteers[0]?.id,
                              },
                              'Volunteer assigned.'
                            )
                          }
                          className="px-3.5 py-2 rounded-xl bg-[#382C27] hover:bg-[#2A201C] text-[#FAF3E8] text-xs font-semibold transition-colors"
                        >
                          Assign Volunteer
                        </button>
                        <input
                          type="text"
                          value={completionNotes[req.id] ?? req.completionReport ?? ''}
                          onChange={(e) =>
                            setCompletionNotes((prev) => ({ ...prev, [req.id]: e.target.value }))
                          }
                          placeholder="Visit completion report..."
                          className="flex-1 min-w-[200px] px-3 py-2 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-xs"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            apiCall(
                              `/api/ngo/requests/${req.id}`,
                              'PATCH',
                              {
                                status: 'completed',
                                completionReport:
                                  completionNotes[req.id] || 'Completed friendly support visit safely.',
                              },
                              'Visit completion recorded.'
                            )
                          }
                          className="px-3.5 py-2 rounded-xl bg-[#355C48] hover:bg-[#294838] text-white text-xs font-semibold transition-colors"
                        >
                          Record Visit Completed
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. ADMINISTRATOR DASHBOARD */}
            {role === 'admin' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8D5B5] shadow-sm p-5">
                    <div className="text-xs text-[#63534B]">VERIFIED ROLES (DEMO)</div>
                    <div className="text-2xl font-bold text-[#382C27] font-mono-num mt-1">8 Active Roles</div>
                  </div>
                  <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8D5B5] shadow-sm p-5">
                    <div className="text-xs text-[#63534B]">AUDIT TRAIL ENTRIES</div>
                    <div className="text-2xl font-bold text-[#382C27] font-mono-num mt-1">{state.auditLogs.length}</div>
                  </div>
                  <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8D5B5] shadow-sm p-5">
                    <div className="text-xs text-[#63534B]">ACTIVE ORDERS / TRIPS</div>
                    <div className="text-2xl font-bold text-[#382C27] font-mono-num mt-1">
                      {state.pharmacyOrders.length + state.transportBookings.length}
                    </div>
                  </div>
                  <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8D5B5] shadow-sm p-5 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-[#63534B]">DEMO SANDBOX</div>
                      <div className="text-sm font-bold text-[#382C27]">Reset Seed State</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => apiCall('/api/demo/reset', 'POST', undefined, 'Demo dataset reset.')}
                      className="px-3 py-2 rounded-xl bg-[#783F45] hover:bg-[#613136] text-[#FAF3E8] text-xs font-semibold transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Security & Multi-Agent Audit Log */}
                <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8D5B5] shadow-sm p-6 space-y-4">
                  <h3 className="text-lg font-bold text-[#382C27] flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-[#355C48]" />
                    Security, Consent &amp; Multi-Agent Audit Log
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#E8D5B5] text-[#63534B]">
                          <th className="py-2.5 pr-3">Timestamp</th>
                          <th className="py-2.5 pr-3">Actor &amp; Role</th>
                          <th className="py-2.5 pr-3">Action</th>
                          <th className="py-2.5 pr-3">Resource</th>
                          <th className="py-2.5">Approval</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8D5B5]">
                        {state.auditLogs.slice(0, 25).map((log) => (
                          <tr key={log.id}>
                            <td className="py-2.5 pr-3 font-mono-num text-[#63534B] whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="py-2.5 pr-3 font-semibold text-[#382C27] whitespace-nowrap">
                              {log.actorName} ({log.actorRole})
                            </td>
                            <td className="py-2.5 pr-3 text-[#382C27]">{log.action}</td>
                            <td className="py-2.5 pr-3 font-mono-num text-[#63534B]">{log.targetResource}</td>
                            <td className="py-2.5 font-semibold uppercase text-[#355C48]">{log.approvalStatus}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-[#EFF3EC] rounded-2xl border border-[#A8B89A] p-6 flex items-center gap-3 text-sm text-[#382C27]">
                  <ShieldCheck className="w-5 h-5 text-[#355C48] shrink-0" />
                  <span>
                    Privacy enforcement active: Pharmacy, Delivery, Transport, Family, and NGO portals receive only role-scoped and consent-approved data.
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
