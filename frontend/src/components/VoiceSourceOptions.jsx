import { useNavigate } from 'react-router-dom';
import Btn from './Btn';
import Icon from './Icon';

// The 4 distinct ways an author can build their AI voice fingerprint.
// Used on the Voice Profile empty state and the Dashboard onboarding card —
// kept as one shared component so both stay in sync.
const SOURCES = [
  { to: '/interview', icon: 'mic', label: 'Start Interview', desc: '8 guided questions about your voice' },
  { to: '/interview-from-books', icon: 'book', label: 'Upload Book', desc: 'PDF, DOCX, TXT, or MD manuscripts' },
  { to: '/interview-from-audio', icon: 'headphones', label: 'Upload Audio Teaching', desc: 'A recorded sermon or message' },
  { to: '/interview-from-notes', icon: 'fileText', label: 'Upload Sermon Notes', desc: 'Paste notes or a transcript' },
];

export default function VoiceSourceOptions({ size = 'lg', cardStyle = false, large = false }) {
  const navigate = useNavigate();

  if (cardStyle) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: large ? 'repeat(auto-fit,minmax(220px,1fr))' : 'repeat(auto-fit,minmax(150px,1fr))', gap: large ? 16 : 10 }}>
        {SOURCES.map((s) => (
          <button
            key={s.to}
            onClick={() => navigate(s.to)}
            className="glass"
            style={{
              borderRadius: large ? 14 : 12, padding: large ? '26px 22px' : '16px 14px', textAlign: 'left', cursor: 'pointer',
              border: '1px solid var(--border-bright)', background: 'transparent', color: 'inherit',
            }}
          >
            <Icon name={s.icon} size={large ? 26 : 20} style={{ color: 'var(--gold)', marginBottom: large ? 14 : 8 }} />
            <div style={{ fontSize: large ? 16 : 13.5, fontWeight: 600, color: 'var(--cream)', marginBottom: large ? 6 : 3 }}>{s.label}</div>
            <div style={{ fontSize: large ? 13 : 11.5, color: 'var(--muted)', lineHeight: 1.4 }}>{s.desc}</div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
      {SOURCES.map((s, i) => (
        <Btn key={s.to} size={size} variant={i === 0 ? 'gold' : 'ghost'} onClick={() => navigate(s.to)}>
          <Icon name={s.icon} size={size === 'sm' ? 12 : 16} />{s.label}
        </Btn>
      ))}
    </div>
  );
}
