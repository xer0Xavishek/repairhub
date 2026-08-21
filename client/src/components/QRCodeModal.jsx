import React, { useState } from 'react';
import { X, QrCode, ShieldCheck, CheckCircle2, Copy, Printer, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function QRCodeModal({ isOpen, onClose, ticketNumber, itemTitle, requesterName }) {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const qrPayload = JSON.stringify({
    ticketNumber: ticketNumber || '',
    issuedAt: new Date().toISOString(),
    system: 'repairhub Handover Verification Token',
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(qrPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay">
      <div className="card-elevated" style={{ width: '100%', maxWidth: 400, padding: '28px 24px', textAlign: 'center', position: 'relative', background: 'var(--apple-white)' }}>
        
        <button
          onClick={onClose}
          className="btn-ghost"
          style={{ position: 'absolute', top: 14, right: 14, padding: '6px 8px', borderRadius: 2 }}
        >
          <X size={17} />
        </button>

        <div style={{
          width: 44,
          height: 44,
          borderRadius: 2,
          background: '#F5EBE6',
          color: '#CB4D22',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px'
        }}>
          <QrCode size={22} />
        </div>

        <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--apple-label)', margin: '0 0 4px' }}>
          Device Handover QR Token
        </h3>
        <p style={{ fontSize: 13, color: 'var(--apple-secondary)', margin: 0 }}>
          Show this QR code to the technician during drop-off or pickup.
        </p>

        {/* QR Code Container */}
        <div style={{
          background: '#FFFFFF',
          padding: 16,
          borderRadius: 16,
          margin: '20px auto',
          width: 'fit-content',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          border: '1px solid var(--apple-border)'
        }}>
          <QRCodeSVG value={qrPayload} size={170} level="H" fgColor="#1D1D1F" />
        </div>

        {/* Metadata Details */}
        <div style={{
          background: '#F5F5F7',
          borderRadius: 12,
          padding: '12px 16px',
          textAlign: 'left',
          fontSize: 13,
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--apple-secondary)' }}>Ticket Number:</span>
            <span style={{ fontWeight: 700, color: 'var(--apple-blue)' }}>{ticketNumber || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--apple-secondary)' }}>Item:</span>
            <span style={{ fontWeight: 600, color: 'var(--apple-label)', maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {itemTitle || 'Repair Item'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--apple-secondary)' }}>Customer:</span>
            <span style={{ fontWeight: 600, color: 'var(--apple-label)' }}>{requesterName || 'Customer'}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
          <button
            onClick={handleCopy}
            className="btn-secondary"
            style={{ justifyContent: 'center', fontSize: 12.5, padding: '7px 12px', gap: 6 }}
          >
            {copied ? <Check size={14} style={{ color: '#34C759' }} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy Token'}
          </button>
          <button
            onClick={handlePrint}
            className="btn-secondary"
            style={{ justifyContent: 'center', fontSize: 12.5, padding: '7px 12px', gap: 6 }}
          >
            <Printer size={14} /> Print Pass
          </button>
        </div>

        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#34C759' }}>
          <ShieldCheck size={16} />
          <span>Protected under repairhub Guarantee</span>
        </div>

      </div>
    </div>
  );
}
