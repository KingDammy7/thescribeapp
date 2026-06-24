import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import Btn from '../components/Btn';
import Icon from '../components/Icon';
import useStore from '../store/useStore';
import api, { friendlyError } from '../lib/api';

const MIN_CHARS = 300;

const FIELD_LABELS = [
  { key: 'ministry', label: 'Ministry Identity' },
  { key: 'tone', label: 'Preaching Tone' },
  { key: 'phrases', label: 'Signature Phrases' },
  { key: 'scriptures', label: 'Anchor Scriptures' },
  { key: 'stories', label: 'Personal Stories' },
  { key: 'audience', label: 'Target Audience' },
  { key: 'theology', label: 'Theological Framework' },
  { key: 'style', label: 'Writing Style' },
];

export default function VoiceFromNotes() {
  // writing -> analyzing -> reviewing -> saving -> error
  const [phase, setPhase] = useState('writing');
  const [notes, setNotes] = useState('');
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { saveVoiceInterview, updateVoiceProfile, showToast } = useStore();

  const tooShort = notes.trim().length > 0 && notes.trim().length < MIN_CHARS;
  const canAnalyze = notes.trim().length >= MIN_CHARS;

  const analyze = async () => {
    if (!canAnalyze) return;
    setPhase('analyzing');
    setError('');
    try {
      const formData = new FormData();
      formData.append('notes', notes.trim());
      const { data } = await api.post('/generate/voice-from-books', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDraft(data.profile);
      setPhase('reviewing');
    } catch (e) {
      setError(friendlyError(e.response?.data?.error || e.message));
      setPhase('error');
    }
  };

  const updateField = (key, value) => setDraft(prev => ({ ...prev, [key]: value }));

  const saveProfile = async () => {
    setPhase('saving');
    try {
      const { sample_passage, ...interviewFields } = draft;
      await saveVoiceInterview(interviewFields);
      if (sample_passage) await updateVoiceProfile({ sample_passage });
      showToast('Your voice profile was generated from your sermon notes.', 'success');
      navigate('/voice-profile');
    } catch (e) {
      setError(friendlyError(e.response?.data?.error || e.message));
      setPhase('reviewing');
    }
  };

  const startOver = () => {
    setNotes('');
    setDraft(null);
    setError('');
    setPhase('writing');
  };

  return (
    <div className="bg-hero" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: 24 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', width: '100%', paddingTop: 40 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36, flexWrap: 'wrap', gap: 10 }}>
          <Logo size="sm" />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Btn variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <Icon name="chevronLeft" size={13} /> Dashboard
            </Btn>
            <Btn variant="ghost" size="sm" onClick={() => navigate('/interview')}>
              <Icon name="mic" size={13} /> Use the interview instead
            </Btn>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div className="tag tag-gold" style={{ display: 'inline-flex', marginBottom: 14 }}>✦ Build From a Sermon Note or Teaching</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(26px,4vw,38px)', color: 'var(--cream)', marginBottom: 10 }}>
            Paste a note. We'll learn your voice.
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14.5, maxWidth: 560, margin: '0 auto' }}>
            Paste a sermon note, teaching outline, or message transcript you've written or preached. The Scribe studies your real words and builds your full voice fingerprint from them — then you review and edit every field before anything is saved.
          </p>
        </div>

        {/* Writing phase */}
        {phase === 'writing' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, color: 'var(--cream-dim)', marginBottom: 8 }}>
                Paste your sermon note, teaching outline, or transcript
              </label>
              <textarea
                autoFocus
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Paste your sermon notes, teaching outline, or a transcript here — the longer and more natural, the better The Scribe can learn your voice..."
                rows={14}
                className="input-gold"
                style={{ width: '100%', padding: '14px 16px', borderRadius: 10, fontSize: 14, lineHeight: 1.7, resize: 'vertical' }}
              />
              <div style={{ fontSize: 11.5, marginTop: 8, color: tooShort ? '#fca5a5' : 'var(--muted)' }}>
                {notes.trim()
                  ? tooShort
                    ? `A little more, please (${notes.trim().length}/${MIN_CHARS} characters) — paste a fuller note for best results`
                    : `✓ Ready (${notes.trim().length} characters)`
                  : `At least ${MIN_CHARS} characters so there's enough to learn from`}
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <Btn size="lg" disabled={!canAnalyze} onClick={analyze}>
                <Icon name="wand" size={16} /> Analyze My Notes
              </Btn>
            </div>
          </>
        )}

        {/* Analyzing phase */}
        {phase === 'analyzing' && (
          <div className="glass" style={{ borderRadius: 20, padding: '48px', textAlign: 'center' }}>
            <div className="spin" style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid var(--border-bright)', borderTopColor: 'var(--gold)', margin: '0 auto' }} />
            <p style={{ marginTop: 20, color: 'var(--muted)', fontSize: 14 }}>
              Studying your pasted notes and learning your voice...
            </p>
          </div>
        )}

        {/* Reviewing / Saving phase */}
        {(phase === 'reviewing' || phase === 'saving') && draft && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {FIELD_LABELS.map(({ key, label }) => (
                <div key={key} className="glass" style={{ borderRadius: 14, padding: '18px 20px' }}>
                  <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600, marginBottom: 10 }}>{label}</div>
                  <textarea
                    value={draft[key] || ''}
                    onChange={e => updateField(key, e.target.value)}
                    className="input-gold"
                    rows={key === 'stories' || key === 'theology' ? 4 : 2}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 13.5, lineHeight: 1.6, resize: 'vertical' }}
                  />
                </div>
              ))}
              <div className="glass" style={{ borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600, marginBottom: 10 }}>Anchor Voice Sample</div>
                <textarea
                  value={draft.sample_passage || ''}
                  onChange={e => updateField('sample_passage', e.target.value)}
                  className="input-gold"
                  rows={6}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 13.5, lineHeight: 1.7, resize: 'vertical', fontFamily: 'Playfair Display, serif', fontStyle: 'italic' }}
                />
              </div>
            </div>

            {error && <div style={{ marginTop: 14, fontSize: 12.5, color: '#fca5a5', textAlign: 'center' }}>{error}</div>}

            <div style={{ textAlign: 'center', marginTop: 28, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Btn size="lg" onClick={saveProfile} disabled={phase === 'saving'}>
                {phase === 'saving'
                  ? <><span className="spin" style={{ display: 'inline-block', width: 13, height: 13, border: '2px solid var(--navy-900)', borderTopColor: 'transparent', borderRadius: '50%' }} /> Saving...</>
                  : <><Icon name="check" size={16} /> Save This Voice Profile</>}
              </Btn>
              <Btn variant="ghost" onClick={startOver} disabled={phase === 'saving'}>
                <Icon name="refresh" size={14} /> Start Over
              </Btn>
            </div>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div className="glass" style={{ borderRadius: 16, padding: '32px', textAlign: 'center', border: '1px solid rgba(239,68,68,0.3)' }}>
            <Icon name="alertCircle" size={36} style={{ color: '#fca5a5', marginBottom: 12 }} />
            <p style={{ color: '#fca5a5', marginBottom: 8 }}>We couldn't generate a voice profile from that note.</p>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>{error || 'Please try again, or use the manual interview instead.'}</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Btn onClick={startOver}><Icon name="refresh" size={14} /> Try Again</Btn>
              <Btn variant="ghost" onClick={() => navigate('/interview')}><Icon name="mic" size={14} /> Use the Interview Instead</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
