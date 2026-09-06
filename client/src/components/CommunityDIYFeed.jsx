import React, { useState, useEffect } from 'react';
import { BookOpen, ThumbsUp, Clock, AlertTriangle, ChevronDown, ChevronUp, Plus, X, Wrench, Loader2, CheckCircle, Database } from 'lucide-react';
import axios from 'axios';

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
  const [guides, setGuides]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [isAtlasConnected, setIsAtlasConnected] = useState(false);
  const [category, setCategory]       = useState('All');
  const [difficulty, setDifficulty]   = useState('All');
  const [expanded, setExpanded]       = useState(null);
  const [creating, setCreating]       = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const [form, setForm] = useState({
    title: '',
    category: 'Home Appliances',
    difficulty: 'Easy',
    minutes: 20,
    summary: '',
    tools: '',
    parts: '',
    stepTitle: '',
    step: '',
    safetyNote: ''
  });

  const categories  = ['All', 'Electronics', 'Home Appliances', 'Smartphones', 'Bicycles', 'Furniture', 'Textiles & Clothing', 'Mechanical', 'Other'];
  const difficulties = ['All', 'Easy', 'Moderate', 'Advanced'];

  // Fetch guides from MongoDB Atlas via GET /api/guides
  useEffect(() => {
    let isMounted = true;
    const fetchGuides = async () => {
      setLoading(true);
      try {
        const params = {};
        if (category && category !== 'All') params.category = category;
        if (difficulty && difficulty !== 'All') params.difficulty = difficulty;

        const res = await axios.get('/api/guides', { params });
        if (res.data?.success && isMounted) {
          setIsAtlasConnected(true);
          const userRaw = sessionStorage.getItem('repairhub_user') || localStorage.getItem('repairhub_user');
          let currentUserId = null;
          try {
            if (userRaw) currentUserId = JSON.parse(userRaw)?._id || JSON.parse(userRaw)?.id;
          } catch (_) {}

          const liveGuides = res.data.data.map(g => ({
            _id: g._id,
            title: g.title,
            author: g.authorName || 'Community Fixer',
            category: g.category,
            difficulty: g.difficulty || 'Moderate',
            minutes: g.estimatedMinutes || 25,
            upvotes: g.upvotes || 0,
            voted: currentUserId && Array.isArray(g.upvotedBy)
              ? g.upvotedBy.some(id => id?.toString() === currentUserId.toString())
              : false,
            summary: g.summary,
            tools: g.toolsRequired && g.toolsRequired.length > 0 ? g.toolsRequired : ['Standard Toolkit'],
            parts: g.partsNeeded && g.partsNeeded.length > 0 ? g.partsNeeded : ['Direct Replacement'],
            steps: (g.steps && g.steps.length > 0)
              ? g.steps.map((s, idx) => ({
                  n: s.stepNumber || idx + 1,
                  title: s.stepTitle || `Step ${idx + 1}`,
                  body: s.instruction || '',
                  warn: s.safetyNote || '',
                }))
              : [{ n: 1, title: 'Step 1: Inspection & Safety', body: g.summary, warn: '' }]
          }));

          setGuides(liveGuides);
        }
      } catch (err) {
        console.warn('Could not fetch from Atlas /api/guides, using local fallback:', err.message);
        if (isMounted) {
          setIsAtlasConnected(false);
          setGuides(INITIAL);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchGuides();
    return () => { isMounted = false; };
  }, [category, difficulty]);

  const filtered = guides.filter(g =>
    (category   === 'All' || g.category   === category) &&
    (difficulty === 'All' || g.difficulty === difficulty)
  );

  const toggleVote = async (id) => {
    // 1. Optimistic UI update
    setGuides(gs => gs.map(g => {
      if (g._id === id) {
        const nextVoted = !g.voted;
        return {
          ...g,
          voted: nextVoted,
          upvotes: nextVoted ? (g.upvotes || 0) + 1 : Math.max(0, (g.upvotes || 0) - 1),
        };
      }
      return g;
    }));

    // 2. Persist to Atlas database via POST /api/guides/:id/upvote
    try {
      const token = sessionStorage.getItem('repairhub_token') || localStorage.getItem('repairhub_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(`/api/guides/${id}/upvote`, {}, { headers });
      if (res.data?.success) {
        setGuides(gs => gs.map(g => g._id === id ? {
          ...g,
          upvotes: res.data.upvotes,
          voted: res.data.hasUpvoted,
        } : g));
      }
    } catch (err) {
      console.error('Error persisting upvote to Atlas:', err.message);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      title: form.title,
      category: form.category,
      difficulty: form.difficulty,
      estimatedMinutes: Number(form.minutes) || 25,
      summary: form.summary,
      toolsRequired: form.tools ? form.tools.split(',').map(s => s.trim()).filter(Boolean) : ['Standard Toolkit'],
      partsNeeded: form.parts ? form.parts.split(',').map(s => s.trim()).filter(Boolean) : ['Replacement Parts'],
      steps: [
        {
          stepNumber: 1,
          stepTitle: form.stepTitle || 'Step 1: Preparation & Safety',
          instruction: form.step,
          safetyNote: form.safetyNote || undefined,
        }
      ]
    };

    try {
      const token = sessionStorage.getItem('repairhub_token') || localStorage.getItem('repairhub_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post('/api/guides', payload, { headers });

      if (res.data?.success && res.data?.data) {
        const saved = res.data.data;
        const normalized = {
          _id: saved._id,
          title: saved.title,
          author: saved.authorName || 'You',
          category: saved.category,
          difficulty: saved.difficulty,
          minutes: saved.estimatedMinutes || 25,
          upvotes: saved.upvotes || 0,
          voted: false,
          summary: saved.summary,
          tools: saved.toolsRequired?.length ? saved.toolsRequired : ['Standard Toolkit'],
          parts: saved.partsNeeded?.length ? saved.partsNeeded : ['Replacement Parts'],
          steps: (saved.steps || []).map((s, idx) => ({
            n: s.stepNumber || idx + 1,
            title: s.stepTitle || `Step ${idx + 1}`,
            body: s.instruction || '',
            warn: s.safetyNote || '',
          })),
        };

        setGuides(prev => [normalized, ...prev]);
        setCreating(false);
        setForm({
          title: '',
          category: 'Home Appliances',
          difficulty: 'Easy',
          minutes: 20,
          summary: '',
          tools: '',
          parts: '',
          stepTitle: '',
          step: '',
          safetyNote: ''
        });
        setStatusMessage({ type: 'success', text: 'Guide successfully created and saved to MongoDB Atlas database!' });
        setTimeout(() => setStatusMessage(null), 5000);
      }
    } catch (err) {
      console.error('Error saving guide to Atlas:', err.message);
      // Fallback local addition if network fails
      setGuides(prev => [{
        _id: `g_${Date.now()}`,
        title: form.title,
        author: 'You',
        category: form.category,
        difficulty: form.difficulty,
        minutes: Number(form.minutes) || 20,
        upvotes: 1,
        voted: true,
        summary: form.summary,
        tools: form.tools ? form.tools.split(',') : ['Standard Toolkit'],
        parts: form.parts ? form.parts.split(',') : ['Replacement Parts'],
        steps: [{ n: 1, title: form.stepTitle || 'Step 1', body: form.step, warn: form.safetyNote }],
      }, ...prev]);
      setCreating(false);
      setStatusMessage({ type: 'warning', text: 'Guide added locally. (Network sync issue: ' + (err.response?.data?.message || err.message) + ')' });
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Atlas Status Banner */}
      {statusMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 18px',
          borderRadius: 12,
          background: statusMessage.type === 'success' ? '#EDFDF5' : '#FFFBEB',
          border: statusMessage.type === 'success' ? '1px solid #A7F3D0' : '1px solid #FDE68A',
          color: statusMessage.type === 'success' ? '#065F46' : '#92400E',
          fontSize: 13.5,
          fontWeight: 600,
        }}>
          <CheckCircle size={17} style={{ flexShrink: 0 }} />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--apple-label)', letterSpacing: '-0.03em', margin: 0 }}>
              Community DIY Repair Guides
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 980,
              background: isAtlasConnected ? '#E6F4EA' : '#F1F3F4',
              color: isAtlasConnected ? '#137333' : '#5F6368',
              border: isAtlasConnected ? '1px solid #CEEAD6' : '1px solid #DADCE0',
            }}>
              <Database size={11} />
              {isAtlasConnected ? 'Atlas Live DB' : 'Connecting DB'}
            </span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--apple-secondary)', margin: 0 }}>
            Open-source step-by-step schematics and Right-to-Repair tutorials verified by technicians and saved to MongoDB Atlas.
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

      {/* Loading State */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 40, color: 'var(--apple-secondary)' }}>
          <Loader2 size={20} className="animate-spin" />
          <span style={{ fontSize: 14, fontWeight: 500 }}>Fetching guides from MongoDB Atlas...</span>
        </div>
      )}

      {/* Guide Cards */}
      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.length === 0 ? (
            <div className="card" style={{ padding: '36px 24px', textAlign: 'center', color: 'var(--apple-secondary)' }}>
              <BookOpen size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--apple-label)', marginBottom: 4 }}>No guides found</h3>
              <p style={{ fontSize: 13.5, margin: '0 0 16px' }}>There are no repair guides matching this category or difficulty in the database.</p>
              <button onClick={() => setCreating(true)} className="btn-primary" style={{ margin: '0 auto' }}>
                <Plus size={14} /> Be the first to share one!
              </button>
            </div>
          ) : (
            filtered.map(guide => {
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
                      title="Upvote this guide (persists to Atlas)"
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
                    {(guide.tools || []).map((t, i) => <span key={i} className="badge badge-neutral" style={{ fontSize: 11.5 }}>{t}</span>)}
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--apple-secondary)', marginLeft: 8 }}>Parts:</span>
                    {(guide.parts || []).map((p, i) => <span key={i} className="badge badge-green" style={{ fontSize: 11.5 }}>{p}</span>)}
                  </div>

                  {/* Expand Steps Toggle */}
                  <button
                    onClick={() => setExpanded(open ? null : guide._id)}
                    className="btn-ghost"
                    style={{ fontSize: 13, gap: 5, padding: '4px 0', color: 'var(--apple-blue)', fontWeight: 600 }}
                  >
                    {open ? <><ChevronUp size={15} /> Hide Repair Steps</> : <><ChevronDown size={15} /> View {guide.steps?.length || 1} Repair Steps</>}
                  </button>

                  {/* Step Sequence */}
                  {open && (
                    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {(guide.steps || []).map(s => (
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
            })
          )}
        </div>
      )}

      {/* Share Guide Modal */}
      {creating && (
        <div className="modal-overlay">
          <div className="card-elevated" style={{ maxWidth: 540, width: '100%', padding: '26px 28px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--apple-white)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid var(--apple-border)', paddingBottom: 12 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--apple-label)', margin: 0 }}>Share a Community Guide</h2>
                <span style={{ fontSize: 12, color: 'var(--apple-secondary)' }}>Publishes immediately to MongoDB Atlas database</span>
              </div>
              <button onClick={() => setCreating(false)} className="btn-ghost" style={{ padding: '6px 8px', borderRadius: 980 }}><X size={16} /></button>
            </div>

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label">Guide Title</label>
                <input className="input" required placeholder="e.g. Fixing a jammed washing machine drum" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label className="label">Category</label>
                  <select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {['Electronics', 'Home Appliances', 'Smartphones', 'Bicycles', 'Furniture', 'Textiles & Clothing', 'Mechanical', 'Other'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Difficulty</label>
                  <select className="input" value={form.difficulty} onChange={e => setForm({...form, difficulty: e.target.value})}>
                    {['Easy','Moderate','Advanced'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Est. Time (min)</label>
                  <input type="number" min="5" max="300" className="input" value={form.minutes} onChange={e => setForm({...form, minutes: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="label">Brief Summary</label>
                <textarea className="input" required rows={2} placeholder="What symptoms does this guide address and fix?" value={form.summary} onChange={e => setForm({...form, summary: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="label">Tools Needed (comma separated)</label>
                  <input className="input" placeholder="e.g. PH2 screwdriver, multimeter" value={form.tools} onChange={e => setForm({...form, tools: e.target.value})} />
                </div>
                <div>
                  <label className="label">Parts Needed (comma separated)</label>
                  <input className="input" placeholder="e.g. 10uF capacitor, thermal paste" value={form.parts} onChange={e => setForm({...form, parts: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="label">Step 1 Title</label>
                <input className="input" placeholder="e.g. Disconnect power and expose board" value={form.stepTitle} onChange={e => setForm({...form, stepTitle: e.target.value})} />
              </div>
              <div>
                <label className="label">Step 1 Instructions</label>
                <textarea className="input" required rows={3} placeholder="Write the first repair step in detail…" value={form.step} onChange={e => setForm({...form, step: e.target.value})} />
              </div>
              <div>
                <label className="label">Safety Warning (Optional)</label>
                <input className="input" placeholder="e.g. Always discharge capacitor before touching contacts." value={form.safetyNote} onChange={e => setForm({...form, safetyNote: e.target.value})} />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14, borderRadius: 980, marginTop: 4, gap: 8 }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving to Atlas...</span>
                  </>
                ) : (
                  'Publish Guide to Atlas'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

