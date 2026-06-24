import { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import Btn from '../components/Btn';
import Icon from '../components/Icon';
import useStore from '../store/useStore';
import { friendlyError } from '../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { forgotPassword } = useStore();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(friendlyError(err.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  return (
    <div className="bg-hero" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link to="/" style={{ display: 'inline-block', marginBottom: 20 }}><Logo /></Link>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, color: 'var(--cream)', marginBottom: 6 }}>Reset your password</h1>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>We'll email you a link to choose a new one</p>
        </div>

        <div className="glass-bright" style={{ borderRadius: 16, padding: '32px 28px' }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <Icon name="mail" size={32} style={{ color: 'var(--gold)', marginBottom: 14 }} />
              <p style={{ color: 'var(--cream-dim)', fontSize: 14.5, lineHeight: 1.6, marginBottom: 18 }}>
                If <strong>{email}</strong> is registered with us, a password reset link is on its way. Check your inbox (and spam folder).
              </p>
              <Link to="/auth" style={{ color: 'var(--gold)', fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}>← Back to Sign In</Link>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@ministry.com" required
                  className="input-gold" style={{ padding: '11px 14px', borderRadius: 8, fontSize: 14, width: '100%' }} />
              </div>

              {error && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 13 }}>
                  {error}
                </div>
              )}

              <Btn type="submit" disabled={loading} size="lg" style={{ justifyContent: 'center', marginTop: 4 }}>
                {loading
                  ? <><span className="spin" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid var(--navy-900)', borderTopColor: 'transparent', borderRadius: '50%' }} /> Sending...</>
                  : 'Send Reset Link →'}
              </Btn>

              <Link to="/auth" style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, textDecoration: 'none' }}>← Back to Sign In</Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
