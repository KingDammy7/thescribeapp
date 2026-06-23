import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import Btn from '../components/Btn';
import Icon from '../components/Icon';
import useStore from '../store/useStore';
import { streamRequest } from '../lib/api';

export default function VoicePreview() {
  const [phase, setPhase] = useState('analyzing'); // analyzing | generating | done | error
  const [displayText, setDisplayText] = useState('');
  const [error, setError] = useState('');
  const { user, voiceProfile } = useStore();
  const navigate = useNavigate();
  const textRef = useRef('');
  const hasStarted = useRef(false);

  const tags = ['Prophetic Tone', 'Anchor Scriptures', 'Signature Phrases', 'Preaching Style', 'Theological Frame'];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasStarted.current) {
        hasStarted.current = true;
        startGeneration();
      }
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  const startGeneration = () => {
    setPhase('generating');
    textRef.current = '';
    setDisplayText('');

    streamRequest(
      '/api/generate/voice-preview',
      {},
      (chunk) => {
        textRef.current += chunk;
        setDisplayText(textRef.current);
      },
      () => setPhase('done'),
      (err) => { setError(err); setPhase('error'); }
    );
  };

  const regenerate = () => {
    hasStarted.current = false;
    setPhase('analyzing');
    setDisplayText('');
    setError('');
    textRef.current = '';
    setTimeout(() => {
      hasStarted.current = true;
      startGeneration();
    }, 2000);
  };

  return (
    <div className="bg-hero" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 720, width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div className="tag tag-gold" style={{ display: 'inline-flex', marginBottom: 14 }}>
            ✦ Voice Analysis Complete
          </div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(28px,4vw,44px)', color: 'var(--cream)', marginBottom: 10 }}>
            {phase === 'analyzing' ? 'Studying your voice...' : phase === 'done' ? 'This sounds like you.' : 'Writing in your voice...'}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 15 }}>
            {phase === 'analyzing'
              ? 'The Scribe is analyzing your theological fingerprint'
              : phase === 'done'
                ? 'Your AI ghostwriter is ready. Every manuscript will sound unmistakably like you.'
                : 'Generating your first voice sample...'}
          </p>
        </div>

        {/* Analyzing phase */}
        {phase === 'analyzing' && (
          <div className="glass" style={{ borderRadius: 20, padding: '48px', textAlign: 'center' }}>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 36 }}>
              {tags.map((tag, i) => (
                <div key={i} className="tag tag-gold shimmer-overlay" style={{ position: 'relative', overflow: 'hidden', animationDelay: `${i * 0.2}s` }}>
                  {tag}
                </div>
              ))}
            </div>
            <div className="spin" style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid var(--border-bright)', borderTopColor: 'var(--gold)', margin: '0 auto' }} />
            <p style={{ marginTop: 20, color: 'var(--muted)', fontSize: 14 }}>Building your voice fingerprint...</p>
          </div>
        )}

        {/* Generating / Done phase */}
        {(phase === 'generating' || phase === 'done') && (
          <div className="glass" style={{ borderRadius: 20, padding: '36px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,var(--gold-dim),var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy-900)' }}>
                  {(user?.name || 'A')[0].toUpperCase()}
                </span>
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--cream)', fontSize: 14 }}>{user?.name || 'Author'}</div>
                <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>✦ AI-Generated in Your Voice</div>
              </div>
              {phase === 'generating' && <div className="notif-dot pulse-gold" style={{ marginLeft: 'auto' }} />}
            </div>
            {phase === 'done' && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
                {tags.map((tag, i) => <span key={i} className="tag tag-blue" style={{ fontSize: 10 }}>{tag}</span>)}
              </div>
            )}
            <div className="divider" style={{ marginBottom: 24 }} />
            <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(15px,2vw,18px)', lineHeight: 1.9, color: 'var(--cream-dim)', minHeight: 200, whiteSpace: 'pre-wrap' }}>
              {displayText}
              {phase === 'generating' && <span className="cursor" />}
            </p>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div className="glass" style={{ borderRadius: 16, padding: '32px', textAlign: 'center', border: '1px solid rgba(239,68,68,0.3)' }}>
            <Icon name="alertCircle" size={36} style={{ color: '#fca5a5', marginBottom: 12 }} />
            <p style={{ color: '#fca5a5', marginBottom: 8 }}>We couldn't generate your voice sample right now.</p>
            <p style={{ fontSize: 12, color: 'var(--muted)' }}>{error || 'Please try again in a moment. If this keeps happening, contact support.'}</p>
          </div>
        )}

        {/* Actions */}
        {(phase === 'done' || phase === 'error') && (
          <div style={{ textAlign: 'center', marginTop: 36, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Btn onClick={() => navigate('/dashboard')} size="lg">
              <Icon name="home" size={16} /> Go to Dashboard
            </Btn>
            <Btn variant="ghost" onClick={regenerate}>
              <Icon name="refresh" size={14} /> Regenerate
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}
