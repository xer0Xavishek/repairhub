import React, { useState, useEffect } from 'react';
import { Search, X, MapPin, Wrench, Calendar, Star, ArrowRight } from 'lucide-react';

export default function GlobalSearchModal({ isOpen, onClose, repairers = [], requests = [], events = [], onSelectResult }) {
  const [query, setQuery]        = useState('');
  const [type, setType]          = useState('all');
  const [category, setCategory]  = useState('All');

  // Handle ESC key to dismiss modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase();

  const matchedRepairers = repairers.filter(r =>
    (type === 'all' || type === 'repairers') &&
    (category === 'All' || r.categories?.includes(category)) &&
    (!q || [r.name, r.businessName, r.address].some(s => s?.toLowerCase().includes(q)))
  );

  const matchedRequests = requests.filter(r =>
    (type === 'all' || type === 'requests') &&
    (category === 'All' || r.category === category) &&
    (!q || [r.itemTitle, r.ticketNumber, r.issueDescription].some(s => s?.toLowerCase().includes(q)))
  );

  const matchedEvents = events.filter(e =>
    (type === 'all' || type === 'events') &&
    (category === 'All' || e.categories?.includes(category)) &&
    (!q || [e.title, e.venue].some(s => s?.toLowerCase().includes(q)))
  );

  const categories = ['All', 'Electronics', 'Home Appliances', 'Furniture', 'Textiles & Clothing', 'Bicycles', 'Mechanical', 'Other'];
  const types      = [
    { k: 'all', label: 'All' }, 
    { k: 'repairers', label: 'Workshops' }, 
    { k: 'requests', label: 'My Repairs' }, 
    { k: 'events', label: 'Repair Cafés' }
  ];

  return (
    <div
      className="modal-overlay"
      style={{ alignItems: 'flex-start', paddingTop: 80 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="card-elevated" style={{ width: '100%', maxWidth: 600, maxHeight: '75vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--apple-white)' }}>

        {/* Search Bar with Keyboard Shortcuts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid #EAE0D6', background: '#FFFFFF' }}>
          <Search size={18} style={{ color: '#CB4D22', flexShrink: 0 }} />
          <input
            autoFocus
            className="input"
            style={{ border: 'none', outline: 'none', fontSize: 15, padding: 0, background: 'transparent', flex: 1, boxShadow: 'none' }}
            placeholder="Search workshops, repairs, repair cafés…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery('')} className="btn-ghost" style={{ padding: 4, color: '#7A6458' }}>
              <X size={15} />
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ 
              fontSize: 10.5, 
              fontFamily: 'monospace',
              fontWeight: 600, 
              color: '#7A6458', 
              background: '#FDFBF9', 
              border: '1px solid #EAE0D6', 
              borderRadius: 2, 
              padding: '2px 6px' 
            }}>
              Ctrl+K
            </span>
            <button
              onClick={onClose}
              title="Close (Esc)"
              style={{
                fontSize: 10.5,
                fontFamily: 'monospace',
                fontWeight: 600,
                color: '#CB4D22',
                background: '#F5EBE6',
                border: '1px solid rgba(203, 77, 34, 0.25)',
                borderRadius: 2,
                padding: '2px 6px',
                cursor: 'pointer'
              }}
            >
              ESC
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 6, padding: '10px 18px', borderBottom: '1px solid var(--apple-border)', flexWrap: 'wrap', background: '#F5F5F7' }}>
          {types.map(t => (
            <button
              key={t.k}
              onClick={() => setType(t.k)}
              style={{
                padding: '4px 12px',
                fontSize: 12.5,
                fontWeight: type === t.k ? 600 : 500,
                borderRadius: 980,
                border: 'none',
                background: type === t.k ? 'var(--apple-blue)' : '#E8E8ED',
                color: type === t.k ? '#FFFFFF' : 'var(--apple-label)',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}
            >
              {t.label}
            </button>
          ))}
          <div style={{ width: 1, background: 'var(--apple-border)', margin: '0 4px' }} />
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                padding: '4px 12px',
                fontSize: 12.5,
                fontWeight: category === c ? 600 : 500,
                borderRadius: 980,
                border: 'none',
                background: category === c ? '#1D1D1F' : '#E8E8ED',
                color: category === c ? '#FFFFFF' : 'var(--apple-label)',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
          {matchedRepairers.length === 0 && matchedRequests.length === 0 && matchedEvents.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--apple-tertiary)', fontSize: 14 }}>
              {query ? `No matches found for "${query}"` : 'Type anything to search workshops, active repairs, or repair café events…'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {matchedRepairers.map(r => (
                <button
                  key={r._id}
                  onClick={() => { onSelectResult('repairer', r); onClose(); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, border: 'none', background: 'transparent', cursor: 'pointer', transition: 'background 0.12s ease', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F5F5F7'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--apple-blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Wrench size={16} style={{ color: 'var(--apple-blue)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--apple-label)' }}>{r.businessName}</div>
                    <div style={{ fontSize: 12, color: 'var(--apple-secondary)' }}>{r.address} · {r.distance}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12.5, color: Number(r.rating) > 0 ? '#C95100' : 'var(--apple-secondary)', fontWeight: 600, flexShrink: 0 }}>
                    {Number(r.rating) > 0 && Number(r.reviewsCount) > 0 ? (
                      <>
                        <Star size={12} style={{ fill: '#FF9500', color: '#FF9500' }} />
                        {Number(r.rating).toFixed(1)}
                      </>
                    ) : (
                      <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--apple-tertiary)' }}>Unrated</span>
                    )}
                  </div>
                  <ArrowRight size={14} style={{ color: 'var(--apple-tertiary)', flexShrink: 0 }} />
                </button>
              ))}

              {matchedRequests.map(r => (
                <button
                  key={r._id}
                  onClick={() => { onSelectResult('request', r); onClose(); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, border: 'none', background: 'transparent', cursor: 'pointer', transition: 'background 0.12s ease', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F5F5F7'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: r.status === 'Completed' ? '#E8FAE8' : '#FFF4E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Wrench size={16} style={{ color: r.status === 'Completed' ? '#34C759' : '#FF9500' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--apple-label)' }}>{r.itemTitle}</div>
                    <div style={{ fontSize: 12, color: 'var(--apple-secondary)' }}>{r.ticketNumber} · {r.status}</div>
                  </div>
                  <ArrowRight size={14} style={{ color: 'var(--apple-tertiary)', flexShrink: 0 }} />
                </button>
              ))}

              {matchedEvents.map(ev => (
                <button
                  key={ev._id}
                  onClick={() => { onSelectResult('event', ev); onClose(); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, border: 'none', background: 'transparent', cursor: 'pointer', transition: 'background 0.12s ease', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F5F5F7'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FFF4E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Calendar size={16} style={{ color: '#FF9500' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--apple-label)' }}>{ev.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--apple-secondary)' }}>{ev.date} · {ev.venue}</div>
                  </div>
                  <ArrowRight size={14} style={{ color: 'var(--apple-tertiary)', flexShrink: 0 }} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '10px 20px', borderTop: '1px solid var(--apple-border)', fontSize: 12, color: 'var(--apple-tertiary)', background: '#F5F5F7' }}>
          {matchedRepairers.length + matchedRequests.length + matchedEvents.length} results matching filter
        </div>
      </div>
    </div>
  );
}
