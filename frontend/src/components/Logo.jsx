import { Link } from 'react-router-dom';
import Icon from './Icon';
import useStore from '../store/useStore';

export default function Logo({ size = 'md', to }) {
  const { user } = useStore();
  const iconSize = size === 'sm' ? 14 : 18;
  const boxSize = size === 'sm' ? 28 : 36;
  const titleSize = size === 'sm' ? 16 : 20;
  const destination = to || (user ? '/dashboard' : '/');

  return (
    <Link to={destination} aria-label="The Scribe — go to home" style={{ display: 'flex', alignItems: 'center', gap: size === 'sm' ? 8 : 12, textDecoration: 'none' }}>
      <div style={{
        width: boxSize, height: boxSize,
        background: 'linear-gradient(135deg, var(--gold-light), var(--gold-dim))',
        borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon name="feather" size={iconSize} style={{ color: 'var(--navy-900)' }} />
      </div>
      <div>
        <div style={{
          fontFamily: 'Playfair Display, serif',
          fontWeight: 700,
          fontSize: titleSize,
          background: 'linear-gradient(135deg, var(--gold-light), var(--gold))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1,
        }}>
          The Scribe
        </div>
        {size !== 'sm' && (
          <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginTop: 2 }}>
            Ministry Voice AI
          </div>
        )}
      </div>
    </Link>
  );
}
