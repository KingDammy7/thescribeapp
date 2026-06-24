import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import Btn from '../components/Btn';
import Icon from '../components/Icon';
import useStore from '../store/useStore';
import api, { friendlyError } from '../lib/api';

const ACCEPTED_EXT = ['.pdf', '.docx', '.txt', '.md'];
const MAX_FILES = 10;
const MIN_FILES = 1;

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

function extOf(filename) {
  const i = filename.lastIndexOf('.');
  return i === -1 ? '' : filename.slice(i).toLowerCase();
}

export default function VoiceFromBooks() {
  // picking -> analyzing -> reviewing -> saving -> done | error
  const [phase, setPhase] = useState('picking');
  const [files, setFiles] = useState([]);
  const [draft, setDraft] = useState(null);
  const [filesAnalyzed, setFilesAnalyzed] = useState([]);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { saveVoiceInterview, updateVoiceProfile, showToast } = useStore();

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList);
    const valid = [];
    const rejected = [];
    for (const f of incoming) {
      if (ACCEPTED_EXT.includes(extOf(f.name))) valid.push(f);
      else rejected.push(f.name);
    }
    if (rejected.length) {
      setError(`Skipped ${rejected.length === 1 ? 'file' : 'files'} we can't read yet (${rejected.join(', ')}). Use PDF, DOCX, TXT, or MD.`);
    } else {
      setError('');
    }
    setFiles(prev => {
      const merged = [...prev, ...valid].slice(0, MAX_FILES);
      return merged;
    });
  };

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const analyze = async () => {
    if (files.length < MIN_FILES) return;
    setPhase('analyzing');
    setError('');
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('books', f));
      const { data } = await api.post('/generate/voice-from-books', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDraft(data.profile);
      setFilesAnalyzed(data.filesAnalyzed || []);
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
      showToast('Your voice profile was generated from your books.', 'success');
      navigate('/voice-profile');
    } catch (e) {
      setError(friendlyError(e.response?.data?.error || e.message));
      setPhase('reviewing');
    }
  };

  const startOver = () => {
    setFiles([]);
    setDraft(null);
    setFilesAnalyzed([]);
    setError('');
    setPhase('picking');
  };

  return (
    <div className="bg-hero" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: 24 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', width: '100%', paddingTop: 40 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
          <Logo size="sm" />
          <Btn variant="ghost" size="sm" onClick={() => navigate('/interview')}>
            <Icon name="mic" size={13} /> Use the interview instead
          </Btn>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div className="tag tag-gold" style={{ display: 'inline-flex', marginBottom: 14 }}>✦ Build From Your Own Writing</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(26px,4vw,38px)', color: 'var(--cream)', marginBottom: 10 }}>
            Upload your books. We'll learn your voice.
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14.5, maxWidth: 540, margin: '0 auto' }}>
            Upload 1–10 books or manuscripts you've already written. The Scribe reads them and builds your full voice fingerprint from real evidence — then you review and edit every field before anything is saved.
          </p>
        </div>

        {/* Picking phase */}
        {phase === 'picking' && (
          <>
            <div
              className="glass"
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              style={{
                borderRadius: 16, padding: '40px 24px', textAlign: 'center', cursor: 'pointer',
                border: `2px dashed ${dragOver ? 'var(--gold)' : 'var(--border-bright)'}`,
                background: dragOver ? 'rgba(201,164,78,0.06)' : undefined,
                transition: 'border-color 0.2s, background 0.2s',
              }}
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                accept={ACCEPTED_EXT.join(',')}
                onChange={e => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ''; }}
                style={{ display: 'none' }}
              />
              <Icon name="upload" size={32} style={{ color: 'var(--gold)', marginBottom: 14 }} />
              <div style={{ color: 'var(--cream)', fontWeight: 600, marginBottom: 6 }}>Drop files here or click to browse</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>PDF, DOCX, TXT, or MD · up to {MAX_FILES} files</div>
            </div>

            {error && (
              <div style={{ marginTop: 14, fontSize: 12.5, color: '#fca5a5', textAlign: 'center' }}>{error}</div>
            )}

            {files.length > 0 && (
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {files.map((f, i) => (
                  <div key={i} className="glass" style={{ borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon name="file" size={15} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'var(--cream-dim)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                    <button onClick={() => removeFile(i)} aria-label={`Remove ${f.name}`} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex' }}>
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <Btn size="lg" disabled={files.length < MIN_FILES} onClick={analyze}>
                <Icon name="wand" size={16} /> Analyze {files.length > 0 ? `${files.length} File${files.length > 1 ? 's' : ''}` : 'My Books'}
              </Btn>
            </div>
          </>
        )}

        {/* Analyzing phase */}
        {phase === 'analyzing' && (
          <div className="glass" style={{ borderRadius: 20, padding: '48px', textAlign: 'center' }}>
            <div className="spin" style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid var(--border-bright)', borderTopColor: 'var(--gold)', margin: '0 auto' }} />
            <p style={{ marginTop: 20, color: 'var(--muted)', fontSize: 14 }}>
              Reading {files.length} file{files.length > 1 ? 's' : ''} and studying your voice — this can take a minute for longer books...
            </p>
          </div>
        )}

        {/* Reviewing / Saving phase */}
        {(phase === 'reviewing' || phase === 'saving') && draft && (
          <div>
            {filesAnalyzed.length > 0 && (
              <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginBottom: 18 }}>
                Learned from: {filesAnalyzed.join(', ')}
              </div>
            )}
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
            <p style={{ color: '#fca5a5', marginBottom: 8 }}>We couldn't generate a voice profile from those files.</p>
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
