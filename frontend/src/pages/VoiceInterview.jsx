import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import Btn from '../components/Btn';
import Icon from '../components/Icon';
import useStore from '../store/useStore';

const questions = [
  { id: 'ministry', label: 'Ministry Identity', q: 'How would you describe your ministry calling and the primary mantle you carry?', placeholder: 'e.g. I carry a prophetic and apostolic mantle with a burden for nations and the next generation...' },
  { id: 'tone', label: 'Preaching Tone', q: 'Describe how you communicate — bold and declarative, gentle and pastoral, fiery and confrontational?', placeholder: 'e.g. I preach with bold, declarative authority but carry deep pastoral sensitivity for hurting people...' },
  { id: 'phrases', label: 'Signature Phrases', q: 'What phrases or expressions do you use repeatedly that feel uniquely yours?', placeholder: 'e.g. "This is a now word," "The Spirit is moving," "Arise and shine," "The mantle is upon you"...' },
  { id: 'scriptures', label: 'Anchor Scriptures', q: 'What are your 3–5 most-used scriptures that anchor your message?', placeholder: 'e.g. Isaiah 60:1, Jeremiah 1:5, Revelation 1:17, Acts 2:17, Romans 8:19...' },
  { id: 'stories', label: 'Personal Stories', q: 'What is a defining personal story or testimony you return to often in your ministry?', placeholder: 'e.g. In 2009, God spoke to me in a hotel room in Lagos and told me to write...' },
  { id: 'audience', label: 'Your Audience', q: 'Who are you primarily writing for? Leaders, the lost, believers, the next generation?', placeholder: 'e.g. I write for emerging apostolic leaders who are navigating their calling and need activation...' },
  { id: 'theology', label: 'Theological Framework', q: 'What theological convictions or movements shape your worldview and writing?', placeholder: 'e.g. Spirit-filled, apostolic theology with heavy emphasis on the prophetic and eschatology...' },
  { id: 'style', label: 'Writing Style', q: 'Do you prefer poetic and devotional, academic and structured, or narrative storytelling?', placeholder: 'e.g. I blend prophetic poetry with strong declarative teaching — urgent but accessible...' },
];

export default function VoiceInterview() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState('');
  const [saving, setSaving] = useState(false);
  const [exiting, setExiting] = useState(false);
  const { saveVoiceInterview, showToast } = useStore();
  const navigate = useNavigate();

  const q = questions[step];
  const progress = (step / questions.length) * 100;

  const next = () => {
    const updated = { ...answers, [q.id]: current };
    setAnswers(updated);
    if (step < questions.length - 1) {
      setStep(s => s + 1);
      setCurrent(answers[questions[step + 1]?.id] || '');
    } else {
      handleComplete(updated);
    }
  };

  const prev = () => {
    if (step > 0) {
      setAnswers(a => ({ ...a, [q.id]: current }));
      setStep(s => s - 1);
      setCurrent(answers[questions[step - 1]?.id] || '');
    }
  };

  const handleComplete = async (finalAnswers) => {
    setSaving(true);
    try {
      await saveVoiceInterview(finalAnswers);
      navigate('/voice-preview');
    } catch (e) {
      setSaving(false);
      showToast('Could not save your interview. Please try again.', 'error');
    }
  };

  const saveAndExit = async () => {
    setExiting(true);
    const partial = { ...answers, [q.id]: current };
    try {
      await saveVoiceInterview(partial);
      showToast('Progress saved. Pick up where you left off any time.', 'success');
      navigate('/dashboard');
    } catch (e) {
      setExiting(false);
      showToast('Could not save your progress. Please try again.', 'error');
    }
  };

  return (
    <div className="bg-hero" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: 24 }}>
      <div style={{ maxWidth: 660, margin: '0 auto', width: '100%', paddingTop: 40 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
          <Logo size="sm" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{step + 1} of {questions.length}</div>
            <button onClick={saveAndExit} disabled={exiting}
              style={{ fontSize: 12, color: 'var(--muted)', background: 'none', border: '1px solid var(--border-bright)', borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }}>
              {exiting ? 'Saving...' : 'Save & Exit'}
            </button>
          </div>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ background: 'rgba(201,164,78,0.1)', borderRadius: 4, height: 3, marginBottom: 14 }}>
            <div style={{ width: `${progress}%`, background: 'linear-gradient(90deg,var(--gold),var(--gold-light))', height: '100%', borderRadius: 4, transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {questions.map((_, i) => (
              <div key={i} className={`step-dot ${i < step ? 'done' : i === step ? 'active' : ''}`} />
            ))}
          </div>
        </div>

        {/* Question card */}
        <div className="glass page-enter" key={step} style={{ borderRadius: 20, padding: '36px 32px' }}>
          <div className="tag tag-gold" style={{ marginBottom: 18 }}>{q.label}</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(20px,3vw,26px)', color: 'var(--cream)', marginBottom: 26, lineHeight: 1.4 }}>
            {q.q}
          </h2>
          <textarea
            autoFocus
            value={current}
            onChange={e => setCurrent(e.target.value)}
            placeholder={q.placeholder}
            rows={5}
            className="input-gold"
            style={{ padding: '14px 16px', borderRadius: 10, resize: 'vertical', lineHeight: 1.7, fontSize: 15 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 26 }}>
            <Btn variant="ghost" onClick={prev} disabled={step === 0}>
              <Icon name="chevronLeft" size={14} /> Back
            </Btn>
            <Btn onClick={next} disabled={saving}>
              {saving
                ? <><span className="spin" style={{ display: 'inline-block', width: 13, height: 13, border: '2px solid var(--navy-900)', borderTopColor: 'transparent', borderRadius: '50%' }} /> Saving...</>
                : step === questions.length - 1
                  ? <><Icon name="check" size={14} /> Complete Interview</>
                  : <>Next Question <Icon name="arrowRight" size={14} /></>
              }
            </Btn>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--muted)' }}>
          Your answers build your AI voice fingerprint. Be as specific and natural as possible.
        </p>
      </div>
    </div>
  );
}
