const express = require('express');
const multer = require('multer');
const Anthropic = require('@anthropic-ai/sdk');
const db = require('../utils/db');
const auth = require('../middleware/auth');
const { buildVoiceSystemPrompt, buildOutlinePrompt, buildScriptureSuggestionPrompt } = require('../utils/voicePromptBuilder');
const { extractText, sampleExcerpt } = require('../utils/extractBookText');
const { transcribeAudioBuffer } = require('../utils/transcribe');

const router = express.Router();

// Memory storage — files are small enough (manuscripts, not media) to hold
// in RAM just long enough to extract their text, then they're discarded.
const ALLOWED_BOOK_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md'];
const bookUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    const ext = '.' + (file.originalname.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_BOOK_EXTENSIONS.includes(ext)) {
      return cb(new Error(`Unsupported file type "${ext}". Please upload PDF, DOCX, TXT, or MD files.`));
    }
    cb(null, true);
  },
});

const ALLOWED_AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.mp4', '.webm', '.ogg', '.aac'];
const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 60 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const ext = '.' + (file.originalname.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_AUDIO_EXTENSIONS.includes(ext)) {
      return cb(new Error(`Unsupported audio type "${ext}". Please upload MP3, WAV, M4A, MP4, WEBM, OGG, or AAC.`));
    }
    cb(null, true);
  },
});

function getAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set in .env');
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function getVoiceProfile(userId, userName) {
  return db.voiceProfiles.findOne({ user_id: userId }) || { name: userName };
}

// ─── STREAMING HELPERS ───────────────────────────────────────────────
function setupSSE(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();
}

async function streamClaude(res, systemPrompt, userPrompt, onComplete) {
  const anthropic = getAnthropic();
  let fullText = '';

  const stream = anthropic.messages.stream({
    model: process.env.CLAUDE_MODEL || 'claude-opus-4-5',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
      fullText += chunk.delta.text;
      res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
    }
  }

  res.write('data: [DONE]\n\n');
  res.end();

  if (onComplete) await onComplete(fullText);
}

// ─── VOICE PREVIEW ───────────────────────────────────────────────────
// Generates a live sample paragraph in the author's voice right after interview
router.post('/voice-preview', auth, async (req, res) => {
  try {
    setupSSE(res);
    const profile = getVoiceProfile(req.user.id, req.user.name);

    const systemPrompt = buildVoiceSystemPrompt(profile);
    const userPrompt = `Write a powerful opening paragraph for a ministry book in ${profile.name || req.user.name}'s voice.
Make it 150-200 words. It should feel like the opening of a prophetic message — urgent, personal, and anointed.
Do not explain what you're doing, just write the paragraph.`;

    await streamClaude(res, systemPrompt, userPrompt);
  } catch (e) {
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
    res.end();
  }
});

// ─── VOICE SAMPLES (multiple variations to choose from) ──────────────
// Generates 3 distinct voice samples in parallel so the author can pick
// the one that feels most like them, then edit it before saving it as
// their anchor "sample_passage" — a reference the AI can lean on for
// every future generation (chapter, chat, rewrite).
const VOICE_SAMPLE_ANGLES = [
  { id: 'declarative', label: 'Bold & Declarative', instruction: 'Lead with prophetic authority and urgency — short, punchy declarations that hit like a sermon opener.' },
  { id: 'narrative', label: 'Personal & Narrative', instruction: 'Ground it in personal testimony and warmth — tell it the way you would share a defining story from the pulpit.' },
  { id: 'teaching', label: 'Teaching & Instructional', instruction: 'Lean into clear, structured teaching authority — the way you would open a message meant to equip and instruct.' },
];

