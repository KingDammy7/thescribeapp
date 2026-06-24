import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import Btn from '../components/Btn';
import Icon from '../components/Icon';
import useStore from '../store/useStore';
import api, { friendlyError } from '../lib/api';

export default function VoicePreview() {
  // analyzing -> generating -> choosing -> editing -> done | error
  const [phase, setPhase] = useState('analyzing');
  const [samples, setSamples] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editedText, setEditedText] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { user, updateVoiceProfile } = useStore();
  const navigate = useNavigate();
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

  const startGeneration = async () => {
    setPhase('generating');
    setError('');
    try {
      const { data } = await api.post('/generate/voice-samples', {});
      setSamples(data.samples || []);
      setPhase('choosing');
    } catch (e) {
      setError(friendlyError(e.response?.data?.error || e.message));
      setPhase('error');
    }
  };

  const regenerate = () => {
    hasStarted.current = false;
    setSelectedId(null);
    setEditedText('');
    setPhase('analyzing');
    setError('');
    setTimeout(() => {
      hasStarted.current = true;
      startGeneration();
    }, 1500);
  };

  const pickSample = (sample) => {
    setSelectedId(sample.id);
    setEditedText(sample.text);
    setPhase('editing');
  };

  const backToChoosing = () => {
    setSelectedId(null);
    setEditedText('');
    setPhase('choosing');
  };

  const saveSample = async () => {
    setSaving(true);
    try {
      await updateVoiceProfile({ sample_passage: editedText.trim() });
      setPhase('done');
    } catch (e) {
      setError(friendlyError(e.response?.data?.error || e.message));
    } finally {
      setSaving(false);
    }
  };

  const headline = {
    analyzing: 'Studying your voice...',
    generating: 'Writing in your voice...',
    choosing: 'Pick the one that sounds like you.',
    editing: 'Make it exactly yours.',
    done: 'This sounds like you.',
    error: 'Writing in your voice...',
  }[phase];

  const subhead = {
    analyzing: 'The Scribe is analyzing your theological fingerprint',
    generating: 'Generating three voice samples to choose from...',
    choosing: 'Each one is written in your voice from a different angle. Pick the closest match — you can edit it next.',
    editing: 'Tweak any wording until it reads exactly the way you would say it. This becomes the anchor for everything The Scribe writes for you.',
    done: 'Your AI ghostwriter is ready. Every manuscript will sound unmistakably like you.',
    error: '',
  }[phase];

  const isWide = phase === 'choosing';

  return (
    <div className="bg-hero" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: isWide ? 980 : 720, width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div className="tag tag-gold" style={{ display: 'inline-flex', marginBottom: 14 }}>
            ✦ Voice Analysis Complete
          </div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(28px,4vw,44px)', color: 'var(--cream)', marginBottom: 10 }}>
            {headline}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 15, maxWidth: 560, margin: '0 auto' }}>{subhead}</p>
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

        {/* Generating phase — fetching 3 samples in parallel */}
        {phase === 'generating' && (
          <div className="glass" style={{ borderRadius: 20, padding: '48px', textAlign: 'center' }}>
            <div className="spin" style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid var(--border-bright)', borderTopColor: 'var(--gold)', margin: '0 auto' }} />
            <p style={{ marginTop: 20, color: 'var(--muted)', fontSize: 14 }}>Writing three versions of your opening, each from a different angle...</p>
          </div>
        )}

        {/* Choosing phase — 3 sample cards */}
        {phase === 'choosing' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
            {samples.map((s) => (
              <div key={s.id} className="glass" style={{ borderRadius: 16, padding: '22px 20px', display: 'flex', flexDirection: 'column' }}>
                <div className="tag tag-gold" style={{ alignSelf: 'flex-start', marginBottom: 14 }}>{s.label}</div>
                <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 14.5, lineHeight: 1.75, color: 'var(--cream-dim)', flex: 1, marginBottom: 18, maxHeight: 260, overflowY: 'auto', fontStyle: 'italic' }}>
                  "{s.text}"
                </p>
                <Btn onClick={() => pickSample(s)} style={{ width: '100%', justifyContent: 'center' }}>
                  <Icon name="check" size={14} /> Pick & Edit This One
                </Btn>
              </div>
            ))}
          </div>
        )}

        {/* Editing phase — refine the chosen sample */}
        {phase === 'editing' && (
          <div className="glass" style={{ borderRadius: 20, padding: '36px 32px' }}>
            <div className="divider" style={{ marginBottom: 24 }} />
            <textarea
              autoFocus
              className="input-gold"
              value={editedText}
              onChange={e => setEditedText(e.target.value)}
              rows={10}
              style={{
                padding: 16, borderRadius: 10, lineHeight: 1.8, fontSize: 15.5, width: '100%', resize: 'vertical',
                fontFamily: 'Playfair Display, serif', fontStyle: 'italic',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, flexWrap: 'wrap', gap: 12 }}>
              <Btn variant="ghost" onClick={backToChoosing} disabled={saving}>
                <Icon name="chevronLeft" size={14} /> Back to All Three
              </Btn>
              <Btn onClick={saveSample} disabled={saving || !editedText.trim()}>
                {saving
                  ? <><span className="spin" style={{ display: 'inline-block', width: 13, height: 13, border: '2px solid var(--navy-900)', borderTopColor: 'transparent', borderRadius: '50%' }} /> Saving...</>
                  : <><Icon name="check" size={14} /> Save This as My Voice</>}
              </Btn>
            </div>
          </div>
        )}

        {/* Done phase */}
        {phase === 'done' && (
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
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
              {tags.map((tag, i) => <span key={i} className="tag tag-blue" style={{ fontSize: 10 }}>{tag}</span>)}
            </div>
            <div className="divider" style={{ marginBottom: 24 }} />
            <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(15px,2vw,18px)', lineHeight: 1.9, color: 'var(--cream-dim)', whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>
              {editedText}
            </p>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div className="glass" style={{ borderRadius: 16, padding: '32px', textAlign: 'center', border: '1px solid rgba(239,68,68,0.3)' }}>
            <Icon name="alertCircle" size={36} style={{ color: '#fca5a5', marginBottom: 12 }} />
            <p style={{ color: '#fca5a5', marginBottom: 8 }}>We couldn't generate your voice samples right now.</p>
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

        {phase === 'choosing' && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Btn variant="ghost" onClick={regenerate}>
              <Icon name="refresh" size={14} /> None of these — try again
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}
