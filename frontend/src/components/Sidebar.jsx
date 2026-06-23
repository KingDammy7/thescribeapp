import { NavLink, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import Icon from './Icon';
import useStore from '../store/useStore';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: 'home' },
  { to: '/manuscripts', label: 'Manuscripts', icon: 'book' },
  { to: '/voice-profile', label: 'My Voice', icon: 'mic' },
  { to: '/scripture-studio', label: 'Scripture Studio', icon: 'quote' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

export default function Sidebar({ onClose }) {
  const { user, logout } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div style={{
      width: 240, minWidth: 240, height: '100%',
      background: 'var(--navy-950)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Logo */}
      <div style={{ padding: '22px 18px', borderBottom: '1px solid var(--border)' }}>
        <Logo size="sm" />
      </div>

      {/* Nav */}
      <nav style={{ padding: '8px 10px', flex: 1 }}>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, marginBottom: 2,
              textDecoration: 'none',
              fontSize: 13, fontWeight: 500,
              color: isActive ? 'var(--nav-active-text)' : 'var(--muted)',
              background: isActive ? 'var(--nav-active-bg)' : 'transparent',
              borderLeft: isActive ? '2px solid var(--gold)' : '2px solid transparent',
              transition: 'all 0.15s',
            })}
          >
            <Icon name={item.icon} size={16} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={() => { navigate('/new-manuscript'); onClose?.(); }}
          className="btn-gold"
          style={{ width: '100%', padding: '9px', borderRadius: 8, fontSize: 13, justifyContent: 'center' }}
        >
          <Icon name="plus" size={14} /> New Manuscript
        </button>

        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--gold-dim), var(--gold))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy-900)' }}>
              {(user?.name || 'A')[0].toUpperCase()}
            </span>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cream)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'Author'}
            </div>
            <button onClick={handleLogout} style={{ fontSize: 10, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