router.post('/voice-samples', auth, async (req, res) => {
  try {
    const profile = getVoiceProfile(req.user.id, req.user.name);
    const anthropic = getAnthropic();
    const systemPrompt = buildVoiceSystemPrompt(profile);

    const samples = await Promise.all(VOICE_SAMPLE_ANGLES.map(async (angle) => {
      const userPrompt = `Write a powerful opening paragraph for a ministry book in ${profile.name || req.user.name}'s voice.
Make it 120-170 words. ${angle.instruction}
Do not explain what you're doing, just write the paragraph.`;

      const response = await anthropic.messages.create({
        model: process.env.CLAUDE_MODEL || 'claude-opus-4-5',
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      return { id: angle.id, label: angle.label, text: response.content[0].text.trim() };
    }));

    res.json({ samples });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── VOICE FROM BOOKS ────────────────────────────────────────────────
// The author uploads 1-10 of their own books/manuscripts (PDF/DOCX/TXT/MD).
// We extract text, sample it, and ask Claude to reverse-engineer their
// voice profile from real evidence instead of self-reported answers.
// This does NOT save anything — it returns a draft the author reviews
// and edits on the frontend before it's saved to their profile, same as
// the multi-sample voice picker.
router.post('/voice-from-books', auth, (req, res) => {
  bookUpload.array('books', 10)(req, res, async (multerErr) => {
    if (multerErr) {
      return res.status(400).json({ error: multerErr.message || 'Could not process those files.' });
    }
    try {
      const files = req.files || [];
      const pastedNotes = (req.body.notes || '').replace(/\s+/g, ' ').trim();

      if (!files.length && !pastedNotes) {
        return res.status(400).json({ error: 'Please upload a book/manuscript file or paste a sermon note or teaching to analyze.' });
      }

      const excerpts = [];
      for (const file of files) {
        try {
          const raw = await extractText(file);
          const cleaned = (raw || '').replace(/\s+/g, ' ').trim();
          if (cleaned.length < 300) continue; // too short to learn anything from — skip silently
          excerpts.push({ filename: file.originalname, text: sampleExcerpt(cleaned, 9000) });
        } catch {
          continue; // one unreadable file shouldn't fail the whole batch
        }
      }

      if (pastedNotes.length >= 300) {
        excerpts.push({ filename: 'Pasted Sermon Note / Teaching', text: sampleExcerpt(pastedNotes, 9000) });
      }

      if (!excerpts.length) {
        return res.status(400).json({ error: pastedNotes
          ? 'That note is a bit short to learn your voice from — paste a fuller sermon, teaching, or message (at least a few paragraphs).'
          : "We couldn't read text from any of those files. Please upload PDF, DOCX, TXT, or MD files of your own writing." });
      }

      const anthropic = getAnthropic();
      const booksBlock = excerpts.map((e, i) => `--- SOURCE ${i + 1}: "${e.filename}" ---\n${e.text}`).join('\n\n');
      const authorName = req.user.name || 'the author';

      const prompt = `You are a literary voice analyst. Below are excerpts from ${excerpts.length} source(s) (books, manuscripts, sermon notes, or teaching transcripts) written or preached by ${authorName}. Study them closely and reverse-engineer this author's unique writing voice and ministry identity from real evidence — do not guess generically.

${booksBlock}

Return ONLY a JSON object with these exact string fields, based strictly on what you read above:
{
  "ministry": "Their ministry identity and calling, inferred from how they write and what they emphasize",
  "tone": "Their preaching/writing tone (bold, pastoral, fiery, etc.) — be specific about the texture of their actual sentences",
  "phrases": "3-6 signature phrases or expressions they actually repeat across these excerpts, comma-separated, no quotation marks",
  "scriptures": "3-5 scripture references they actually cite or allude to in these excerpts, comma-separated",
  "stories": "One defining personal story, testimony, or illustration found in these excerpts, summarized in their own voice",
  "audience": "Who they are clearly writing for, based on the language and assumptions in the text",
  "theology": "Their theological framework and convictions, as evidenced by the text",
  "style": "Their writing style (poetic, academic, narrative, declarative, etc.)",
  "sample_passage": "A 120-170 word passage you write yourself in their exact voice, suitable as an anchor sample for a new chapter opening — don't just copy text verbatim from the excerpts"
}

Return ONLY the JSON object — no explanation, no markdown code fences.`;

      const response = await anthropic.messages.create({
        model: process.env.CLAUDE_MODEL || 'claude-opus-4-5',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Could not analyze your books right now. Please try again.');
      const profile = JSON.parse(jsonMatch[0]);

      res.json({ profile, filesAnalyzed: excerpts.map(e => e.filename) });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
});

// ─── VOICE FROM AUDIO TEACHING ───────────────────────────────────────
// The author uploads a recording of a sermon or teaching they preached.
// We transcribe it with Whisper, then reverse-engineer their voice
// profile from the transcript the same way /voice-from-books does for
// written excerpts. Like the other voice-building routes, this returns
// a draft for the author to review/edit before anything is saved.
router.post('/voice-from-audio', auth, (req, res) => {
  audioUpload.single('audio')(req, res, async (multerErr) => {
    if (multerErr) {
      return res.status(400).json({ error: multerErr.message || 'Could not process that audio file.' });
    }
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Please upload an audio recording of a sermon or teaching.' });
      }

      let transcript;
      try {
        transcript = await transcribeAudioBuffer(req.file.buffer, req.file.originalname);
      } catch (e) {
        return res.status(503).json({ error: e.message });
      }

      const cleaned = (transcript || '').replace(/\s+/g, ' ').trim();
      if (cleaned.length < 300) {
        return res.status(400).json({ error: "We couldn't get enough spoken content from that recording. Please upload a clearer or longer teaching." });
      }

      const anthropic = getAnthropic();
      const authorName = req.user.name || 'the author';
      const excerptText = sampleExcerpt(cleaned, 9000);

      const prompt = `You are a literary voice analyst. Below is a transcript of a sermon or teaching preached by ${authorName}. Study it closely and reverse-engineer this author's unique speaking/writing voice and ministry identity from real evidence — do not guess generically.

--- TRANSCRIPT: "${req.file.originalname}" ---
${excerptText}

Return ONLY a JSON object with these exact string fields, based strictly on what you read above:
{
  "ministry": "Their ministry identity and calling, inferred from how they speak and what they emphasize",
  "tone": "Their preaching/speaking tone (bold, pastoral, fiery, etc.) — be specific about the texture of their actual sentences",
  "phrases": "3-6 signature phrases or expressions they actually repeat in this transcript, comma-separated, no quotation marks",
  "scriptures": "3-5 scripture references they actually cite or allude to in this transcript, comma-separated",
  "stories": "One defining personal story, testimony, or illustration found in this transcript, summarized in their own voice",
  "audience": "Who they are clearly speaking to, based on the language and assumptions in the transcript",
  "theology": "Their theological framework and convictions, as evidenced by the transcript",
  "style": "Their speaking/writing style (poetic, academic, narrative, declarative, etc.)",
  "sample_passage": "A 120-170 word passage you write yourself in their exact voice, suitable as an anchor sample for a new chapter opening — don't just copy text verbatim from the transcript"
}

Return ONLY the JSON object — no explanation, no markdown code fences.`;

      const response = await anthropic.messages.create({
        model: process.env.CLAUDE_MODEL || 'claude-opus-4-5',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Could not analyze that recording right now. Please try again.');
      const profile = JSON.parse(jsonMatch[0]);

      res.json({ profile, filesAnalyzed: [req.file.originalname] });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
});

// ─── CHAPTER GENERATION ─────────────────────────────────────────────
// Generates a full chapter in the author's voice
router.post('/chapter', auth, async (req, res) => {
  try {
    setupSSE(res);
    const { manuscriptId, chapterId, prompt: customPrompt, focus } = req.body;

    const manuscript = db.manuscripts.findById(manuscriptId);
    if (!manuscript || manuscript.user_id !== req.user.id) {
      res.write(`data: ${JSON.stringify({ error: 'Manuscript not found' })}\n\n`);
      return res.end();
    }

    const chapter = db.chapters.findById(chapterId);
    const profile = getVoiceProfile(req.user.id, req.user.name);
    const systemPrompt = buildVoiceSystemPrompt(profile, {
      bookTitle: manuscript.title,
      chapterTitle: chapter?.title,
      chapterNumber: chapter?.chapter_number,
      purpose: manuscript.purpose,
    });

    // The author can optionally specify what this particular chapter should
    // focus on (subject matter) to steer the AI's writing — persisted on the
    // chapter as `description`, or passed fresh from the generation screen.
    const chapterFocus = (focus || chapter?.description || '').trim();
    const focusLine = chapterFocus
      ? `\n\nThe author wants this chapter to specifically focus on: "${chapterFocus}". Keep the entire chapter centered on this subject — don't drift into unrelated topics.`
      : '';

    const userPrompt = customPrompt ||
      `Write a complete chapter titled "${chapter?.title || 'Chapter'}" for the book "${manuscript.title}".

This chapter should be 600-900 words, written in ${profile.name || req.user.name}'s exact voice.
Structure: Opening hook → Core teaching → Personal illustration or scripture → Prophetic declaration → Closing challenge.
Do not use subheadings. Write as flowing, powerful prose.${focusLine}`;

    await streamClaude(res, systemPrompt, userPrompt, async (fullText) => {
      if (chapterId && fullText) {
        const wordCount = fullText.trim().split(/\s+/).filter(Boolean).length;
        db.chapters.update(chapterId, { content: fullText, word_count: wordCount, status: 'complete' });
        db.manuscripts.update(manuscriptId, {});
      }
    });
  } catch (e) {
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
    res.end();
  }
});

// ─── AI CHAT ASSISTANT ───────────────────────────────────────────────
// In-editor AI assistant that responds to any writing request
router.post('/chat', auth, async (req, res) => {
  try {
    setupSSE(res);
    const { message, manuscriptId, selectedText, context: msgContext } = req.body;

    const profile = getVoiceProfile(req.user.id, req.user.name);
    let manuscript = null;
    if (manuscriptId) manuscript = db.manuscripts.findById(manuscriptId);

    const systemPrompt = buildVoiceSystemPrompt(profile, {
      bookTitle: manuscript?.title,
      purpose: manuscript?.purpose,
    });

    const contextPrefix = selectedText
      ? `The author has selected this text from their manuscript:\n\n"${selectedText}"\n\n`
      : '';

    const userPrompt = `${contextPrefix}Author's request: ${message}

Respond helpfully and write any content in ${profile.name || req.user.name}'s voice.
If asked to write, generate content immediately without preamble.
If giving feedback or suggestions, be specific and actionable.`;

    await streamClaude(res, systemPrompt, userPrompt);
  } catch (e) {
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
    res.end();
  }
});

// ─── OUTLINE GENERATION ──────────────────────────────────────────────
// Non-streaming: returns JSON outline
router.post('/outline', auth, async (req, res) => {
  try {
    const { title, type, purpose, total_chapters } = req.body;
    const profile = getVoiceProfile(req.user.id, req.user.name);
    const anthropic = getAnthropic();

    const prompt = buildOutlinePrompt(profile, { title, type, purpose, total_chapters });

    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text;
    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Failed to parse outline');
    const outline = JSON.parse(jsonMatch[0]);
    res.json({ outline });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── SCRIPTURE SUGGESTIONS ───────────────────────────────────────────
router.post('/scripture-suggest', auth, async (req, res) => {
  try {
    setupSSE(res);
    const { context: ctx } = req.body;
    const profile = getVoiceProfile(req.user.id, req.user.name);
    const anthropic = getAnthropic();

    const prompt = buildScriptureSuggestionPrompt(profile, ctx);

    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    res.write(`data: ${JSON.stringify({ suggestions })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (e) {
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
    res.end();
  }
});

// ─── REWRITE SELECTED TEXT ───────────────────────────────────────────
router.post('/rewrite', auth, async (req, res) => {
  try {
    setupSSE(res);
    const { text, instruction } = req.body;
    const profile = getVoiceProfile(req.user.id, req.user.name);
    const systemPrompt = buildVoiceSystemPrompt(profile);

    const userPrompt = `Rewrite the following text in ${profile.name || req.user.name}'s exact voice.
${instruction ? `Instruction: ${instruction}` : 'Make it more powerful, prophetic, and true to their voice.'}

Original text:
"${text}"

Return ONLY the rewritten text, no explanation.`;

    await streamClaude(res, systemPrompt, userPrompt);
  } catch (e) {
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
    res.end();
  }
});

module.exports = router;
