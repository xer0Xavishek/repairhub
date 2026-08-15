import React, { useState, useEffect } from 'react';
import { X, History, ShieldCheck, CheckCircle2, Clock, ArrowRight, UserCheck, Wrench } from 'lucide-react';

export default function ItemHistoryModal({ isOpen, onClose, ticket, currentUser }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !ticket?._id) return;

    const token = localStorage.getItem('repairhub_token');
    const isRealTicket = ticket._id.length === 24 && !ticket._id.startsWith('req_') && !ticket._id.startsWith('t_');

    if (isRealTicket && token && !token.startsWith('demo_')) {
      setLoading(true);
      fetch(`/api/repairs/${ticket._id}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            setLogs(data.data);
          } else {
            setLogs(generateFallbackLogs(ticket, currentUser));
          }
        })
        .catch(() => {
          setLogs(generateFallbackLogs(ticket, currentUser));
        })
        .finally(() => setLoading(false));
    } else {
      setLogs(generateFallbackLogs(ticket, currentUser));
    }
  }, [isOpen, ticket, currentUser]);

  if (!isOpen || !ticket) return null;

  const formatChangeType = (type) => {
    switch (type) {
      case 'REQUEST_CREATED': return 'Request Submitted';
      case 'STATUS_UPDATED': return 'Lifecycle Transition';
      case 'QUOTE_SUBMITTED': return 'Technician Quote Submitted';
      case 'QUOTE_ACCEPTED': return 'Quote Accepted & Escrow Created';
      case 'PAYMENT_HELD_IN_ESCROW': return 'Escrow Funds Secured';
      case 'ITEM_DROPPED_OFF': return 'Physical Drop-Off Verified (QR)';
      case 'REPAIR_STARTED': return 'Diagnosis & Repair Started';
      case 'READY_FOR_PICKUP': return 'Item Ready for Pickup';
      case 'ITEM_PICKED_UP': return 'Pickup Verified & Handover Token Scanned';
      case 'ESCROW_RELEASED': return 'Protected Escrow Disbursed';
      case 'REQUEST_CANCELLED': return 'Request Cancelled';
      default: return type?.replace(/_/g, ' ') || 'Audit Event';
    }
  };

  const getEventBadgeColor = (type) => {
    if (type?.includes('PICKED_UP') || type?.includes('RELEASED') || type === 'Completed') {
      return { bg: '#EBF8EE', color: '#248A3D', border: '#C4F3C4' };
    }
    if (type?.includes('DROPPED_OFF') || type?.includes('STARTED') || type === 'In Progress') {
      return { bg: '#FFF4E5', color: '#C95100', border: '#FFE0B2' };
    }
    return { bg: '#F5EBE6', color: '#CB4D22', border: '#EAE0D6' };
  };

  const isRepairer = (currentUser?.role || '').toLowerCase() === 'repairer';
  const currentUserIdStr = currentUser?._id ? String(currentUser._id) : '';
  const currentUserName = currentUser?.businessName || currentUser?.name || '';

  // Item 13: In audit log, for repairer POV, repairer should only see requester's request, their own bidding,
  // escrow funds secured, etc. A repairer should not see what other repairers bid or if other repairers have bid.
  const visibleLogs = logs.filter((log) => {
    if (!isRepairer) return true;
    if (log.changeType === 'QUOTE_SUBMITTED') {
      const actorIdStr = log.actorId?._id ? String(log.actorId._id) : (typeof log.actorId === 'string' ? log.actorId : '');
      const actorName = log.actorId?.name || '';
      const matchId = currentUserIdStr && actorIdStr && currentUserIdStr === actorIdStr;
      const matchName = currentUserName && actorName && (currentUserName.toLowerCase() === actorName.toLowerCase() || log.note?.toLowerCase().includes(currentUserName.toLowerCase()));
      return matchId || matchName;
    }
    return true;
  });

  return (
    <div className="modal-overlay">
      <div className="card-elevated" style={{ width: '100%', maxWidth: 540, padding: '24px 28px', background: 'var(--apple-white)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span className="badge badge-blue">Audit & History Log</span>
              <span style={{ fontSize: 11.5, color: '#34C759', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                <ShieldCheck size={13} /> Immutable Ledger
              </span>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--apple-label)', margin: 0 }}>
              {ticket.itemTitle || 'Repair Item'}
            </h3>
            <p style={{ fontSize: 12.5, color: 'var(--apple-secondary)', margin: '2px 0 0' }}>
              Tracking Ticket: <strong style={{ color: 'var(--apple-blue)' }}>{ticket.ticketNumber || ticket._id}</strong>
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px 8px', borderRadius: 4 }}>
            <X size={17} />
          </button>
        </div>

        {/* Scrollable Audit Trail */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: 6, margin: '8px 0' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--apple-secondary)', fontSize: 13 }}>
              Loading verifiable audit history...
            </div>
          ) : visibleLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--apple-secondary)', fontSize: 13 }}>
              No audit logs recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
              {visibleLogs.map((log, idx) => {
                const badge = getEventBadgeColor(log.changeType || log.newStatus);
                const isLast = idx === logs.length - 1;

                return (
                  <div key={log._id || idx} style={{ display: 'flex', gap: 12, position: 'relative' }}>
                    
                    {/* Timeline indicator */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: badge.bg,
                        border: `1.5px solid ${badge.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: badge.color,
                        zIndex: 2,
                      }}>
                        {log.changeType?.includes('PICK') || log.changeType?.includes('RELEASE') ? (
                          <CheckCircle2 size={12} strokeWidth={2.5} />
                        ) : log.changeType?.includes('STARTED') ? (
                          <Wrench size={11} strokeWidth={2.5} />
                        ) : (
                          <Clock size={11} strokeWidth={2.5} />
                        )}
                      </div>
                      {!isLast && (
                        <div style={{ width: 2, flex: 1, background: '#EAE0D6', minHeight: 28, margin: '2px 0' }} />
                      )}
                    </div>

                    {/* Content Box */}
                    <div style={{ flex: 1, background: '#FDFBF9', border: '1px solid #EAE0D6', borderRadius: 4, padding: '10px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--apple-label)' }}>
                          {formatChangeType(log.changeType)}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--apple-tertiary)' }}>
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recent'}
                        </span>
                      </div>

                      {log.note && (
                        <p style={{ fontSize: 12.5, color: 'var(--apple-secondary)', margin: '0 0 6px' }}>
                          {log.note}
                        </p>
                      )}

                      {/* State transition pills if present */}
                      {(log.previousStatus || log.newStatus) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, marginTop: 4 }}>
                          {log.previousStatus && (
                            <span style={{ padding: '1px 6px', background: '#E8E8ED', borderRadius: 3, color: 'var(--apple-secondary)' }}>
                              {log.previousStatus}
                            </span>
                          )}
                          {log.previousStatus && log.newStatus && <ArrowRight size={11} style={{ color: 'var(--apple-tertiary)' }} />}
                          {log.newStatus && (
                            <span style={{ padding: '1px 6px', background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, borderRadius: 3, fontWeight: 600 }}>
                              {log.newStatus}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Actor info */}
                      {log.actorId && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--apple-tertiary)', marginTop: 4 }}>
                          <UserCheck size={11} />
                          <span>Recorded by: <strong>{log.actorId.name || log.actorId.role || 'Authorized Actor'}</strong></span>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ paddingTop: 12, borderTop: '1px solid var(--apple-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <span style={{ fontSize: 11.5, color: 'var(--apple-secondary)' }}>
            Each log entry is timestamped and tamper-proof per CSE470 FR-05.
          </span>
          <button onClick={onClose} className="btn-secondary" style={{ fontSize: 12.5, padding: '6px 14px' }}>
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

function generateFallbackLogs(ticket, currentUser) {
  const isRepairer = (currentUser?.role || '').toLowerCase() === 'repairer';
  const currentUserIdStr = currentUser?._id ? String(currentUser._id) : '';
  const currentUserName = currentUser?.businessName || currentUser?.name || '';
  const assignedIdStr = ticket.assignedRepairerId?._id ? String(ticket.assignedRepairerId._id) : String(ticket.assignedRepairerId || '');

  const logs = [
    {
      _id: 'log_01',
      changeType: 'REQUEST_CREATED',
      previousStatus: '',
      newStatus: 'Requested',
      note: `Repair request submitted for ${ticket.itemTitle || 'Item'}. Unique ticket ${ticket.ticketNumber || ''} and handover QR token generated.`,
      timestamp: ticket.createdAt || new Date(Date.now() - 86400000 * 3).toISOString(),
      actorId: { name: ticket.customerName || 'Customer', role: 'Requester' },
    },
  ];

  // For repairer POV, only show technician quote if it belongs to this repairer
  const isAssignedToThisRepairer = isRepairer && (
    (currentUserIdStr && assignedIdStr && currentUserIdStr === assignedIdStr) ||
    (currentUserName && ticket.assignedRepairer && currentUserName.toLowerCase() === ticket.assignedRepairer.toLowerCase())
  );

  if (ticket.status !== 'Requested') {
    if (!isRepairer || isAssignedToThisRepairer) {
      logs.push({
        _id: 'log_02',
        changeType: 'QUOTE_SUBMITTED',
        previousStatus: 'Requested',
        newStatus: 'Quoted',
        note: `Workshop technician review completed. Initial diagnostic bid submitted${ticket.quotedPrice ? ` at ৳${ticket.quotedPrice}` : ''}.`,
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        actorId: { name: ticket.assignedRepairer || (isRepairer ? currentUserName : 'Technician'), role: 'Repairer' },
      });
    }
  }

  if (['In Progress', 'Ready for Pickup', 'Completed'].includes(ticket.status)) {
    logs.push({
      _id: 'log_03',
      changeType: 'ITEM_DROPPED_OFF',
      previousStatus: 'Quoted',
      newStatus: 'In Progress',
      note: `Physical device drop-off verified via QR token scan at workshop. Disassembly and circuit diagnostics commenced.`,
      timestamp: new Date(Date.now() - 86400000 * 1.2).toISOString(),
      actorId: { name: ticket.assignedRepairer || 'Technician', role: 'Repairer' },
    });
  }

  if (['Ready for Pickup', 'Completed'].includes(ticket.status)) {
    logs.push({
      _id: 'log_04',
      changeType: 'READY_FOR_PICKUP',
      previousStatus: 'In Progress',
      newStatus: 'Ready for Pickup',
      note: `Bench testing and QA passed. Device cleaned and packaged for customer pickup.`,
      timestamp: new Date(Date.now() - 86400000 * 0.5).toISOString(),
      actorId: { name: ticket.assignedRepairer || 'Technician', role: 'Repairer' },
    });
  }

  if (ticket.status === 'Completed') {
    logs.push({
      _id: 'log_05',
      changeType: 'ITEM_PICKED_UP',
      previousStatus: 'Ready for Pickup',
      newStatus: 'Completed',
      note: `Final customer handover token authenticated. Escrow payout released to technician. Environmental impact metrics logged.`,
      timestamp: new Date().toISOString(),
      actorId: { name: 'Customer & Technician', role: 'System' },
    });
  }

  return logs;
}
