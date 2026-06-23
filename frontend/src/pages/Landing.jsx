import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import Btn from '../components/Btn';
import Icon from '../components/Icon';

const features = [
  { icon: 'mic', title: 'Voice Fingerprinting', desc: 'A guided 8-question interview captures your theology, phrases, and preaching style.' },
  { icon: 'wand', title: 'Ghostwriting AI', desc: 'AI that has studied you for years writes full chapters in your exact voice.' },
  { icon: 'quote', title: 'Scripture Weaving', desc: 'Your anchor scriptures woven naturally into every paragraph — the way you preach them.' },
  { icon: 'layers', title: 'Full Manuscripts', desc: 'From outline to complete draft — structured, Spirit-led, and unmistakably yours.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => { setTimeout(() => setVisible(true), 80); }, []);

  return (
    <div className="bg-hero" style={{ minHeight: '100vh', overflowY: 'auto' }}>
      {/* Nav */}
      <nav style={{
        padding: '18px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid var(--border)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 10, background: 'rgba(6,13,26,0.85)',
      }}>
        <Logo />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Btn variant="ghost" onClick={() => navigate('/auth')} size="sm">Sign In</Btn>
          <Btn onClick={() => navigate('/auth?mode=signup')} size="sm">Get Started</Btn>
        </div>
      </nav>

      {/* Hero */}
      <div style={{
        maxWidth: 920, margin: '0 auto', padding: '90px 24px 70px', textAlign: 'center',
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
      }}>
        <div className="tag tag-gold" style={{ display: 'inline-flex', marginBottom: 22 }}>
          ✦ Built for Apostolic & Prophetic Authors
        </div>
        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 'clamp(40px, 6vw, 72px)',
          lineHeight: 1.08, marginBottom: 22, color: 'var(--cream)',
        }}>
          Your voice. Your anointing.<br />
          <span className="gold-text">Your manuscript.</span>
        </h1>
        <p style={{ fontSize: 'clamp(16px,2vw,20px)', color: 'var(--cream-dim)', maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.75 }}>
          The Scribe is an AI writing assistant built exclusively for Spirit-filled ministry voices — capturing your theology, phrases, and prophetic style to write full book drafts that sound unmistakably like you.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
          <Btn onClick={() => navigate('/auth?mode=signup')} size="lg">
            <Icon name="pen" size={16} /> Begin Your Voice Interview
          </Btn>
          <Btn variant="ghost" onClick={() => navigate('/auth')} size="lg">
            <Icon name="eye" size={16} /> Sign In
          </Btn>
        </div>

        {/* Sample output */}
        <div className="glass" style={{ marginTop: 64, borderRadius: 18, padding: '32px 36px', maxWidth: 680, margin: '64px auto 0', textAlign: 'left' }}>
          <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600, marginBottom: 16 }}>
            ✦ Generated in your voice
          </div>
          <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(15px,2vw,18px)', lineHeight: 1.85, color: 'var(--cream-dim)', fontStyle: 'italic' }}>
            "The prophet does not merely speak into the air — he speaks into the spirit of a generation hungry for the voice of God. What you carry is not a message; it is a mantle. And this book is not simply words on a page; it is a transfer of what heaven deposited in you..."
          </p>
          <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,var(--gold-dim),var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy-900)' }}>A</span>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cream)' }}>Apostle James Osei</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>Prophetic Voice · Chapter 1</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(28px,4vw,44px)', color: 'var(--cream)', marginBottom: 10 }}>
            How The Scribe Works
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 15 }}>From interview to manuscript in three steps</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 18 }}>
          {features.map((f, i) => (
            <div key={i} className="glass glow-ring" style={{ borderRadius: 14, padding: '26px 22px', transition: 'transform 0.2s', cursor: 'default' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(201,164,78,0.1)', border: '1px solid var(--border-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: 'var(--gold)' }}>
                <Icon name={f.icon} size={20} />
              </div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, fontWeight: 600, color: 'var(--cream)', marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '28px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>© 2025 The Scribe · AI Writing Assistant for Ministry Voices</div>
      </div>
    </div>
  );
}
