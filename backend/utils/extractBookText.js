const path = require('path');

// Pulls plain text out of an uploaded book/manuscript file. Supports the
// formats most authors will actually have on hand: PDF, DOCX, and plain
// text/markdown. Old .doc (binary Word format) is intentionally not
// supported — mammoth only reads the modern .docx XML format.
async function extractText(file) {
  const ext = path.extname(file.originalname || '').toLowerCase();

  if (ext === '.pdf') {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(file.buffer);
    return data.text || '';
  }

  if (ext === '.docx') {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value || '';
  }

  if (ext === '.txt' || ext === '.md') {
    return file.buffer.toString('utf-8');
  }

  throw new Error(`Unsupported file type: ${ext || 'unknown'}`);
}

// Books can be huge — sending an entire manuscript per file would blow past
// reasonable prompt size for 10 files at once. Instead, take three slices
// (opening, middle, closing) so the model sees how the author's voice holds
// up across an entire book, not just the introduction.
function sampleExcerpt(cleanedText, maxLen = 9000) {
  if (cleanedText.length <= maxLen) return cleanedText;

  const sliceSize = Math.floor(maxLen / 3);
  const start = cleanedText.slice(0, sliceSize);
  const midPoint = Math.floor(cleanedText.length / 2);
  const middle = cleanedText.slice(midPoint - sliceSize / 2, midPoint + sliceSize / 2);
  const end = cleanedText.slice(-sliceSize);

  return `${start}\n\n[...]\n\n${middle}\n\n[...]\n\n${end}`;
}

module.exports = { extractText, sampleExcerpt };
