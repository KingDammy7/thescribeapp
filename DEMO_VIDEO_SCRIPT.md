# The Scribe — Demo Video Script
**Target length:** ~10 minutes
**Goal:** Show reviewers why this build should be picked — not just that it works, but that it was built with care for the actual end users (apostolic/prophetic authors), with real AI depth, a polished UI, and production-grade infrastructure (auth, email, deployment).

**Tone:** Confident, walk-through narration — like showing a colleague around something you're proud of. Screen recording with voiceover. Let each screen breathe for a second before narrating over it; cursor movements deliberate, not rushed.

---

## 0:00–0:40 — Hook / Opening

**Visual:** Start on the Landing page, hero section visible.

**Say:** "This is The Scribe — an AI writing assistant built specifically for apostolic and prophetic authors. Not a generic 'AI book writer' wrapper — a tool that actually learns a specific author's voice, theology, and signature phrases, and writes full manuscripts that sound like them, not like ChatGPT. I built the entire thing — frontend, backend, AI integration, authentication, email, deployment — and I want to walk you through why it's ready to hand to real users today."

**Visual:** Scroll the landing page slowly — hero, feature cards, footer with legal links.

**Say:** "It's a full product: marketing site, authentication, a multi-step voice-learning engine, a manuscript editor, AI generation, scripture research, and account management — all live, all deployed."

---

## 0:40–1:30 — Sign Up & Email Verification

**Visual:** Click "Get Started" → Auth page → sign up with a fresh email.

**Say:** "Let's start where a real user would. Signing up is straightforward — name, email, password, with a show/hide toggle so people can see what they're typing."

**Visual:** Show the password eye-toggle. Submit.

**Say:** "Behind the scenes this hits a real Express backend with JWT auth and bcrypt-hashed passwords — and it sends a real verification email."

**Visual:** Cut to your test inbox showing the verification email. Click the link, show the Verify Email page confirming success.

**Say:** "No fake 'verified' badge — this is an actual email flow with a real provider, the same one powering password resets."

---

## 1:30–4:15 — Building a Voice Profile (the core differentiator)

**Visual:** Land on the Dashboard's empty state — the four-option voice source picker.

**Say:** "This is the heart of the app. Before The Scribe writes a single word, it needs to learn the author's actual voice — and I built four different ways to teach it, because authors don't all work the same way."

**Visual:** Hover each of the four cards as you name them.

**Say:** "Start an interview, upload your existing books, upload a recorded sermon, or paste sermon notes. Let's try two of these."

### Option A — Guided Interview

**Visual:** Click "Start Interview." Show question 1 ("How would you describe your ministry calling?") with the quick-pick chips.

**Say:** "Eight questions — ministry identity, tone, signature phrases, anchor scriptures, personal stories, audience, theology, writing style. Quick-pick chips give a fast start, but everything's editable, and there's a dictation mic for anyone who'd rather speak their answer."

**Visual:** Tap a chip, edit it slightly, briefly tap the mic to show the listening state, click Next a couple times. Point out "Back to Dashboard," "Try other options," and "Save & Exit" in the header.

**Say:** "Progress autosaves, so nobody loses their answers if they step away mid-interview."

**Visual:** Finish the interview (or skip ahead) → Voice Preview screen with a generated sample passage.

**Say:** "Once it's done, The Scribe generates a writing sample in that exact voice — multiple options to pick from — before anything is locked in."

### Option B — Upload Audio Teaching

**Visual:** Back to Dashboard → click "Upload Audio Teaching."

**Say:** "For preachers, the most natural source of their real voice is a sermon they've already preached. This page accepts a recording — MP3, WAV, M4A, and a few other formats — transcribes it with OpenAI's Whisper model, then has Claude analyze the transcript and build the same voice profile fields."

**Visual:** Drag in a short test recording, click "Transcribe & Analyze," show the loading state, then the review/edit screen with all eight fields pre-filled.

**Say:** "Every field stays editable before saving — the AI gives a strong first draft, but the author always has final say over their own voice profile."

**Visual:** Mention the remaining two without a full demo.

**Say:** "Upload Book works the same way with manuscripts — PDF, DOCX, TXT, or Markdown — and Upload Sermon Notes does it from pasted text, for authors with outlines or transcripts but no files or audio."

---

## 4:15–5:00 — Dashboard

**Visual:** Full Dashboard, with a saved voice profile and at least one manuscript.

**Say:** "Once a voice profile exists, the Dashboard becomes a real home base — stats on manuscripts and progress, a quick way to start a new book, and direct access back into the voice profile to review or edit it anytime."

**Visual:** Point out stat cards, then narrow the browser window to show the sidebar collapse into a mobile hamburger menu.

