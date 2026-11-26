import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { WebSocket, WebSocketServer } from 'ws';
import { createServer as createViteServer } from 'vite';
import {
  orchestrateElderConversation,
  synthesizeGeminiSpeech,
  transcribeGeminiAudio,
} from './server/agents';
import {
  GOVERNMENT_INITIATIVES,
  IMPACT_PROJECTIONS,
  OFFICIAL_STATISTICS,
} from './server/officialStats';
import {
  SessionPayload,
  signSessionToken,
  store,
  verifySessionToken,
} from './server/store';
import { TAMIL_DIALECT_MAP } from './src/i18n/tamilDialects';
import type {
  DeliveryStage,
  ElderProfile,
  EmergencyContact,
  EmergencyDeliveryChannelResult,
  LanguageCode,
  Role,
  TamilDialectId,
  VoicePersonaId,
} from './src/types';

interface AuthedRequest extends Request {
  session?: SessionPayload;
}

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Invalid JSON request payload.' });
    return;
  }
  next(err);
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

function broadcastEvent(event: string, data?: unknown): void {
  const payload = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ event: 'connected', timestamp: new Date().toISOString() }));
});

function extractToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return undefined;
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  const session = verifySessionToken(token);
  if (!session) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  req.session = session;
  next();
}

function requireRole(allowedRoles: Role[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (!req.session) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!allowedRoles.includes(req.session.role) && req.session.role !== 'admin') {
      res.status(403).json({ error: `Role ${req.session.role} is not permitted for this action.` });
      return;
    }
    next();
  };
}

// --- PUBLIC / AUTH ROUTES ---
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'SENIORA Backend' });
});

app.get('/api/auth/demo-accounts', (_req, res) => {
  res.json({ accounts: store.getDemoAccounts() });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }
  const user = store.authenticate(email, password);
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }
  const token = signSessionToken({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  });
  store.addAuditLog({
    actorRole: user.role,
    actorName: user.name,
    action: `Signed in as ${user.role}`,
    targetResource: 'auth-session',
    approvalStatus: 'approved',
  });
  res.json({
    token,
    user: {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      label: user.label,
    },
    state: store.getStateForRole(user.role),
  });
});

// First-visit elder bootstrap (lets the elderly user complete onboarding directly and receive an elder session token)
app.post('/api/auth/elder-session', (_req, res) => {
  const user = store.getUserById('user-elder');
  if (!user) {
    res.status(404).json({ error: 'Default elder account not found.' });
    return;
  }
  const token = signSessionToken({
    userId: user.id,
    role: user.role,
    name: store.getRawState().profile.name,
    email: user.email,
  });
  res.json({
    token,
    user: {
      id: user.id,
      role: user.role,
      name: store.getRawState().profile.name,
      email: user.email,
      label: user.label,
    },
    state: store.getStateForRole('elder'),
  });
});

app.get('/api/stats/official', (_req, res) => {
  res.json({
    statistics: OFFICIAL_STATISTICS,
    projections: IMPACT_PROJECTIONS,
    initiatives: GOVERNMENT_INITIATIVES,
  });
});

// --- PROTECTED STATE ---
app.get('/api/state', requireAuth, (req: AuthedRequest, res) => {
  const role = req.session!.role;
  res.json({ state: store.getStateForRole(role) });
});

app.post('/api/demo/reset', requireAuth, (req: AuthedRequest, res) => {
  const fresh = store.resetDemo();
  broadcastEvent('state:updated', { reason: 'demo_reset' });
  res.json({ state: fresh });
});

// --- PROFILE & ONBOARDING & MEMORY ---
app.patch('/api/profile', requireAuth, requireRole(['elder']), (req: AuthedRequest, res) => {
  const updates = req.body as Partial<ElderProfile> & { clearSampleContacts?: boolean };
  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    'Updated personal profile and preferences',
    'elder-profile',
    'approved',
    (s) => {
      const safeKeys: Array<keyof ElderProfile> = [
        'name',
        'age',
        'city',
        'address',
        'language',
        'tamilDialect',
        'voicePersona',
        'speechRate',
        'volume',
        'fontScale',
        'highContrast',
        'communicationStyle',
        'wakeTime',
        'sleepTime',
        'livesAlone',
        'livingArrangement',
        'supportAreas',
        'favouriteFoods',
        'dislikedFoods',
        'dietaryRestrictions',
        'hobbies',
        'favouriteMusic',
        'favouriteTopics',
        'mobilityNeeds',
        'conditions',
        'allergies',
        'onboardingCompleted',
        'privacy',
      ];
      for (const k of safeKeys) {
        if (updates[k] !== undefined) {
          if (k === 'tamilDialect') {
            const candidate = String(updates.tamilDialect);
            if (candidate in TAMIL_DIALECT_MAP) {
              s.profile.tamilDialect = candidate as TamilDialectId;
            }
          } else {
            (s.profile[k] as unknown) = updates[k];
          }
        }
      }
      if (updates.clearSampleContacts === true) {
        s.emergencyContacts = s.emergencyContacts.filter((c) => !c.isDemoSample);
      }
    }
  );
  broadcastEvent('state:updated', { reason: 'profile_updated' });
  res.json({ state: updated });
});

app.post('/api/memories', requireAuth, requireRole(['elder']), (req: AuthedRequest, res) => {
  const { category, label, value, preferenceType } = req.body as {
    category?: string;
    label?: string;
    value?: string;
    preferenceType?: 'like' | 'dislike' | 'fact';
  };
  if (!label || !value) {
    res.status(400).json({ error: 'Label and value are required.' });
    return;
  }
  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    `Added memory: ${label}`,
    'elder-memory',
    'approved',
    (s) => {
      s.profile.memories.unshift({
        id: `mem-${Date.now()}`,
        category: (category as 'food' | 'music' | 'hobby' | 'family' | 'topic' | 'routine' | 'other') || 'other',
        label: String(label).slice(0, 80),
        value: String(value).slice(0, 240),
        preferenceType: preferenceType || 'like',
        createdAt: new Date().toISOString(),
      });
    }
  );
  broadcastEvent('state:updated', { reason: 'memory_added' });
  res.json({ state: updated });
});

app.delete('/api/memories/:id', requireAuth, requireRole(['elder']), (req: AuthedRequest, res) => {
  const { id } = req.params;
  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    `Deleted memory ${id}`,
    'elder-memory',
    'approved',
    (s) => {
      s.profile.memories = s.profile.memories.filter((m) => m.id !== id);
    }
  );
  broadcastEvent('state:updated', { reason: 'memory_deleted' });
  res.json({ state: updated });
});

