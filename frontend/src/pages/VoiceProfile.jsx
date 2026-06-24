import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Btn from '../components/Btn';
import Icon from '../components/Icon';
import VoiceSourceOptions from '../components/VoiceSourceOptions';
import useStore from '../store/useStore';
import useDocumentTitle from '../hooks/useDocumentTitle';

// Strip any leading/trailing quote characters the user may have typed during the interview
const stripQuotes = (s) => s.replace(/^["'“‘]+/, '').replace(/["'”’]+$/, '').trim();

export default function VoiceProfile() {
  useDocumentTitle('My Voice Profile');
  const { user, voiceProfile, fetchVoiceProfile, updateVoiceProfile, showToast } = useStore();
  const navigate = useNavigate();
  const [editingKey, setEditingKey] = useState(null);
  const [draft, setDraft] = useState('');
  const [savingKey, setSavingKey] = useState(null);

  useEffect(() => { if (!voiceProfile) fetchVoiceProfile(); }, []);

  if (!voiceProfile) return (
    <div style={{ padding: '60px 28px', textAlign: 'center', maxWidth: 640, margin: '0 auto' }} className="page-enter">
      <div style={{ textAlign: 'left', marginBottom: 8 }}>
        <Btn variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
          <Icon name="chevronLeft" size={13} /> Back to Dashboard
        </Btn>
      </div>
      <Icon name="mic" size={48} style={{ color: 'var(--gold)', opacity: 0.4, marginBottom: 20 }} />
      <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color: 'var(--cream)', marginBottom: 10 }}>No Voice Profile Yet</h2>
      <p style={{ color: 'var(--muted)', marginBottom: 28 }}>Pick how you'd like to build your AI fingerprint</p>
      <VoiceSourceOptions cardStyle />
    </div>
  );

  const p = voiceProfile;
  const phrases = (p.phrases || '').split(',').map(s => stripQuotes(s.trim())).filter(Boolean);
  const scriptures = (p.scriptures || '').split(',').map(s => s.trim()).filter(Boolean);

  const sections = [
    { key: 'ministry', label: 'Ministry Identity', content: p.ministry },
    { key: 'tone', label: 'Preaching Tone', content: p.tone },
    { key: 'stories', label: 'Personal Stories', content: p.stories },
    { key: 'audience', label: 'Target Audience', content: p.audience },
    { key: 'theology', label: 'Theological Framework', content: p.theology },
    { key: 'style', label: 'Writing Style', content: p.style },
  ];

  const startEdit = (key, value) => { setEditingKey(key); setDraft(value || ''); };
  const cancelEdit = () => { setEditingKey(null); setDraft(''); };

  const saveEdit = async (key) => {
    setSavingKey(key);
    try {
      await updateVoiceProfile({ [key]: draft });
      showToast('Voice profile updated.', 'success');
      setEditingKey(null);
    } catch {
      showToast('Could not save that change. Please try again.', 'error');
    }
    setSavingKey(null);
  };

  return (
    <div style={{ padding: '32px 28px', maxWidth: 900, margin: '0 auto' }} className="page-enter">
      <div style={{ marginBottom: 32 }}>
        <div className="tag tag-gold" style={{ marginBottom: 10 }}>Voice Fingerprint</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, color: 'var(--cream)' }}>Your Ministry Voice</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="ghost" onClick={() => navigate('/voice-preview')} size="sm">
              <Icon name="eye" size={13} /> Preview My Voice
            </Btn>
            <Btn variant="ghost" onClick={() => navigate('/interview')} size="sm">
              <Icon name="refresh" size={13} /> Re-interview
            </Btn>
          </div>
        </div>
        <p style={{ color: 'var(--muted)', marginTop: 6, fontSize: 14 }}>Every manuscript The Scribe generates draws from this fingerprint. Click any section below to edit it directly.</p>
      </div>

      {/* Author card */}
      <div className="glass-bright" style={{ borderRadius: 16, padding: '24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg,var(--gold-dim),var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--navy-900)' }}>{(user?.name || 'A')[0]}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, color: 'var(--cream)', fontWeight: 600 }}>{user?.name}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
            {p.ministry?.slice(0, 100) || 'Apostolic & Prophetic Voice'}...
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span className="tag tag-gold">Prophetic</span>
          <span className="tag tag-blue">Apostolic</span>
          <span className="tag tag-green">Spirit-filled</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
        {/* Phrases */}
        <div className="glass" style={{ borderRadius: 14, padding: '22px' }}>
          <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600, marginBottom: 14 }}>Signature Phrases</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {phrases.length > 0
              ? phrases.map((ph, i) => <span key={i} className="tag tag-gold">&ldquo;{ph}&rdquo;</span>)
              : <span style={{ fontSize: 13, color: 'var(--muted)' }}>None captured</span>
            }
          </div>
        </div>

        {/* Scriptures */}
        <div className="glass" style={{ borderRadius: 14, padding: '22px' }}>
          <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600, marginBottom: 14 }}>Anchor Scriptures</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {scriptures.length > 0
              ? scriptures.map((s, i) => <span key={i} className="tag tag-blue">{s}</span>)
              : <span style={{ fontSize: 13, color: 'var(--muted)' }}>None captured</span>
            }
          </div>
        </div>

        {/* Other sections — click to edit inline */}
        {sections.map((s) => s.content && (
          <div key={s.key} className="glass" style={{ borderRadius: 14, padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}>{s.label}</div>
              {editingKey !== s.key && (
                <button onClick={() => startEdit(s.key, s.content)} title="Edit" style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex' }}>
                  <Icon name="edit" size={13} />
                </button>
              )}
            </div>
            {editingKey === s.key ? (
              <div>
                <textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  className="input-gold"
                  rows={5}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 13.5, lineHeight: 1.6, resize: 'vertical', marginBottom: 10 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn size="sm" onClick={() => saveEdit(s.key)} disabled={savingKey === s.key}>
                    {savingKey === s.key ? 'Saving...' : 'Save'}
                  </Btn>
                  <Btn size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Btn>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 14, color: 'var(--cream-dim)', lineHeight: 1.7 }}>{s.content}</p>
            )}
          </div>
        ))}
      </div>

      {/* Approved voice sample — the anchor passage picked & edited on the
          Voice Preview screen. Shown full-width since it's usually a full
          paragraph. Editable here too, and re-generatable from scratch. */}
      <div className="glass" style={{ borderRadius: 14, padding: '22px', marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}>Approved Voice Sample</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {editingKey !== 'sample_passage' && p.sample_passage && (
              <button onClick={() => startEdit('sample_passage', p.sample_passage)} title="Edit" style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex' }}>
                <Icon name="edit" size={13} />
              </button>
            )}
            <Btn size="sm" variant="ghost" onClick={() => navigate('/voice-preview')}>
              <Icon name="refresh" size={13} /> {p.sample_passage ? 'Generate New Options' : 'Generate a Sample'}
            </Btn>
          </div>
        </div>
        {editingKey === 'sample_passage' ? (
          <div>
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              className="input-gold"
              rows={7}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 13.5, lineHeight: 1.6, resize: 'vertical', marginBottom: 10, fontFamily: 'Playfair Display, serif', fontStyle: 'italic' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn size="sm" onClick={() => saveEdit('sample_passage')} disabled={savingKey === 'sample_passage'}>
                {savingKey === 'sample_passage' ? 'Saving...' : 'Save'}
              </Btn>
              <Btn size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Btn>
            </div>
          </div>
        ) : p.sample_passage ? (
          <p style={{ fontSize: 14, color: 'var(--cream-dim)', lineHeight: 1.7, fontFamily: 'Playfair Display, serif', fontStyle: 'italic' }}>"{p.sample_passage}"</p>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>No approved sample yet. Generate a few options and pick the one that sounds most like you — The Scribe will use it as a reference for everything it writes.</p>
        )}
      </div>
    </div>
  );
}
