import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../components/Logo';
import Btn from '../components/Btn';
import Icon from '../components/Icon';
import useStore from '../store/useStore';
import { friendlyError } from '../lib/api';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState('verifying'); // verifying | done | error
  const [error, setError] = useState('');
  const { verifyEmailToken, user } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) { setStatus('error'); setError('This link is missing its verification token.'); return; }
    verifyEmailToken(token)
      .then(() => setStatus('done'))
      .catch(err => {
        setStatus('error');
        setError(friendlyError(err.response?.data?.error || err.message));
      });
  }, [token]);

  return (
    <div className="bg-hero" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
        <Link to="/" style={{ display: 'inline-block', marginBottom: 28 }}><Logo /></Link>
        <div className="glass-bright" style={{ borderRadius: 16, padding: '36px 28px' }}>
          {status === 'verifying' && (
            <>
              <div className="spin" style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border-bright)', borderTopColor: 'var(--gold)', margin: '0 auto 18px' }} />
              <p style={{ color: 'var(--muted)' }}>Verifying your email...</p>
            </>
          )}
          {status === 'done' && (
            <>
              <Icon name="check" size={36} style={{ color: '#6ee7b7', marginBottom: 14 }} />
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, color: 'var(--cream)', marginBottom: 10 }}>Email verified</h2>
              <p style={{ color: 'var(--muted)', marginBottom: 22 }}>Your email address has been confirmed.</p>
              <Btn onClick={() => navigate(user ? '/dashboard' : '/auth')} size="lg">{user ? 'Go to Dashboard →' : 'Sign In →'}</Btn>
            </>
          )}
          {status === 'error' && (
            <>
              <Icon name="alertCircle" size={36} style={{ color: '#fca5a5', marginBottom: 14 }} />
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, color: 'var(--cream)', marginBottom: 10 }}>Verification failed</h2>
              <p style={{ color: 'var(--muted)', marginBottom: 4 }}>{error}</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 14 }}>You can request a new verification link from your dashboard.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
