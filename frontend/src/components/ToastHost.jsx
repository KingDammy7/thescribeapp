import Icon from './Icon';
import useStore from '../store/useStore';

export default function ToastHost() {
  const { toasts, dismissToast } = useStore();
  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 200,
      display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 340,
    }}>
      {toasts.map(t => (
        <div
          key={t.id}
          className="glass-bright page-enter"
          onClick={() => dismissToast(t.id)}
          style={{
            borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
            cursor: 'pointer', borderLeft: `3px solid ${t.type === 'error' ? '#ef4444' : t.type === 'info' ? '#3b82f6' : 'var(--gold)'}`,
            boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
          }}
        >
          <Icon name={t.type === 'error' ? 'alertCircle' : 'check'} size={15} style={{ color: t.type === 'error' ? '#fca5a5' : t.type === 'info' ? '#93c5fd' : 'var(--gold)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.4 }}>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