**Say:** "It's fully responsive — same functionality whether someone's on a laptop or reviewing this on a tablet."

---

## 5:00–6:45 — Creating a Manuscript & AI Outline

**Visual:** Click "New Manuscript."

**Say:** "Starting a book: title, type — teaching book, devotional, memoir, prophetic manual, and so on — and a short statement of purpose, which feeds directly into how the AI writes."

**Visual:** Fill in title and purpose, scroll to chapter count.

**Say:** "Chapter count is kept separate from the introduction and conclusion — pick 10 chapters and you get 10 real chapters, plus a properly labeled introduction and conclusion on top, not folded into that number."

**Visual:** Select a chapter count chip, scroll to the cover style picker.

**Say:** "Then a cover design — real generated cover templates using the book's title, author name, and type, not a placeholder image."

**Visual:** Click through 2–3 cover styles, scroll to "AI Chapter Outline."

**Say:** "And here's where the voice profile pays off — generating an outline doesn't give a generic table of contents. It's shaped by this specific author's theology, audience, and tone."

**Visual:** Click "Generate Outline." Show the chapter list with INTRO and CONCL clearly labeled, separate from the numbered chapters.

**Say:** "Notice the intro and conclusion are marked distinctly from the numbered chapters — that's deliberate, so chapter counts and word-count goals stay accurate."

**Visual:** Click "Create Manuscript & Start Writing."

---

## 6:45–8:15 — AI Generation Mode (multi-chapter)

**Visual:** From the Editor, click "Generate" to enter Generation Mode.

**Say:** "This is where a lot of AI writing tools fall short — they generate one chapter and stop, and you have to manually kick off every chapter after that. The Scribe generates an entire run of selected chapters back to back, automatically moving to the next one the moment the last one finishes."

**Visual:** Select 3–5 chapters via checkboxes, optionally set a focus note on one chapter, click "Generate N Chapters."

**Say:** "You can optionally give a chapter a specific focus — a subject or angle — and the AI works that in."

**Visual:** Let it stream visibly through at least two chapters — live text appearing, progress indicator advancing, chapter dots filling in.

**Say:** "Live streaming text, chapter-by-chapter progress, and it just keeps going until the whole batch is done — no babysitting it one chapter at a time."

**Visual:** Show the "done" state — "X chapters generated in your voice" — click "Open in Editor."

---

## 8:15–9:25 — Editor, AI Assist & Scripture Studio

**Visual:** In the Editor, show the chapter sidebar (with INTRO / numbered chapters / CONCL), word count vs. goal, and the writing area with generated content.

**Say:** "Inside the editor, authors keep writing by hand, ask the AI panel for help — expand a thought, write the next paragraph, make it bolder — and reorder chapters by drag and drop."

**Visual:** Use one quick-action AI chip (e.g. "Expand this thought"), show it inserting text. Drag-reorder two chapters briefly.

**Visual:** Navigate to Scripture Studio.

**Say:** "For scripture research, there's a dedicated studio — search, get AI-suggested scriptures aligned with the author's theology, and send a result straight into the chapter they're working on."

**Visual:** Run a quick search, click "Send to Editor" on a result.

---

## 9:25–9:50 — Export & Account Management

**Visual:** Back in the Editor, click Export, show format options (DOCX/PDF/TXT).

**Say:** "When a manuscript is ready, it exports straight to Word, PDF, or plain text."

**Visual:** Quickly show Settings — profile info, dark/light theme toggle.

**Say:** "Account settings, profile editing, and a light/dark mode toggle round out the basics every real product needs."

---

## 9:50–10:00 — Close

**Visual:** Return to Dashboard or Landing page, hold on a clean shot.

**Say:** "Everything you just saw is live and deployed right now — frontend on Netlify, backend on Render, real authentication, real transactional email, real AI on both the writing and transcription side. This isn't a prototype — it's a working product, built for one specific kind of author, done properly. That's why I built it this way, and that's why I'm confident handing it over."

**[End]**

---

## Pre-recording checklist
- [ ] Backend running with `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` set (Whisper + Claude both need to respond live)
- [ ] A voice profile and at least one manuscript pre-made as backup, in case live AI generation is slow on camera
- [ ] A short (30–60 sec) test audio file ready for the Upload Audio Teaching demo
- [ ] A fresh test email inbox open in another tab/window for the verification email cutaway
- [ ] Browser zoom/window size consistent throughout so text doesn't look cramped
- [ ] Dev console and terminal notifications muted/hidden before recording
- [ ] Do a dry run of the full 10-minute pass once before the real take — note where AI calls are slow and trim narration pauses around them