// --- MEDICATIONS & PRESCRIPTIONS ---
app.post('/api/medications/:id/status', requireAuth, requireRole(['elder']), (req: AuthedRequest, res) => {
  const { id } = req.params;
  const { status } = req.body as { status?: 'taken' | 'snoozed' | 'missed' };
  if (!status || !['taken', 'snoozed', 'missed'].includes(status)) {
    res.status(400).json({ error: 'Valid status required.' });
    return;
  }
  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    `Marked medication ${id} as ${status}`,
    `medication:${id}`,
    'approved',
    (s) => {
      const med = s.medications.find((m) => m.id === id);
      if (med) {
        med.status = status;
        med.lastUpdatedAt = new Date().toISOString();
        med.history.unshift({
          date: new Date().toISOString().slice(0, 10),
          time: new Date().toTimeString().slice(0, 5),
          status,
          confirmedBy: s.profile.name,
        });
        if (status === 'missed') {
          store.addNotification({
            targetRoles: ['family'],
            title: `Missed Medication Alert: ${med.name}`,
            message: `${s.profile.name} missed ${med.name} (${med.scheduledTime}).`,
            category: 'medication',
          });
        }
      }
    }
  );
  broadcastEvent('state:updated', { reason: 'medication_status' });
  res.json({ state: updated });
});

app.post('/api/medications', requireAuth, requireRole(['elder', 'doctor']), (req: AuthedRequest, res) => {
  const { name, dosage, frequency, foodInstruction, scheduledTime, purpose } = req.body as {
    name?: string;
    dosage?: string;
    frequency?: string;
    foodInstruction?: 'before_food' | 'after_food' | 'with_food' | 'anytime';
    scheduledTime?: string;
    purpose?: string;
  };
  if (!name || !dosage || !scheduledTime) {
    res.status(400).json({ error: 'Medicine name, dosage, and time are required.' });
    return;
  }
  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    `Added medication schedule for ${name}`,
    'medications',
    'approved',
    (s) => {
      s.medications.push({
        id: `med-${Date.now()}`,
        patientId: s.profile.id,
        name: name.trim(),
        dosage: dosage.trim(),
        frequency: frequency || 'Once daily',
        foodInstruction: foodInstruction || 'after_food',
        scheduledTime,
        status: 'pending',
        refillDaysLeft: 30,
        prescribedBy: req.session!.role === 'doctor' ? req.session!.name : s.profile.preferredDoctorName,
        purpose: purpose || 'Prescribed daily care',
        lastUpdatedAt: new Date().toISOString(),
        history: [],
      });
    }
  );
  broadcastEvent('state:updated', { reason: 'medication_added' });
  res.json({ state: updated });
});

// Doctor creates prescription requiring explicit elder consent
app.post('/api/prescriptions', requireAuth, requireRole(['doctor']), (req: AuthedRequest, res) => {
  const { medicineName, dosage, frequency, foodInstruction, scheduledTime, reason, plainExplanation } = req.body as {
    medicineName?: string;
    dosage?: string;
    frequency?: string;
    foodInstruction?: 'before_food' | 'after_food' | 'with_food' | 'anytime';
    scheduledTime?: string;
    reason?: string;
    plainExplanation?: string;
  };
  if (!medicineName || !dosage || !reason) {
    res.status(400).json({ error: 'Medicine name, dosage, and clinical reason are required.' });
    return;
  }
  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    `Issued prescription recommendation for ${medicineName} (awaiting elder consent)`,
    'prescriptions',
    'pending',
    (s) => {
      const rxId = `rx-${Date.now()}`;
      s.prescriptionUpdates.unshift({
        id: rxId,
        patientId: s.profile.id,
        patientName: s.profile.name,
        doctorId: req.session!.userId,
        doctorName: req.session!.name,
        medicineName: medicineName.trim(),
        dosage: dosage.trim(),
        frequency: frequency || 'Once daily',
        foodInstruction: foodInstruction || 'after_food',
        scheduledTime: scheduledTime || '09:00',
        reason: reason.trim(),
        plainExplanation:
          plainExplanation?.trim() ||
          `${req.session!.name} recommends ${medicineName} (${dosage}) for ${reason}. Please review and confirm before we update your schedule or order from the pharmacy.`,
        status: 'pending_consent',
        createdAt: new Date().toISOString(),
        isDemo: true,
      });
      store.addNotification({
        targetRoles: ['elder', 'family'],
        title: `New Prescription from ${req.session!.name}`,
        message: `${medicineName} (${dosage}) awaits ${s.profile.name}'s confirmation.`,
        category: 'prescription',
      });
    }
  );
  broadcastEvent('prescription:created', { medicineName });
  res.json({ state: updated });
});

// Elder explicitly consents or declines prescription -> consented creates pharmacy order & updates schedule
app.post('/api/prescriptions/:id/respond', requireAuth, requireRole(['elder']), (req: AuthedRequest, res) => {
  const { id } = req.params;
  const { decision, orderFromPharmacy } = req.body as {
    decision?: 'consented' | 'declined';
    orderFromPharmacy?: boolean;
  };
  if (!decision || !['consented', 'declined'].includes(decision)) {
    res.status(400).json({ error: 'Decision must be consented or declined.' });
    return;
  }

  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    `Elder ${decision} prescription ${id}`,
    `prescription:${id}`,
    decision === 'consented' ? 'approved' : 'declined',
    (s) => {
      const rx = s.prescriptionUpdates.find((p) => p.id === id);
      if (!rx) return;
      rx.status = decision;
      rx.consentTimestamp = new Date().toISOString();

      if (decision === 'consented') {
        s.medications.push({
          id: `med-${Date.now()}`,
          patientId: s.profile.id,
          name: rx.medicineName,
          dosage: rx.dosage,
          frequency: rx.frequency,
          foodInstruction: rx.foodInstruction,
          scheduledTime: rx.scheduledTime,
          status: 'pending',
          refillDaysLeft: 30,
          prescribedBy: rx.doctorName,
          purpose: rx.reason,
          lastUpdatedAt: new Date().toISOString(),
          history: [],
        });

        if (orderFromPharmacy !== false) {
          s.pharmacyOrders.unshift({
            id: `ord-${Date.now()}`,
            prescriptionId: rx.id,
            patientId: s.profile.id,
            patientName: s.profile.name,
            pharmacyName: 'MedPlus Care Pharmacy (DEMO)',
            itemsSummary: `${rx.medicineName} (${rx.dosage})`,
            stage: 'prescription_received',
            deliveryPartnerName: 'Pending Assignment',
            deliveryPhone: '+91 98400 11223 (DEMO)',
            deliveryAddress: s.profile.address,
            estimatedAmountInr: 220,
            availabilityConfirmed: false,
            notes: `Consented by ${s.profile.name}.`,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            isDemo: true,
          });
          store.addNotification({
            targetRoles: ['pharmacy', 'family'],
            title: `Confirmed Medicine Order: ${rx.medicineName}`,
            message: `${s.profile.name} confirmed the prescription and placed a DEMO pharmacy order.`,
            category: 'pharmacy',
          });
        }
      } else {
        store.addNotification({
          targetRoles: ['doctor'],
          title: `Prescription Declined by ${s.profile.name}`,
          message: `${s.profile.name} declined ${rx.medicineName} and requested doctor follow-up.`,
          category: 'prescription',
        });
      }
    }
  );
  broadcastEvent('order:updated', { prescriptionId: id, decision });
  res.json({ state: updated });
});

