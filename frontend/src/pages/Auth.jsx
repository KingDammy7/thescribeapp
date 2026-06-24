import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import Btn from '../components/Btn';
import Icon from '../components/Icon';
import useStore from '../store/useStore';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function Auth() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get('mode') === 'signup' ? 'signup' : 'signin');
  useDocumentTitle(mode === 'signin' ? 'Sign In' : 'Create Account');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, register, authLoading, user } = useStore();
  const navigate = useNavigate();

  useEffect(() => { if (user) navigate('/dashboard'); }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'signup') {
        if (!name.trim()) return setError('Name is required');
        await register(name.trim(), email.trim(), password);
        navigate('/interview');
      } else {
        await login(email.trim(), password);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div className="bg-hero" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link to="/" style={{ display: 'inline-block', marginBottom: 20 }}><Logo /></Link>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, color: 'var(--cream)', marginBottom: 6 }}>
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>
            {mode === 'signin' ? 'Sign in to continue writing' : 'Begin your voice journey'}
          </p>
        </div>

        <div className="glass-bright" style={{ borderRadius: 16, padding: '32px 28px' }}>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {mode === 'signup' && (
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Apostle John Smith" required
                  className="input-gold" style={{ padding: '11px 14px', borderRadius: 8, fontSize: 14 }} />
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@ministry.com" required
                className="input-gold" style={{ padding: '11px 14px', borderRadius: 8, fontSize: 14 }} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Password</label>
                {mode === 'signin' && (
                  <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--gold)', textDecoration: 'none' }}>Forgot password?</Link>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6}
                  className="input-gold" style={{ padding: '11px 44px 11px 14px', borderRadius: 8, fontSize: 14, width: '100%' }} />
                <button type="button" onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'} title={showPassword ? 'Hide password' : 'Show password'}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex' }}>
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={16} />
                </button>
              </div>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 13 }}>
                {error}
              </div>
            )}

            <Btn type="submit" disabled={authLoading} size="lg" style={{ justifyContent: 'center', marginTop: 4 }}>
              {authLoading
                ? <><span className="spin" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid var(--navy-900)', borderTopColor: 'transparent', borderRadius: '50%' }} /> Please wait...</>
                : mode === 'signin' ? 'Sign In →' : 'Create Account →'
              }
            </Btn>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
              style={{ color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
