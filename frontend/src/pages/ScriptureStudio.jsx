import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Btn from '../components/Btn';
import Icon from '../components/Icon';
import useStore from '../store/useStore';
import { streamRequest } from '../lib/api';

const defaultScriptures = [
  { reference: 'Isaiah 60:1', text: '"Arise, shine; for your light has come! And the glory of the LORD is risen upon you."', theme: 'Prophetic Awakening', tags: ['light', 'glory', 'awakening', 'arise', 'prophetic'] },
  { reference: 'Isaiah 6:8', text: '"Also I heard the voice of the Lord, saying, Whom shall I send, and who will go for us? Then said I, Here am I; send me."', theme: 'Sending & Calling', tags: ['calling', 'sending', 'obedience', 'prophet'] },
  { reference: 'Isaiah 43:19', text: '"Behold, I will do a new thing; now it shall spring forth; shall ye not know it? I will even make a way in the wilderness, and rivers in the desert."', theme: 'New Things', tags: ['new', 'wilderness', 'breakthrough', 'provision', 'faith'] },
  { reference: 'Isaiah 54:2', text: '"Enlarge the place of thy tent, and let them stretch forth the curtains of thine habitations: spare not, lengthen thy cords, and strengthen thy stakes."', theme: 'Enlargement', tags: ['enlargement', 'increase', 'expansion', 'faith'] },
  { reference: 'Jeremiah 1:5', text: '"Before I formed you in the womb I knew you; before you were born I sanctified you; I ordained you a prophet to the nations."', theme: 'Divine Calling', tags: ['calling', 'destiny', 'purpose', 'prophet', 'identity'] },
  { reference: 'Jeremiah 29:11', text: '"For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end."', theme: 'Hope & Destiny', tags: ['hope', 'future', 'plans', 'destiny', 'peace'] },
  { reference: 'Acts 2:17', text: '"And it shall come to pass in the last days, says God, that I will pour out of My Spirit on all flesh; your sons and your daughters shall prophesy..."', theme: 'Prophetic Outpouring', tags: ['spirit', 'holy spirit', 'prophecy', 'outpouring', 'last days', 'faith'] },
  { reference: 'Acts 1:8', text: '"But ye shall receive power, after that the Holy Ghost is come upon you: and ye shall be witnesses unto me both in Jerusalem, and in all Judaea, and in Samaria, and unto the uttermost part of the earth."', theme: 'Power & Witness', tags: ['power', 'holy spirit', 'witness', 'mission'] },
  { reference: 'Revelation 1:17', text: '"Do not be afraid; I am the First and the Last. I am He who lives, and was dead, and behold, I am alive forevermore."', theme: 'Divine Authority', tags: ['authority', 'fear', 'courage', 'eternal', 'faith'] },
  { reference: 'Revelation 12:11', text: '"And they overcame him by the blood of the Lamb, and by the word of their testimony; and they loved not their lives unto the death."', theme: 'Overcoming', tags: ['overcome', 'testimony', 'blood', 'victory'] },
  { reference: 'Romans 8:19', text: '"For the earnest expectation of the creation eagerly waits for the revealing of the sons of God."', theme: 'Kingdom Manifestation', tags: ['kingdom', 'sonship', 'hope', 'manifestation', 'faith'] },
  { reference: 'Romans 8:28', text: '"And we know that all things work together for good to them that love God, to them who are the called according to his purpose."', theme: 'Providence', tags: ['providence', 'purpose', 'good', 'trust'] },
  { reference: 'Romans 12:2', text: '"And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God."', theme: 'Transformation', tags: ['mind', 'renewal', 'transformation', 'will of god'] },
  { reference: 'Habakkuk 2:2', text: '"Write the vision and make it plain on tablets, that he may run who reads it."', theme: 'Vision & Writing', tags: ['vision', 'writing', 'clarity', 'purpose'] },
  { reference: 'Habakkuk 2:3', text: '"For the vision is yet for an appointed time, but at the end it shall speak, and not lie: though it tarry, wait for it; because it will surely come, it will not tarry."', theme: 'Patience & Vision', tags: ['vision', 'timing', 'patience', 'waiting'] },
  { reference: 'Ephesians 4:11', text: '"And He Himself gave some to be apostles, some prophets, some evangelists, and some pastors and teachers."', theme: 'Five-fold Ministry', tags: ['ministry', 'leadership', 'apostolic', 'gifts', 'church'] },
  { reference: 'Ephesians 4:12', text: '"For the perfecting of the saints, for the work of the ministry, for the edifying of the body of Christ."', theme: 'Equipping the Saints', tags: ['ministry', 'equipping', 'church', 'body of christ'] },
  { reference: 'Ephesians 6:12', text: '"For we wrestle not against flesh and blood, but against principalities, against powers, against the rulers of the darkness of this world, against spiritual wickedness in high places."', theme: 'Spiritual Warfare', tags: ['warfare', 'principalities', 'spirit', 'battle'] },
  { reference: '2 Timothy 1:6', text: '"Therefore I remind you to stir up the gift of God which is in you through the laying on of my hands."', theme: 'Activating the Gift', tags: ['gift', 'activation', 'impartation', 'faith', 'prayer'] },
  { reference: '2 Timothy 1:7', text: '"For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind."', theme: 'Boldness', tags: ['fear', 'boldness', 'power', 'sound mind'] },
  { reference: 'Philippians 4:6', text: '"Be anxious for nothing, but in everything by prayer and supplication, with thanksgiving, let your requests be made known to God."', theme: 'Prayer & Peace', tags: ['prayer', 'peace', 'anxiety', 'thanksgiving', 'supplication'] },
  { reference: 'Philippians 4:13', text: '"I can do all things through Christ which strengtheneth me."', theme: 'Strength', tags: ['strength', 'christ', 'empowerment', 'faith'] },
  { reference: 'Hebrews 11:1', text: '"Now faith is the substance of things hoped for, the evidence of things not seen."', theme: 'Foundations of Faith', tags: ['faith', 'hope', 'belief', 'substance', 'evidence'] },
  { reference: 'Hebrews 11:6', text: '"But without faith it is impossible to please him: for he that cometh to God must believe that he is, and that he is a rewarder of them that diligently seek him."', theme: 'Faith', tags: ['faith', 'belief', 'reward', 'seeking god'] },
  { reference: 'Joel 2:28', text: '"And it shall come to pass afterward, that I will pour out my spirit upon all flesh; and your sons and your daughters shall prophesy, your old men shall dream dreams, your young men shall see visions."', theme: 'Outpouring', tags: ['outpouring', 'prophecy', 'dreams', 'visions', 'holy spirit'] },
  { reference: 'Joshua 1:9', text: '"Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest."', theme: 'Courage', tags: ['courage', 'strength', 'fear', 'presence of god'] },
  { reference: 'Psalm 23:1', text: '"The LORD is my shepherd; I shall not want."', theme: 'Provision & Peace', tags: ['shepherd', 'provision', 'peace', 'trust'] },
  { reference: 'Psalm 91:1', text: '"He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty."', theme: 'Protection', tags: ['protection', 'refuge', 'dwelling', 'safety'] },
  { reference: 'Psalm 139:14', text: '"I will praise thee; for I am fearfully and wonderfully made: marvellous are thy works; and that my soul knoweth right well."', theme: 'Identity', tags: ['identity', 'worth', 'creation', 'praise'] },
  { reference: 'Proverbs 29:18', text: '"Where there is no vision, the people perish: but he that keepeth the law, happy is he."', theme: 'Vision', tags: ['vision', 'leadership', 'law', 'direction'] },
  { reference: 'Proverbs 3:5', text: '"Trust in the LORD with all thine heart; and lean not unto thine own understanding."', theme: 'Trust', tags: ['trust', 'understanding', 'heart', 'wisdom'] },
  { reference: 'Matthew 28:19', text: '"Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost."', theme: 'Great Commission', tags: ['commission', 'nations', 'baptism', 'mission'] },
  { reference: 'Matthew 6:33', text: '"But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you."', theme: 'Kingdom Priority', tags: ['kingdom', 'righteousness', 'priority', 'provision'] },
  { reference: 'Mark 16:17', text: '"And these signs shall follow them that believe; In my name shall they cast out devils; they shall speak with new tongues..."', theme: 'Signs & Wonders', tags: ['signs', 'healing', 'belief', 'miracles'] },
  { reference: 'Luke 4:18', text: '"The Spirit of the Lord is upon me, because he hath anointed me to preach the gospel to the poor; he hath sent me to heal the brokenhearted, to preach deliverance to the captives, and recovering of sight to the blind, to set at liberty them that are bruised."', theme: 'Anointing', tags: ['anointing', 'gospel', 'healing', 'deliverance'] },
  { reference: 'John 10:10', text: '"I am come that they might have life, and that they might have it more abundantly."', theme: 'Abundant Life', tags: ['life', 'abundance', 'purpose'] },
  { reference: 'John 14:12', text: '"Verily, verily, I say unto you, He that believeth on me, the works that I do shall he do also; and greater works than these shall he do; because I go unto my Father."', theme: 'Greater Works', tags: ['works', 'faith', 'miracles', 'greater'] },
  { reference: 'Galatians 5:22', text: '"But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith."', theme: 'Fruit of the Spirit', tags: ['fruit', 'spirit', 'character', 'love'] },
  { reference: '1 Corinthians 12:7', text: '"But the manifestation of the Spirit is given to every man to profit withal."', theme: 'Spiritual Gifts', tags: ['gifts', 'spirit', 'manifestation', 'church'] },
  { reference: '1 Corinthians 13:13', text: '"And now abideth faith, hope, charity, these three; but the greatest of these is charity."', theme: 'Love', tags: ['love', 'faith', 'hope', 'charity'] },
  { reference: '2 Corinthians 5:17', text: '"Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new."', theme: 'New Creation', tags: ['new creation', 'transformation', 'salvation', 'identity'] },
  { reference: '2 Corinthians 4:18', text: '"While we look not at the things which are seen, but at the things which are not seen: for the things which are seen are temporal; but the things which are not seen are eternal."', theme: 'Eternal Perspective', tags: ['eternal', 'perspective', 'faith', 'unseen'] },
  { reference: 'Zechariah 4:6', text: '"Not by might, nor by power, but by my spirit, saith the LORD of hosts."', theme: 'Dependence on the Spirit', tags: ['spirit', 'power', 'might', 'dependence'] },
  { reference: 'Malachi 3:10', text: '"Bring ye all the tithes into the storehouse... and prove me now herewith, saith the LORD of hosts, if I will not open you the windows of heaven, and pour you out a blessing, that there shall not be room enough to receive it."', theme: 'Provision & Tithing', tags: ['tithe', 'provision', 'blessing', 'storehouse'] },
  { reference: 'Genesis 1:3', text: '"And God said, Let there be light: and there was light."', theme: 'Creative Power of the Word', tags: ['creation', 'word', 'light', 'power'] },
  { reference: 'Numbers 23:19', text: '"God is not a man, that he should lie; neither the son of man, that he should repent: hath he said, and shall he not do it? or hath he spoken, and shall he not make it good?"', theme: 'Faithfulness of God', tags: ['faithfulness', 'promise', 'truth', 'god'] },
  { reference: 'Deuteronomy 31:6', text: '"Be strong and of a good courage, fear not, nor be afraid of them: for the LORD thy God, he it is that doth go with thee; he will not fail thee, nor forsake thee."', theme: 'Courage & Presence', tags: ['courage', 'presence', 'fear', 'strength'] },
  { reference: '1 Samuel 16:7', text: '"...for the LORD seeth not as man seeth; for man looketh on the outward appearance, but the LORD looketh on the heart."', theme: 'Heart Over Appearance', tags: ['heart', 'identity', 'calling', 'discernment'] },
  { reference: 'Esther 4:14', text: '"...for who knoweth whether thou art come to the kingdom for such a time as this?"', theme: 'Such a Time as This', tags: ['purpose', 'timing', 'destiny', 'calling'] },
  { reference: 'Daniel 11:32', text: '"...but the people that do know their God shall be strong, and do exploits."', theme: 'Exploits', tags: ['strength', 'exploits', 'knowledge of god', 'boldness'] },
  { reference: 'Amos 3:7', text: '"Surely the Lord GOD will do nothing, but he revealeth his secret unto his servants the prophets."', theme: 'Prophetic Revelation', tags: ['prophets', 'revelation', 'secrets', 'servants'] },
  { reference: 'Micah 6:8', text: '"...what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?"', theme: 'Justice & Humility', tags: ['justice', 'mercy', 'humility', 'walk with god'] },
  { reference: 'Nehemiah 8:10', text: '"...for the joy of the LORD is your strength."', theme: 'Joy as Strength', tags: ['joy', 'strength', 'gladness'] },
  { reference: 'James 1:5', text: '"If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him."', theme: 'Wisdom', tags: ['wisdom', 'asking', 'god', 'liberally'] },
  { reference: 'James 5:16', text: '"...The effectual fervent prayer of a righteous man availeth much."', theme: 'Prayer', tags: ['prayer', 'righteousness', 'power', 'effectual'] },
  { reference: '1 Peter 2:9', text: '"But ye are a chosen generation, a royal priesthood, an holy nation, a peculiar people; that ye should shew forth the praises of him who hath called you out of darkness into his marvellous light."', theme: 'Chosen & Royal', tags: ['chosen', 'priesthood', 'identity', 'calling'] },
  { reference: '1 John 4:4', text: '"...greater is he that is in you, than he that is in the world."', theme: 'Greater is He', tags: ['greater', 'victory', 'indwelling', 'confidence'] },
];

