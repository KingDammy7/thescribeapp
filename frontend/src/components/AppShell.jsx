import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Logo from './Logo';
import Icon from './Icon';

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close the drawer whenever the route changes (e.g. after tapping a nav link)
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Lock background scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Close on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  return (
    <div className="app-shell-root" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Desktop / tablet persistent sidebar */}
      <div className="sidebar-desktop" style={{ flexShrink: 0, height: '100%' }}>
        <Sidebar />
      </div>

      {/* Mobile backdrop */}
      <div
        className="mobile-sidebar-backdrop"
        onClick={() => setMobileOpen(false)}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 40,
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* Mobile sliding drawer — always mounted, transformed off-screen when closed */}
      <div
        className="mobile-sidebar-drawer"
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
          width: 240, boxShadow: '4px 0 40px rgba(0,0,0,0.5)',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s ease',
        }}
      >
        <Sidebar onClose={() => setMobileOpen(false)} />
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Mobile / tablet header with hamburger */}
        <div
          className="mobile-header"
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--navy-950)', flexShrink: 0,
          }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cream)', padding: 6, display: 'flex' }}
          >
            <Icon name="menu" size={22} />
          </button>
          <Logo size="sm" />
          <div style={{ width: 30 }} />
        </div>

        {/* Page Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
