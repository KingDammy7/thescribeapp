import { Link } from 'react-router-dom';

export default function Btn({
  children, variant = 'gold', size = 'md',
  className = '', onClick, disabled, style = {}, type = 'button',
  to, ariaLabel,
}) {
  const padding = size === 'sm' ? '7px 14px' : size === 'lg' ? '13px 28px' : '9px 20px';
  const fontSize = size === 'sm' ? 12 : size === 'lg' ? 15 : 14;
  const cls = `${variant === 'gold' ? 'btn-gold' : 'btn-ghost'} ${className}`;
  const sharedStyle = { padding, fontSize, borderRadius: 8, ...style };

  // When a destination is given, render a real <a> (via Link) so navigation
  // actions are crawlable and keyboard/screen-reader friendly — not just a
  // button with a JS handler.
  if (to) {
    return (
      <Link to={to} className={cls} style={{ ...sharedStyle, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cls}
      style={sharedStyle}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