export default function ScriptureStudio() {
  const { voiceProfile, manuscripts, fetchManuscripts, showToast } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [context, setContext] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState('');
  const [suggestEmpty, setSuggestEmpty] = useState(false);
  const [copied, setCopied] = useState(null);
  const [sendPickerFor, setSendPickerFor] = useState(null);

  useEffect(() => { if (manuscripts.length === 0) fetchManuscripts(); }, []);

  const filtered = defaultScriptures.filter(s => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      s.reference.toLowerCase().includes(q) ||
      s.text.toLowerCase().includes(q) ||
      s.theme.toLowerCase().includes(q) ||
      (s.tags || []).some(tag => tag.toLowerCase().includes(q))
    );
  });

  const getSuggestions = () => {
    setSuggestLoading(true);
    setSuggestions([]);
    setSuggestError('');
    setSuggestEmpty(false);

    streamRequest(
      '/api/generate/scripture-suggest',
      { context: context || 'apostolic calling and prophetic ministry' },
      () => {}, // no text chunks expected on this endpoint
      (data) => {
        setSuggestLoading(false);
        if (Array.isArray(data) && data.length > 0) {
          setSuggestions(data);
        } else {
          setSuggestEmpty(true);
        }
      },
      (err) => { setSuggestLoading(false); setSuggestError(err); }
    );
  };

  const copy = (s) => {
    const text = `${s.reference} — ${s.text || s.why || ''}`;
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(s.reference);
    setTimeout(() => setCopied(null), 2000);
  };

  const sendToEditor = (manuscript, scripture) => {
    navigate(`/editor/${manuscript.id}?insertScripture=${encodeURIComponent(`${scripture.reference} — ${scripture.text}`)}`);
    setSendPickerFor(null);
  };

  return (
    <div style={{ padding: '32px 28px', maxWidth: 900, margin: '0 auto' }} className="page-enter">
      <div style={{ marginBottom: 32 }}>
        <div className="tag tag-gold" style={{ marginBottom: 10 }}>Scripture Studio</div>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, color: 'var(--cream)' }}>Scripture Library</h1>
        <p style={{ color: 'var(--muted)', marginTop: 6, fontSize: 14 }}>Find, explore, and weave scripture into your manuscript with AI assistance</p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 22 }}>
        <Icon name="search" size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by reference, keyword, or theme (e.g. faith, spirit, prayer)..."
          className="input-gold" style={{ padding: '11px 14px 11px 42px', borderRadius: 10, fontSize: 14 }} />
      </div>

      {/* AI Suggestion Panel */}
      <div className="glass-bright" style={{ borderRadius: 14, padding: '20px 22px', marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--cream)', fontSize: 14 }}>AI Scripture Suggestions</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Get verses tailored to your voice and current writing context</div>
          </div>
          <Btn variant="ghost" size="sm" onClick={getSuggestions} disabled={suggestLoading}>
            {suggestLoading
              ? <><span className="spin" style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} /> Thinking...</>
              : <><Icon name="zap" size={13} /> Suggest for Me</>
            }
          </Btn>
        </div>
        <input value={context} onChange={e => setContext(e.target.value)} placeholder="What are you writing about? (optional)"
          className="input-gold" style={{ padding: '9px 12px', borderRadius: 8, fontSize: 13, marginBottom: (suggestions.length > 0 || suggestError || suggestEmpty) ? 16 : 0 }} />

        {suggestError && (
          <div style={{ marginTop: 4, padding: '10px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', fontSize: 13 }}>
            {suggestError}
          </div>
        )}

        {suggestEmpty && !suggestError && (
          <div style={{ marginTop: 4, padding: '10px 12px', borderRadius: 8, background: 'rgba(201,164,78,0.06)', border: '1px solid var(--border-bright)', color: 'var(--muted)', fontSize: 13 }}>
            No suggestions came back for that prompt. Try adding more detail about what you're writing, then try again.
          </div>
        )}

        {suggestions.length > 0 && (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {suggestions.map((s, i) => (
              <div key={i} className="scripture-card" style={{ padding: '12px 14px', background: 'rgba(6,13,26,0.4)', borderRadius: '0 8px 8px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 14 }}>{s.reference}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setSendPickerFor(sendPickerFor === `s${i}` ? null : `s${i}`)} style={{ padding: '3px 8px', borderRadius: 6, background: 'transparent', border: '1px solid var(--border-bright)', color: 'var(--muted)', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                      Send to Editor
                    </button>
                    <button onClick={() => copy(s)} style={{ padding: '3px 8px', borderRadius: 6, background: copied === s.reference ? 'rgba(16,185,129,0.15)' : 'transparent', border: `1px solid ${copied === s.reference ? 'rgba(16,185,129,0.4)' : 'var(--border-bright)'}`, color: copied === s.reference ? '#6ee7b7' : 'var(--muted)', cursor: 'pointer', fontSize: 11, fontWeight: 600, transition: 'all 0.2s', flexShrink: 0 }}>
                      {copied === s.reference ? '✓' : 'Copy'}
                    </button>
                  </div>
                </div>
                <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 6 }}>{s.text}</p>
                {s.why && <p style={{ fontSize: 12, color: 'var(--muted)' }}>{s.why}</p>}
                {sendPickerFor === `s${i}` && <ManuscriptPicker manuscripts={manuscripts} onPick={(m) => sendToEditor(m, s)} />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scripture Library */}
      <div style={{ marginBottom: 14, fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
        Library · {filtered.length} scriptures
      </div>
      {filtered.length === 0 ? (
        <div className="glass" style={{ borderRadius: 12, padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>
          No scriptures match "{query}". Try a broader keyword.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 14 }}>
          {filtered.map((s, i) => (
            <div key={i} className="glass scripture-card" style={{ borderRadius: 12, padding: '18px 18px 18px 16px', transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 14 }}>{s.reference}</div>
                  <span className="tag tag-blue" style={{ marginTop: 5, fontSize: 10 }}>{s.theme}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setSendPickerFor(sendPickerFor === `l${i}` ? null : `l${i}`)} style={{ padding: '4px 9px', borderRadius: 6, background: 'transparent', border: '1px solid var(--border-bright)', color: 'var(--muted)', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                    Send
                  </button>
                  <button onClick={() => copy(s)} style={{ padding: '4px 10px', borderRadius: 6, background: copied === s.reference ? 'rgba(16,185,129,0.15)' : 'transparent', border: `1px solid ${copied === s.reference ? 'rgba(16,185,129,0.4)' : 'var(--border-bright)'}`, color: copied === s.reference ? '#6ee7b7' : 'var(--muted)', cursor: 'pointer', fontSize: 11, fontWeight: 600, transition: 'all 0.2s', flexShrink: 0 }}>
                    {copied === s.reference ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.7, fontStyle: 'italic' }}>{s.text}</p>
              {sendPickerFor === `l${i}` && <ManuscriptPicker manuscripts={manuscripts} onPick={(m) => sendToEditor(m, s)} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ManuscriptPicker({ manuscripts, onPick }) {
  if (manuscripts.length === 0) {
    return <div style={{ marginTop: 10, fontSize: 12, color: 'var(--muted)' }}>Create a manuscript first to send scripture into it.</div>;
  }
  return (
    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4, padding: 8, borderRadius: 8, background: 'rgba(6,13,26,0.5)', border: '1px solid var(--border-bright)' }}>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Choose a manuscript:</div>
      {manuscripts.map(m => (
        <button key={m.id} onClick={() => onPick(m)} style={{ textAlign: 'left', padding: '6px 8px', borderRadius: 6, background: 'transparent', border: 'none', color: 'var(--cream-dim)', cursor: 'pointer', fontSize: 12.5 }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,164,78,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          {m.title}
        </button>
      ))}
    </div>
  );
}
