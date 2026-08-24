import React, { useState } from 'react';
import { BookOpen, ThumbsUp, Clock, AlertTriangle, ChevronDown, ChevronUp, Plus, X, Wrench } from 'lucide-react';

const INITIAL = [
  {
    _id: 'g_01',
    title: 'Replacing a burnt microwave waveguide mica plate (Samsung / Panasonic)',
    author: 'Master Rafiq',
    category: 'Home Appliances',
    difficulty: 'Easy',
    minutes: 15,
    upvotes: 42,
    voted: false,
    summary: 'Fix sparking inside the microwave chamber by swapping out the burnt mica sheet on the interior right wall.',
    tools: ['Phillips screwdriver', 'Utility scissors', 'Alcohol wipe'],
    parts: ['Universal mica sheet (13 × 13 cm)'],
    steps: [
      { n: 1, title: 'Unplug — Safety First', body: 'Disconnect from the AC mains outlet. Note: this guide only covers the interior mica cover; it does not require opening the outer high-voltage casing.', warn: 'Never touch internal 2,000 V capacitor.' },
      { n: 2, title: 'Remove the Burnt Mica Card', body: 'Locate the rectangular sheet on the right interior wall. Slide out the plastic retention pin.' },
      { n: 3, title: 'Trace & Cut Replacement', body: 'Lay the old sheet on new mica, trace the outline with a pencil, and cut with scissors.' },
      { n: 4, title: 'Degrease & Install', body: 'Wipe grease from the cavity behind the slot with isopropyl alcohol, insert the new sheet, and latch the pin.' },
    ],
  },
  {
    _id: 'g_02',
    title: 'Shimano 21/24-speed derailleur indexing and chain slip fix',
    author: 'Dhaka Bike Doctor',
    category: 'Bicycles',
    difficulty: 'Moderate',
    minutes: 25,
    upvotes: 35,
    voted: false,
    summary: 'Eliminate gear clicking, phantom shifts, and chain slippage by tuning limit screws and cable tension.',
    tools: ['PH2 screwdriver', '5mm hex key', 'Bike stand'],
    parts: ['PTFE chain lubricant'],
    steps: [
      { n: 1, title: 'Check Hanger Alignment', body: 'Look from behind — the derailleur cage must be perfectly vertical relative to the cassette.' },
      { n: 2, title: 'Set High Limit Screw', body: 'Shift to smallest cog. Rotate H-screw until top jockey wheel lines up under the outer cog edge.' },
      { n: 3, title: 'Fine-Tune Cable Tension', body: 'Shift one click up. If the chain hesitates, turn the barrel adjuster ¼ turn counter-clockwise.' },
    ],
  },
  {
    _id: 'g_03',
    title: 'Smartphone OLED display replacement (adhesive softening + battery disconnect)',
    author: 'FixSmart Lab',
    category: 'Smartphones',
    difficulty: 'Advanced',
    minutes: 40,
    upvotes: 28,
    voted: false,
    summary: 'Safely soften waterproof perimeter adhesive, disconnect the battery first, and transplant the digitizer assembly.',
    tools: ['Heat pad (75°C)', 'Suction cup', 'Plastic pry picks', 'Pentalobe driver'],
    parts: ['Replacement OLED assembly', 'Pre-cut B-7000 adhesive tape'],
    steps: [
      { n: 1, title: 'Heat the Perimeter (70–80°C)', body: 'Apply controlled heat for 3 min to soften factory waterproof adhesive.', warn: 'Never exceed 85°C — risk of battery swell or puncture.' },
      { n: 2, title: 'Disconnect Battery Ribbon First', body: 'Remove the shielding bracket and unplug the battery ribbon before touching any display connectors.', warn: 'Short-circuit risk: always cut power before handling flex cables.' },
    ],
  },
];

const difficultyBadge = (d) => ({
  Easy:     'badge-green',
  Moderate: 'badge-orange',
  Advanced: 'badge-red',
})[d] || 'badge-neutral';

