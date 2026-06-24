import Logo from '../components/Logo';
import { Link } from 'react-router-dom';

const PRIVACY = {
  title: 'Privacy Policy',
  updated: 'Last updated: June 2026',
  body: [
    ['What we collect', 'We collect the account information you provide (name, email), the manuscript and voice-profile content you create in the app, and basic usage data needed to operate the service.'],
    ['How we use it', 'Your manuscript and voice-interview content is sent to our AI provider (Anthropic) solely to generate writing in your voice. We do not sell your data or use it to train third-party models without your consent.'],
    ['Storage & security', 'Content is stored on our servers and protected with industry-standard access controls. You can request deletion of your account and all associated content at any time.'],
    ['Your rights', 'You may access, export, or delete your manuscripts and voice profile from within the app, or by contacting us directly.'],
    ['Contact', 'Questions about this policy can be sent to contactdamilolaayodele@gmail.com.'],
  ],
};

const TERMS = {
  title: 'Terms of Service',
  updated: 'Last updated: June 2026',
  body: [
    ['Use of the service', 'The Scribe is provided to help you draft written content in your own voice. You are responsible for reviewing, editing, and approving any AI-generated text before publishing or distributing it.'],
    ['Your content', 'You retain ownership of everything you write and everything generated for your manuscripts. We claim no ownership over your content.'],
    ['Acceptable use', 'You agree not to use the service to generate content that infringes on others’ rights, violates law, or misrepresents AI-generated text as having been independently authored where disclosure is required.'],
    ['AI-generated content', 'Generated drafts are a starting point, not a finished, fact-checked, or theologically vetted manuscript. Review all scripture references and doctrinal claims yourself before publishing.'],
    ['Availability', 'The service is provided "as is." We aim for reliable uptime but do not guarantee uninterrupted access.'],
    ['Contact', 'Questions about these terms can be sent to contactdamilolaayodele@gmail.com.'],
  ],
};

function LegalPage({ doc }) {
  return (
    <div className="bg-hero" style={{ minHeight: '100vh', overflowY: 'auto' }}>
      <header style={{ padding: '18px 40px', borderBottom: '1px solid var(--border)' }}>
        <Logo to="/" />
      </header>
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '56px 24px 80px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(28px,5vw,42px)', color: 'var(--cream)', marginBottom: 6 }}>
          {doc.title}
        </h1>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 36 }}>{doc.updated}</div>
        {doc.body.map(([heading, text], i) => (
          <section key={i} style={{ marginBottom: 28 }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 19, color: 'var(--gold-light)', marginBottom: 8 }}>{heading}</h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.75, color: 'var(--cream-dim)' }}>{text}</p>
          </section>
        ))}
        <Link to="/" style={{ fontSize: 13, color: 'var(--gold)' }}>&larr; Back to home</Link>
      </main>
    </div>
  );
}

export function PrivacyPolicy() {
  return <LegalPage doc={PRIVACY} />;
}

export function TermsOfService() {
  return <LegalPage doc={TERMS} />;
}
