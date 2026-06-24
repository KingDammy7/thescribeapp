const OpenAI = require('openai');

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Audio transcription is not set up yet. Add OPENAI_API_KEY to the backend .env to enable "Upload Audio Teaching".');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Transcribes an in-memory audio buffer (from multer memoryStorage) using
// OpenAI's Whisper model. The SDK needs a File-like object, not a raw
// Buffer, so we wrap it with OpenAI.toFile() first.
async function transcribeAudioBuffer(buffer, filename) {
  const openai = getOpenAI();
  const file = await OpenAI.toFile(buffer, filename);
  const result = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
  });
  return result.text;
}

module.exports = { transcribeAudioBuffer };