export default function CommunityDIYFeed() {
  const [guides, setGuides]           = useState(INITIAL);
  const [category, setCategory]       = useState('All');
  const [difficulty, setDifficulty]   = useState('All');
  const [expanded, setExpanded]       = useState(null);
  const [creating, setCreating]       = useState(false);

  const [form, setForm] = useState({ title: '', category: 'Home Appliances', difficulty: 'Easy', summary: '', step: '' });

  const categories  = ['All', 'Electronics', 'Home Appliances', 'Furniture', 'Textiles & Clothing', 'Bicycles', 'Mechanical', 'Other'];
  const difficulties = ['All', 'Easy', 'Moderate', 'Advanced'];

  const filtered = guides.filter(g =>
    (category   === 'All' || g.category   === category) &&
    (difficulty === 'All' || g.difficulty === difficulty)
  );

  const toggleVote = (id) => setGuides(gs => gs.map(g => g._id === id ? { ...g, voted: !g.voted, upvotes: g.voted ? g.upvotes - 1 : g.upvotes + 1 } : g));

  const submit = (e) => {
    e.preventDefault();
    setGuides([{
      _id: `g_${Date.now()}`, title: form.title, author: 'You', category: form.category,
      difficulty: form.difficulty, minutes: 20, upvotes: 1, voted: true,
      summary: form.summary, tools: ['Standard Toolkit'], parts: ['Replacement Parts'],
      steps: [{ n: 1, title: 'Step 1', body: form.step }],
    }, ...guides]);
    setCreating(false);
    setForm({ title: '', category: 'Home Appliances', difficulty: 'Easy', summary: '', step: '' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--apple-label)', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Community DIY Repair Guides
          </h1>
          <p style={{ fontSize: 14, color: 'var(--apple-secondary)', margin: 0 }}>
            Open-source step-by-step schematics and Right-to-Repair tutorials verified by technicians.
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary" style={{ gap: 6 }}>
          <Plus size={15} strokeWidth={2.5} /> Share a Guide
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--apple-secondary)', marginRight: 2 }}>Category:</span>
          {categories.map(c => {
            const isSel = category === c;
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 980,
                  fontSize: 12.5,
                  fontWeight: isSel ? 600 : 500,
                  cursor: 'pointer',
                  border: 'none',
                  background: isSel ? 'var(--apple-blue)' : '#E8E8ED',
                  color: isSel ? '#FFFFFF' : 'var(--apple-label)',
                  transition: 'all 0.12s ease'
                }}
              >
                {c}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--apple-secondary)', marginRight: 2 }}>Difficulty:</span>
          {difficulties.map(d => {
            const isSel = difficulty === d;
            return (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 980,
                  fontSize: 12.5,
                  fontWeight: isSel ? 600 : 500,
                  cursor: 'pointer',
                  border: 'none',
                  background: isSel ? '#1D1D1F' : '#E8E8ED',
                  color: isSel ? '#FFFFFF' : 'var(--apple-label)',
                  transition: 'all 0.12s ease'
                }}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Guide Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(guide => {
          const open = expanded === guide._id;
          return (
            <div key={guide._id} className="card" style={{ padding: '22px 24px' }}>
              
              {/* Top Row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span className={`badge ${difficultyBadge(guide.difficulty)}`}>{guide.difficulty}</span>
                    <span className="badge badge-neutral">{guide.category}</span>
                    <span style={{ fontSize: 12.5, color: 'var(--apple-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={13} style={{ color: 'var(--apple-tertiary)' }} /> {guide.minutes} min · Author: {guide.author}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--apple-label)', marginBottom: 4, lineHeight: 1.3 }}>{guide.title}</h3>
                  <p style={{ fontSize: 13.5, color: 'var(--apple-secondary)', margin: 0, lineHeight: 1.5 }}>{guide.summary}</p>
                </div>

                {/* Upvote Button */}
                <button
                  onClick={() => toggleVote(guide._id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3,
                    padding: '8px 14px',
                    borderRadius: 12,
                    border: guide.voted ? '1px solid var(--apple-blue)' : '1px solid var(--apple-border)',
                    background: guide.voted ? 'var(--apple-blue-light)' : '#F5F5F7',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.12s ease'
                  }}
                >
                  <ThumbsUp size={15} style={{ color: guide.voted ? 'var(--apple-blue)' : 'var(--apple-secondary)' }} />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: guide.voted ? 'var(--apple-blue)' : 'var(--apple-label)' }}>{guide.upvotes}</span>
                </button>
              </div>

              {/* Tools & Parts Strip */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '10px 0', borderTop: '1px solid var(--apple-border-subtle)', borderBottom: '1px solid var(--apple-border-subtle)', marginBottom: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--apple-secondary)' }}>Tools:</span>
                {guide.tools.map((t, i) => <span key={i} className="badge badge-neutral" style={{ fontSize: 11.5 }}>{t}</span>)}
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--apple-secondary)', marginLeft: 8 }}>Parts:</span>
                {guide.parts.map((p, i) => <span key={i} className="badge badge-green" style={{ fontSize: 11.5 }}>{p}</span>)}
              </div>

              {/* Expand Steps Toggle */}
              <button
                onClick={() => setExpanded(open ? null : guide._id)}
                className="btn-ghost"
                style={{ fontSize: 13, gap: 5, padding: '4px 0', color: 'var(--apple-blue)', fontWeight: 600 }}
              >
                {open ? <><ChevronUp size={15} /> Hide Repair Steps</> : <><ChevronDown size={15} /> View {guide.steps.length} Repair Steps</>}
              </button>

              {/* Step Sequence */}
              {open && (
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {guide.steps.map(s => (
                    <div key={s.n} style={{ background: '#F5F5F7', borderRadius: 12, padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--apple-blue)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                          {s.n}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--apple-label)' }}>{s.title}</span>
                      </div>
                      <p style={{ fontSize: 13.5, color: 'var(--apple-secondary)', margin: '0 0 0 32px', lineHeight: 1.5 }}>{s.body}</p>
                      {s.warn && (
                        <div style={{ marginTop: 8, marginLeft: 32, display: 'flex', gap: 8, background: '#FFEBE9', border: '1px solid #FFCDD2', borderRadius: 10, padding: '8px 12px', fontSize: 12.5, color: 'var(--apple-red)', alignItems: 'center' }}>
                          <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                          <span>{s.warn}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Share Guide Modal */}
      {creating && (
        <div className="modal-overlay">
          <div className="card-elevated" style={{ maxWidth: 520, width: '100%', padding: '26px 28px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--apple-white)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid var(--apple-border)', paddingBottom: 12 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--apple-label)', margin: 0 }}>Share a Community Guide</h2>
              <button onClick={() => setCreating(false)} className="btn-ghost" style={{ padding: '6px 8px', borderRadius: 980 }}><X size={16} /></button>
            </div>

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label">Guide Title</label>
                <input className="input" required placeholder="e.g. Fixing a jammed washing machine drum" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="label">Category</label>
                  <select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {['Electronics', 'Home Appliances', 'Furniture', 'Textiles & Clothing', 'Bicycles', 'Mechanical', 'Other'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Difficulty</label>
                  <select className="input" value={form.difficulty} onChange={e => setForm({...form, difficulty: e.target.value})}>
                    {['Easy','Moderate','Advanced'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Brief Summary</label>
                <textarea className="input" required rows={2} placeholder="What does this guide fix?" value={form.summary} onChange={e => setForm({...form, summary: e.target.value})} />
              </div>
              <div>
                <label className="label">Step 1 Instructions</label>
                <textarea className="input" required rows={3} placeholder="Write the first repair step in detail…" value={form.step} onChange={e => setForm({...form, step: e.target.value})} />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14, borderRadius: 980, marginTop: 4 }}>
                Publish Guide
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
