import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Btn from '../components/Btn';
import Icon from '../components/Icon';
import useStore from '../store/useStore';
import { streamRequest } from '../lib/api';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function GenerationMode() {
  useDocumentTitle('Generate');
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeManuscript, activeChapters, fetchManuscript, updateChapter } = useStore();

  const [phase, setPhase] = useState('ready'); // ready | generating | done | error
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [streamText, setStreamText] = useState('');
  const [overallProgress, setOverallProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedChapters, setSelectedChapters] = useState([]);
  const [focusDrafts, setFocusDrafts] = useState({}); // chapterId -> subject/focus text
  const [editingFocusFor, setEditingFocusFor] = useState(null);
  const streamRef = useRef('');

  useEffect(() => { if (id) fetchManuscript(id); }, [id]);

  useEffect(() => {
    if (activeChapters.length > 0 && selectedChapters.length === 0) {
      // Default: select all empty chapters
      setSelectedChapters(activeChapters.filter(ch => ch.status !== 'complete').map(ch => ch.id));
    }
    if (activeChapters.length > 0 && Object.keys(focusDrafts).length === 0) {
      const initial = {};
      activeChapters.forEach(ch => { initial[ch.id] = ch.description || ''; });
      setFocusDrafts(initial);
    }
  }, [activeChapters]);

  const setFocus = (chapterId, text) => setFocusDrafts(f => ({ ...f, [chapterId]: text }));
  const saveFocus = (chapterId) => {
    updateChapter(id, chapterId, { description: focusDrafts[chapterId] || '' });
    setEditingFocusFor(null);
  };

  const chaptersToGenerate = activeChapters.filter(ch => selectedChapters.includes(ch.id));

  const startGeneration = async () => {
    if (chaptersToGenerate.length === 0) return;
    setPhase('generating');
    setCurrentIdx(0);
    setCompletedIds(new Set());
    setOverallProgress(0);
    await generateChapter(0, chaptersToGenerate);
  };

  const generateChapter = async (idx, chapters) => {
    if (idx >= chapters.length) {
      setPhase('done');
      setOverallProgress(100);
      return;
    }

    const chapter = chapters[idx];
    setCurrentIdx(idx);
    streamRef.current = '';
    setStreamText('');

    await new Promise((resolve) => {
      streamRequest(
        '/api/generate/chapter',
        { manuscriptId: id, chapterId: chapter.id, focus: focusDrafts[chapter.id] || '' },
        (chunk) => {
          streamRef.current += chunk;
          setStreamText(streamRef.current);
          const p = Math.round(((idx + streamRef.current.length / 800) / chapters.length) * 100);
          setOverallProgress(Math.min(p, Math.round(((idx + 0.99) / chapters.length) * 100)));
        },
        () => {
          setCompletedIds(s => new Set([...s, chapter.id]));
          setOverallProgress(Math.round(((idx + 1) / chapters.length) * 100));
          resolve();
        },
        (err) => { setErrorMsg(err); setPhase('error'); resolve(); }
      );
    });

    if (phase !== 'error') {
      await generateChapter(idx + 1, chapters);
    }
  };

  const toggleChapter = (id) => {
    setSelectedChapters(s => s.includes(id) ? s.filter(i => i !== id) : [...s, id]);
  };

  if (!activeManuscript) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--muted)' }}>
      <div className="spin" style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--border-bright)', borderTopColor: 'var(--gold)' }} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy-950)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => navigate(`/editor/${id}`)} style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
            <Icon name="chevronLeft" size={14} /> Editor
          </button>
          <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
          <div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, color: 'var(--cream)', fontWeight: 600 }}>{activeManuscript.title}</div>
            <div style={{ fontSize: 11, color: 'var(--gold)' }}>AI Generation Mode</div>
          </div>
        </div>
        {phase === 'done' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="ghost" size="sm" onClick={() => navigate(`/editor/${id}`)}><Icon name="pen" size={13} />Open in Editor</Btn>
          </div>
        )}
      </div>

      <div style={{ flex: 1, maxWidth: 900, margin: '0 auto', width: '100%', padding: '36px 24px', overflowY: 'auto' }}>
        {phase === 'ready' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(201,164,78,0.1)', border: '2px solid var(--border-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--gold)' }}>
                <Icon name="zap" size={30} />
              </div>
              <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 36, color: 'var(--cream)', marginBottom: 10 }}>Generate Your Manuscript</h1>
              <p style={{ color: 'var(--muted)', fontSize: 15, maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
                The Scribe will write selected chapters in your exact voice — drawing from your theological fingerprint, signature phrases, and anchor scriptures.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
                <span className="tag tag-gold">Your Voice</span>
                <span className="tag tag-blue">Your Theology</span>
                <span className="tag tag-green">Your Scriptures</span>
              </div>
            </div>

            {/* Chapter selection */}
            {activeChapters.length > 0 ? (
              <div className="glass" style={{ borderRadius: 14, padding: '22px', marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cream)' }}>Select Chapters to Generate</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setSelectedChapters(activeChapters.filter(ch => ch.status !== 'complete').map(ch => ch.id))} style={{ fontSize: 11, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer' }}>All Empty</button>
                    <button onClick={() => setSelectedChapters([])} style={{ fontSize: 11, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {activeChapters.map(ch => (
                    <div key={ch.id} style={{ borderRadius: 8, background: selectedChapters.includes(ch.id) ? 'rgba(201,164,78,0.08)' : 'transparent', border: `1px solid ${selectedChapters.includes(ch.id) ? 'var(--border-bright)' : 'transparent'}`, transition: 'all 0.15s' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={selectedChapters.includes(ch.id)} onChange={() => toggleChapter(ch.id)} style={{ accentColor: 'var(--gold)' }} />
                        <span style={{ fontSize: 13, color: ch.status === 'complete' ? 'var(--muted)' : 'var(--cream)', flex: 1 }}>{ch.title}</span>
                        {ch.status === 'complete' && <span className="tag tag-green" style={{ fontSize: 10 }}>Done</span>}
                        {ch.word_count > 0 && <span style={{ fontSize: 11, color: 'var(--muted)' }}>{ch.word_count} words</span>}
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); setEditingFocusFor(editingFocusFor === ch.id ? null : ch.id); }}
                          title="Set chapter subject / focus"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: focusDrafts[ch.id] ? 'var(--gold)' : 'var(--muted)', display: 'flex', flexShrink: 0 }}>
                          <Icon name="edit" size={13} />
                        </button>
                      </label>
                      {focusDrafts[ch.id] && editingFocusFor !== ch.id && (
                        <div style={{ padding: '0 10px 8px 38px', fontSize: 11.5, color: 'var(--gold)', fontStyle: 'italic' }}>
                          Focus: {focusDrafts[ch.id]}
                        </div>
                      )}
                      {editingFocusFor === ch.id && (
                        <div style={{ padding: '0 10px 10px 38px', display: 'flex', gap: 6 }}>
                          <input
                            autoFocus
                            value={focusDrafts[ch.id] || ''}
                            onChange={e => setFocus(ch.id, e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && saveFocus(ch.id)}
                            placeholder="What should this chapter focus on? (optional — guides the AI)"
                            className="input-gold"
                            style={{ flex: 1, padding: '6px 10px', borderRadius: 6, fontSize: 12 }}
                          />
                          <Btn size="sm" onClick={() => saveFocus(ch.id)}>Save</Btn>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="glass" style={{ borderRadius: 14, padding: '24px', marginBottom: 28, textAlign: 'center', color: 'var(--muted)' }}>
                No chapters found. Create an outline first from the editor.
              </div>
            )}

            <div style={{ textAlign: 'center' }}>
              <Btn onClick={startGeneration} disabled={chaptersToGenerate.length === 0} size="lg">
                <Icon name="zap" size={16} /> Generate {chaptersToGenerate.length} Chapter{chaptersToGenerate.length !== 1 ? 's' : ''}
              </Btn>
            </div>
          </div>
        )}

        {(phase === 'generating' || phase === 'done') && (
          <div>
            {/* Overall progress */}
            <div className="glass" style={{ borderRadius: 14, padding: '20px 22px', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cream)' }}>
                  {phase === 'done' ? '✦ Generation Complete' : `Generating chapter ${currentIdx + 1} of ${chaptersToGenerate.length}...`}
                </div>
                <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 700 }}>{overallProgress}%</div>
              </div>
              <div style={{ background: 'rgba(201,164,78,0.08)', borderRadius: 4, height: 6 }}>
                <div className="progress-bar" style={{ width: `${overallProgress}%`, height: '100%' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
                {chaptersToGenerate.map((ch, i) => (
                  <div key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: completedIds.has(ch.id) ? 'var(--gold)' : (i === currentIdx && phase === 'generating') ? 'transparent' : 'var(--navy-700)', border: `2px solid ${completedIds.has(ch.id) ? 'var(--gold)' : i === currentIdx && phase === 'generating' ? 'var(--gold)' : 'var(--navy-500)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {completedIds.has(ch.id) && <Icon name="check" size={9} style={{ color: 'var(--navy-900)' }} />}
                      {i === currentIdx && phase === 'generating' && !completedIds.has(ch.id) && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)' }} className="pulse-gold" />}
                    </div>
                    <span style={{ color: completedIds.has(ch.id) ? 'var(--gold)' : i === currentIdx ? 'var(--cream)' : 'var(--muted)' }}>{ch.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live text */}
            {phase === 'generating' && streamText && (
              <div className="glass" style={{ borderRadius: 14, padding: '32px 36px', minHeight: 300 }}>
                <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
                  {chaptersToGenerate[currentIdx]?.title}
                </div>
                <div className="divider" style={{ marginBottom: 24 }} />
                <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, lineHeight: 1.9, color: 'var(--cream-dim)', whiteSpace: 'pre-wrap' }}>
                  {streamText}<span className="cursor" />
                </p>
              </div>
            )}

            {/* Done actions */}
            {phase === 'done' && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#6ee7b7' }}>
                  <Icon name="check" size={28} />
                </div>
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color: 'var(--cream)', marginBottom: 10 }}>Your manuscript is ready</h2>
                <p style={{ color: 'var(--muted)', marginBottom: 28 }}>{completedIds.size} chapter{completedIds.size !== 1 ? 's' : ''} generated in your voice</p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Btn onClick={() => navigate(`/editor/${id}`)} size="lg"><Icon name="pen" size={16} />Open in Editor</Btn>
                  <Btn variant="ghost" onClick={() => setPhase('ready')}><Icon name="refresh" size={14} />Generate More</Btn>
                </div>
              </div>
            )}
          </div>
        )}

        {phase === 'error' && (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <Icon name="alertCircle" size={40} style={{ color: '#fca5a5', marginBottom: 16 }} />
            <p style={{ color: '#fca5a5', marginBottom: 8 }}>{errorMsg || 'Generation failed'}</p>
            <Btn variant="ghost" onClick={() => setPhase('ready')} style={{ marginTop: 16 }}><Icon name="refresh" size={14} />Try Again</Btn>
          </div>
        )}
      </div>
    </div>
  );
}
