import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Btn from '../components/Btn';
import Icon from '../components/Icon';
import CoverPreview, { coverStyles } from '../components/CoverPreview';
import useStore from '../store/useStore';
import api, { friendlyError } from '../lib/api';

const bookTypes = ['Teaching Book', 'Devotional', 'Autobiography / Memoir', 'Prophetic Manual', 'Prayer & Intercession', 'Leadership & Ministry'];
const chapterCounts = ['6', '8', '10', '12', '15', '20'];

export default function NewManuscript() {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [purpose, setPurpose] = useState('');
  const [chapters, setChapters] = useState('10');
  const [coverStyle, setCoverStyle] = useState('aurora');
  const [outline, setOutline] = useState(null);
  const [generatingOutline, setGeneratingOutline] = useState(false);
  const [creating, setCreating] = useState(false);
  const [outlineError, setOutlineError] = useState('');
  const { createManuscript, showToast, user } = useStore();
  const navigate = useNavigate();

  const generateOutline = async () => {
    if (!title.trim()) return setOutlineError('Enter a title first');
    if (!(parseInt(chapters) > 0)) return setOutlineError('Enter a valid number of chapters first');
    setOutlineError('');
    setGeneratingOutline(true);
    try {
      const { data } = await api.post('/generate/outline', { title, type, purpose, total_chapters: parseInt(chapters) });
      setOutline(data.outline);
    } catch (e) {
      setOutlineError(friendlyError(e.response?.data?.error || 'Failed to generate outline.'));
    }
    setGeneratingOutline(false);
  };

  const chapterCountValid = parseInt(chapters) > 0;

  const handleCreate = async () => {
    if (!title.trim() || !chapterCountValid) return;
    setCreating(true);
    try {
      const manuscript = await createManuscript({
        title: title.trim(),
        type: type || 'Teaching Book',
        purpose,
        total_chapters: parseInt(chapters),
        outline: outline || [],
        cover_style: coverStyle,
      });
      showToast(`"${manuscript.title}" created.`, 'success');
      navigate(`/editor/${manuscript.id}`);
    } catch (e) {
      showToast(friendlyError(e.response?.data?.error || 'Failed to create manuscript.'), 'error');
      setCreating(false);
    }
  };

  return (
    <div style={{ padding: '32px 28px', maxWidth: 760, margin: '0 auto' }} className="page-enter">
      <button onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, marginBottom: 28 }}>
        <Icon name="chevronLeft" size={14} /> Back to Dashboard
      </button>

      <div className="tag tag-gold" style={{ marginBottom: 10 }}>New Manuscript</div>
      <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, color: 'var(--cream)', marginBottom: 6 }}>Start Your Book</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 36, fontSize: 14 }}>The Scribe will write in your captured voice from the first word</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Title */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Book Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="The Apostolic Mandate" required
            className="input-gold" style={{ padding: '12px 14px', borderRadius: 8, fontSize: 15 }} />
        </div>

        {/* Type */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Book Type</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {bookTypes.map(t => (
              <button key={t} onClick={() => setType(t)}
                style={{ padding: '7px 14px', borderRadius: 20, fontSize: 13, border: `1px solid ${type === t ? 'var(--gold)' : 'var(--border-bright)'}`, background: type === t ? 'rgba(201,164,78,0.12)' : 'transparent', color: type === t ? 'var(--gold-light)' : 'var(--muted)', cursor: 'pointer', fontWeight: type === t ? 600 : 400, transition: 'all 0.15s' }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Purpose */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Book's Core Purpose</label>
          <textarea value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="This book is for emerging leaders who need to understand the apostolic call..."
            rows={3} className="input-gold" style={{ padding: '12px 14px', borderRadius: 8, fontSize: 14, resize: 'vertical', lineHeight: 1.6 }} />
        </div>

        {/* Chapter count */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Number of Chapters</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {chapterCounts.map(n => (
              <button key={n} onClick={() => setChapters(n)}
                style={{ width: 46, height: 40, borderRadius: 8, border: `1px solid ${chapters === n ? 'var(--gold)' : 'var(--border-bright)'}`, background: chapters === n ? 'rgba(201,164,78,0.12)' : 'transparent', color: chapters === n ? 'var(--gold-light)' : 'var(--muted)', cursor: 'pointer', fontWeight: 600, fontSize: 14, transition: 'all 0.15s' }}>
                {n}
              </button>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>or custom:</span>
              <input
                type="number"
                min={1}
                max={60}
                value={chapterCounts.includes(chapters) ? '' : chapters}
                onChange={e => setChapters(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 24"
                className="input-gold"
                style={{ width: 70, height: 40, padding: '0 10px', borderRadius: 8, fontSize: 14, textAlign: 'center' }}
              />
            </div>
          </div>
        </div>

        {/* Cover style */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Cover Style</label>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 14 }}>Pick a designed cover template — you can change this later from the editor.</p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {coverStyles.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCoverStyle(s.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: 116,
                }}
                title={s.description}
              >
                <div style={{
                  borderRadius: 10,
                  padding: 4,
                  border: `2px solid ${coverStyle === s.id ? 'var(--gold)' : 'transparent'}`,
                  transition: 'all 0.15s',
                }}>
                  <CoverPreview style={s.id} title={title || 'Your Book Title'} author={user?.name || ''} type={type} width={100} />
                </div>
                <span style={{ fontSize: 12, fontWeight: coverStyle === s.id ? 700 : 500, color: coverStyle === s.id ? 'var(--gold-light)' : 'var(--muted)' }}>{s.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* AI Outline */}
        <div className="glass-bright" style={{ borderRadius: 14, padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: outline ? 20 : 0, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--cream)', fontSize: 15 }}>AI Chapter Outline</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Let The Scribe suggest a chapter structure based on your voice and purpose</div>
            </div>
            <Btn variant="ghost" size="sm" onClick={generateOutline} disabled={generatingOutline}>
              {generatingOutline
                ? <><span className="spin" style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} /> Generating...</>
                : <><Icon name="zap" size={13} /> {outline ? 'Regenerate' : 'Generate Outline'}</>
              }
            </Btn>
          </div>
          {outlineError && <div style={{ color: '#fca5a5', fontSize: 13, marginBottom: 12 }}>{outlineError}</div>}
          {outline && (
            <div>
              {outline.map((ch, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '9px 0', borderBottom: i < outline.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700, minWidth: 22, paddingTop: 2 }}>
                    {ch.number === 0 ? '—' : String(ch.number).padStart(2, '0')}
                  </span>
                  <div>
                    <div style={{ fontSize: 14, color: 'var(--cream)', fontWeight: 600 }}>{ch.title}</div>
                    {ch.description && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{ch.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Btn onClick={handleCreate} disabled={creating || !title.trim() || !chapterCountValid} size="lg" style={{ alignSelf: 'flex-start' }}>
          {creating
            ? <><span className="spin" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid var(--navy-900)', borderTopColor: 'transparent', borderRadius: '50%' }} /> Creating...</>
            : <><Icon name="pen" size={16} /> Create Manuscript & Start Writing</>
          }
        </Btn>
      </div>
    </div>
  );
}
