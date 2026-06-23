import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Btn from '../components/Btn';
import Icon from '../components/Icon';
import CoverPreview from '../components/CoverPreview';
import useStore from '../store/useStore';

export default function Dashboard() {
  const { user, manuscripts, fetchManuscripts, manuscriptsLoading, voiceProfile, fetchVoiceProfile } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchManuscripts();
    if (!voiceProfile) fetchVoiceProfile();
  }, []);

  const totalWords = manuscripts.reduce((s, m) => s + (m.total_words || 0), 0);
  const totalChaptersDone = manuscripts.reduce((s, m) => s + (m.chapters_done || 0), 0);
  const totalChapters = manuscripts.reduce((s, m) => s + (m.total_chapters || 0), 0);

  const stats = [
    { label: 'Manuscripts', value: manuscripts.length, color: 'var(--gold)' },
    { label: 'Total Words', value: totalWords >= 1000 ? `${(totalWords / 1000).toFixed(1)}k` : totalWords, color: '#3b82f6' },
    {
      label: 'Chapters Done',
      value: totalChapters > 0 ? `${totalChaptersDone}/${totalChapters}` : '—',
      color: '#10b981',
    },
  ];

  const recent = [...manuscripts]
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 3);

  const timeAgo = (dt) => {
    const diff = Date.now() - new Date(dt).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const isBrandNew = !voiceProfile && manuscripts.length === 0 && !manuscriptsLoading;

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1000, margin: '0 auto' }} className="page-enter">
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>
          Good day, {user?.name?.split(' ')[0] || 'Author'} ✦
        </div>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, color: 'var(--cream)' }}>Dashboard</h1>
      </div>

      {/* Guided onboarding for brand-new users */}
      {isBrandNew ? (
        <div className="glass-bright" style={{ borderRadius: 18, padding: '36px 32px', marginBottom: 32 }}>
          <div className="tag tag-gold" style={{ marginBottom: 14 }}>Welcome to The Scribe</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, color: 'var(--cream)', marginBottom: 10 }}>Let's get you set up</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 28, maxWidth: 520, lineHeight: 1.6 }}>
            Two quick steps before The Scribe can write in your voice.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
            <div className="glass" style={{ borderRadius: 14, padding: 22, position: 'relative' }}>
              <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700, marginBottom: 10 }}>STEP 1</div>
              <Icon name="mic" size={26} style={{ color: 'var(--gold)', marginBottom: 12 }} />
              <div style={{ fontWeight: 600, color: 'var(--cream)', marginBottom: 6 }}>Build your voice fingerprint</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>Answer 8 questions so the AI can write exactly like you.</div>
              <Btn size="sm" onClick={() => navigate('/interview')}><Icon name="arrowRight" size={12} />Start Interview</Btn>
            </div>
            <div className="glass" style={{ borderRadius: 14, padding: 22, opacity: 0.6 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, marginBottom: 10 }}>STEP 2</div>
              <Icon name="book" size={26} style={{ color: 'var(--muted)', marginBottom: 12 }} />
              <div style={{ fontWeight: 600, color: 'var(--cream)', marginBottom: 6 }}>Create your first manuscript</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>Unlocked once your voice profile is ready.</div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 30 }}>
            {stats.map((s, i) => (
              <div key={i} className="glass" style={{ borderRadius: 12, padding: '18px 16px', borderBottom: `2px solid ${s.color}` }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 30, color: 'var(--cream)', fontWeight: 700 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Voice profile prompt */}
          {!voiceProfile && (
            <div className="glass-bright" style={{ borderRadius: 14, padding: '20px 22px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--cream)', marginBottom: 4 }}>Complete your Voice Interview</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>Set up your AI voice fingerprint to start generating manuscripts</div>
              </div>
              <Btn onClick={() => navigate('/interview')}><Icon name="mic" size={14} />Start Interview</Btn>
            </div>
          )}

          {/* Recent manuscripts */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cream)' }}>Recent Manuscripts</div>
            {manuscripts.length > 0 && (
              <button onClick={() => navigate('/manuscripts')} style={{ fontSize: 12, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer' }}>
                View all →
              </button>
            )}
          </div>

          {manuscriptsLoading ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
              <div className="spin" style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid var(--border-bright)', borderTopColor: 'var(--gold)', margin: '0 auto 16px' }} />
              Loading manuscripts...
            </div>
          ) : manuscripts.length === 0 ? (
            <div className="glass" style={{ borderRadius: 16, padding: '50px 32px', textAlign: 'center' }}>
              <Icon name="book" size={36} style={{ color: 'var(--gold)', opacity: 0.5, marginBottom: 14 }} />
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, color: 'var(--cream)', marginBottom: 8 }}>No manuscripts yet</div>
              <div style={{ color: 'var(--muted)', marginBottom: 20 }}>Create your first book and let The Scribe write in your voice</div>
              <Btn onClick={() => navigate('/new-manuscript')}><Icon name="plus" size={14} />Create Your First Manuscript</Btn>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
              {recent.map(m => (
                <div key={m.id} className="glass" onClick={() => navigate(`/editor/${m.id}`)}
                  style={{ borderRadius: 12, padding: '16px 18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', border: '1px solid var(--border)', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                    <CoverPreview style={m.cover_style || 'aurora'} title={m.title} author={user?.name || ''} type={m.type} width={40} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, color: 'var(--cream)', fontWeight: 600 }}>{m.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                        {m.chapters_done || 0}/{m.total_chapters} chapters · Updated {timeAgo(m.updated_at)}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600, flexShrink: 0 }}>{m.progress || 0}%</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Quick links */}
      <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
        {[
          { to: '/manuscripts', icon: 'book', title: 'Manuscripts', desc: 'View, search & manage all your books' },
          { to: '/voice-profile', icon: 'mic', title: 'My Voice Profile', desc: 'View & edit your AI fingerprint' },
          { to: '/scripture-studio', icon: 'quote', title: 'Scripture Studio', desc: 'Find & weave scripture into writing' },
        ].map(card => (
          <button key={card.to} className="glass" onClick={() => navigate(card.to)}
            style={{ borderRadius: 12, padding: '18px', border: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', background: 'transparent', color: 'inherit', width: '100%' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <Icon name={card.icon} size={20} style={{ color: 'var(--gold)', marginBottom: 10 }} />
            <div style={{ fontWeight: 600, color: 'var(--cream)', fontSize: 14, marginBottom: 4 }}>{card.title}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{card.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
