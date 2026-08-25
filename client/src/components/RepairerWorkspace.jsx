import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  QrCode, 
  MessageSquare, 
  CheckCircle2, 
  DollarSign, 
  Clock, 
  ShieldCheck, 
  MapPin, 
  Send, 
  Star, 
  ChevronRight, 
  Inbox, 
  AlertCircle,
  X,
  FileText,
  History
} from 'lucide-react';
import ItemHistoryModal from './ItemHistoryModal';

export default function RepairerWorkspace({ 
  requests = [], 
  currentUser, 
  scanStatusUpdate, 
  onStatusUpdated, 
  onQuoteSubmitted, 
  onOpenScanner, 
  onOpenChat, 
  onOpenProfile,
  unreadChats = {}
}) {
  const [tickets, setTickets] = useState([]);

  // Incoming Repair Requests (awaiting bids)
  const [availableRequests, setAvailableRequests] = useState([]);

  // Quote Submission Modal State
  const [selectedQuoteRequest, setSelectedQuoteRequest] = useState(null);
  const [quotePrice, setQuotePrice] = useState('650');
  const [quoteDays, setQuoteDays] = useState('2');
  const [quoteMessage, setQuoteMessage] = useState('');
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteSuccessMsg, setQuoteSuccessMsg] = useState('');

  // Reviews State
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const identifier = currentUser?._id || currentUser?.email || currentUser?.businessName;
    if (!identifier) return;

    fetch(`/api/reviews/repairer/${identifier}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          const mapped = data.data.map(r => ({
            id: r._id,
            customerName: r.requesterId?.name || r.reviewerId?.name || 'Customer',
            rating: r.averageRating != null ? r.averageRating : (r.qualityRating != null ? r.qualityRating : (r.rating || 0)),
            comment: r.comment || '',
            date: new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
          }));
          setReviews(mapped);
        }
      })
      .catch(err => console.warn('[Fetch Reviews Error]:', err.message));
  }, [currentUser?._id, currentUser?.email, currentUser?.businessName]);

  const [selectedHistoryTicket, setSelectedHistoryTicket] = useState(null);

  const handleRejectRequest = async (requestId) => {
    const token = localStorage.getItem('repairhub_token');
    const isRealAuth = token && !token.startsWith('demo_');

    // Item 16: Persist decline in localStorage so switching tabs never restores the declined order
    const userId = currentUser?._id || 'user';
    const declineKey = `repairhub_declined_${userId}`;
    try {
      const stored = JSON.parse(localStorage.getItem(declineKey) || '[]');
      if (!stored.includes(requestId)) {
        stored.push(requestId);
        localStorage.setItem(declineKey, JSON.stringify(stored));
      }
    } catch (e) {}

    if (isRealAuth && requestId && requestId.length === 24 && !requestId.startsWith('avail_')) {
      try {
        await fetch(`/api/repairs/${requestId}/decision`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ decision: 'rejected' }),
        });
      } catch (err) {
        console.warn('[Reject Request Error]:', err.message);
      }
    }

    setAvailableRequests((current) => current.filter((r) => r._id !== requestId));
  };

  // Sync assigned tickets and incoming requests from parent requests prop
  useEffect(() => {
    if (!requests || requests.length === 0) {
      setTickets([]);
      setAvailableRequests([]);
      return;
    }

    // Item 16: Read declined orders from localStorage to prevent them from coming back on tab switch
    const userId = currentUser?._id || 'user';
    const declineKey = `repairhub_declined_${userId}`;
    let declinedList = [];
    try {
      declinedList = JSON.parse(localStorage.getItem(declineKey) || '[]');
    } catch (e) {}

    // Filter incoming requests available for quotes/bids (Bug 4)
    const currentTechId = currentUser?._id ? String(currentUser._id) : '';
    const incomingFromParent = requests.filter(r => {
      // Must be open for bids
      if (!['Requested', 'Quoted'].includes(r.status)) return false;

      // If an assignedRepairerId is present, strictly exclude it from other technicians
      const assignedIdStr = r.assignedRepairerId 
        ? (typeof r.assignedRepairerId === 'object' ? String(r.assignedRepairerId._id || '') : String(r.assignedRepairerId))
        : '';
      if (assignedIdStr && assignedIdStr !== currentTechId) return false;

      const isAwaiting = !r.assignedRepairer || r.assignedRepairer.includes('Awaiting') || r.assignedRepairer.includes('Multiple') || r.assignedRepairer.includes('Bid') || r.assignedRepairer === 'Open for Bids';
      if (!isAwaiting && !r.hasQuoted) return false;

      if (declinedList.includes(r._id)) return false;
      if (r.repairerResponses && Array.isArray(r.repairerResponses)) {
        const hasDeclined = r.repairerResponses.some(resp => {
          const respId = resp.repairerId?._id ? String(resp.repairerId._id) : String(resp.repairerId || '');
          return respId === currentTechId && resp.decision === 'rejected';
        });
        if (hasDeclined) return false;
      }
      return true;
    });

    const formattedIncoming = incomingFromParent.map(p => ({
      _id: p._id,
      ticketNumber: p.ticketNumber,
      customerName: p.customerName || 'Customer',
      customerAddress: p.customerAddress || 'Dhaka',
      itemTitle: p.itemTitle,
      category: p.category,
      issueDescription: p.issueDescription,
      status: p.status,
      preferredMethod: p.preferredMethod || 'drop-off',
      createdAt: p.date || 'Recent',
      hasQuoted: Array.isArray(p.bids) && p.bids.some(b => {
        const bidRepId = b.repairerId?._id ? String(b.repairerId._id) : String(b.repairerId || '');
        return bidRepId === currentTechId;
      }),
    }));
    setAvailableRequests(formattedIncoming);

    // Filter assigned requests strictly for this technician
    const currentIdStr = currentUser?._id ? String(currentUser._id) : '';

    const assignedFromParent = requests.filter(r => {
      if (!['In Progress', 'Ready for Pickup', 'Completed'].includes(r.status)) return false;
      const assignedIdStr = r.assignedRepairerId 
        ? (typeof r.assignedRepairerId === 'object' ? String(r.assignedRepairerId._id || '') : String(r.assignedRepairerId))
        : '';
      const matchId = currentIdStr && assignedIdStr && (currentIdStr === assignedIdStr);
      const matchBusiness = currentUser?.businessName && r.assignedRepairer === currentUser.businessName;
      const matchName = currentUser?.name && r.assignedRepairer === currentUser.name;
      return matchId || matchBusiness || matchName;
    });

    const formattedAssigned = assignedFromParent.map(p => ({
      _id: p._id,
      ticketNumber: p.ticketNumber,
      customerName: p.customerName || 'Customer',
      customerAddress: p.customerAddress || 'Dhaka',
      itemTitle: p.itemTitle,
      category: p.category,
      symptom: p.issueDescription,
      status: p.status,
      agreedPrice: p.finalPrice || p.quotedPrice || 0,
      paymentStatus: p.status === 'Completed' ? 'Disbursed to technician' : (p.status === 'Ready for Pickup' ? 'Awaiting QR pickup scan' : 'Held in Protected Vault'),
      createdAt: p.date || 'Recent',
    }));
    setTickets(formattedAssigned);
  }, [requests, currentUser]);

  // Sync scan updates from parent QR Scanner
  useEffect(() => {
    if (!scanStatusUpdate) return;
    setTickets(current =>
      current.map(ticket => {
        if (ticket._id === scanStatusUpdate.ticketId || ticket.ticketNumber === scanStatusUpdate.ticketNumber) {
          return {
            ...ticket,
            status: scanStatusUpdate.status,
            paymentStatus: scanStatusUpdate.status === 'Completed' ? 'Disbursed to technician' : ticket.paymentStatus,
          };
        }
        return ticket;
      })
    );
  }, [scanStatusUpdate]);

  // Advance status handler (with backend PUT /api/repairs/:id/status if available)
  const advance = async (id, next) => {
    const token = localStorage.getItem('repairhub_token');
    const isRealAuth = token && !token.startsWith('demo_');

    const ticket = tickets.find(t => t._id === id);
    if (isRealAuth && ticket && ticket._id && !ticket._id.startsWith('t_')) {
      try {
        await fetch(`/api/repairs/${ticket._id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: next }),
        });
      } catch (err) {
        console.warn('[Status Advance Error]:', err.message);
      }
    }

    setTickets(t => t.map(x => x._id === id ? { ...x, status: next } : x));
    if (onStatusUpdated) {
      onStatusUpdated(id, next);
    }
  };

  // Submit quote to backend / demo handler
  const handleOpenQuoteModal = (reqItem) => {
    setSelectedQuoteRequest(reqItem);
    setQuotePrice('650');
    setQuoteDays('2');
    setQuoteMessage(`Diagnosed ${reqItem.itemTitle}. Ready to service and restore to factory performance.`);
    setQuoteSuccessMsg('');
  };

  const handleSendQuote = async (e) => {
    e.preventDefault();
    if (!selectedQuoteRequest) return;
    setQuoteSubmitting(true);

    const token = localStorage.getItem('repairhub_token');
    const isRealAuth = token && !token.startsWith('demo_');
    const parsedPrice = Number(quotePrice) || 500;
    const parsedDays = Number(quoteDays) || 2;

    const quotePayload = {
      repairRequestId: selectedQuoteRequest._id,
      ticketNumber: selectedQuoteRequest.ticketNumber,
      price: parsedPrice,
      totalPrice: parsedPrice,
      estimatedDays: parsedDays,
      turnaroundDays: parsedDays,
      partsCost: Math.round(parsedPrice * 0.6),
      laborCost: Math.round(parsedPrice * 0.4),
      warrantyDays: 90,
      message: quoteMessage,
      businessName: currentUser?.businessName || currentUser?.name || 'Rafiq Precision Tech',
      rating: (currentUser?.ratingCount > 0 && currentUser?.rating != null) ? Number(currentUser.rating) : 0,
    };

    if (isRealAuth && !selectedQuoteRequest._id.startsWith('avail_') && !selectedQuoteRequest._id.startsWith('req_')) {
      try {
        const res = await fetch('/api/quotes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            repairRequestId: selectedQuoteRequest._id,
            price: parsedPrice,
            estimatedDays: parsedDays,
            message: quoteMessage,
          }),
        });
        if (res.ok) {
          const resJson = await res.json();
          quotePayload.id = resJson.data?._id || `q_${Date.now()}`;
        }
      } catch (err) {
        console.warn('[Quote Submit Notice]:', err.message);
      }
    } else {
      quotePayload.id = `q_${Date.now()}`;
    }

    // Update incoming list: mark request as quoted
    setAvailableRequests(prev =>
      prev.map(r => r._id === selectedQuoteRequest._id ? { ...r, status: 'Quoted', hasQuoted: true } : r)
    );

    if (onQuoteSubmitted) {
      onQuoteSubmitted(quotePayload);
    }

    setQuoteSubmitting(false);
    setQuoteSuccessMsg(`Quote for ৳${parsedPrice} submitted successfully!`);
    setTimeout(() => {
      setSelectedQuoteRequest(null);
      setQuoteSuccessMsg('');
    }, 1500);
  };

  const statusColor = (s) => {
    if (s === 'In Progress')      return { bg: '#FFF4E5', color: '#C95100', border: '#FFE0B2' };
    if (s === 'Ready for Pickup') return { bg: '#F5EBE6', color: '#CB4D22', border: '#EAE0D6' };
    if (s === 'Completed')        return { bg: '#EBF8EE', color: '#248A3D', border: '#C4F3C4' };
    return { bg: '#FDFBF9', color: '#7A6458', border: '#EAE0D6' };
  };

  const activeTickets = tickets.filter(t => t.status === 'In Progress' || t.status === 'Ready for Pickup');
  const completedTickets = tickets.filter(t => t.status === 'Completed');
  const activeCount = activeTickets.length;
  const vaultHeld = activeTickets.reduce((sum, t) => sum + (Number(t.agreedPrice) || 0), 0);
  const settledPayouts = completedTickets.reduce((sum, t) => sum + (Number(t.agreedPrice) || 0), 0);

  const hasReviews = reviews.length > 0;
  const avgRating = hasReviews
    ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / reviews.length).toFixed(1)
    : (currentUser?.ratingCount > 0 && currentUser?.rating ? Number(currentUser.rating).toFixed(1) : null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 2, background: '#F5EBE6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wrench size={20} style={{ color: '#CB4D22' }} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--apple-label)' }}>Technician Workspace</div>
            <div style={{ fontSize: 13, color: 'var(--apple-secondary)' }}>
              {currentUser?.businessName || currentUser?.name || 'Verified Technician'} · {currentUser?.technicianType === 'freelance' ? 'Freelance Fixer' : 'Verified Workshop'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {onOpenProfile && (
            <button onClick={onOpenProfile} className="btn-secondary" style={{ gap: 6, padding: '8px 14px', fontSize: 12.5, borderRadius: 2 }}>
              <MapPin size={13} style={{ color: '#34C759' }} /> Workshop Pin & Rates
            </button>
          )}
          <button onClick={onOpenScanner} className="btn-primary" style={{ gap: 6, padding: '9px 18px', borderRadius: 2 }}>
            <QrCode size={15} /> Scan Customer QR Token
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {[
          { label: 'Active Repairs', value: activeCount.toString(), note: 'Currently on workbench' },
          { label: 'Protected Vault Held', value: `৳${vaultHeld.toLocaleString()}`, note: 'Awaiting customer pickup scan' },
          { label: 'Settled Payouts', value: `৳${settledPayouts.toLocaleString()}`, note: 'Disbursed to date' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '18px 22px' }}>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: i === 0 ? 'var(--apple-label)' : '#CB4D22' }}>
              {s.value}
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--apple-label)', marginTop: 4 }}>{s.label}</div>
            <div style={{ fontSize: 12, color: 'var(--apple-secondary)', marginTop: 2 }}>{s.note}</div>
          </div>
        ))}
      </div>

      {/* SECTION 1: INCOMING REPAIR REQUESTS FOR BIDDING */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Inbox size={18} style={{ color: '#CB4D22' }} />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--apple-label)', margin: 0 }}>
              Incoming Repair Requests (Open for Bids)
            </h2>
          </div>
          <span className="badge badge-orange" style={{ fontSize: 12 }}>
            {availableRequests.length} Available in your zone
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {availableRequests.length === 0 ? (
            <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--apple-secondary)' }}>
              No incoming repair requests currently awaiting bids in your category.
            </div>
          ) : (
            availableRequests.map((reqItem) => (
              <div key={reqItem._id} className="card" style={{ padding: '18px 22px', borderLeft: '4px solid #FF9500' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span className="badge badge-blue">{reqItem.ticketNumber}</span>
                      <span style={{ fontSize: 12, color: 'var(--apple-secondary)' }}>{reqItem.category}</span>
                      <span style={{ fontSize: 12, color: 'var(--apple-tertiary)' }}>{reqItem.createdAt}</span>
                      {reqItem.hasQuoted && (
                        <span className="badge badge-green" style={{ fontSize: 11 }}>
                          ✓ Your Quote Submitted
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--apple-label)', marginBottom: 2 }}>
                      {reqItem.itemTitle}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--apple-secondary)' }}>
                      Customer: <strong>{reqItem.customerName}</strong> ({reqItem.customerAddress}) · Handover: <span style={{ textTransform: 'capitalize' }}>{reqItem.preferredMethod}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => handleOpenQuoteModal(reqItem)}
                      className="btn-primary"
                      style={{ fontSize: 13, padding: '7px 16px', gap: 5 }}
                    >
                      <DollarSign size={14} />
                      {reqItem.hasQuoted ? 'Update Bid' : 'Place Bid'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectRequest(reqItem._id)}
                      className="btn-secondary"
                      style={{ fontSize: 12.5, padding: '7px 12px', color: '#C95100' }}
                    >
                      Decline
                    </button>
                  </div>
                </div>

                <div style={{ background: '#FDFBF9', border: '1px solid #EAE0D6', borderRadius: 2, padding: '9px 12px', fontSize: 13, color: 'var(--apple-label)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--apple-secondary)', marginRight: 6 }}>Reported Defect:</span>
                  {reqItem.issueDescription}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SECTION 2: ACTIVE WORKBENCH (IN PROGRESS & READY FOR PICKUP) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wrench size={18} style={{ color: 'var(--apple-blue)' }} />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--apple-label)', margin: 0 }}>
              Active Workbench
            </h2>
          </div>
          <span className="badge badge-blue" style={{ fontSize: 12 }}>
            {activeTickets.length} On Bench
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activeTickets.length === 0 ? (
            <div className="card" style={{ padding: '36px 24px', textAlign: 'center', background: '#FFFFFF' }}>
              <div style={{ width: 48, height: 48, borderRadius: 24, background: '#F5EBE6', color: '#CB4D22', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Wrench size={22} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--apple-label)', margin: '0 0 6px' }}>
                No Active Repair Jobs Assigned
              </h3>
              <p style={{ fontSize: 13, color: 'var(--apple-secondary)', margin: 0, maxWidth: 420, marginInline: 'auto' }}>
                When customers accept your bids or book repairs with you, active jobs will appear here on your workbench.
              </p>
            </div>
          ) : (
            activeTickets.map(t => {
              const sc = statusColor(t.status);
              const hasUnread = unreadChats && (unreadChats[t.ticketNumber] || unreadChats[t._id]);
              return (
                <div key={t._id} className="card" style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span className="badge badge-blue">{t.ticketNumber}</span>
                        <span style={{ fontSize: 12.5, color: 'var(--apple-secondary)' }}>{t.category}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 2, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                          {t.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--apple-label)', marginBottom: 2 }}>{t.itemTitle}</div>
                      <div style={{ fontSize: 13, color: 'var(--apple-secondary)' }}>Customer: {t.customerName} · Logged {t.createdAt}</div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#CB4D22', letterSpacing: '-0.03em' }}>৳{t.agreedPrice}</div>
                      <div style={{ fontSize: 12, color: 'var(--apple-secondary)', fontWeight: 500 }}>{t.paymentStatus}</div>
                    </div>
                  </div>

                  {t.customerAddress && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--apple-label)', marginBottom: 12, background: '#FDFBF9', padding: '8px 12px', borderRadius: 2, border: '1px solid #EAE0D6' }}>
                      <MapPin size={14} style={{ color: '#CB4D22', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong>Customer Pickup/Drop Location:</strong> {t.customerAddress}
                      </div>
                      <span className="badge badge-blue" style={{ fontSize: 10.5, flexShrink: 0 }}>
                        Assigned Tech View Only
                      </span>
                    </div>
                  )}

                  <div style={{ background: '#FDFBF9', border: '1px solid #EAE0D6', borderRadius: 2, padding: '10px 14px', fontSize: 13, color: 'var(--apple-label)', marginBottom: 14 }}>
                    <span style={{ fontWeight: 600, color: 'var(--apple-secondary)', marginRight: 6 }}>Symptom details:</span>
                    {t.symptom}
                  </div>

                  <div style={{ paddingTop: 12, borderTop: '1px solid var(--apple-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button 
                        onClick={() => onOpenChat({ ticketNumber: t.ticketNumber, _id: t._id, customerName: t.customerName, assignedRepairer: currentUser?.businessName || currentUser?.name || 'Technician' })} 
                        className="btn-ghost" 
                        style={{ 
                          gap: 6, 
                          position: 'relative',
                          background: hasUnread ? '#FFF5F4' : undefined,
                          borderColor: hasUnread ? '#FFCDD2' : undefined,
                          padding: '6px 12px',
                          borderRadius: 2
                        }}
                      >
                        <MessageSquare size={14} style={{ color: '#CB4D22' }} /> 
                        <span>Chat</span>
                        {Boolean(hasUnread) && (
                          <span style={{ 
                            background: '#E63946', 
                            color: '#fff', 
                            fontSize: 10, 
                            fontWeight: 700, 
                            borderRadius: 10, 
                            padding: '2px 7px', 
                            lineHeight: 1.1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            boxShadow: '0 0 6px rgba(230, 57, 70, 0.4)'
                          }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#FFFFFF', display: 'inline-block' }}></span>
                            {(unreadChats[t.ticketNumber] || unreadChats[t._id]) > 1 ? `${unreadChats[t.ticketNumber] || unreadChats[t._id]} New` : 'New'}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => setSelectedHistoryTicket(t)}
                        className="btn-ghost"
                        style={{ gap: 5, fontSize: 12.5 }}
                      >
                        <History size={13} style={{ color: 'var(--apple-blue)' }} /> Audit Log
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      {t.status === 'In Progress' && (
                        <button onClick={() => advance(t._id, 'Ready for Pickup')} className="btn-secondary" style={{ fontSize: 13, padding: '7px 16px' }}>
                          Mark Ready for Pickup
                        </button>
                      )}
                      {t.status === 'Ready for Pickup' && (
                        <button onClick={() => onOpenScanner && onOpenScanner(t)} className="btn-primary" style={{ fontSize: 13, gap: 6, padding: '7px 16px' }}>
                          <QrCode size={14} /> Scan Pickup QR
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION 3: COMPLETED TASKS & SETTLED PAYOUTS (DEDICATED SECTION) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={18} style={{ color: '#248A3D' }} />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--apple-label)', margin: 0 }}>
              Completed Tasks & Settled Payouts
            </h2>
          </div>
          <span className="badge badge-green" style={{ fontSize: 12 }}>
            {completedTickets.length} Settled
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {completedTickets.length === 0 ? (
            <div className="card" style={{ padding: '28px 24px', textAlign: 'center', background: '#FDFBF9', color: 'var(--apple-secondary)', border: '1px dashed #EAE0D6' }}>
              <CheckCircle2 size={32} style={{ color: '#34C759', margin: '0 auto 8px', opacity: 0.7 }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--apple-label)', marginBottom: 2 }}>No Completed Tasks Yet</div>
              <div style={{ fontSize: 12.5 }}>Completed repairs with settled escrow payouts will appear here after QR code handover verification.</div>
            </div>
          ) : (
            completedTickets.map(t => {
              const hasUnread = unreadChats && (unreadChats[t.ticketNumber] || unreadChats[t._id]);
              return (
                <div key={t._id} className="card" style={{ padding: '18px 22px', borderLeft: '4px solid #34C759' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span className="badge badge-blue">{t.ticketNumber}</span>
                        <span style={{ fontSize: 12, color: 'var(--apple-secondary)' }}>{t.category}</span>
                        <span className="badge badge-green" style={{ fontSize: 11 }}>
                          ✓ Completed & Settled
                        </span>
                      </div>
                      <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--apple-label)', marginBottom: 2 }}>
                        {t.itemTitle}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--apple-secondary)' }}>
                        Customer: <strong>{t.customerName}</strong> · Service Completed
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#248A3D', letterSpacing: '-0.03em' }}>৳{t.agreedPrice}</div>
                      <div style={{ fontSize: 11.5, color: '#34C759', fontWeight: 600 }}>Disbursed to Technician</div>
                    </div>
                  </div>

                  <div style={{ paddingTop: 10, borderTop: '1px solid var(--apple-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button 
                        onClick={() => onOpenChat({ ticketNumber: t.ticketNumber, _id: t._id, customerName: t.customerName, assignedRepairer: currentUser?.businessName || currentUser?.name || 'Technician', status: t.status })} 
                        className="btn-ghost" 
                        style={{ 
                          gap: 6, 
                          position: 'relative',
                          background: hasUnread ? '#FFF5F4' : undefined,
                          borderColor: hasUnread ? '#FFCDD2' : undefined,
                          padding: '6px 12px',
                          borderRadius: 2
                        }}
                      >
                        <MessageSquare size={14} style={{ color: '#CB4D22' }} /> 
                        <span>Chat History</span>
                        {Boolean(hasUnread) && (
                          <span style={{ 
                            background: '#E63946', 
                            color: '#fff', 
                            fontSize: 10, 
                            fontWeight: 700, 
                            borderRadius: 10, 
                            padding: '2px 7px', 
                            lineHeight: 1.1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            boxShadow: '0 0 6px rgba(230, 57, 70, 0.4)'
                          }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#FFFFFF', display: 'inline-block' }}></span>
                            {(unreadChats[t.ticketNumber] || unreadChats[t._id]) > 1 ? `${unreadChats[t.ticketNumber] || unreadChats[t._id]} New` : 'New'}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => setSelectedHistoryTicket(t)}
                        className="btn-ghost"
                        style={{ gap: 5, fontSize: 12.5 }}
                      >
                        <History size={13} style={{ color: 'var(--apple-blue)' }} /> Full Audit Log
                      </button>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--apple-secondary)' }}>
                      Escrow Released via Verified Token
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION 4: REPAIRER RATINGS & REVIEWS PANEL */}
      <div className="card" style={{ padding: '22px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--apple-label)', margin: '0 0 2px' }}>
              Customer Ratings & Verified Reviews
            </h3>
            <p style={{ fontSize: 13, color: 'var(--apple-secondary)', margin: 0 }}>
              Feedback from completed repairs protected by RepairHub Vault.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: avgRating ? '#FFF4E5' : '#F5F5F7', padding: '6px 12px', borderRadius: 8, border: avgRating ? '1px solid #FFE0B2' : '1px solid #EAE0D6' }}>
            <Star size={16} style={{ fill: avgRating ? '#FF9500' : 'none', color: avgRating ? '#FF9500' : '#B8A898' }} />
            <span style={{ fontSize: 15, fontWeight: 800, color: avgRating ? '#C95100' : 'var(--apple-secondary)' }}>
              {avgRating || 'Unrated'}
            </span>
            <span style={{ fontSize: 12, color: 'var(--apple-secondary)' }}>({reviews.length} reviews)</span>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', background: '#FDFBF9', border: '1px dashed #EAE0D6', borderRadius: 6, fontSize: 13, color: 'var(--apple-secondary)' }}>
            No verified client reviews logged yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {reviews.map((rev) => {
              const starCount = Math.max(1, Math.min(5, Math.round(Number(rev.rating) || 5)));
              const emptyStarCount = 5 - starCount;
              return (
                <div key={rev.id} style={{ background: '#FDFBF9', border: '1px solid #EAE0D6', borderRadius: 6, padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--apple-label)' }}>{rev.customerName}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ display: 'flex', color: '#FF9500', fontSize: 13 }}>
                        {'★'.repeat(starCount)}
                        {'☆'.repeat(emptyStarCount)}
                      </div>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#C95100' }}>
                        {Number(rev.rating).toFixed(1)} / 5.0
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: 12.5, color: 'var(--apple-secondary)', margin: '4px 0 6px', fontStyle: 'italic' }}>
                    "{rev.comment}"
                  </p>
                  <span style={{ fontSize: 11, color: 'var(--apple-tertiary)' }}>{rev.date}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: SUBMIT QUOTE / BID MODAL */}
      {selectedQuoteRequest && (
        <div className="modal-overlay">
          <div className="card-elevated" style={{ width: '100%', maxWidth: 460, padding: '24px 28px', background: 'var(--apple-white)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <span className="badge badge-orange">Place Technician Bid</span>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--apple-label)', margin: '6px 0 2px' }}>
                  {selectedQuoteRequest.itemTitle}
                </h3>
                <p style={{ fontSize: 12.5, color: 'var(--apple-secondary)', margin: 0 }}>
                  Ticket: {selectedQuoteRequest.ticketNumber} · Customer: {selectedQuoteRequest.customerName}
                </p>
              </div>
              <button onClick={() => setSelectedQuoteRequest(null)} className="btn-ghost" style={{ padding: 4 }}>
                <X size={16} />
              </button>
            </div>

            {quoteSuccessMsg ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={38} style={{ color: '#34C759' }} />
                <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--apple-label)', margin: 0 }}>Quote Dispatched!</h4>
                <p style={{ fontSize: 13, color: 'var(--apple-secondary)', margin: 0 }}>{quoteSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSendQuote} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="label">Total Price (BDT ৳)</label>
                    <input
                      type="number"
                      required
                      min="100"
                      step="50"
                      className="input"
                      value={quotePrice}
                      onChange={(e) => setQuotePrice(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Est. Turnaround (Days)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="14"
                      className="input"
                      value={quoteDays}
                      onChange={(e) => setQuoteDays(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Repair Breakdown & Parts Note</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe your diagnosis, turnaround, and parts guarantee..."
                    className="input"
                    value={quoteMessage}
                    onChange={(e) => setQuoteMessage(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ background: '#F5EBE6', padding: '10px 12px', borderRadius: 4, fontSize: 12, color: '#7A6458', display: 'flex', gap: 6 }}>
                  <ShieldCheck size={16} style={{ color: '#CB4D22', flexShrink: 0 }} />
                  <span>5% platform guarantee fee deducted upon escrow payout release. 90-day warranty included.</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                  <button type="button" onClick={() => setSelectedQuoteRequest(null)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={quoteSubmitting} className="btn-primary" style={{ gap: 6 }}>
                    <Send size={13} /> {quoteSubmitting ? 'Dispatching...' : 'Submit Quote to Customer'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Item History Modal (Module 1 - FR-05) */}
      <ItemHistoryModal
        isOpen={!!selectedHistoryTicket}
        onClose={() => setSelectedHistoryTicket(null)}
        ticket={selectedHistoryTicket}
        currentUser={currentUser}
      />

    </div>
  );
}
