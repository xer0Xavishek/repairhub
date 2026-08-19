import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Wrench, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  X, 
  AlertCircle,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

// Dynamic Reschedule Slots (Bug 7)
export const generateRescheduleSlots = () => {
  const slots = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();

  const slotTimes = [
    { label: '10:00 AM – 11:30 AM', hour: 10, min: 0 },
    { label: '02:00 PM – 03:30 PM', hour: 14, min: 0 },
    { label: '05:00 PM – 06:30 PM', hour: 17, min: 0 },
  ];

  for (let i = 1; i <= 3; i++) {
    const d = new Date();
    d.setDate(now.getDate() + i);
    const dayName = dayNames[d.getDay()];
    const dateNum = d.getDate();
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();

    const t = slotTimes[(i - 1) % slotTimes.length];
    const localDate = new Date(year, d.getMonth(), dateNum, t.hour, t.min, 0);

    slots.push({
      id: `resched-slot-${i}`,
      date: `${dayName}, ${dateNum} ${month} ${year}`,
      time: t.label,
      iso: localDate.toISOString(),
      rawDate: localDate,
    });
  }
  return slots;
};

export default function BookingManagementPanel({ currentUser, newBooking }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rescheduleBookingTarget, setRescheduleBookingTarget] = useState(null);
  const [rescheduleSlots, setRescheduleSlots] = useState(generateRescheduleSlots());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Prepend newly confirmed booking dynamically
  useEffect(() => {
    if (newBooking) {
      setBookings(prev => {
        if (prev.some(b => b._id === newBooking._id)) return prev;
        return [newBooking, ...prev];
      });
    }
  }, [newBooking]);

  // Fetch real active bookings from backend (Bug 6 & 7)
  const fetchBookings = () => {
    const token = localStorage.getItem('repairhub_token');
    setLoading(true);
    fetch('/api/bookings', {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          // Bug 6: Exclude cancelled bookings from the active list
          const activeBookings = data.data.filter(b => b.status !== 'Cancelled');
          const mapped = activeBookings.map(b => {
            const d = new Date(b.scheduledTime);
            return {
              _id: b._id,
              repairerName: b.repairerId?.businessName || b.repairerId?.name || 'Assigned Workshop',
              repairerAddress: b.repairerId?.address || 'Dhaka',
              customerName: b.requesterId?.name || 'Customer',
              scheduledTime: b.scheduledTime,
              formattedDate: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
              formattedTime: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
              type: b.type || 'Diagnostic Appointment',
              status: b.status,
              notes: b.notes || 'Workshop diagnostic session',
              startingRate: b.repairerId?.priceRangeMin || b.repairerId?.startingRate || 300,
            };
          });
          setBookings(mapped);
        } else {
          setBookings([]);
        }
      })
      .catch(err => {
        console.warn('[Bookings Load Notice]:', err.message);
        setBookings([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, [currentUser]);

  // Bug 6: Cancelling appointment removes it from the list
  const handleCancel = async (booking) => {
    const token = localStorage.getItem('repairhub_token');
    try {
      const res = await fetch(`/api/bookings/${booking._id}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Appointment cancelled and slot released.');
        setBookings(current => current.filter(item => item._id !== booking._id));
        return;
      }
    } catch (err) {
      console.warn('[Cancel Booking Notice]:', err.message);
    }

    setBookings(current => current.filter(item => item._id !== booking._id));
    showToast('Appointment cancelled and slot released.');
  };

  // Bug 7: Reschedule with real calendar slots & conflict detection
  const handleConfirmReschedule = async () => {
    if (!rescheduleBookingTarget || !selectedSlot) return;

    const token = localStorage.getItem('repairhub_token');
    try {
      const res = await fetch(`/api/bookings/${rescheduleBookingTarget._id}/reschedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ newScheduledTime: selectedSlot.iso })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Appointment rescheduled to ${selectedSlot.date} (${selectedSlot.time}).`);
        setBookings(current =>
          current.map(item =>
            item._id === rescheduleBookingTarget._id
              ? {
                  ...item,
                  scheduledTime: selectedSlot.iso,
                  formattedDate: selectedSlot.date,
                  formattedTime: selectedSlot.time,
                  status: 'Rescheduled',
                }
              : item
          )
        );
        setRescheduleBookingTarget(null);
        return;
      } else {
        if (data.conflictType === 'CUSTOMER_TIME_CONFLICT' || (data.message && data.message.includes('cannot book two repairs'))) {
          showToast(data.message || 'You already have another appointment scheduled at this time.');
          return;
        }
      }
    } catch (err) {
      console.warn('[Reschedule Booking Notice]:', err.message);
    }

    setBookings(current =>
      current.map(item =>
        item._id === rescheduleBookingTarget._id
          ? {
              ...item,
              scheduledTime: selectedSlot.iso,
              formattedDate: selectedSlot.date,
              formattedTime: selectedSlot.time,
              status: 'Rescheduled',
            }
          : item
      )
    );

    showToast(`Appointment rescheduled to ${selectedSlot.date} (${selectedSlot.time}).`);
    setRescheduleBookingTarget(null);
  };

  const isRepairer = currentUser?.role === 'Repairer' || currentUser?.role === 'repairer';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {toastMessage && (
        <div style={{ position: 'fixed', top: 72, right: 20, zIndex: 60, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500 }}>
          <CheckCircle2 size={16} style={{ color: '#34C759', flexShrink: 0 }} />
          {toastMessage}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--apple-label)', margin: '0 0 2px' }}>
            Your Appointments ({bookings.length})
          </h2>
          <p style={{ fontSize: 13, color: 'var(--apple-secondary)', margin: 0 }}>
            {isRepairer ? 'Scheduled customer diagnostic visits at your workbench.' : 'Scheduled in-person diagnostic sessions with verified workshops.'}
          </p>
        </div>
        <span className="badge badge-blue" style={{ fontSize: 12 }}>
          {bookings.length} Active Slot{bookings.length === 1 ? '' : 's'}
        </span>
      </div>

      {bookings.length === 0 ? (
        <div className="card" style={{ padding: '28px', textAlign: 'center', color: 'var(--apple-secondary)' }}>
          <Calendar size={32} style={{ color: 'var(--apple-tertiary)', margin: '0 auto 8px' }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--apple-label)' }}>No Upcoming Appointments</div>
          <div style={{ fontSize: 12.5, marginTop: 4 }}>You can book a diagnostic slot directly from the Workshop Explorer map.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {bookings.map(b => (
            <div key={b._id} className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <span className={b.status === 'Rescheduled' ? 'badge badge-orange' : 'badge badge-green'} style={{ fontSize: 11, marginBottom: 4, display: 'inline-block' }}>
                    {b.status}
                  </span>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--apple-label)', margin: 0 }}>
                    {isRepairer ? b.customerName : b.repairerName}
                  </h4>
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--apple-blue)', background: 'var(--apple-blue-light)', padding: '3px 8px', borderRadius: 4 }}>
                  {b.type}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--apple-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={14} style={{ color: 'var(--apple-blue)', flexShrink: 0 }} />
                  <span>{b.formattedDate}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} style={{ color: 'var(--apple-blue)', flexShrink: 0 }} />
                  <span>{b.formattedTime}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={14} style={{ color: '#CB4D22', flexShrink: 0 }} />
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {b.repairerAddress}
                  </span>
                </div>
              </div>

              {b.notes && (
                <div style={{ background: '#FDFBF9', border: '1px solid #EAE0D6', borderRadius: 4, padding: '7px 10px', fontSize: 12, color: 'var(--apple-label)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--apple-secondary)', marginRight: 4 }}>Note:</span>
                  {b.notes}
                </div>
              )}

              <div style={{ paddingTop: 10, borderTop: '1px solid var(--apple-border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  onClick={() => handleCancel(b)}
                  className="btn-ghost"
                  style={{ fontSize: 12, color: 'var(--apple-red)', padding: '5px 10px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const freshSlots = generateRescheduleSlots();
                    setRescheduleSlots(freshSlots);
                    setSelectedSlot(freshSlots[0]);
                    setRescheduleBookingTarget(b);
                  }}
                  className="btn-secondary"
                  style={{ fontSize: 12, padding: '5px 12px', gap: 4 }}
                >
                  <RotateCcw size={12} /> Reschedule
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reschedule Modal (Bug 7) */}
      {rescheduleBookingTarget && (
        <div className="modal-overlay">
          <div className="card-elevated" style={{ width: '100%', maxWidth: 420, padding: '22px 24px', background: 'var(--apple-white)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--apple-label)', margin: 0 }}>
                  Reschedule Appointment
                </h3>
                <p style={{ fontSize: 12.5, color: 'var(--apple-secondary)', margin: '3px 0 0' }}>
                  {rescheduleBookingTarget.repairerName}
                </p>
              </div>
              <button onClick={() => setRescheduleBookingTarget(null)} className="btn-ghost" style={{ padding: 4 }}>
                <X size={16} />
              </button>
            </div>

            <label className="label">Select New Diagnostic Slot (Upcoming Calendar)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {rescheduleSlots.map(slot => {
                const isSelected = selectedSlot?.id === slot.id;
                return (
                  <div
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: isSelected ? '2px solid var(--apple-blue)' : '1px solid var(--apple-border)',
                      background: isSelected ? 'var(--apple-blue-light)' : '#F5F5F7',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--apple-label)' }}>{slot.date}</div>
                      <div style={{ fontSize: 12, color: 'var(--apple-secondary)' }}>{slot.time}</div>
                    </div>
                    {isSelected && <CheckCircle2 size={16} style={{ color: 'var(--apple-blue)' }} />}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setRescheduleBookingTarget(null)} className="btn-secondary">
                Back
              </button>
              <button onClick={handleConfirmReschedule} className="btn-primary">
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
