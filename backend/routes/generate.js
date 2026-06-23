const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const db = require('../utils/db');
const auth = require('../middleware/auth');
const { buildVoiceSystemPrompt, buildOutlinePrompt, buildScriptureSuggestionPrompt } = require('../utils/voicePromptBuilder');

const router = express.Router();

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