// --- PHARMACY & DELIVERY PARTNER WORKFLOW ---
app.patch(
  '/api/pharmacy-orders/:id',
  requireAuth,
  requireRole(['pharmacy', 'delivery', 'elder']),
  (req: AuthedRequest, res) => {
    const { id } = req.params;
    const { stage, availabilityConfirmed, deliveryPartnerName, notes } = req.body as {
      stage?: DeliveryStage;
      availabilityConfirmed?: boolean;
      deliveryPartnerName?: string;
      notes?: string;
    };

    const updated = store.mutate(
      req.session!.role,
      req.session!.name,
      `Updated pharmacy order ${id} -> ${stage || 'details'}`,
      `pharmacy-order:${id}`,
      'approved',
      (s) => {
        const order = s.pharmacyOrders.find((o) => o.id === id);
        if (!order) return;
        if (stage) order.stage = stage;
        if (availabilityConfirmed !== undefined) order.availabilityConfirmed = availabilityConfirmed;
        if (deliveryPartnerName) order.deliveryPartnerName = deliveryPartnerName;
        if (notes !== undefined) order.notes = notes;
        order.updatedAt = new Date().toISOString();

        store.addNotification({
          targetRoles: ['elder', 'family', 'pharmacy', 'delivery'],
          title: `Medicine Order Update (${order.itemsSummary})`,
          message: `Stage updated to "${order.stage.replace(/_/g, ' ')}" (DEMO workflow).`,
          category: 'pharmacy',
        });
      }
    );
    broadcastEvent('order:updated', { orderId: id, stage });
    res.json({ state: updated });
  }
);

// --- APPOINTMENTS & MEDICAL REPORTS ---
app.post('/api/appointments', requireAuth, requireRole(['elder', 'doctor', 'family']), (req: AuthedRequest, res) => {
  const { doctorId, doctorName, specialty, hospital, mode, date, time, reason } = req.body as {
    doctorId?: string;
    doctorName?: string;
    specialty?: string;
    hospital?: string;
    mode?: 'in_person' | 'teleconsult';
    date?: string;
    time?: string;
    reason?: string;
  };
  if (!date || !time || !reason) {
    res.status(400).json({ error: 'Date, time, and reason are required.' });
    return;
  }

  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    `Booked DEMO appointment with ${doctorName || 'Doctor'}`,
    'appointments',
    'approved',
    (s) => {
      const dirDoc = s.doctors.find((d) => d.id === doctorId || d.name === doctorName) || s.doctors[0];
      s.appointments.unshift({
        id: `appt-${Date.now()}`,
        patientId: s.profile.id,
        patientName: s.profile.name,
        doctorId: dirDoc.id,
        doctorName: doctorName || dirDoc.name,
        specialty: specialty || dirDoc.specialty,
        hospital: hospital || dirDoc.hospital,
        mode: mode || 'in_person',
        date,
        time,
        reason,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        isDemo: true,
      });
      store.addNotification({
        targetRoles: ['elder', 'doctor', 'family', 'ngo'],
        title: `Appointment Scheduled (DEMO): ${doctorName || dirDoc.name}`,
        message: `${s.profile.name} booked a ${mode || 'in_person'} visit on ${date} at ${time}.`,
        category: 'appointment',
      });
    }
  );
  broadcastEvent('state:updated', { reason: 'appointment_booked' });
  res.json({ state: updated });
});

app.patch('/api/appointments/:id', requireAuth, requireRole(['elder', 'doctor']), (req: AuthedRequest, res) => {
  const { id } = req.params;
  const { status, consultationNotes, followUpDate } = req.body as {
    status?: 'scheduled' | 'completed' | 'cancelled';
    consultationNotes?: string;
    followUpDate?: string;
  };
  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    `Updated appointment ${id}`,
    `appointment:${id}`,
    'approved',
    (s) => {
      const appt = s.appointments.find((a) => a.id === id);
      if (!appt) return;
      if (status) appt.status = status;
      if (consultationNotes !== undefined) appt.consultationNotes = consultationNotes;
      if (followUpDate !== undefined) appt.followUpDate = followUpDate;
    }
  );
  broadcastEvent('state:updated', { reason: 'appointment_updated' });
  res.json({ state: updated });
});

app.post('/api/reports', requireAuth, requireRole(['elder', 'doctor']), (req: AuthedRequest, res) => {
  const { title, category, summary } = req.body as {
    title?: string;
    category?: 'lab_report' | 'imaging' | 'prescription_scan' | 'discharge_summary';
    summary?: string;
  };
  if (!title || !summary) {
    res.status(400).json({ error: 'Report title and summary are required.' });
    return;
  }
  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    `Uploaded medical report: ${title}`,
    'reports',
    'approved',
    (s) => {
      s.reports.unshift({
        id: `rep-${Date.now()}`,
        patientId: s.profile.id,
        title,
        category: category || 'lab_report',
        uploadedAt: new Date().toISOString().slice(0, 10),
        summary,
        reviewedByDoctor: req.session!.role === 'doctor',
      });
      store.addNotification({
        targetRoles: ['doctor'],
        title: `New Report Uploaded by ${s.profile.name}`,
        message: title,
        category: 'appointment',
      });
    }
  );
  broadcastEvent('state:updated', { reason: 'report_uploaded' });
  res.json({ state: updated });
});

app.patch('/api/reports/:id/review', requireAuth, requireRole(['doctor']), (req: AuthedRequest, res) => {
  const { id } = req.params;
  const { doctorNote } = req.body as { doctorNote?: string };
  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    `Reviewed medical report ${id}`,
    `report:${id}`,
    'approved',
    (s) => {
      const rep = s.reports.find((r) => r.id === id);
      if (rep) {
        rep.reviewedByDoctor = true;
        if (doctorNote) rep.doctorNote = doctorNote;
      }
    }
  );
  broadcastEvent('state:updated', { reason: 'report_reviewed' });
  res.json({ state: updated });
});

