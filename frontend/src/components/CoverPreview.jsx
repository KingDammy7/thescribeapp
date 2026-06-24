import Icon from './Icon';

// Style templates: rendered as CSS/SVG, no AI image generation. Each pairs a
// palette + font + layout meant to suit a particular tone of apostolic/
// prophetic ministry book. `cover_style` on a manuscript stores the `id`.
export const coverStyles = [
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Gold on deep navy — devotional & prophetic',
    background: 'linear-gradient(160deg, #0d1b2e 0%, #16243a 55%, #1f2f4a 100%)',
    accent: '#c9a44e',
    textColor: '#f6ecd9',
    subColor: 'rgba(246,236,217,0.65)',
    titleFont: "'Playfair Display', serif",
    icon: 'star',
    border: '1px solid rgba(201,164,78,0.35)',
  },
  {
    id: 'heritage',
    name: 'Heritage',
    description: 'Deep maroon & cream — classic teaching / memoir',
    background: 'linear-gradient(160deg, #3a1518 0%, #4f1f23 55%, #642a2c 100%)',
    accent: '#e8c79e',
    textColor: '#f7ece0',
    subColor: 'rgba(247,236,224,0.65)',
    titleFont: "'Playfair Display', serif",
    icon: 'book',
    border: '1px solid rgba(232,199,158,0.35)',
  },
  {
    id: 'ember',
    name: 'Ember',
    description: 'Black to orange — bold, urgent, revival tone',
    background: 'linear-gradient(160deg, #18120a 0%, #3a1f0c 55%, #6b3410 100%)',
    accent: '#f0a04b',
    textColor: '#fff4e6',
    subColor: 'rgba(255,244,230,0.65)',
    titleFont: "'Playfair Display', serif",
    icon: 'zap',
    border: '1px solid rgba(240,160,75,0.35)',
  },
  {
    id: 'royal',
    name: 'Royal',
    description: 'Purple & gold — apostolic authority, leadership',
    background: 'linear-gradient(160deg, #1f1530 0%, #2e1f47 55%, #3d2a5c 100%)',
    accent: '#d4af37',
    textColor: '#f3eefa',
    subColor: 'rgba(243,238,250,0.65)',
    titleFont: "'Playfair Display', serif",
    icon: 'feather',
    border: '1px solid rgba(212,175,55,0.35)',
  },
  {
    id: 'stone',
    name: 'Stone',
    description: 'Charcoal & white — minimal, modern, plain-spoken',
    background: 'linear-gradient(160deg, #1c1c1e 0%, #2a2a2d 55%, #38383c 100%)',
    accent: '#e5e5e5',
    textColor: '#ffffff',
    subColor: 'rgba(255,255,255,0.6)',
    titleFont: "'Inter', sans-serif",
    icon: 'layers',
    border: '1px solid rgba(255,255,255,0.18)',
  },
  {
    id: 'dawn',
    name: 'Dawn',
    description: 'Soft blue & white — gentle, hope-centered, devotional',
    background: 'linear-gradient(160deg, #cfe3f5 0%, #aecbe8 55%, #8fb3da 100%)',
    accent: '#1f3a5f',
    textColor: '#16243a',
    subColor: 'rgba(22,36,58,0.6)',
    titleFont: "'Playfair Display', serif",
    icon: 'quote',
    border: '1px solid rgba(22,36,58,0.18)',
  },
];

export function getCoverStyle(id) {
  return coverStyles.find(s => s.id === id) || coverStyles[0];
}

// width/height control overall size; aspect ratio fixed at 2:3 (book cover)
export default function CoverPreview({ style = 'aurora', title = 'Untitled', author = '', type = '', width = 140 }) {
  const s = getCoverStyle(style);
  const height = Math.round(width * 1.5);
  const titleSize = width < 100 ? 11 : width < 180 ? 14 : 19;

  return (
    <div
      style={{
        width, height,
        background: s.background,
        border: s.border,
        borderRadius: Math.max(4, width * 0.04),
        boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${width * 0.12}px ${width * 0.1}px`,
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: width * 0.06 }}>
        <Icon name={s.icon} size={Math.max(14, width * 0.16)} style={{ color: s.accent }} />
        {type && (
          <div style={{ fontSize: Math.max(7, width * 0.06), letterSpacing: 1.5, textTransform: 'uppercase', color: s.subColor, textAlign: 'center', fontWeight: 600 }}>
            {type}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', width: '100%' }}>
        <div
          style={{
            fontFamily: s.titleFont,
            fontWeight: 700,
            fontSize: titleSize,
            color: s.textColor,
            lineHeight: 1.25,
            overflowWrap: 'break-word',
            marginBottom: width * 0.08,
            display: '-webkit-box',
            WebkitLineClamp: width < 100 ? 2 : 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={title}
        >
          {title}
        </div>
        <div style={{ width: width * 0.2, height: 1.5, background: s.accent, margin: `0 auto ${width * 0.08}px` }} />
        {author && (
          <div style={{ fontSize: Math.max(7, width * 0.065), color: s.subColor, letterSpacing: 0.5 }}>
            {author}
          </div>
        )}
      </div>
    </div>
  );
}
