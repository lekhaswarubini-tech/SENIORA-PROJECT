import { useCallback, useEffect, useState } from 'react';
import { ElderlyDashboard } from './components/ElderlyDashboard';
import { EmergencyModal } from './components/EmergencyModal';
import { LiveVideoCompanionModal } from './components/LiveVideoCompanionModal';
import { OnboardingFlow } from './components/OnboardingFlow';
import { RoleDashboards } from './components/RoleDashboards';
import { RoleLoginModal } from './components/RoleLoginModal';
import { safeApiFetch } from './services/apiClient';
import { safeJsonParse } from './services/safeJson';
import type {
  AgentProposal,
  ElderProfile,
  Role,
  SharedPlatformState,
} from './types';

export default function App() {
  const [token, setToken] = useState<string>('');
  const [currentRole, setCurrentRole] = useState<Role>('elder');
  const [currentUserName, setCurrentUserName] = useState<string>('Lakshmi');
  const [state, setState] = useState<SharedPlatformState | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(true);
  const [videoOpen, setVideoOpen] = useState<boolean>(false);
  const [emergencyOpen, setEmergencyOpen] = useState<boolean>(false);
  const [roleLoginOpen, setRoleLoginOpen] = useState<boolean>(false);
  const [bootError, setBootError] = useState<string | null>(null);

  const handleTokenRefreshed = useCallback(
    (nextToken: string, nextState?: SharedPlatformState) => {
      setToken(nextToken);
      if (nextState) setState(nextState);
    },
    []
  );

  const refreshState = useCallback(async (authToken: string) => {
    if (!authToken) return;
    const res = await safeApiFetch<{ state?: SharedPlatformState }>('/api/state', {
      token: authToken,
      role: currentRole,
      onTokenRefreshed: handleTokenRefreshed,
    });
    if (res.ok && res.data?.state) {
      setState(res.data.state);
    }
  }, [currentRole, handleTokenRefreshed]);

  useEffect(() => {
    safeApiFetch<{
      token: string;
      user: { role: Role; name: string };
      state: SharedPlatformState;
      error?: string;
    }>('/api/auth/elder-session', { method: 'POST' }).then((res) => {
      if (!res.ok || !res.data) {
        setBootError(res.error || 'Unable to start SENIORA');
        return;
      }
      setToken(res.data.token);
      setCurrentRole(res.data.user.role);
      setCurrentUserName(res.data.user.name);
      setState(res.data.state);
      setShowOnboarding(!res.data.state.profile.onboardingCompleted);
    });
  }, []);

  // Real-time WebSocket synchronization across roles with auto-reconnect
  useEffect(() => {
    if (!token) return;
    let active = true;
    let ws: WebSocket | null = null;
    let retryTimer: number | null = null;

    const connect = () => {
      if (!active) return;
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${proto}//${window.location.host}/ws`);
      ws.onmessage = (event) => {
        const parsed = safeJsonParse<{ event?: string }>(event.data, {});
        if (parsed.ok && parsed.value.event && parsed.value.event !== 'connected') {
          refreshState(token);
        }
      };
      ws.onclose = () => {
        if (active) {
          retryTimer = window.setTimeout(connect, 2500);
        }
      };
      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();
    return () => {
      active = false;
      if (retryTimer) window.clearTimeout(retryTimer);
      ws?.close();
    };
  }, [token, refreshState]);

  const handleCompleteOnboarding = async (
    updates: Partial<ElderProfile>,
    emergencyContact?: { name: string; relationship: string; phone: string }
  ) => {
    if (!token) return;
    const res = await safeApiFetch<{ state?: SharedPlatformState }>('/api/profile', {
      method: 'PATCH',
      token,
      role: 'elder',
      onTokenRefreshed: handleTokenRefreshed,
      body: JSON.stringify(updates),
    });
    if (res.ok && res.data?.state) {
      setState(res.data.state);
      setCurrentUserName(res.data.state.profile.name);
    }

    if (emergencyContact) {
      const ecRes = await safeApiFetch<{ state?: SharedPlatformState }>('/api/emergency/contacts', {
        method: 'POST',
        token,
        role: 'elder',
        onTokenRefreshed: handleTokenRefreshed,
        body: JSON.stringify(emergencyContact),
      });
      if (ecRes.ok && ecRes.data?.state) {
        setState(ecRes.data.state);
      }
    }
    setShowOnboarding(false);
  };

  const handleExecuteProposal = async (proposal: AgentProposal): Promise<string> => {
    if (!token || !state) return 'Session unavailable.';
    const p = proposal.payload;

    if (proposal.actionType === 'book_appointment') {
      const res = await safeApiFetch<{ state?: SharedPlatformState }>('/api/appointments', {
        method: 'POST',
        token,
        role: 'elder',
        onTokenRefreshed: handleTokenRefreshed,
        body: JSON.stringify({
          doctorName: p.doctorName,
          specialty: p.specialty,
          hospital: p.hospital,
          date: p.date || new Date(Date.now() + 86400000).toISOString().slice(0, 10),
          time: p.time || '10:30',
          mode: p.mode === 'teleconsult' ? 'teleconsult' : 'in_person',
          reason: p.reason || 'Consultation',
        }),
      });
      if (res.ok && res.data?.state) {
        setState(res.data.state);
        return `Confirmed! Your DEMO appointment with ${String(p.doctorName)} is scheduled for ${String(p.date)} at ${String(p.time)}, and your family & care team have been notified.`;
      }
    } else if (proposal.actionType === 'book_transport') {
      const res = await safeApiFetch<{ state?: SharedPlatformState }>('/api/transport', {
        method: 'POST',
        token,
        role: 'elder',
        onTokenRefreshed: handleTokenRefreshed,
        body: JSON.stringify({
          purpose: p.purpose || 'doctor',
          destination: p.destination || state.profile.preferredHospital,
          date: p.date || new Date(Date.now() + 86400000).toISOString().slice(0, 10),
          time: p.time || '09:30',
          vehicleType: p.vehicleType || 'accessible_van',
          accessibleRequired: true,
        }),
      });
      if (res.ok && res.data?.state) {
        setState(res.data.state);
        return `Your accessible ride request to ${String(p.destination)} is saved (DEMO) and shared with CityCare Mobility and your family.`;
      }
    } else if (proposal.actionType === 'mark_medicine_taken') {
      const med = state.medications.find((m) =>
        m.name.toLowerCase().includes(String(p.medicationName || '').toLowerCase())
      ) || state.medications[0];
      if (med) {
        const res = await safeApiFetch<{ state?: SharedPlatformState }>(`/api/medications/${med.id}/status`, {
          method: 'POST',
          token,
          role: 'elder',
          onTokenRefreshed: handleTokenRefreshed,
          body: JSON.stringify({ status: 'taken' }),
        });
        if (res.ok && res.data?.state) {
          setState(res.data.state);
          return `Wonderful! I have recorded ${med.name} as taken today.`;
        }
      }
    } else if (proposal.actionType === 'log_water') {
      const res = await safeApiFetch<{ state?: SharedPlatformState }>('/api/nutrition/water', {
        method: 'POST',
        token,
        role: 'elder',
        onTokenRefreshed: handleTokenRefreshed,
        body: JSON.stringify({ delta: Number(p.glasses) || 1 }),
      });
      if (res.ok && res.data?.state) {
        setState(res.data.state);
        return `Great job staying hydrated! Your water tracker is updated.`;
      }
    } else if (proposal.actionType === 'add_reminder') {
      const res = await safeApiFetch<{ state?: SharedPlatformState }>('/api/reminders', {
        method: 'POST',
        token,
        role: 'elder',
        onTokenRefreshed: handleTokenRefreshed,
        body: JSON.stringify({
          title: String(p.title || 'Reminder'),
          date: String(p.date || new Date().toISOString().slice(0, 10)),
          time: String(p.time || '10:00'),
          category: p.category || 'task',
        }),
      });
      if (res.ok && res.data?.state) {
        setState(res.data.state);
        return `Saved your reminder: ${String(p.title)}.`;
      }
    } else if (proposal.actionType === 'save_memory') {
      const res = await safeApiFetch<{ state?: SharedPlatformState }>('/api/memories', {
        method: 'POST',
        token,
        role: 'elder',
        onTokenRefreshed: handleTokenRefreshed,
        body: JSON.stringify({
          category: p.category || 'other',
          label: p.label || 'Preference',
          value: p.value || '',
          preferenceType: p.preferenceType || 'like',
        }),
      });
      if (res.ok && res.data?.state) {
        setState(res.data.state);
        return `I have saved that to your personal memory profile.`;
      }
    } else if (proposal.actionType === 'trigger_emergency_review') {
      setVideoOpen(false);
      setEmergencyOpen(true);
      return 'Opening Emergency Assistance right away.';
    }

    return 'Action could not be completed right now. Please try again.';
  };

  if (bootError) {
    return (
      <div className="min-h-screen bg-[#FAF3E8] flex items-center justify-center p-6">
        <div className="bg-[#FFFDF9] rounded-3xl border border-[#E8D5B5] p-8 max-w-md text-center space-y-3 shadow-sm">
          <h1 className="text-xl font-bold text-[#382C27]">Unable to connect to SENIORA</h1>
          <p className="text-sm text-[#63534B]">{bootError}</p>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="min-h-screen bg-[#FAF3E8] flex items-center justify-center p-6">
        <div className="text-lg font-semibold text-[#382C27]">Preparing SENIORA...</div>
      </div>
    );
  }

  return (
    <>
      {currentRole === 'elder' && showOnboarding ? (
        <OnboardingFlow
          token={token}
          initialProfile={state.profile}
          onComplete={handleCompleteOnboarding}
          onOpenRoleLogin={() => setRoleLoginOpen(true)}
        />
      ) : currentRole === 'elder' ? (
        <ElderlyDashboard
          token={token}
          state={state}
          onRefreshState={(next) => setState(next)}
          onTokenRefreshed={handleTokenRefreshed}
          onOpenVideoCompanion={() => setVideoOpen(true)}
          onOpenEmergency={() => setEmergencyOpen(true)}
          onOpenRoleLogin={() => setRoleLoginOpen(true)}
          onReopenOnboarding={() => setShowOnboarding(true)}
        />
      ) : (
        <RoleDashboards
          role={currentRole}
          userName={currentUserName}
          token={token}
          state={state}
          onRefreshState={(next) => setState(next)}
          onOpenRoleLogin={() => setRoleLoginOpen(true)}
        />
      )}

      {/* Human Live Video Companion Modal (opens on mic click) */}
      <LiveVideoCompanionModal
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        token={token}
        profile={state.profile}
        onTokenRefreshed={handleTokenRefreshed}
        onUpdateVoiceSettings={async (updates) => {
          const res = await safeApiFetch<{ state?: SharedPlatformState }>('/api/profile', {
            method: 'PATCH',
            token,
            role: 'elder',
            onTokenRefreshed: handleTokenRefreshed,
            body: JSON.stringify(updates),
          });
          if (res.ok && res.data?.state) {
            setState(res.data.state);
          }
        }}
        onExecuteProposal={handleExecuteProposal}
        onOpenEmergency={() => {
          setVideoOpen(false);
          setEmergencyOpen(true);
        }}
      />

      {/* Emergency SOS Modal */}
      <EmergencyModal
        open={emergencyOpen}
        onClose={() => setEmergencyOpen(false)}
        language={state.profile.language}
        contacts={state.emergencyContacts}
        events={state.emergencyEvents}
        address={state.profile.address}
        onTriggerSos={async (locationSharedConsent, notes) => {
          const res = await safeApiFetch<{ state?: SharedPlatformState }>('/api/emergency/trigger', {
            method: 'POST',
            token,
            role: currentRole,
            onTokenRefreshed: handleTokenRefreshed,
            body: JSON.stringify({ trigger: 'manual_sos', locationSharedConsent, notes }),
          });
          if (res.ok && res.data?.state) {
            setState(res.data.state);
          }
        }}
        onAddContact={async (name, relationship, phone) => {
          const res = await safeApiFetch<{ state?: SharedPlatformState }>('/api/emergency/contacts', {
            method: 'POST',
            token,
            role: currentRole,
            onTokenRefreshed: handleTokenRefreshed,
            body: JSON.stringify({ name, relationship, phone }),
          });
          if (res.ok && res.data?.state) {
            setState(res.data.state);
          }
        }}
      />

      {/* Role-Based Login & Demo Account Switcher */}
      <RoleLoginModal
        open={roleLoginOpen}
        onClose={() => setRoleLoginOpen(false)}
        currentRole={currentRole}
        onAuthenticated={(payload) => {
          setToken(payload.token);
          setCurrentRole(payload.user.role);
          setCurrentUserName(payload.user.name);
          setState(payload.state);
          if (payload.user.role === 'elder') {
            setShowOnboarding(false);
          }
        }}
      />
    </>
  );
}
