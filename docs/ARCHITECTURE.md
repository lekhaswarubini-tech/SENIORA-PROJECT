# SENIORA System Architecture

## 1. Multi-Agent Orchestration (`/server/agents.ts`)

SENIORA routes elderly natural-language requests through a central Gemini (`gemini-4-hydrogen`) orchestration layer exposing 7 coordinated agent responsibilities via structured Function Calling:

1. **Personal Companion Agent** — Warm multilingual conversation & personal memory (`proposeSaveMemory`).
2. **Medication Agent** — Schedule reminders, taken/snoozed/missed tracking (`proposeMarkMedicineTaken`).
3. **Health Monitoring Agent** — Non-diagnostic vital trend briefings & report summarization.
4. **Nutrition & Habit Agent** — Hydration (`proposeLogWater`) & food preference awareness (avoids disliked foods).
5. **Appointment Agent** — Specialist matching & slot proposals (`proposeAppointment`).
6. **Emergency Response Agent** — Distress/symptom detection & immediate 112/contact escalation (`proposeEmergencyReview`).
7. **Family & NGO Coordination Agent** — Consent-scoped notifications, transport (`proposeTransport`), and volunteer requests.

All consequential actions return a structured `AgentProposal` requiring explicit confirmation from the elderly person before mutating state.

## 2. Security, Privacy & Role-Based Access Control (`/server/store.ts`, `/server.ts`)

- Passwords hashed with `crypto.scryptSync` and verified via `crypto.timingSafeEqual`.
- Bearer session tokens signed with HMAC-SHA256 held exclusively in client memory (no `localStorage` token storage).
- Route-level `requireAuth` and `requireRole([...])` enforcement.
- Patient privacy controls (`shareHealthWithFamily`, `shareAppointmentsWithFamily`, `shareNutritionWithFamily`, `shareWithNgoCoordinator`) filter server responses before serialization.
- Prescriptions issued by doctors enter `pending_consent` and cannot modify medication schedules or generate pharmacy orders until the elderly user explicitly consents.
- Every sensitive mutation appends an entry to `auditLogs`.
