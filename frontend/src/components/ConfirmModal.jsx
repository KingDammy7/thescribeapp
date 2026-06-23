import Icon from './Icon';
import Btn from './Btn';

export default function ConfirmModal({
  open, title, message, confirmLabel = 'Delete', cancelLabel = 'Cancel',
  danger = true, onConfirm, onCancel,
}) {
  if (!open) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(3,8,18,0.7)', backdropFilter: 'blur(4px)', padding: 20 }}
      onClick={onCancel}
    >
      <div
        className="glass-bright page-enter"
        onClick={e => e.stopPropagation()}
        style={{ borderRadius: 16, padding: '28px', maxWidth: 420, width: '100%' }}
      >
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 22 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: danger ? 'rgba(239,68,68,0.12)' : 'rgba(201,164,78,0.12)',
            border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : 'var(--border-bright)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="alertCircle" size={18} style={{ color: danger ? '#fca5a5' : 'var(--gold)' }} />
          </div>
          <div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 19, color: 'var(--cream)', marginBottom: 6 }}>{title}</h3>
            <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6 }}>{message}</p>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Btn variant="ghost" size="sm" onClick={onCancel}>{cancelLabel}</Btn>
          <button
            onClick={onConfirm}
            style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              border: 'none', cursor: 'pointer',
              background: danger ? 'linear-gradient(135deg,#f87171,#ef4444)' : 'linear-gradient(135deg,var(--gold-light),var(--gold))',
              color: danger ? '#fff' : 'var(--navy-900)',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
