import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Btn from '../components/Btn';
import Icon from '../components/Icon';
import useStore from '../store/useStore';
import { friendlyError } from '../lib/api';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function Settings() {
  useDocumentTitle('Settings');
  const { user, updateProfile, logout, theme, toggleTheme, showToast } = useStore();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // user loads asynchronously after mount — keep form fields in sync once it arrives
  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
  }, [user]);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await updateProfile({ name, email });
      setSaved(true);
      showToast('Profile updated.', 'success');
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      const msg = friendlyError(e.response?.data?.error || 'Failed to save changes.');
      setError(msg);
      showToast(msg, 'error');
    }
    setSaving(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div style={{ padding: '32px 28px', maxWidth: 640, margin: '0 auto' }} className="page-enter">
      <div style={{ marginBottom: 32 }}>
        <div className="tag tag-gold" style={{ marginBottom: 10 }}>Settings</div>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, color: 'var(--cream)' }}>Account & Profile</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Profile */}
        <div className="glass" style={{ borderRadius: 14, padding: '26px' }}>
          <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600, marginBottom: 20 }}>Profile</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,var(--gold-dim),var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy-900)' }}>{(name || 'A')[0]}</span>
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--cream)', fontSize: 16 }}>{user?.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Ministry Voice · Active</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 7 }}>Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="input-gold" style={{ padding: '11px 14px', borderRadius: 8, fontSize: 14 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 7 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-gold" style={{ padding: '11px 14px', borderRadius: 8, fontSize: 14 }} />
            </div>
            {error && <div style={{ color: '#fca5a5', fontSize: 13 }}>{error}</div>}
            <Btn onClick={save} disabled={saving} style={{ alignSelf: 'flex-start' }}>
              {saving ? 'Saving...' : saved ? <><Icon name="check" size={14} /> Saved!</> : 'Save Changes'}
            </Btn>
          </div>
        </div>

        {/* Voice Profile */}
        <div className="glass" style={{ borderRadius: 14, padding: '26px' }}>
          <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600, marginBottom: 14 }}>Voice Profile</div>
          <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 16 }}>
            Your voice fingerprint is built from your interview answers and powers all AI generation.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Btn variant="ghost" size="sm" onClick={() => navigate('/voice-profile')}><Icon name="eye" size={13} />View Profile</Btn>
            <Btn variant="ghost" size="sm" onClick={() => navigate('/interview')}><Icon name="refresh" size={13} />Re-interview</Btn>
          </div>
        </div>

        {/* Appearance */}
        <div className="glass" style={{ borderRadius: 14, padding: '26px' }}>
          <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600, marginBottom: 14 }}>Appearance</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--cream)', fontSize: 14 }}>Dark Mode</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Switch between light and dark themes</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: theme === 'light' ? 'var(--gold-dim)' : 'var(--muted)' }}>Light</span>
              <button className={`theme-toggle ${theme === 'dark' ? 'on' : ''}`} onClick={toggleTheme} aria-label="Toggle theme">
                <span className="knob" />
              </button>
              <span style={{ fontSize: 12, fontWeight: 600, color: theme === 'dark' ? 'var(--gold-light)' : 'var(--muted)' }}>Dark</span>
            </div>
          </div>
        </div>

        {/* Account */}
        <div className="glass" style={{ borderRadius: 14, padding: '26px' }}>
          <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600, marginBottom: 14 }}>Account</div>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#fca5a5', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <Icon name="x" size={14} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
