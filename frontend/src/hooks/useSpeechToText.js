import { useRef, useState, useCallback, useEffect } from 'react';

// Thin wrapper around the browser's native Web Speech API. Only available in
// Chrome, Edge, and a few Chromium-based browsers (window.webkitSpeechRecognition) —
// not supported in Safari or Firefox as of this writing. Callers should check
// `supported` and hide/disable the mic control gracefully when false, since most
// authors will still type rather than dictate.
export default function useSpeechToText({ onFinalChunk } = {}) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const SpeechRecognitionImpl = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;
  const supported = !!SpeechRecognitionImpl;

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    if (!supported || listening) return;
    const recognition = new SpeechRecognitionImpl();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          onFinalChunk?.(event.results[i][0].transcript.trim());
        }
      }
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [supported, listening, onFinalChunk, SpeechRecognitionImpl]);

  const toggle = useCallback(() => {
    if (listening) stop(); else start();
  }, [listening, start, stop]);

  useEffect(() => () => { recognitionRef.current?.stop(); }, []);

  return { supported, listening, start, stop, toggle };
}
