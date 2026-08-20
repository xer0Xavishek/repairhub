import React, { useState } from 'react';
import { X, Star, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function ReviewModal({ isOpen, onClose, ticket, onReviewSubmitted }) {
  const [rating, setRating] = useState(5);
  const [timelinessRating, setTimelinessRating] = useState(5);
  const [communicationRating, setCommunicationRating] = useState(5);
  const [pricingRating, setPricingRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !ticket) return null;

  const handleRatingChange = (star) => {
    setRating(star);
    setTimelinessRating(star);
    setCommunicationRating(star);
    setPricingRating(star);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitted(true);

    const targetRepairerId = ticket.assignedRepairerId?._id || ticket.assignedRepairerId;

    const reviewPayload = {
      ticketId: ticket._id,
      repairRequestId: ticket._id,
      repairer: ticket.assignedRepairer,
      repairerId: targetRepairerId,
      rating: Number(rating),
      qualityRating: Number(rating),
      turnaroundRating: Number(timelinessRating),
      timelinessRating: Number(timelinessRating),
      communicationRating: Number(communicationRating),
      pricingRating: Number(pricingRating),
      comment: comment || 'Smooth and professional repair service.',
    };

    const token = localStorage.getItem('repairhub_token');
    const isRealAuth = token && !token.startsWith('demo_');

    if (isRealAuth && ticket._id && ticket._id.length === 24 && !ticket._id.startsWith('req_')) {
      try {
        const res = await fetch('/api/reviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            repairRequestId: ticket._id,
            repairerId: targetRepairerId,
            qualityRating: Number(rating),
            communicationRating: Number(communicationRating),
            turnaroundRating: Number(timelinessRating),
            comment: comment || 'Smooth and professional repair service.',
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.message || 'Could not publish review');
          setSubmitted(false);
          return;
        }
      } catch (err) {
        console.warn('[Review Submit Error]:', err.message);
      }
    }

    setTimeout(() => {
      onReviewSubmitted(reviewPayload);
      setSubmitted(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="modal-overlay">
      <div className="card-elevated" style={{ width: '100%', maxWidth: 460, padding: '26px 28px', background: 'var(--apple-white)' }}>
        
        <button
          onClick={onClose}
          className="btn-ghost"
          style={{ position: 'absolute', top: 14, right: 14, padding: '6px 8px', borderRadius: 980 }}
        >
          <X size={17} />
        </button>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span className="badge badge-green">
              <ShieldCheck size={12} /> Verified Customer Review
            </span>
          </div>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--apple-label)', margin: '4px 0 2px' }}>
            Rate Technician: {ticket.assignedRepairer}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--apple-secondary)', margin: 0 }}>{ticket.itemTitle}</p>
        </div>

        {ticket.hasReviewed ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#E8FAE8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={30} style={{ color: '#34C759' }} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--apple-label)', margin: 0 }}>Review Already Published</h3>
            <p style={{ fontSize: 13, color: 'var(--apple-secondary)', margin: 0 }}>
              You have already published a verified review for this repair order. To protect community trust, published reviews cannot be modified or re-submitted.
            </p>
            <button onClick={onClose} className="btn-secondary" style={{ marginTop: 12, padding: '7px 20px', borderRadius: 980 }}>
              Close
            </button>
          </div>
        ) : submitted ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#E8FAE8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={30} style={{ color: '#34C759' }} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--apple-label)', margin: 0 }}>Review Published</h3>
            <p style={{ fontSize: 13, color: 'var(--apple-secondary)', margin: 0 }}>
              Thank you! Your feedback helps other citizens find trustworthy certified repairers.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {errorMsg && (
              <div style={{ padding: '10px 14px', background: '#FDEEE9', border: '1px solid #F8CCC0', borderRadius: 8, color: '#C95100', fontSize: 13 }}>
                {errorMsg}
              </div>
            )}
            
            {/* Overall Star Selection */}
            <div>
              <label className="label">Overall Repair Quality</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingChange(star)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                  >
                    <Star
                      size={26}
                      style={{
                        fill: star <= rating ? '#FF9500' : 'none',
                        color: star <= rating ? '#FF9500' : '#D2D2D7'
                      }}
                    />
                  </button>
                ))}
                <span style={{ fontSize: 14, fontWeight: 700, color: '#C95100', marginLeft: 6 }}>{rating}.0 / 5.0</span>
              </div>
            </div>

            {/* Multi-Criteria Ratings */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, background: '#F5F5F7', padding: '12px 14px', borderRadius: 12 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--apple-secondary)', display: 'block', marginBottom: 2 }}>Timeliness</span>
                <div style={{ display: 'flex', gap: 1 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} onClick={() => setTimelinessRating(s)} style={{ cursor: 'pointer', color: s <= timelinessRating ? '#FF9500' : '#D2D2D7', fontSize: 13 }}>★</span>
                  ))}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--apple-secondary)', display: 'block', marginBottom: 2 }}>Communication</span>
                <div style={{ display: 'flex', gap: 1 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} onClick={() => setCommunicationRating(s)} style={{ cursor: 'pointer', color: s <= communicationRating ? '#FF9500' : '#D2D2D7', fontSize: 13 }}>★</span>
                  ))}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--apple-secondary)', display: 'block', marginBottom: 2 }}>Fair Pricing</span>
                <div style={{ display: 'flex', gap: 1 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} onClick={() => setPricingRating(s)} style={{ cursor: 'pointer', color: s <= pricingRating ? '#FF9500' : '#D2D2D7', fontSize: 13 }}>★</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Written Review */}
            <div>
              <label className="label">Written Feedback</label>
              <textarea
                required
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="input"
                style={{ resize: 'vertical' }}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14, borderRadius: 980, marginTop: 4 }}
            >
              Publish Verified Review
            </button>

          </form>
        )}

      </div>
    </div>
  );
}
