# The Scribe — AI Writing Assistant for Ministry Voices

> A premium AI writing platform built exclusively for apostolic, prophetic, and Spirit-filled authors.

## Quick Start (5 minutes)

### Prerequisites
- Node.js 18+ ([nodejs.org](https://nodejs.org))
- An Anthropic API key (already added to `.env`)

---

### 1. Start the Backend

```bash
cd backend
npm install
npm run dev
```

You should see:
```
✦ The Scribe Backend running on http://localhost:5000
  AI: ✅ Connected
  Model: claude-opus-4-5
```

---

### 2. Start the Frontend

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Using the App

### Full Flow (for demo recording)

1. **Landing** → Click "Get Started"
2. **Sign Up** → Create an account
3. **Voice Interview** → Answer all 8 questions about your ministry voice
4. **Voice Preview** → Watch the AI write a paragraph in your voice (live streaming)
5. **Dashboard** → Your manuscript hub
6. **New Manuscript** → Title + type + AI-generated chapter outline
7. **Editor** → Write with the AI Scribe assistant panel
8. **Generate Mode** → Let AI write full chapters in your voice
9. **Scripture Studio** → Browse library + AI scripture suggestions
10. **Voice Profile** → See your full AI fingerprint
11. **Settings** → Update your profile

---

## Project Structure

```
the-scribe-app/
├── backend/
│   ├── .env                    ← API keys go here
│   ├── server.js               ← Express app
│   ├── routes/
│   │   ├── auth.js             ← Login, register, profile
│   │   ├── voice.js            ← Voice profile CRUD
│   │   ├── manuscripts.js      ← Manuscript + chapter CRUD
│   │   └── generate.js         ← All AI endpoints (streaming)
│   ├── middleware/
│   │   └── auth.js             ← JWT middleware
│   └── utils/
│       ├── db.js               ← JSON file-based DB
│       └── voicePromptBuilder.js ← Core AI prompt engine
│
└── frontend/
    ├── src/
    │   ├── App.jsx             ← Router
    │   ├── store/useStore.js   ← Global state (Zustand)
    │   ├── lib/api.js          ← Axios + streaming utility
    │   ├── components/         ← Logo, Sidebar, AppShell, etc.
    │   └── pages/              ← All 11 screens
    └── index.css               ← Design system
```

---

## AI Architecture

The key to The Scribe is the **Voice Prompt Builder** (`backend/utils/voicePromptBuilder.js`).

When a user completes their interview, their answers are stored as a Voice Profile. Every AI call constructs a detailed system prompt from this profile:

```
You are The Scribe — a ghostwriter who has studied [Author Name]'s
ministry voice for years. You write EXCLUSIVELY in their voice.

MINISTRY IDENTITY: [their answer]
PREACHING TONE: [their answer]
SIGNATURE PHRASES: [their phrases]
ANCHOR SCRIPTURES: [their scriptures]
...

VOICE RULES:
1. Sound like [Author] — not a generic Christian voice
2. Use their signature phrases organically
3. Reference their anchor scriptures as they preach them
...
```

This system prompt is what makes every generated paragraph feel unmistakably personal.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/voice/interview` | Save interview answers |
| GET | `/api/voice/profile` | Get voice profile |
| GET | `/api/manuscripts` | List manuscripts |
| POST | `/api/manuscripts` | Create manuscript |
| PUT | `/api/manuscripts/:id/chapters/:cid` | Update chapter |
| POST | `/api/generate/voice-preview` | Stream voice sample (SSE) |
| POST | `/api/generate/chapter` | Stream full chapter (SSE) |
| POST | `/api/generate/chat` | Stream AI chat (SSE) |
| POST | `/api/generate/outline` | Generate chapter outline |
| POST | `/api/generate/scripture-suggest` | AI scripture suggestions |

---

## Tech Stack

**Frontend:** React 18 · React Router · Zustand · Axios · Vite · Tailwind CSS

**Backend:** Node.js · Express · JWT Auth · JSON file DB

**AI:** Anthropic Claude (`claude-opus-4-5`) · Server-Sent Events streaming

---

## Design System

- **Colors:** Deep navy (`#060d1a`) + Gold (`#c9a44e`) + Cream (`#f5efe0`)
- **Typography:** Playfair Display (headings/body text) · Inter (UI)
- **Components:** Glass cards, gold shimmer buttons, streaming cursors, animated progress