// --- TRANSPORT BOOKINGS ---
app.post('/api/transport', requireAuth, requireRole(['elder', 'family', 'ngo']), (req: AuthedRequest, res) => {
  const { purpose, pickup, destination, date, time, vehicleType, accessibleRequired } = req.body as {
    purpose?: 'doctor' | 'hospital' | 'pharmacy' | 'shopping' | 'personal';
    pickup?: string;
    destination?: string;
    date?: string;
    time?: string;
    vehicleType?: 'car' | 'accessible_van' | 'auto_rickshaw' | 'ambulance';
    accessibleRequired?: boolean;
  };
  if (!destination || !date || !time) {
    res.status(400).json({ error: 'Destination, date, and time are required.' });
    return;
  }

  const fareMap: Record<string, number> = {
    auto_rickshaw: 110,
    car: 160,
    accessible_van: 220,
    ambulance: 450,
  };
  const vType = vehicleType || (accessibleRequired ? 'accessible_van' : 'car');

  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    `Requested DEMO transport to ${destination}`,
    'transport',
    'approved',
    (s) => {
      s.transportBookings.unshift({
        id: `trip-${Date.now()}`,
        patientId: s.profile.id,
        patientName: s.profile.name,
        purpose: purpose || 'doctor',
        pickup: pickup || s.profile.address,
        destination,
        date,
        time,
        vehicleType: vType,
        accessibleRequired: accessibleRequired ?? vType === 'accessible_van',
        estimatedFareInr: fareMap[vType] || 180,
        driverName: 'Awaiting Partner Confirmation (DEMO)',
        driverPhone: '+91 98401 44556 (DEMO)',
        vehicleNumber: 'Pending Dispatch',
        status: 'requested',
        createdAt: new Date().toISOString(),
        isDemo: true,
      });
      store.addNotification({
        targetRoles: ['transport', 'family', 'ngo'],
        title: `New Transport Request (DEMO): ${destination}`,
        message: `${s.profile.name} requested a ${vType.replace(/_/g, ' ')} on ${date} at ${time}.`,
        category: 'transport',
      });
    }
  );
  broadcastEvent('transport:updated', { destination });
  res.json({ state: updated });
});

app.patch('/api/transport/:id', requireAuth, requireRole(['elder', 'transport', 'ngo']), (req: AuthedRequest, res) => {
  const { id } = req.params;
  const { status, driverName, vehicleNumber } = req.body as {
    status?: 'requested' | 'confirmed' | 'en_route' | 'completed' | 'cancelled';
    driverName?: string;
    vehicleNumber?: string;
  };
  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    `Updated transport ${id} -> ${status || 'details'}`,
    `transport:${id}`,
    'approved',
    (s) => {
      const trip = s.transportBookings.find((t) => t.id === id);
      if (!trip) return;
      if (status) trip.status = status;
      if (driverName) trip.driverName = driverName;
      if (vehicleNumber) trip.vehicleNumber = vehicleNumber;
      store.addNotification({
        targetRoles: ['elder', 'family'],
        title: `Ride Status Updated (DEMO)`,
        message: `Ride to ${trip.destination} is now "${trip.status.replace(/_/g, ' ')}".`,
        category: 'transport',
      });
    }
  );
  broadcastEvent('transport:updated', { tripId: id, status });
  res.json({ state: updated });
});

// --- WEARABLE HEALTH WATCH ---
app.post('/api/wearable/sync', requireAuth, requireRole(['elder']), (req: AuthedRequest, res) => {
  const { heartRate, steps, spo2, sleepHours, connectionMode, deviceName, shareWithDoctor } = req.body as {
    heartRate?: number;
    steps?: number;
    spo2?: number;
    sleepHours?: number;
    connectionMode?: 'demo' | 'web_bluetooth' | 'disconnected';
    deviceName?: string;
    shareWithDoctor?: boolean;
  };

  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    `Synced wearable health watch (${connectionMode || 'demo'})`,
    'wearable',
    'approved',
    (s) => {
      if (connectionMode) {
        s.wearable.connectionMode = connectionMode;
        s.wearable.connected = connectionMode !== 'disconnected';
        s.wearable.isDemoData = connectionMode !== 'web_bluetooth';
      }
      if (deviceName) s.wearable.deviceName = deviceName;
      if (typeof shareWithDoctor === 'boolean') s.wearable.shareWithDoctor = shareWithDoctor;
      if (typeof heartRate === 'number' && heartRate > 30 && heartRate < 220) {
        s.wearable.heartRate = heartRate;
      } else if (s.wearable.connectionMode === 'demo') {
        s.wearable.heartRate = 71 + Math.floor(Math.random() * 8);
        s.wearable.steps += 85;
      }
      if (typeof steps === 'number') s.wearable.steps = steps;
      if (typeof spo2 === 'number') s.wearable.spo2 = spo2;
      if (typeof sleepHours === 'number') s.wearable.sleepHours = sleepHours;
      s.wearable.lastSyncedAt = new Date().toISOString();
    }
  );
  broadcastEvent('state:updated', { reason: 'wearable_synced' });
  res.json({ state: updated });
});

// --- NUTRITION, HABITS, ROUTINES, REMINDERS, SHOPPING ---
app.post('/api/nutrition/water', requireAuth, requireRole(['elder']), (req: AuthedRequest, res) => {
  const delta = Number((req.body as { delta?: number }).delta ?? 1);
  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    `Updated water intake (${delta > 0 ? '+' : ''}${delta})`,
    'nutrition',
    'approved',
    (s) => {
      s.waterGlasses = Math.max(0, Math.min(20, s.waterGlasses + delta));
      const waterHabit = s.habits.find((h) => h.category === 'water');
      if (waterHabit && s.waterGlasses >= s.waterGoal) {
        waterHabit.completedToday = true;
      }
    }
  );
  broadcastEvent('state:updated', { reason: 'water_logged' });
  res.json({ state: updated });
});

app.post('/api/nutrition/meals', requireAuth, requireRole(['elder']), (req: AuthedRequest, res) => {
  const { type, description, caloriesApprox } = req.body as {
    type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    description?: string;
    caloriesApprox?: number;
  };
  if (!description) {
    res.status(400).json({ error: 'Meal description is required.' });
    return;
  }
  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    `Logged ${type || 'meal'}`,
    'nutrition',
    'approved',
    (s) => {
      s.meals.unshift({
        id: `meal-${Date.now()}`,
        type: type || 'lunch',
        description: description.trim(),
        time: new Date().toTimeString().slice(0, 5),
        caloriesApprox: Number(caloriesApprox) || 320,
      });
    }
  );
  broadcastEvent('state:updated', { reason: 'meal_logged' });
  res.json({ state: updated });
});

app.post('/api/habits/:id/toggle', requireAuth, requireRole(['elder']), (req: AuthedRequest, res) => {
  const { id } = req.params;
  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    `Toggled habit ${id}`,
    'habits',
    'approved',
    (s) => {
      const h = s.habits.find((item) => item.id === id);
      if (h) {
        h.completedToday = !h.completedToday;
        h.streakDays = h.completedToday ? h.streakDays + 1 : Math.max(0, h.streakDays - 1);
      }
    }
  );
  broadcastEvent('state:updated', { reason: 'habit_toggled' });
  res.json({ state: updated });
});

