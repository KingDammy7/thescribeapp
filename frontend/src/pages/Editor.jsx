import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Btn from '../components/Btn';
import Icon from '../components/Icon';
import CoverPreview, { coverStyles } from '../components/CoverPreview';
import useStore from '../store/useStore';
import { streamRequest } from '../lib/api';
import useDocumentTitle from '../hooks/useDocumentTitle';

const WORDS_PER_CHAPTER_GOAL = 800;

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeManuscript, activeChapters, fetchManuscript, updateChapter, updateManuscript, generateOutlineForManuscript, reorderChapters, exportManuscript, showToast, user } = useStore();
  useDocumentTitle(activeManuscript ? `Editing: ${activeManuscript.title}` : 'Editor');
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);

  const [selectedChapter, setSelectedChapter] = useState(null);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiPanel, setAiPanel] = useState(true);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState([
    { role: 'assistant', text: "I'm The Scribe, your AI ghostwriter. I'll write in your exact voice. Ask me to write, expand, add scripture, or rewrite anything.", welcome: true }
  ]);
  const [aiTyping, setAiTyping] = useState(false);
  const [streamingReply, setStreamingReply] = useState('');
  const [generatingOutline, setGeneratingOutline] = useState(false);
  const [mobileTab, setMobileTab] = useState('write'); // chapters | write | ai
  const [dragId, setDragId] = useState(null);
  const editorRef = useRef(null);
  const chatEndRef = useRef(null);
  const saveTimer = useRef(null);
  const streamText = useRef('');
  const aiInputRef = useRef(null);
  const insertedScriptureRef = useRef(false);

  useEffect(() => { if (id) fetchManuscript(id); }, [id]);

  useEffect(() => {
    if (activeChapters.length > 0 && !selectedChapter) {
      const first = activeChapters[0];
      setSelectedChapter(first);
      setContent(first.content || '');
    }
  }, [activeChapters]);

  // Handle "Send to Editor" scripture insertion coming from Scripture Studio
  useEffect(() => {
    const scripture = searchParams.get('insertScripture');
    if (scripture && selectedChapter && !insertedScriptureRef.current) {
      insertedScriptureRef.current = true;
      const updated = content ? `${content}\n\n${scripture}` : scripture;
      setContent(updated);
      if (editorRef.current) editorRef.current.innerHTML = updated.replace(/\n/g, '<br/>');
      autoSave(updated, selectedChapter);
      showToast('Scripture added to chapter.', 'success');
      searchParams.delete('insertScripture');
      setSearchParams(searchParams, { replace: true });
    }
  }, [selectedChapter, searchParams]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [aiMessages, streamingReply]);

  // Keyboard shortcuts: Cmd/Ctrl+S to save now, Cmd/Ctrl+Enter to send AI message
  useEffect(() => {
    const handler = (e) => {
      const cmd = e.metaKey || e.ctrlKey;
      if (cmd && e.key === 's') {
        e.preventDefault();
        clearTimeout(saveTimer.current);
        autoSave(content, selectedChapter);
      } else if (cmd && e.key === 'Enter') {
        if (document.activeElement === aiInputRef.current) {
          e.preventDefault();
          sendAI();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [content, selectedChapter, aiInput, aiTyping]);

  const wordCount = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  const manuscriptWordCount = activeChapters.reduce((sum, ch) => sum + (ch.id === selectedChapter?.id ? wordCount : (ch.word_count || 0)), 0);
  // Always derive the goal from the manuscript's own total_chapters (set once at
  // creation, updated only when an outline is generated) rather than the current
  // activeChapters.length — that array can briefly hold stale data from a
  // previously viewed manuscript while this one is still loading, which made the
  // goal flicker between two different values on reload.
  // +2 accounts for the Introduction and Conclusion, which every outline
  // generates on top of total_chapters (see the chapter-numbering sentinel
  // convention: 0 = Intro, 999 = Conclusion) — both still need real word
  // count, so the goal should reflect them rather than only the main chapters.
  const manuscriptGoal = ((activeManuscript?.total_chapters || 10) + 2) * WORDS_PER_CHAPTER_GOAL;

  const autoSave = useCallback(async (text, chapter) => {
    if (!chapter) return;
    setSaving(true);
    setSaved(false);
    try {
      await updateChapter(id, chapter.id, { content: text });
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { setSaving(false); }
  }, [id]);

  const handleContentChange = (text) => {
    setContent(text);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => autoSave(text, selectedChapter), 1500);
  };

  // The writing area is a raw contentEditable, so the browser already keeps a
  // native undo/redo history for it as the author types — Ctrl/Cmd+Z works.
  // There just wasn't a visible button surfacing that. execCommand is
  // deprecated but still the only way to drive the browser's own
  // contentEditable undo stack; we resync our `content` state afterward
  // since execCommand doesn't always reliably fire a React input event.
  const undo = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand('undo');
    handleContentChange(editorRef.current.innerText);
  };
  const redo = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand('redo');
    handleContentChange(editorRef.current.innerText);
  };

  // Insert an AI chat reply directly into the chapter, mirroring what the
  // quick-action chips effectively do — so freeform chat answers don't
  // require manual copy/paste out of the panel.
  const insertReply = (text) => {
    if (!selectedChapter) { showToast('Select a chapter first.', 'error'); return; }
    const updated = content ? `${content}\n\n${text}` : text;
    setContent(updated);
    if (editorRef.current) editorRef.current.innerHTML = updated.replace(/\n/g, '<br/>');
    clearTimeout(saveTimer.current);
    autoSave(updated, selectedChapter);
    showToast('Inserted into chapter.', 'success');
  };

  // Sync the contentEditable DOM only when switching to a (different) chapter.
  // We deliberately do NOT re-set innerHTML on every keystroke (e.g. via
  // dangerouslySetInnerHTML tied to `content` state) — doing that forces React
  // to rebuild the DOM node on every render, which resets the browser's cursor
  // position back to the start of the field. Each newly typed character then
  // lands at position 0 instead of where you were typing, which is what made
  // typed text come out reversed.
  useEffect(() => {
    if (editorRef.current && selectedChapter) {
      editorRef.current.innerHTML = (selectedChapter.content || '').replace(/\n/g, '<br/>');
    }
  }, [selectedChapter?.id]);

  const selectChapter = (ch) => {
    if (selectedChapter) autoSave(content, selectedChapter);
    setSelectedChapter(ch);
    setContent(ch.content || '');
    setMobileTab('write');
  };

  const sendAI = () => {
    if (!aiInput.trim() || aiTyping) return;
    const msg = aiInput.trim();
    setAiInput('');
    setAiMessages(m => [...m, { role: 'user', text: msg }]);
    setAiTyping(true);
    streamText.current = '';
    setStreamingReply('');

    streamRequest(
      '/api/generate/chat',
      { message: msg, manuscriptId: id, context: selectedChapter?.title },
      (chunk) => { streamText.current += chunk; setStreamingReply(streamText.current); },
      () => {
        setAiMessages(m => [...m, { role: 'assistant', text: streamText.current }]);
        setStreamingReply('');
        setAiTyping(false);
      },
      (err) => {
        setAiMessages(m => [...m, { role: 'assistant', text: err }]);
        setStreamingReply('');
        setAiTyping(false);
      }
    );
  };

  const handleGenerateOutline = async () => {
    setGeneratingOutline(true);
    try {
      await generateOutlineForManuscript(id);
      showToast('Outline generated — chapters are ready.', 'success');
    } catch (e) {
      showToast('Could not generate an outline. Check your AI connection and try again.', 'error');
    }
    setGeneratingOutline(false);
  };

  const handleExport = async () => {
    try {
      await exportManuscript(id, activeManuscript.title);
      showToast('Manuscript exported.', 'success');
    } catch {
      showToast('Export failed. Please try again.', 'error');
    }
  };

  // Drag and drop reordering
  const handleDrop = async (targetCh) => {
    if (!dragId || dragId === targetCh.id) return;
    const ids = activeChapters.map(c => c.id);
    const fromIdx = ids.indexOf(dragId);
    const toIdx = ids.indexOf(targetCh.id);
    ids.splice(toIdx, 0, ids.splice(fromIdx, 1)[0]);
    setDragId(null);
    await reorderChapters(id, ids);
  };

  const quickActions = ['Write next paragraph', 'Add a scripture here', 'Make this bolder', 'Expand this thought', 'Write chapter opening'];

  if (!activeManuscript) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--muted)' }}>
      <div className="spin" style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--border-bright)', borderTopColor: 'var(--gold)' }} />
    </div>
  );

  const ChapterList = (
    <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
      <button onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, marginBottom: 10 }}>
        <Icon name="chevronLeft" size={13} /> Dashboard
      </button>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button onClick={() => setCoverPickerOpen(true)} title="Change cover style" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
          <CoverPreview style={activeManuscript.cover_style || 'aurora'} title={activeManuscript.title} author={user?.name || ''} type={activeManuscript.type} width={44} />
        </button>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, color: 'var(--cream)', fontWeight: 600, lineHeight: 1.3 }}>{activeManuscript.title}</div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <Btn size="sm" onClick={() => navigate(`/generate/${id}`)} style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}>
          <Icon name="zap" size={12} /> Generate
        </Btn>
        <button onClick={handleExport} title="Export manuscript" aria-label="Download / export manuscript" style={{ width: 32, borderRadius: 6, border: '1px solid var(--border-bright)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="download" size={13} />
        </button>
      </div>
    </div>
  );

  const CoverPickerModal = coverPickerOpen ? (
    <div
      onClick={() => setCoverPickerOpen(false)}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div onClick={e => e.stopPropagation()} className="glass-bright" style={{ borderRadius: 16, padding: 28, maxWidth: 520, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: 'var(--cream)' }}>Change Cover Style</div>
          <button onClick={() => setCoverPickerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {coverStyles.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={async () => {
                await updateManuscript(id, { cover_style: s.id });
                showToast('Cover style updated.', 'success');
                setCoverPickerOpen(false);
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: 100 }}
              title={s.description}
            >
              <div style={{ borderRadius: 10, padding: 4, border: `2px solid ${(activeManuscript.cover_style || 'aurora') === s.id ? 'var(--gold)' : 'transparent'}` }}>
                <CoverPreview style={s.id} title={activeManuscript.title} author={user?.name || ''} type={activeManuscript.type} width={86} />
              </div>
              <span style={{ fontSize: 11.5, fontWeight: (activeManuscript.cover_style || 'aurora') === s.id ? 700 : 500, color: (activeManuscript.cover_style || 'aurora') === s.id ? 'var(--gold-light)' : 'var(--muted)' }}>{s.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', flexDirection: 'column' }}>
      {/* Mobile tab bar */}
      <div className="editor-mobile-tabs" style={{ display: 'none', borderBottom: '1px solid var(--border)', background: 'var(--navy-950)', flexShrink: 0 }}>
        {[{ k: 'chapters', label: 'Outline', icon: 'book' }, { k: 'write', label: 'Write', icon: 'pen' }, { k: 'ai', label: 'AI', icon: 'feather' }].map(t => (
          <button key={t.k} onClick={() => setMobileTab(t.k)}
            style={{ flex: 1, padding: '12px 8px', background: mobileTab === t.k ? 'rgba(201,164,78,0.1)' : 'transparent', border: 'none', borderBottom: `2px solid ${mobileTab === t.k ? 'var(--gold)' : 'transparent'}`, color: mobileTab === t.k ? 'var(--gold-light)' : 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
            <Icon name={t.icon} size={13} /> {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Chapter list */}
        <div className={`editor-desktop-panel editor-mobile-panel ${mobileTab === 'chapters' ? 'active' : ''}`}
          style={{ width: 200, minWidth: 200, borderRight: '1px solid var(--border)', background: 'var(--navy-950)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {ChapterList}
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
            {activeChapters.map(ch => (
              <div key={ch.id}
                draggable
                onDragStart={() => setDragId(ch.id)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(ch)}
                style={{ opacity: dragId === ch.id ? 0.4 : 1 }}
              >
                <button onClick={() => selectChapter(ch)}
                  style={{ width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', background: selectedChapter?.id === ch.id ? 'rgba(201,164,78,0.1)' : 'transparent', color: selectedChapter?.id === ch.id ? 'var(--gold-light)' : 'var(--muted)', borderLeft: `2px solid ${selectedChapter?.id === ch.id ? 'var(--gold)' : 'transparent'}`, marginBottom: 1, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="layers" size={11} style={{ opacity: 0.4, cursor: 'grab', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.6, marginBottom: 2 }}>
                      {ch.chapter_number === 0 ? 'INTRO' : ch.chapter_number === 999 ? 'CONCL' : `CH ${ch.chapter_number}`}
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.title}</div>
                    {ch.status === 'complete' && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', marginTop: 4 }} />}
                  </div>
                </button>
              </div>
            ))}
            {activeChapters.length === 0 && (
              <div style={{ padding: '20px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                  No chapters yet. Generate an outline to get started.
                </div>
                <Btn size="sm" onClick={handleGenerateOutline} disabled={generatingOutline} style={{ width: '100%', justifyContent: 'center' }}>
                  {generatingOutline
                    ? <><span className="spin" style={{ display: 'inline-block', width: 11, height: 11, border: '2px solid var(--navy-900)', borderTopColor: 'transparent', borderRadius: '50%' }} /> Generating...</>
                    : <><Icon name="zap" size={12} /> Generate Outline</>
                  }
                </Btn>
              </div>
            )}
          </div>
        </div>

        {/* Main editor */}
        <div className={`editor-mobile-panel ${mobileTab === 'write' ? 'active' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* Toolbar */}
          <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--navy-950)', flexShrink: 0, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, color: 'var(--cream)' }}>
                {selectedChapter?.title || 'Select a chapter'}
              </div>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{wordCount} words</span>
              <span style={{ fontSize: 11, color: 'var(--gold)' }}>{manuscriptWordCount.toLocaleString()} / {manuscriptGoal.toLocaleString()} words</span>
              {saving && <span style={{ fontSize: 11, color: 'var(--muted)' }}>Saving...</span>}
              {saved && <span style={{ fontSize: 11, color: '#6ee7b7' }}>✓ Saved</span>}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={undo} disabled={!selectedChapter} title="Undo (Ctrl/⌘+Z)" aria-label="Undo"
                style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid var(--border-bright)', background: 'transparent', color: 'var(--muted)', cursor: selectedChapter ? 'pointer' : 'default', opacity: selectedChapter ? 1 : 0.4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="undo" size={14} />
              </button>
              <button onClick={redo} disabled={!selectedChapter} title="Redo (Ctrl/⌘+Shift+Z)" aria-label="Redo"
                style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid var(--border-bright)', background: 'transparent', color: 'var(--muted)', cursor: selectedChapter ? 'pointer' : 'default', opacity: selectedChapter ? 1 : 0.4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="redo" size={14} />
              </button>
              <button onClick={handleExport} title="Export manuscript"
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border-bright)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="download" size={13} /> Export
              </button>
              <button
                onClick={() => setAiPanel(p => !p)}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border-bright)', background: aiPanel ? 'rgba(201,164,78,0.1)' : 'transparent', color: aiPanel ? 'var(--gold)' : 'var(--muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                AI {aiPanel ? '▸' : '◂'}
              </button>
            </div>
          </div>

          {/* Writing area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '40px 60px', background: 'var(--navy-800)' }}>
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
              {selectedChapter ? (
                <>
                  <div className="divider" style={{ marginBottom: 32 }} />
                  {wordCount < 5 && (
                    <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13.5, marginBottom: 28, opacity: 0.75 }}>
                      <Icon name="feather" size={22} style={{ opacity: 0.4, marginBottom: 10 }} />
                      <div>Your chapter starts here. Click <strong>Generate</strong> or ask The Scribe to begin writing&hellip;</div>
                    </div>
                  )}
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    role="textbox"
                    aria-multiline="true"
                    aria-label={`Chapter content — ${selectedChapter.title}`}
                    className="editor-content"
                    data-placeholder="Begin writing here, or ask The Scribe to write for you..."
                    onInput={e => handleContentChange(e.currentTarget.innerText)}
                    style={{ outline: 'none', lineHeight: 1.9, fontSize: 17, color: 'var(--cream)', caretColor: 'var(--gold)', fontFamily: 'Playfair Display, serif', minHeight: wordCount < 5 ? 160 : 400 }}
                  />
                </>
              ) : (
                <div style={{ textAlign: 'center', paddingTop: 80, color: 'var(--muted)' }}>
                  <Icon name="book" size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <p>Select a chapter from the sidebar to start writing</p>
                  {activeChapters.length === 0 && (
                    <Btn size="sm" onClick={handleGenerateOutline} disabled={generatingOutline} style={{ marginTop: 16 }}>
                      <Icon name="zap" size={12} /> Generate Outline
                    </Btn>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Panel */}
        {aiPanel && (
          <div className={`editor-mobile-panel ${mobileTab === 'ai' ? 'active' : ''}`} style={{ width: 310, borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--navy-950)', flexShrink: 0 }}>
            {/* AI Header */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,var(--gold-dim),var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="feather" size={13} style={{ color: 'var(--navy-900)' }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cream)' }}>The Scribe AI</div>
                <div style={{ fontSize: 10, color: 'var(--gold)' }}>Writing in your voice</div>
              </div>
              {aiTyping && <div className="notif-dot pulse-gold" style={{ marginLeft: 'auto' }} />}
            </div>

            {/* Quick actions */}
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {quickActions.map(a => (
                <button key={a} onClick={() => setAiInput(a)}
                  style={{ padding: '4px 9px', borderRadius: 12, fontSize: 11, border: '1px solid var(--border-bright)', background: 'transparent', color: 'var(--cream-dim)', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold-light)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.color = 'var(--cream-dim)'; }}>
                  {a}
                </button>
              ))}
            </div>

            {/* Chat messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {aiMessages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '90%', padding: '9px 12px',
                    borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: msg.role === 'user' ? 'rgba(201,164,78,0.15)' : 'var(--navy-700)',
                    border: `1px solid ${msg.role === 'user' ? 'var(--border-bright)' : 'var(--border)'}`,
                    fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.6, whiteSpace: 'pre-wrap',
                  }}>
                    {msg.text}
                  </div>
                  {msg.role === 'assistant' && !msg.welcome && (
                    <button onClick={() => insertReply(msg.text)} title="Insert into chapter"
                      style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 10, fontSize: 10.5, fontWeight: 600, border: '1px solid var(--border-bright)', background: 'transparent', color: 'var(--gold-light)', cursor: 'pointer' }}>
                      <Icon name="plus" size={10} /> Insert into chapter
                    </button>
                  )}
                </div>
              ))}
              {aiTyping && streamingReply && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ maxWidth: '90%', padding: '9px 12px', borderRadius: '12px 12px 12px 2px', background: 'var(--navy-700)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {streamingReply}<span className="cursor" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  ref={aiInputRef}
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendAI()}
                  placeholder="Ask The Scribe... (Enter to send)"
                  className="input-gold"
                  style={{ flex: 1, padding: '9px 12px', borderRadius: 8, fontSize: 13 }}
                />
                <button onClick={sendAI} disabled={aiTyping} aria-label="Send message"
                  style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg,var(--gold-light),var(--gold))', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: aiTyping ? 0.6 : 1 }}>
                  <Icon name="send" size={14} style={{ color: 'var(--navy-900)' }} />
                </button>
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6, textAlign: 'center' }}>Ctrl/⌘+S to save now</div>
            </div>
          </div>
        )}
      </div>
      {CoverPickerModal}
    </div>
  );
}
