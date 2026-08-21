import React, { useState } from 'react';
import { X, QrCode, ShieldCheck, CheckCircle2, Camera, RefreshCw } from 'lucide-react';

export default function QRScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [scanState, setScanState] = useState('idle'); // idle | scanning | verified
  const [tokenInput, setTokenInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setTokenInput('');
      setScanState('idle');
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulateScan = (actionType) => {
    setErrorMessage('');
    if (!tokenInput || !tokenInput.trim()) {
      setErrorMessage('Please ask customer for their handover token/ticket code (e.g. RH-2026-...)');
      return;
    }
    const cleanToken = tokenInput.trim().toUpperCase();
    setScanState('scanning');
    setTimeout(() => {
      setScanState('verified');
      setTimeout(() => {
        onScanSuccess({
          ticketNumber: cleanToken,
          action: actionType,
          verifiedAt: new Date().toISOString(),
        });
        setScanState('idle');
        onClose();
      }, 1500);
    }, 1200);
  };

  return (
    <div className="modal-overlay">
      <div className="card-elevated" style={{ width: '100%', maxWidth: 420, padding: '28px 24px', textAlign: 'center', background: 'var(--apple-white)' }}>
        
        <button
          onClick={onClose}
          className="btn-ghost"
          style={{ position: 'absolute', top: 14, right: 14, padding: '6px 8px', borderRadius: 980 }}
        >
          <X size={17} />
        </button>

        <div style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: 'var(--apple-blue-light)',
          color: 'var(--apple-blue)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px'
        }}>
          <Camera size={24} />
        </div>

        <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--apple-label)', margin: '0 0 4px' }}>
          Technician QR Scanner
        </h3>
        <p style={{ fontSize: 13, color: 'var(--apple-secondary)', margin: 0 }}>
          Verify customer handover token to release workflow stages and payment.
        </p>

        {/* Camera Viewfinder Box */}
        <div style={{
          width: '100%',
          height: 180,
          background: '#F5F5F7',
          borderRadius: 16,
          border: '2px dashed var(--apple-border-strong)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '18px 0',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {scanState === 'scanning' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <RefreshCw size={28} className="animate-spin" style={{ color: 'var(--apple-blue)' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--apple-blue)' }}>
                Verifying Cryptographic Handover Token...
              </span>
            </div>
          )}

          {scanState === 'verified' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={36} style={{ color: '#34C759' }} />
              <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--apple-label)' }}>
                Token Authenticated! Payment Disbursed.
              </span>
            </div>
          )}

          {scanState === 'idle' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--apple-tertiary)' }}>
              <QrCode size={36} />
              <span style={{ fontSize: 12.5, color: 'var(--apple-secondary)' }}>
                Align customer token within viewfinder
              </span>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div style={{ background: '#FFEBE9', border: '1px solid #FFCDD2', borderRadius: 8, padding: '8px 12px', fontSize: 12.5, color: 'var(--apple-red)', marginBottom: 12, textAlign: 'left' }}>
            {errorMessage}
          </div>
        )}

        {/* Ticket Input */}
        <div style={{ textAlign: 'left', marginBottom: 16 }}>
          <label className="label">Customer Handover Token Code</label>
          <input
            type="text"
            className="input"
            placeholder="Ask customer for code (e.g. RH-2026-...)"
            value={tokenInput}
            onChange={(e) => {
              setTokenInput(e.target.value);
              setErrorMessage('');
            }}
            style={{ fontFamily: 'monospace', fontSize: 13.5, letterSpacing: '0.04em' }}
          />
        </div>

        {/* Action Triggers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button
            onClick={() => handleSimulateScan('drop-off')}
            disabled={scanState !== 'idle' || !tokenInput.trim()}
            className="btn-secondary"
            style={{ justifyContent: 'center', padding: '10px' }}
          >
            Verify Drop-off
          </button>

          <button
            onClick={() => handleSimulateScan('pickup')}
            disabled={scanState !== 'idle' || !tokenInput.trim()}
            className="btn-primary"
            style={{ justifyContent: 'center', padding: '10px' }}
          >
            Verify Pickup & Payout
          </button>
        </div>

      </div>
    </div>
  );
}
