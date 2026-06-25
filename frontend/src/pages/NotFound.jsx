import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import Btn from '../components/Btn';
import Icon from '../components/Icon';
import useStore from '../store/useStore';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('Page Not Found');
  const { token } = useStore();

  return (
    <div className="bg-hero" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div style={{ maxWidth: 440 }}>
        <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'center' }}>
          <Logo />
        </div>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 64, color: 'var(--gold)', opacity: 0.5, lineHeight: 1, marginBottom: 8 }}>404</div>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, color: 'var(--cream)', marginBottom: 10 }}>Page Not Found</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 28, fontSize: 14 }}>
          The page you're looking for doesn't exist or may have moved. Your session is still active — head back to continue.
        </p>
        <Link to={token ? '/dashboard' : '/'} style={{ textDecoration: 'none' }}>
          <Btn size="lg">
            <Icon name="chevronLeft" size={14} /> {token ? 'Back to Dashboard' : 'Back to Home'}
          </Btn>
        </Link>
      </div>
    </div>
  );
}
