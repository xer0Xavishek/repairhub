import React from 'react';
import { Check, XCircle } from 'lucide-react';

const STAGES = ['Requested', 'Quoted', 'In Progress', 'Ready for Pickup', 'Completed'];

export default function StatusPipeline({ currentStatus }) {
  if (currentStatus === 'Cancelled') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#FFF2F2', border: '1px solid #FFD1D1', borderRadius: 6, marginTop: 6 }}>
        <XCircle size={16} style={{ color: '#E02020', flexShrink: 0 }} />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: '#C51010' }}>
          This repair request was cancelled.
        </span>
      </div>
    );
  }

  const activeIdx = Math.max(0, STAGES.indexOf(currentStatus));

  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginTop: 6, position: 'relative' }}>
      {STAGES.map((stage, idx) => {
        const done    = idx < activeIdx;
        const current = idx === activeIdx;

        return (
          <React.Fragment key={stage}>
            {/* Node */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0, zIndex: 2 }}>
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                flexShrink: 0,
                background: done ? '#34C759' : current ? 'var(--apple-blue)' : '#E8E8ED',
                border: current ? '2px solid var(--apple-blue)' : done ? 'none' : '1px solid #D2D2D7',
                color: done || current ? '#FFFFFF' : 'var(--apple-secondary)',
                boxShadow: current ? '0 0 0 4px rgba(0, 113, 227, 0.15)' : 'none',
                transition: 'all 0.2s ease',
              }}>
                {done ? <Check size={13} strokeWidth={3} /> : idx + 1}
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: current ? 700 : 500,
                color: current ? 'var(--apple-label)' : done ? '#248A3D' : 'var(--apple-tertiary)',
                marginTop: 6,
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}>
                {stage}
              </span>
            </div>

            {/* Connector Line */}
            {idx < STAGES.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 3,
                  margin: '-18px 4px 0',
                  background: done ? '#34C759' : '#E5E5EA',
                  borderRadius: 980,
                  transition: 'background 0.3s ease',
                  zIndex: 1
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
