# SENIORA — AI Elderly Care & Companionship Ecosystem

**Tagline:** *Care That Understands. Companionship That Never Leaves.*

SENIORA is a full-stack, voice-first, multilingual AI elderly-care platform built with React, TypeScript, Tailwind CSS, Express, WebSockets, and `@google/genai`.

## Features Implemented

1. **Voice-First Welcome & 7-Step Onboarding** (`/src/components/OnboardingFlow.tsx`):
   - Greets the elder automatically before showing the dashboard.
   - Asks 7 questions one at a time (name, language, voice persona with sample preview, speaking pace, living arrangement, support areas, emergency contact) with speak/type, skip, and repeat options.
2. **Human Live Video Companion** (`/src/components/LiveVideoCompanionModal.tsx`):
   - Opens automatically when the user taps **"Talk to your companion"**.
   - Features a realistic human video-call portrait, optional self-camera PIP, live Speech-to-Text (`SpeechRecognition`), Gemini Multi-Agent Orchestration (`gemini-4-hydrogen`), Gemini TTS (`gemini-3.8-flash-lite-tts` with browser SpeechSynthesis fallback), voice interruption, continuous listening, adjustable speed & volume, and 1-tap confirmation cards.
3. **Complete Multilingual Interface (English, தமிழ், हिन्दी)** (`/src/i18n/translations.ts`):
   - Switching language translates navigation, greetings, medicines, appointments, health watch, transport, companionship, emergency instructions, and AI conversations.
4. **Connected 8-Role Ecosystem & Live WebSocket Sync** (`/server.ts`, `/server/store.ts`, `/src/components/RoleDashboards.tsx`):
   - **Elderly User**: Personal Dashboard, Healthcare & Consent, Doctor Bookings, HEALTH WATCH, Transport, Companionship & Memory, Verified Opportunities, Reminders, Settings.
   - **Doctor (`Dr. Arjun`)**: Patient clinical summary, vitals charts, report review, consultation notes, and digital prescriptions requiring explicit patient consent.
   - **Family Member (`Priya`)**: Privacy-respecting wellbeing summary, **Voices of Love** audio/text greetings, notification preferences.
   - **Pharmacy (`MedPlus Care Pharmacy`)**: Consented prescription queue, availability confirmation, order preparation.
   - **Delivery Partner (`Karthik R.`)**: Assigned deliveries, secure address view, delivery status updates (`Out for Delivery` -> `Delivered`).
   - **Transport Partner (`CityCare Mobility`)**: Accessible vehicle dispatch and live trip status updates.
   - **NGO Care Coordinator (`Meena`)**: Elderly registry, volunteer assignment, assistance requests, visit completion reports, SOS coordination.
   - **Administrator**: Security & Multi-Agent Audit Log, role isolation monitoring, demo reset.
5. **Officially Sourced Global & Indian Impact Page** (`/src/components/GlobalImpactPage.tsx`, `/server/officialStats.ts`):
   - Cited WHO, UN DESA, UNFPA India Ageing Report 2023, MoSPI, and LASI Wave-1 data clearly separated from `DEMO` 5-year and 10-year INR (`₹`) / USD (`$`) projections.

## Installation & Setup

```bash
npm install
npm run dev
```

The Express + WebSocket + Vite server runs on `http://localhost:3000`.

### Production Build

```bash
npm run build
npm start
```

## Environment Variables (`.env.example`)

- `GEMINI_API_KEY`: Server-side Gemini API key (configured via AI Studio Secrets; never exposed to the browser).
- `PORT`: Server port (defaults to `3000`).
- `SESSION_SECRET`: Optional HMAC signing secret for session tokens (ephemeral CSPRNG fallback used if unset).

## Demo Login Credentials

All accounts connect to the same persistent demo database (`./data/seniora-db.json`):

| Role | Email | Password |
| :--- | :--- | :--- |
| Elderly Person (Lakshmi) | `lakshmi@seniora.demo` | `lakshmi123` |
| Doctor (Dr. Arjun Menon) | `arjun.doctor@seniora.demo` | `doctor123` |
| Family Member (Priya) | `priya.family@seniora.demo` | `family123` |
| Pharmacy Partner | `pharmacy@seniora.demo` | `pharmacy123` |
| Delivery Partner (Karthik) | `karthik.delivery@seniora.demo` | `delivery123` |
| Transport Partner | `transport@seniora.demo` | `transport123` |
| NGO Coordinator (Meena) | `meena.ngo@seniora.demo` | `ngo123` |
| Administrator | `admin@seniora.demo` | `admin123` |

## Integration Limitations & Demo Scope

- **Smartwatch (`HEALTH WATCH`)**: Attempts Web Bluetooth Heart-Rate pairing when supported; otherwise runs in clearly labelled `DEMO DATA` mode.
- **Pharmacy, Delivery, Transport & Doctor Bookings**: Simulated end-to-end workflows clearly badged `DEMO`; not connected to live commercial provider APIs.
- **Emergency SOS (112)**: Uses `tel:` links where supported by the device; web alerts are logged to Family, NGO, and Doctor dashboards in `DEMO` mode rather than placing automated carrier phone calls.
