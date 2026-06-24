import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../components/Logo';
import Btn from '../components/Btn';
import Icon from '../components/Icon';
import useStore from '../store/useStore';
import { friendlyError } from '../lib/api';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { resetPassword } = useStore();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirm) return setError("Passwords don't match.");
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(friendlyError(err.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <div className="bg-hero" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="glass-bright" style={{ borderRadius: 16, padding: '32px 28px', maxWidth: 420, textAlign: 'center' }}>
          <Icon name="alertCircle" size={32} style={{ color: '#fca5a5', marginBottom: 14 }} />
          <p style={{ color: 'var(--cream-dim)', marginBottom: 16 }}>This reset link is missing its token. Please request a new one.</p>
          <Link to="/forgot-password" style={{ color: 'var(--gold)', fontWeight: 600, textDecoration: 'none' }}>Request New Link →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-hero" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link to="/" style={{ display: 'inline-block', marginBottom: 20 }}><Logo /></Link>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, color: 'var(--cream)', marginBottom: 6 }}>Choose a new password</h1>
        </div>

        <div className="glass-bright" style={{ borderRadius: 16, padding: '32px 28px' }}>
          {done ? (
            <div style={{ textAlign: 'center' }}>
              <Icon name="check" size={32} style={{ color: '#6ee7b7', marginBottom: 14 }} />
              <p style={{ color: 'var(--cream-dim)', marginBottom: 18 }}>Your password has been reset.</p>
              <Btn onClick={() => navigate('/auth')} size="lg">Sign In →</Btn>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6}
                    className="input-gold" style={{ padding: '11px 44px 11px 14px', borderRadius: 8, fontSize: 14, width: '100%' }} />
                  <button type="button" onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex' }}>
                    <Icon name={showPassword ? 'eyeOff' : 'eye'} size={16} />
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Confirm Password</label>
                <input type={showPassword ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required minLength={6}
                  className="input-gold" style={{ padding: '11px 14px', borderRadius: 8, fontSize: 14, width: '100%' }} />
              </div>

              {error && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 13 }}>
                  {error}
                </div>
              )}

              <Btn type="submit" disabled={loading} size="lg" style={{ justifyContent: 'center', marginTop: 4 }}>
                {loading
                  ? <><span className="spin" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid var(--navy-900)', borderTopColor: 'transparent', borderRadius: '50%' }} /> Saving...</>
                  : 'Reset Password →'}
              </Btn>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
