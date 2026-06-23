const express = require('express');
const db = require('../utils/db');
const auth = require('../middleware/auth');

const router = express.Router();

// Save / update voice profile (interview answers)
router.post('/interview', auth, (req, res) => {
  try {
    const { ministry, tone, phrases, scriptures, stories, audience, theology, style } = req.body;
    const profile = db.voiceProfiles.upsert(
      { user_id: req.user.id },
      { user_id: req.user.id, name: req.user.name, ministry, tone, phrases, scriptures, stories, audience, theology, style }
    );
    res.json({ profile });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get voice profile
router.get('/profile', auth, (req, res) => {
  const profile = db.voiceProfiles.findOne({ user_id: req.user.id });
  res.json({ profile: profile || null });
});

// Update specific fields
router.put('/profile', auth, (req, res) => {
  try {
    const existing = db.voiceProfiles.findOne({ user_id: req.user.id });
    if (!existing) return res.status(404).json({ error: 'No voice profile found' });
    const updated = db.voiceProfiles.update(existing.id, req.body);
    res.json({ profile: updated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
