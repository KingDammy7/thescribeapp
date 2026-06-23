export default function Btn({
  children, variant = 'gold', size = 'md',
  className = '', onClick, disabled, style = {}, type = 'button'
}) {
  const padding = size === 'sm' ? '7px 14px' : size === 'lg' ? '13px 28px' : '9px 20px';
  const fontSize = size === 'sm' ? 12 : size === 'lg' ? 15 : 14;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${variant === 'gold' ? 'btn-gold' : 'btn-ghost'} ${className}`}
      style={{ padding, fontSize, borderRadius: 8, ...style }}
    >
      {children}
    </button>
  );
}