app.post('/api/routines/:id/toggle', requireAuth, requireRole(['elder']), (req: AuthedRequest, res) => {
  const { id } = req.params;
  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    `Toggled routine item ${id}`,
    'routines',
    'approved',
    (s) => {
      const r = s.routines.find((item) => item.id === id);
      if (r) r.completed = !r.completed;
    }
  );
  broadcastEvent('state:updated', { reason: 'routine_toggled' });
  res.json({ state: updated });
});

app.post('/api/reminders', requireAuth, requireRole(['elder', 'family']), (req: AuthedRequest, res) => {
  const { title, time, date, category } = req.body as {
    title?: string;
    time?: string;
    date?: string;
    category?: 'medication' | 'appointment' | 'hydration' | 'family' | 'transport' | 'task';
  };
  if (!title) {
    res.status(400).json({ error: 'Reminder title is required.' });
    return;
  }
  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    `Added reminder: ${title}`,
    'reminders',
    'approved',
    (s) => {
      s.reminders.unshift({
        id: `rem-${Date.now()}`,
        title: title.trim(),
        time: time || '10:00',
        date: date || new Date().toISOString().slice(0, 10),
        category: category || 'task',
        completed: false,
      });
    }
  );
  broadcastEvent('state:updated', { reason: 'reminder_added' });
  res.json({ state: updated });
});

app.post('/api/reminders/:id/toggle', requireAuth, requireRole(['elder']), (req: AuthedRequest, res) => {
  const { id } = req.params;
  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    `Toggled reminder ${id}`,
    'reminders',
    'approved',
    (s) => {
      const r = s.reminders.find((item) => item.id === id);
      if (r) r.completed = !r.completed;
    }
  );
  broadcastEvent('state:updated', { reason: 'reminder_toggled' });
  res.json({ state: updated });
});

app.post('/api/shopping', requireAuth, requireRole(['elder', 'family']), (req: AuthedRequest, res) => {
  const { name, quantity } = req.body as { name?: string; quantity?: string };
  if (!name) {
    res.status(400).json({ error: 'Item name is required.' });
    return;
  }
  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    `Added shopping item: ${name}`,
    'shopping-list',
    'approved',
    (s) => {
      s.shoppingList.unshift({
        id: `shop-${Date.now()}`,
        name: name.trim(),
        quantity: quantity || '1',
        checked: false,
      });
    }
  );
  broadcastEvent('state:updated', { reason: 'shopping_added' });
  res.json({ state: updated });
});

app.post('/api/shopping/:id/toggle', requireAuth, requireRole(['elder', 'ngo']), (req: AuthedRequest, res) => {
  const { id } = req.params;
  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    `Toggled shopping item ${id}`,
    'shopping-list',
    'approved',
    (s) => {
      const item = s.shoppingList.find((x) => x.id === id);
      if (item) item.checked = !item.checked;
    }
  );
  broadcastEvent('state:updated', { reason: 'shopping_toggled' });
  res.json({ state: updated });
});

// --- VOICES OF LOVE (FAMILY AUDIO/TEXT MESSAGES) ---
app.post('/api/voices-of-love', requireAuth, requireRole(['family', 'elder']), (req: AuthedRequest, res) => {
  const { fromName, relationship, title, transcript, audioDataUrl, durationSec, scheduledTime } = req.body as {
    fromName?: string;
    relationship?: string;
    title?: string;
    transcript?: string;
    audioDataUrl?: string;
    durationSec?: number;
    scheduledTime?: string;
  };
  if (!title || !transcript) {
    res.status(400).json({ error: 'Title and message text are required.' });
    return;
  }
  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    `Recorded Voices of Love message: ${title}`,
    'voices-of-love',
    'approved',
    (s) => {
      s.voicesOfLove.unshift({
        id: `vol-${Date.now()}`,
        fromName: fromName || req.session!.name,
        relationship: relationship || 'Family',
        title,
        transcript,
        audioDataUrl,
        durationSec: Number(durationSec) || 15,
        scheduledTime: scheduledTime || 'Anytime',
        createdAt: new Date().toISOString(),
        listened: false,
      });
      store.addNotification({
        targetRoles: ['elder'],
        title: `New Voices of Love Message from ${fromName || req.session!.name}`,
        message: title,
        category: 'family',
      });
    }
  );
  broadcastEvent('voice:received', { title });
  res.json({ state: updated });
});

app.post('/api/voices-of-love/:id/listened', requireAuth, requireRole(['elder']), (req: AuthedRequest, res) => {
  const { id } = req.params;
  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    `Marked voice message ${id} listened`,
    'voices-of-love',
    'approved',
    (s) => {
      const m = s.voicesOfLove.find((x) => x.id === id);
      if (m) m.listened = true;
    }
  );
  res.json({ state: updated });
});

// --- EMERGENCY CONTACTS & SOS ---
const ALLOWED_CONTACT_RELATIONS = new Set<EmergencyContact['relationship']>([
  'family',
  'neighbour',
  'caregiver',
  'doctor',
  'hospital',
]);

function isAuthorizedForEmergencyContacts(req: AuthedRequest): { ok: boolean; error?: string } {
  if (!req.session) return { ok: false, error: 'Authentication required.' };
  if (req.session.role === 'admin') return { ok: true };
  const user = store.getUserById(req.session.userId);
  if (!user) return { ok: false, error: 'Account not found.' };
  const patientId = store.getRawState().profile.id;
  if (user.linkedPatientId !== patientId) {
    return { ok: false, error: 'You are not authorized to modify contacts for this elder account.' };
  }
  return { ok: true };
}

function validateContactFields(body: {
  name?: unknown;
  phone?: unknown;
  relationship?: unknown;
}): { ok: boolean; error?: string } {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  if (name.length < 2 || name.length > 80) {
    return { ok: false, error: 'Contact name must be between 2 and 80 characters.' };
  }
  if (!/^[+\d\s()-]{3,24}$/.test(phone) || phone.replace(/\D/g, '').length < 3) {
    return { ok: false, error: 'Please enter a valid phone number.' };
  }
  if (
    body.relationship !== undefined &&
    !ALLOWED_CONTACT_RELATIONS.has(body.relationship as EmergencyContact['relationship'])
  ) {
    return { ok: false, error: 'Invalid emergency contact relationship.' };
  }
  return { ok: true };
}

