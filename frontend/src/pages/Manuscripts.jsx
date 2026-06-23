import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Btn from '../components/Btn';
import Icon from '../components/Icon';
import CoverPreview from '../components/CoverPreview';
import ConfirmModal from '../components/ConfirmModal';
import useStore from '../store/useStore';

const statusFilters = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'complete', label: 'Complete' },
];

function deriveStatus(m) {
  if (m.status === 'complete' || m.progress >= 100) return 'complete';
  if ((m.chapters_done || 0) > 0) return 'in_progress';
  return 'draft';
}

export default function Manuscripts() {
  const { manuscripts, fetchManuscripts, manuscriptsLoading, deleteManuscript, showToast, user } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [statusKey, setStatusKey] = useState('all');
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => { fetchManuscripts(); }, []);

  const filtered = manuscripts.filter(m => {
    const matchesQuery = !query || m.title.toLowerCase().includes(query.toLowerCase()) || (m.type || '').toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusKey === 'all' || deriveStatus(m) === statusKey;
    return matchesQuery && matchesStatus;
  });

  const timeAgo = (dt) => {
    const diff = Date.now() - new Date(dt).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteManuscript(toDelete.id);
      showToast(`"${toDelete.title}" was deleted.`, 'success');
    } catch {
      showToast('Could not delete manuscript. Please try again.', 'error');
    }
    setToDelete(null);
  };

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1000, margin: '0 auto' }} className="page-enter">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <div className="tag tag-gold" style={{ marginBottom: 10 }}>Manuscripts</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, color: 'var(--cream)' }}>All Manuscripts</h1>
        </div>
        <Btn onClick={() => navigate('/new-manuscript')}><Icon name="plus" size={14} /> New Manuscript</Btn>
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Icon name="search" size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by title or type..."
            className="input-gold" style={{ padding: '10px 14px 10px 38px', borderRadius: 9, fontSize: 13.5 }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {statusFilters.map(f => (
            <button key={f.key} onClick={() => setStatusKey(f.key)}
              style={{ padding: '8px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', border: `1px solid ${statusKey === f.key ? 'var(--gold)' : 'var(--border-bright)'}`, background: statusKey === f.key ? 'rgba(201,164,78,0.12)' : 'transparent', color: statusKey === f.key ? 'var(--gold-light)' : 'var(--muted)' }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {manuscriptsLoading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
          <div className="spin" style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid var(--border-bright)', borderTopColor: 'var(--gold)', margin: '0 auto 16px' }} />
          Loading manuscripts...
        </div>
      ) : manuscripts.length === 0 ? (
        <div className="glass" style={{ borderRadius: 16, padding: '60px 32px', textAlign: 'center' }}>
          <Icon name="book" size={40} style={{ color: 'var(--gold)', opacity: 0.5, marginBottom: 16 }} />
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, color: 'var(--cream)', marginBottom: 8 }}>No manuscripts yet</div>
          <div style={{ color: 'var(--muted)', marginBottom: 24 }}>Create your first book and let The Scribe write in your voice</div>
          <Btn onClick={() => navigate('/new-manuscript')}><Icon name="plus" size={14} />Create Your First Manuscript</Btn>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass" style={{ borderRadius: 16, padding: '40px 32px', textAlign: 'center', color: 'var(--muted)' }}>
          No manuscripts match your search or filter.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(m => (
            <div key={m.id} className="glass" onClick={() => navigate(`/editor/${m.id}`)}
              style={{ borderRadius: 14, padding: '22px 20px', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--border)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <CoverPreview style={m.cover_style || 'aurora'} title={m.title} author={user?.name || ''} type={m.type} width={56} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, color: 'var(--cream)', fontWeight: 600, margin: 0 }}>{m.title}</h3>
                    <span className={`tag ${deriveStatus(m) === 'complete' ? 'tag-green' : deriveStatus(m) === 'in_progress' ? 'tag-blue' : 'tag-gold'}`}>
                      {deriveStatus(m) === 'complete' ? 'Complete' : deriveStatus(m) === 'in_progress' ? 'In Progress' : 'Draft'}
                    </span>
                    {m.type && <span className="tag tag-blue">{m.type}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
                    {m.total_words?.toLocaleString() || 0} words · {m.chapters_done || 0}/{m.total_chapters} chapters · Updated {timeAgo(m.updated_at)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, background: 'rgba(201,164,78,0.08)', borderRadius: 4, height: 4, maxWidth: 220 }}>
                      <div className="progress-bar" style={{ width: `${m.progress || 0}%` }} />
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>{m.progress || 0}%</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <Btn variant="ghost" size="sm" onClick={e => { e.stopPropagation(); navigate(`/generate/${m.id}`); }}>
                    <Icon name="zap" size={13} /> Generate
                  </Btn>
                  <Btn size="sm" onClick={e => { e.stopPropagation(); navigate(`/editor/${m.id}`); }}>
                    <Icon name="pen" size={13} /> Edit
                  </Btn>
                  <button onClick={e => { e.stopPropagation(); setToDelete(m); }} style={{ padding: '7px 9px', borderRadius: 6, background: 'transparent', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <Icon name="trash" size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!toDelete}
        title="Delete this manuscript?"
        message={toDelete ? `Are you sure you want to delete "${toDelete.title}"? This cannot be undone — all chapters and content will be permanently lost.` : ''}
        confirmLabel="Delete Manuscript"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
