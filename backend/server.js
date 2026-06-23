require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── MIDDLEWARE ───────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// ─── ROUTES ───────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/voice', require('./routes/voice'));
app.use('/api/manuscripts', require('./routes/manuscripts'));
app.use('/api/generate', require('./routes/generate'));

// ─── HEALTH CHECK ─────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  res.json({
    status: 'ok',
    ai: hasKey ? 'connected' : 'missing_api_key',
    model: process.env.CLAUDE_MODEL || 'claude-opus-4-5',
  });
});

// ─── ERROR HANDLER ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`\n✦ The Scribe Backend running on http://localhost:${PORT}`);
  console.log(`  AI: ${process.env.ANTHROPIC_API_KEY ? '✅ Connected' : '❌ Add ANTHROPIC_API_KEY to .env'}`);
  console.log(`  Model: ${process.env.CLAUDE_MODEL || 'claude-opus-4-5'}\n`);
});
