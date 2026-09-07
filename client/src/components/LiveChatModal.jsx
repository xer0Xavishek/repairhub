import React, { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, Send, Zap, Wifi } from 'lucide-react';
import { io } from 'socket.io-client';
import axios from 'axios';

export default function LiveChatModal({ isOpen, onClose, ticket, currentUser }) {
  const isRepairer = currentUser?.role === 'Repairer' || currentUser?.role === 'repairer';
  const roleLabel = isRepairer ? 'Repairer' : 'Customer';
  const senderDisplayName = currentUser?.name || currentUser?.businessName || (isRepairer ? 'Master Rafiq Tech' : 'Customer');
  const roomId = `order_${ticket?.ticketNumber || ticket?._id || 'default_room'}`;
  const isOrderCompleted = ticket?.status === 'Completed';

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);



  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset messages and fetch chat history strictly for the selected ticket
  useEffect(() => {
    if (!isOpen || !ticket) return;

    const initialWelcome = [
      {
        id: `init-${ticket.ticketNumber || ticket._id}`,
        from: 'System',
        senderName: 'RepairHub Live Channel',
        text: `Live workshop channel established for Order #${ticket.ticketNumber || 'Recent'} (${ticket.itemTitle || 'Repair Item'}). Chatting with ${isRepairer ? (ticket.customerName || 'Customer') : (ticket.assignedRepairer || 'Technician')}.`,
        time: 'Just now'
      }
    ];
    setMessages(initialWelcome);

    const targetRequestId = ticket._id || ticket.ticketNumber;
    if (targetRequestId) {
      const token = currentUser?.token || sessionStorage.getItem('repairhub_token') || localStorage.getItem('repairhub_token');
      axios.get(`/api/chat/request/${targetRequestId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
            const dbMsgs = res.data.data.map((m) => ({
              id: m._id,
              from: m.senderId?.role === 'repairer' ? 'Repairer' : 'Customer',
              senderName: m.senderId?.name || 'User',
              text: m.content,
              time: new Date(m.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
              senderId: m.senderId?._id || m.senderId
            }));
            setMessages(dbMsgs);
          }
        })
        .catch((err) => {
          console.warn('[Chat History Notice]:', err.message);
        });
    }
  }, [isOpen, ticket?.ticketNumber, ticket?._id, isRepairer]);

  // Connect to Socket.io & Join Order-Specific Room
  useEffect(() => {
    if (!isOpen || !ticket) return;

    // Connect directly to backend at port 5000 or current origin
    const socketEndpoint = window.location.port === '5173' ? 'http://localhost:5000' : window.location.origin;
    const socket = io(socketEndpoint, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      timeout: 8000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_room', roomId);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket.io] Connection error:', err.message);
      setIsConnected(false);
    });

    socket.on('receive_message', (incoming) => {
      if (!incoming) return;
      const currentUserId = currentUser?._id ? String(currentUser._id) : '';
      const incomingSenderId = incoming.senderId ? String(incoming.senderId?._id || incoming.senderId) : '';
      if (currentUserId && incomingSenderId && incomingSenderId === currentUserId) return;

      setMessages((prev) => {
        if (prev.some((m) => m.id === incoming.id)) return prev;
        playMessageChime();
        return [...prev, incoming];
      });
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
    });

    return () => {
      socket.emit('leave_room', roomId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isOpen, roomId, currentUser?._id]);

  if (!isOpen) return null;

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isOrderCompleted) return;

    const timeStr = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      from: roleLabel,
      senderName: senderDisplayName,
      senderId: currentUser?._id || socketRef.current?.id || 'anon',
      ticketNumber: ticket?.ticketNumber,
      repairRequestId: ticket?._id,
      text: input.trim(),
      time: timeStr,
    };

    // Optimistically add to local UI
    setMessages((prev) => [...prev, newMsg]);

    // 1. Emit live WebSocket event via Socket.io
    if (socketRef.current) {
      socketRef.current.emit('send_message', {
        roomId,
        ticketNumber: ticket?.ticketNumber,
        repairRequestId: ticket?._id,
        message: newMsg,
      });
    }

    // 2. Persist to MongoDB backend if authenticated & ticket is valid
    const token = currentUser?.token || sessionStorage.getItem('repairhub_token') || localStorage.getItem('repairhub_token');
    if (token && ticket?._id && ticket._id.length === 24 && !ticket._id.startsWith('req_')) {
      try {
        let receiverId = isRepairer
          ? (ticket.requesterId?._id || ticket.requesterId)
          : (ticket.assignedRepairerId?._id || ticket.assignedRepairerId);

        if (!receiverId || typeof receiverId !== 'string' || receiverId.length !== 24) {
          receiverId = currentUser?._id;
        }

        await axios.post('/api/chat/messages', {
          repairRequestId: ticket._id,
          receiverId,
          content: input.trim(),
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (saveErr) {
        console.warn('[Chat DB Save Notice]:', saveErr.message);
      }
    }

    setInput('');
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="card-elevated"
        style={{
          width: '100%',
          maxWidth: 480,
          height: 560,
          display: 'flex',
          flexDirection: 'column',
          background: '#FFFFFF',
          borderRadius: 2,
          boxShadow: '0 20px 48px rgba(45, 27, 17, 0.2)'
        }}
      >

        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #EAE0D6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FDFBF9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 2,
              background: '#F5EBE6',
              border: '1px solid #EAE0D6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#CB4D22'
            }}>
              <MessageSquare size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14.5, fontWeight: 700, color: '#2D1B11' }}>
                  {isRepairer ? 'Customer Live Chat' : 'Technician Direct Chat'}
                </span>
                <span
                  title={isConnected ? 'Connected in real-time' : 'Connecting...'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: isConnected ? 'rgba(36, 138, 61, 0.12)' : 'rgba(201, 81, 0, 0.12)',
                  }}
                >
                  <span style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: isConnected ? '#248A3D' : '#C95100',
                    boxShadow: isConnected ? '0 0 0 2px rgba(36, 138, 61, 0.2)' : 'none'
                  }} />
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: '#7A6458', marginTop: 1 }}>
                Ticket: <strong>{ticket?.ticketNumber || 'N/A'}</strong> · {ticket?.itemTitle || 'Repair Order'}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px 8px', borderRadius: 2 }}>
            <X size={17} />
          </button>
        </div>

        {/* Message Bubble Feed */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          background: '#FAF8F5'
        }}>
          {messages.map((m) => {
            if (m.from === 'System') {
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
                  <div style={{
                    fontSize: 11,
                    color: '#7A6458',
                    background: '#F0EAE1',
                    border: '1px solid #E5DDD3',
                    padding: '6px 14px',
                    borderRadius: 12,
                    textAlign: 'center',
                    maxWidth: '90%',
                    lineHeight: 1.4,
                  }}>
                    {m.text}
                  </div>
                </div>
              );
            }

            const currentUserId = currentUser?._id ? String(currentUser._id) : '';
            const msgSenderId = m.senderId ? (typeof m.senderId === 'object' ? String(m.senderId._id || m.senderId) : String(m.senderId)) : '';
            const isMe = (currentUserId && msgSenderId)
              ? (msgSenderId === currentUserId)
              : (m.from === roleLabel);

            const displayName = isMe
              ? 'You'
              : (m.senderName || (m.from === 'Repairer' ? 'Technician' : 'Customer'));

            return (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                <span style={{ fontSize: 10, color: '#7A6458', marginBottom: 2, padding: '0 4px', fontWeight: 600 }}>
                  {displayName}
                </span>
                <div style={{
                  maxWidth: '82%',
                  background: isMe ? '#CB4D22' : '#FFFFFF',
                  color: isMe ? '#FFFFFF' : '#2D1B11',
                  border: isMe ? '1px solid #CB4D22' : '1px solid #EAE0D6',
                  borderRadius: 2,
                  padding: '9px 14px',
                  boxShadow: '0 1px 3px rgba(45, 27, 17, 0.05)',
                }}>
                  <p style={{ fontSize: 13, margin: 0, lineHeight: 1.45 }}>{m.text}</p>
                  <p style={{
                    fontSize: 10,
                    margin: '4px 0 0',
                    opacity: isMe ? 0.85 : 0.6,
                    textAlign: 'right',
                    letterSpacing: '0.02em'
                  }}>
                    {m.time}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar or Archived Banner (Bug 5) */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #EAE0D6', background: isOrderCompleted ? '#FDFBF9' : '#FFFFFF' }}>
          {isOrderCompleted ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 14px',
              background: '#E8FAE8',
              border: '1px solid #C8E6C9',
              borderRadius: 4,
              color: '#2E7D32',
              fontSize: 12.5,
              fontWeight: 600,
              textAlign: 'center'
            }}>
              <span>✓ Repair order completed & escrow settled. This conversation is archived and read-only.</span>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                className="input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Send message as ${senderDisplayName}…`}
                style={{
                  flex: 1,
                  background: '#FAF8F5',
                  borderRadius: 2,
                  padding: '9px 14px',
                  fontSize: 13,
                  border: '1px solid #EAE0D6'
                }}
              />
              <button
                type="submit"
                disabled={!input.trim()}
                style={{
                  padding: '9px 16px',
                  borderRadius: 2,
                  background: input.trim() ? '#CB4D22' : '#EAE0D6',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: input.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 12.5,
                  fontWeight: 600,
                  transition: 'all 0.15s ease'
                }}
              >
                <Send size={14} />
                <span>Send</span>
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
