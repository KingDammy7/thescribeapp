const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const db = require('../utils/db');
const auth = require('../middleware/auth');
const { buildOutlinePrompt } = require('../utils/voicePromptBuilder');

const router = express.Router();

// Get all manuscripts for user
router.get('/', auth, (req, res) => {
  const manuscripts = db.manuscripts.findAll({ user_id: req.user.id })
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

  // Attach word count from chapters
  const enriched = manuscripts.map(m => {
    const chapters = db.chapters.findAll({ manuscript_id: m.id });
    const totalWords = chapters.reduce((sum, ch) => sum + (ch.word_count || 0), 0);
    const doneChapters = chapters.filter(ch => ch.status === 'complete').length;
    const progress = m.total_chapters > 0 ? Math.round((doneChapters / m.total_chapters) * 100) : 0;
    return { ...m, total_words: totalWords, chapters_done: doneChapters, progress };
  });

  res.json({ manuscripts: enriched });
});

// Create manuscript
router.post('/', auth, (req, res) => {
  try {
    const { title, type, purpose, total_chapters, outline, cover_style } = req.body;
    const manuscript = db.manuscripts.create({
      user_id: req.user.id,
      title: title || 'Untitled',
      type: type || 'Teaching Book',
      purpose: purpose || '',
      total_chapters: total_chapters || 10,
      cover_style: cover_style || 'aurora',
      status: 'draft',
    });

    // Create chapter stubs from outline if provided
    if (outline && Array.isArray(outline)) {
      outline.forEach(ch => {
        db.chapters.create({
          manuscript_id: manuscript.id,
          chapter_number: ch.number,
          title: ch.title,
          description: ch.description || '',
          content: '',
          word_count: 0,
          status: 'empty',
        });
      });
    }

    res.json({ manuscript });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get single manuscript
router.get('/:id', auth, (req, res) => {
  const manuscript = db.manuscripts.findById(req.params.id);
  if (!manuscript || manuscript.user_id !== req.user.id) {
    return res.status(404).json({ error: 'Not found' });
  }
  const chapters = db.chapters.findAll({ manuscript_id: manuscript.id })
    .sort((a, b) => a.chapter_number - b.chapter_number);
  res.json({ manuscript, chapters });
});

// Update manuscript
router.put('/:id', auth, (req, res) => {
  try {
    const manuscript = db.manuscripts.findById(req.params.id);
    if (!manuscript || manuscript.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Not found' });
    }
    const updated = db.manuscripts.update(req.params.id, req.body);
    res.json({ manuscript: updated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete manuscript
router.delete('/:id', auth, (req, res) => {
  const manuscript = db.manuscripts.findById(req.params.id);
  if (!manuscript || manuscript.user_id !== req.user.id) {
    return res.status(404).json({ error: 'Not found' });
  }
  // Delete chapters too
  db.chapters.findAll({ manuscript_id: req.params.id }).forEach(ch => db.chapters.delete(ch.id));
  db.manuscripts.delete(req.params.id);
  res.json({ success: true });
});

// === CHAPTERS ===

// Get chapters
router.get('/:id/chapters', auth, (req, res) => {
  const manuscript = db.manuscripts.findById(req.params.id);
  if (!manuscript || manuscript.user_id !== req.user.id) {
    return res.status(404).json({ error: 'Not found' });
  }
  const chapters = db.chapters.findAll({ manuscript_id: req.params.id })
    .sort((a, b) => a.chapter_number - b.chapter_number);
  res.json({ chapters });
});

// Update chapter content
router.put('/:id/chapters/:chapterId', auth, (req, res) => {
  try {
    const manuscript = db.manuscripts.findById(req.params.id);
    if (!manuscript || manuscript.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Not found' });
    }
    const { content, title, status } = req.body;
    const wordCount = content ? content.trim().split(/\s+/).filter(Boolean).length : 0;
    const updated = db.chapters.update(req.params.chapterId, {
      ...(content !== undefined && { content, word_count: wordCount }),
      ...(title && { title }),
      ...(status && { status }),
    });
    // Update manuscript updated_at
    db.manuscripts.update(req.params.id, {});
    res.json({ chapter: updated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// === GENERATE OUTLINE FOR EXISTING MANUSCRIPT (creates real chapter rows) ===
router.post('/:id/generate-outline', auth, async (req, res) => {
  try {
    const manuscript = db.manuscripts.findById(req.params.id);
    if (!manuscript || manuscript.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Not found' });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set in .env' });
    }

    const profile = db.voiceProfiles.findOne({ user_id: req.user.id }) || { name: req.user.name };
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const prompt = buildOutlinePrompt(profile, manuscript);

    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Failed to parse outline');
    const outline = JSON.parse(jsonMatch[0]);

    // Clear any existing empty chapters before adding the new outline
    db.chapters.findAll({ manuscript_id: manuscript.id }).forEach(ch => {
      if (ch.status === 'empty') db.chapters.delete(ch.id);
    });

    outline.forEach(ch => {
      db.chapters.create({
        manuscript_id: manuscript.id,
        chapter_number: ch.number,
        title: ch.title,
        description: ch.description || '',
        content: '',
        word_count: 0,
        status: 'empty',
      });
    });

    db.manuscripts.update(manuscript.id, { total_chapters: outline.length });

    const chapters = db.chapters.findAll({ manuscript_id: manuscript.id }).sort((a, b) => a.chapter_number - b.chapter_number);
    res.json({ chapters });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// === REORDER CHAPTERS ===
router.put('/:id/chapters/reorder', auth, (req, res) => {
  try {
    const manuscript = db.manuscripts.findById(req.params.id);
    if (!manuscript || manuscript.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Not found' });
    }
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds must be an array' });

    orderedIds.forEach((chapterId, i) => {
      const ch = db.chapters.findById(chapterId);
      if (ch && ch.manuscript_id === manuscript.id) {
        // Preserve a special "0" intro slot if it was already numbered 0
        const newNumber = ch.chapter_number === 0 ? 0 : i + 1;
        db.chapters.update(chapterId, { chapter_number: newNumber });
      }
    });

    const chapters = db.chapters.findAll({ manuscript_id: manuscript.id }).sort((a, b) => a.chapter_number - b.chapter_number);
    res.json({ chapters });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// === EXPORT MANUSCRIPT AS PLAIN TEXT ===
router.get('/:id/export', auth, (req, res) => {
  const manuscript = db.manuscripts.findById(req.params.id);
  if (!manuscript || manuscript.user_id !== req.user.id) {
    return res.status(404).json({ error: 'Not found' });
  }
  const chapters = db.chapters.findAll({ manuscript_id: manuscript.id }).sort((a, b) => a.chapter_number - b.chapter_number);

  let text = `${manuscript.title}\n${'='.repeat(manuscript.title.length)}\n\n`;
  if (manuscript.purpose) text += `${manuscript.purpose}\n\n`;
  text += '\n';

  chapters.forEach(ch => {
    const heading = ch.chapter_number === 0 ? ch.title : `Chapter ${ch.chapter_number}: ${ch.title}`;
    text += `${heading}\n${'-'.repeat(heading.length)}\n\n`;
    text += (ch.content && ch.content.trim()) ? `${ch.content.trim()}\n\n` : '[This chapter has not been written yet.]\n\n';
  });

  const filename = manuscript.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'manuscript';
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.txt"`);
  res.send(text);
});

module.exports = router;