app.post('/api/emergency/contacts', requireAuth, requireRole(['elder', 'family']), (req: AuthedRequest, res) => {
  const authCheck = isAuthorizedForEmergencyContacts(req);
  if (!authCheck.ok) {
    res.status(403).json({ error: authCheck.error });
    return;
  }

  const { name, relationship, relationshipDetail, phone, priority, notifyOnSos } = req.body as {
    name?: string;
    relationship?: 'family' | 'neighbour' | 'caregiver' | 'doctor' | 'hospital';
    relationshipDetail?: string;
    phone?: string;
    priority?: 'primary' | 'secondary';
    notifyOnSos?: boolean;
  };
  const check = validateContactFields({ name, phone, relationship });
  if (!check.ok) {
    res.status(400).json({ error: check.error });
    return;
  }

  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    `Added emergency contact ${name!.trim()}`,
    'emergency-contacts',
    'approved',
    (s) => {
      const personalCount = s.emergencyContacts.filter((c) => !c.isSystemDefault).length;
      const effectivePriority: 'primary' | 'secondary' =
        priority === 'primary'
          ? 'primary'
          : priority === 'secondary'
          ? 'secondary'
          : personalCount === 0
          ? 'primary'
          : 'secondary';

      if (effectivePriority === 'primary') {
        s.emergencyContacts.forEach((c) => {
          if (!c.isSystemDefault && c.priority === 'primary') {
            c.priority = 'secondary';
          }
        });
      }

      const newContact: EmergencyContact = {
        id: `ec-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        patientId: s.profile.id,
        name: name!.trim(),
        relationship: relationship || 'family',
        relationshipDetail: relationshipDetail?.trim() ? relationshipDetail.trim().slice(0, 60) : undefined,
        phone: phone!.trim(),
        priority: effectivePriority,
        isDemoSample: false,
        notifyOnSos: notifyOnSos !== false,
      };
      s.emergencyContacts.push(newContact);
    }
  );
  broadcastEvent('state:updated', { reason: 'emergency_contact_added' });
  res.json({ state: updated });
});

app.patch('/api/emergency/contacts/:id', requireAuth, requireRole(['elder', 'family']), (req: AuthedRequest, res) => {
  const authCheck = isAuthorizedForEmergencyContacts(req);
  if (!authCheck.ok) {
    res.status(403).json({ error: authCheck.error });
    return;
  }

  const { id } = req.params;
  const { name, relationship, relationshipDetail, phone, priority, notifyOnSos } = req.body as {
    name?: string;
    relationship?: 'family' | 'neighbour' | 'caregiver' | 'doctor' | 'hospital';
    relationshipDetail?: string;
    phone?: string;
    priority?: 'primary' | 'secondary';
    notifyOnSos?: boolean;
  };

  const existing = store.getRawState().emergencyContacts.find((c) => c.id === id);
  if (!existing) {
    res.status(404).json({ error: 'Emergency contact not found.' });
    return;
  }
  if (existing.isSystemDefault) {
    res.status(400).json({ error: 'System emergency helplines cannot be modified.' });
    return;
  }

  const check = validateContactFields({
    name: name ?? existing.name,
    phone: phone ?? existing.phone,
    relationship: relationship ?? existing.relationship,
  });
  if (!check.ok) {
    res.status(400).json({ error: check.error });
    return;
  }

  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    `Updated emergency contact ${name?.trim() || existing.name}`,
    `emergency-contact:${id}`,
    'approved',
    (s) => {
      const target = s.emergencyContacts.find((c) => c.id === id);
      if (!target) return;
      if (name !== undefined) target.name = name.trim();
      if (relationship !== undefined) target.relationship = relationship;
      if (relationshipDetail !== undefined) {
        target.relationshipDetail = relationshipDetail.trim()
          ? relationshipDetail.trim().slice(0, 60)
          : undefined;
      }
      if (phone !== undefined) target.phone = phone.trim();
      if (typeof notifyOnSos === 'boolean') target.notifyOnSos = notifyOnSos;
      if (priority === 'primary') {
        s.emergencyContacts.forEach((c) => {
          if (!c.isSystemDefault && c.id !== id && c.priority === 'primary') {
            c.priority = 'secondary';
          }
        });
        target.priority = 'primary';
      } else if (priority === 'secondary') {
        target.priority = 'secondary';
      }
      target.isDemoSample = false;
    }
  );
  broadcastEvent('state:updated', { reason: 'emergency_contact_updated' });
  res.json({ state: updated });
});

app.delete('/api/emergency/contacts/:id', requireAuth, requireRole(['elder', 'family']), (req: AuthedRequest, res) => {
  const authCheck = isAuthorizedForEmergencyContacts(req);
  if (!authCheck.ok) {
    res.status(403).json({ error: authCheck.error });
    return;
  }

  const { id } = req.params;
  const existing = store.getRawState().emergencyContacts.find((c) => c.id === id);
  if (!existing) {
    res.status(404).json({ error: 'Emergency contact not found.' });
    return;
  }
  if (existing.isSystemDefault) {
    res.status(400).json({ error: 'National emergency helplines cannot be removed.' });
    return;
  }

  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    `Removed emergency contact ${existing.name}`,
    `emergency-contact:${id}`,
    'approved',
    (s) => {
      s.emergencyContacts = s.emergencyContacts.filter((c) => c.id !== id);
      const remainingPersonal = s.emergencyContacts.filter((c) => !c.isSystemDefault);
      if (remainingPersonal.length > 0 && !remainingPersonal.some((c) => c.priority === 'primary')) {
        remainingPersonal[0].priority = 'primary';
      }
    }
  );
  broadcastEvent('state:updated', { reason: 'emergency_contact_deleted' });
  res.json({ state: updated });
});

app.post('/api/emergency/trigger', requireAuth, async (req: AuthedRequest, res) => {
  const { trigger, notes, locationSharedConsent, coordinates } = req.body as {
    trigger?: 'manual_sos' | 'fall_detection' | 'voice_distress' | 'abnormal_vital';
    notes?: string;
    locationSharedConsent?: boolean;
    coordinates?: { lat?: number; lng?: number; accuracy?: number };
  };

  const rawState = store.getRawState();
  const personalToNotify = rawState.emergencyContacts.filter((c) => !c.isSystemDefault && c.notifyOnSos);
  const deliveryDetails: EmergencyDeliveryChannelResult[] = [];

  if (personalToNotify.length === 0) {
    deliveryDetails.push({
      channel: 'care_network',
      recipient: 'Personal Emergency Contacts',
      status: 'failed',
      detail: 'No personal emergency contacts are registered to receive alerts.',
    });
  } else {
    deliveryDetails.push({
      channel: 'care_network',
      recipient: personalToNotify.map((c) => c.name).join(', '),
      status: 'delivered',
      detail: `Emergency notification dispatched to Care Network & Family/Doctor/NGO portals for ${personalToNotify.length} contact(s).`,
    });
  }

  const webhookUrl = process.env.EMERGENCY_WEBHOOK_URL?.trim();
  let webhookFailed = false;
  if (webhookUrl) {
    try {
      const parsedUrl = new URL(webhookUrl);
      if (parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:') {
        const hookRes = await fetch(parsedUrl.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000),
          body: JSON.stringify({
            patientId: rawState.profile.id,
            patientName: rawState.profile.name,
            trigger: trigger || 'manual_sos',
            contacts: personalToNotify.map((c) => ({ name: c.name, phone: c.phone })),
            locationShared: Boolean(locationSharedConsent),
            timestamp: new Date().toISOString(),
          }),
        });
        if (hookRes.ok) {
          deliveryDetails.push({
            channel: 'webhook',
            recipient: 'External Messaging Gateway',
            status: 'delivered',
            detail: 'External communication service confirmed alert receipt.',
          });
        } else {
          webhookFailed = true;
          deliveryDetails.push({
            channel: 'webhook',
            recipient: 'External Messaging Gateway',
            status: 'failed',
            detail: `External notification service returned status ${hookRes.status}.`,
          });
        }
      }
    } catch {
      webhookFailed = true;
      deliveryDetails.push({
        channel: 'webhook',
        recipient: 'External Messaging Gateway',
        status: 'failed',
        detail: 'External communication service did not respond in time.',
      });
    }
  } else {
    deliveryDetails.push({
      channel: 'webhook',
      recipient: 'External Carrier SMS / Phone Gateway',
      status: 'unconfigured',
      detail: 'No external SMS gateway configured; direct phone call links remain ready.',
    });
  }

  const deliveryStatus: 'delivered' | 'partial' | 'failed' =
    personalToNotify.length === 0
      ? 'failed'
      : webhookFailed
      ? 'partial'
      : 'delivered';

  let locationText = 'Location withheld (permission not granted)';
  if (locationSharedConsent === true) {
    if (
      coordinates &&
      typeof coordinates.lat === 'number' &&
      typeof coordinates.lng === 'number' &&
      Number.isFinite(coordinates.lat) &&
      Number.isFinite(coordinates.lng)
    ) {
      locationText = `${rawState.profile.address} · GPS (${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)})`;
    } else {
      locationText = rawState.profile.address;
    }
  }

  let createdEventId = '';
  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    `Triggered Emergency SOS (${trigger || 'manual_sos'}) — delivery: ${deliveryStatus}`,
    'emergency-sos',
    'approved',
    (s) => {
      const notified = personalToNotify.map((c) => `${c.name} (${c.phone})`);
      const evId = `sos-${Date.now()}`;
      createdEventId = evId;
      s.emergencyEvents.unshift({
        id: evId,
        patientId: s.profile.id,
        patientName: s.profile.name,
        trigger: trigger || 'manual_sos',
        severity: 'urgent',
        notes: notes?.trim() || 'Emergency Assistance requested from SENIORA.',
        locationSharedConsent: Boolean(locationSharedConsent),
        locationLabel: locationText,
        notifiedContacts: notified,
        deliveryStatus,
        deliveryDetails,
        status: 'active',
        createdAt: new Date().toISOString(),
        isDemo: true,
      });
      store.addNotification({
        targetRoles: ['family', 'ngo', 'doctor', 'admin'],
        title: `URGENT SOS Alert for ${s.profile.name}`,
        message: `${notes?.trim() || `${s.profile.name} activated Emergency Assistance.`} · ${locationText}`,
        category: 'emergency',
      });
    }
  );
  broadcastEvent('emergency:triggered', { trigger: trigger || 'manual_sos', deliveryStatus });
  const createdEvent = updated.emergencyEvents.find((e) => e.id === createdEventId) || updated.emergencyEvents[0];
  res.json({
    state: updated,
    event: createdEvent,
    deliveryStatus,
    deliveryDetails,
  });
});

app.patch('/api/emergency/:id', requireAuth, requireRole(['ngo', 'family', 'doctor', 'elder']), (req: AuthedRequest, res) => {
  const { id } = req.params;
  const { status } = req.body as { status?: 'acknowledged' | 'resolved' };
  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    `Marked emergency ${id} as ${status}`,
    `emergency:${id}`,
    'approved',
    (s) => {
      const ev = s.emergencyEvents.find((e) => e.id === id);
      if (ev && status) {
        ev.status = status;
        ev.acknowledgedBy = req.session!.name;
      }
    }
  );
  broadcastEvent('state:updated', { reason: 'emergency_updated' });
  res.json({ state: updated });
});

// --- NGO VOLUNTEERS & ASSISTANCE ---
app.post('/api/ngo/requests', requireAuth, requireRole(['elder', 'family', 'ngo']), (req: AuthedRequest, res) => {
  const { type, description, preferredDate } = req.body as {
    type?: 'hospital_visit' | 'medicine_delivery' | 'grocery' | 'companionship' | 'mobility' | 'emergency_followup';
    description?: string;
    preferredDate?: string;
  };
  if (!description) {
    res.status(400).json({ error: 'Request description is required.' });
    return;
  }
  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    `Created NGO assistance request (${type || 'companionship'})`,
    'ngo-requests',
    'approved',
    (s) => {
      s.ngoRequests.unshift({
        id: `ngo-req-${Date.now()}`,
        patientId: s.profile.id,
        patientName: s.profile.name,
        area: s.profile.city,
        type: type || 'companionship',
        description: description.trim(),
        preferredDate: preferredDate || new Date().toISOString().slice(0, 10),
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      store.addNotification({
        targetRoles: ['ngo'],
        title: `New Support Request from ${s.profile.name}`,
        message: description.trim(),
        category: 'ngo',
      });
    }
  );
  broadcastEvent('ngo:updated', { reason: 'request_created' });
  res.json({ state: updated });
});

app.patch('/api/ngo/requests/:id', requireAuth, requireRole(['ngo']), (req: AuthedRequest, res) => {
  const { id } = req.params;
  const { status, assignedVolunteerId, completionReport } = req.body as {
    status?: 'pending' | 'assigned' | 'completed';
    assignedVolunteerId?: string;
    completionReport?: string;
  };
  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    `Updated NGO request ${id}`,
    `ngo-request:${id}`,
    'approved',
    (s) => {
      const r = s.ngoRequests.find((item) => item.id === id);
      if (!r) return;
      if (status) r.status = status;
      if (assignedVolunteerId) {
        const vol = s.volunteers.find((v) => v.id === assignedVolunteerId);
        if (vol) {
          r.assignedVolunteerId = vol.id;
          r.assignedVolunteerName = vol.name;
          r.status = status || 'assigned';
        }
      }
      if (completionReport !== undefined) r.completionReport = completionReport;
      store.addNotification({
        targetRoles: ['elder', 'family'],
        title: `NGO Care Update: ${r.type.replace(/_/g, ' ')}`,
        message: r.assignedVolunteerName
          ? `Volunteer ${r.assignedVolunteerName} is ${r.status}.`
          : `Request status: ${r.status}.`,
        category: 'ngo',
      });
    }
  );
  broadcastEvent('ngo:updated', { requestId: id });
  res.json({ state: updated });
});

// --- OPPORTUNITIES ---
app.post('/api/opportunities/apply', requireAuth, requireRole(['elder']), (req: AuthedRequest, res) => {
  const { opportunityId, note } = req.body as { opportunityId?: string; note?: string };
  if (!opportunityId) {
    res.status(400).json({ error: 'Opportunity ID required.' });
    return;
  }
  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    `Applied for verified senior opportunity ${opportunityId}`,
    `opportunity:${opportunityId}`,
    'approved',
    (s) => {
      const opp = s.opportunities.find((o) => o.id === opportunityId);
      if (!opp) return;
      s.applications.unshift({
        id: `app-${Date.now()}`,
        opportunityId: opp.id,
        opportunityTitle: opp.title,
        applicantName: s.profile.name,
        note: note || 'Interested in flexible morning hours.',
        status: 'submitted',
        appliedAt: new Date().toISOString().slice(0, 10),
      });
    }
  );
  broadcastEvent('state:updated', { reason: 'opportunity_applied' });
  res.json({ state: updated });
});

// --- FAMILY NOTIFICATION PREFS & NOTIFICATIONS ---
app.patch('/api/family/preferences', requireAuth, requireRole(['family', 'elder']), (req: AuthedRequest, res) => {
  const prefs = req.body as Partial<Record<'missedMedication' | 'emergencyAlerts' | 'appointmentReminders' | 'ngoVisitUpdates', boolean>>;
  const updated = store.mutate(
    req.session!.role,
    req.session!.name,
    'Updated family notification preferences',
    'family-prefs',
    'approved',
    (s) => {
      s.familyNotificationPrefs = { ...s.familyNotificationPrefs, ...prefs };
    }
  );
  res.json({ state: updated });
});

app.post('/api/notifications/read-all', requireAuth, (req: AuthedRequest, res) => {
  const role = req.session!.role;
  const updated = store.mutate(
    role,
    req.session!.name,
    'Marked notifications read',
    'notifications',
    'system',
    (s) => {
      s.notifications.forEach((n) => {
        if (n.targetRoles.includes(role)) n.read = true;
      });
    }
  );
  res.json({ state: updated });
});

// --- DATA EXPORT (PRIVACY COMPLIANCE) ---
app.get('/api/privacy/export', requireAuth, requireRole(['elder']), (_req: AuthedRequest, res) => {
  res.json({
    exportedAt: new Date().toISOString(),
    patientData: store.getStateForRole('elder'),
  });
});

// --- AGENTIC AI ORCHESTRATION, TTS, & STT ---
app.post('/api/ai/converse', requireAuth, async (req: AuthedRequest, res) => {
  const body = (req.body && typeof req.body === 'object' ? req.body : {}) as {
    message?: unknown;
    history?: unknown;
    language?: LanguageCode;
    tamilDialect?: TamilDialectId;
  };
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    res.status(400).json({ error: 'Message text is required.' });
    return;
  }
  const history = Array.isArray(body.history)
    ? body.history
        .filter(
          (item): item is { role: 'user' | 'assistant'; text: string } =>
            Boolean(item) &&
            typeof item === 'object' &&
            ((item as { role?: unknown }).role === 'user' ||
              (item as { role?: unknown }).role === 'assistant') &&
            typeof (item as { text?: unknown }).text === 'string'
        )
        .slice(-12)
    : [];
  const language: LanguageCode | undefined =
    body.language === 'en' || body.language === 'ta' || body.language === 'hi'
      ? body.language
      : undefined;
  const tamilDialect: TamilDialectId | undefined =
    typeof body.tamilDialect === 'string' && body.tamilDialect in TAMIL_DIALECT_MAP
      ? (body.tamilDialect as TamilDialectId)
      : undefined;

  try {
    const result = await orchestrateElderConversation({
      message: message.trim(),
      history: Array.isArray(history) ? history : [],
      state: store.getRawState(),
      languageOverride: language,
      tamilDialectOverride: tamilDialect,
    });
    store.addAuditLog({
      actorRole: req.session!.role,
      actorName: req.session!.name,
      action: `AI Orchestration: [${result.activeAgents.join(', ')}]`,
      targetResource: 'seniora-companion',
      approvalStatus: 'system',
    });
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI service error';
    res.status(502).json({ error: msg });
  }
});

app.post('/api/ai/tts', requireAuth, async (req: AuthedRequest, res) => {
  const { text, voicePersona, language, tamilDialect, rate } = req.body as {
    text?: string;
    voicePersona?: VoicePersonaId;
    language?: LanguageCode;
    tamilDialect?: TamilDialectId;
    rate?: number;
  };
  if (!text || text.trim().length === 0) {
    res.status(400).json({ error: 'Text is required for speech synthesis.' });
    return;
  }
  const safeDialect =
    typeof tamilDialect === 'string' && tamilDialect in TAMIL_DIALECT_MAP
      ? (tamilDialect as TamilDialectId)
      : store.getRawState().profile.tamilDialect;

  try {
    const audio = await synthesizeGeminiSpeech({
      text: text.trim().slice(0, 800),
      voicePersona: voicePersona || store.getRawState().profile.voicePersona,
      language: language || store.getRawState().profile.language,
      tamilDialect: safeDialect,
      rate: typeof rate === 'number' ? rate : store.getRawState().profile.speechRate,
    });
    res.json(audio);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'TTS synthesis failed';
    res.status(502).json({ error: msg, useBrowserTts: true });
  }
});

app.post('/api/ai/transcribe', requireAuth, async (req: AuthedRequest, res) => {
  const { audioBase64, mimeType, language, tamilDialect } = req.body as {
    audioBase64?: string;
    mimeType?: string;
    language?: LanguageCode;
    tamilDialect?: TamilDialectId;
  };
  if (!audioBase64) {
    res.status(400).json({ error: 'Audio payload is required.' });
    return;
  }
  const safeDialect =
    typeof tamilDialect === 'string' && tamilDialect in TAMIL_DIALECT_MAP
      ? (tamilDialect as TamilDialectId)
      : store.getRawState().profile.tamilDialect;

  try {
    const text = await transcribeGeminiAudio({
      audioBase64,
      mimeType: mimeType || 'audio/webm',
      language: language || store.getRawState().profile.language,
      tamilDialect: safeDialect,
    });
    res.json({ text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Audio transcription failed';
    res.status(502).json({ error: msg });
  }
});

// Global Express error handler so unexpected errors never drop the TCP socket
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server route error:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- VITE DEV / STATIC PROD ---
async function startServer(): Promise<void> {
  const port = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`SENIORA server listening on http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start SENIORA server:', err);
  process.exit(1);
});
