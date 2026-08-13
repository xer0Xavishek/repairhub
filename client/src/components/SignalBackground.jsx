import React from 'react';

// Apple subtle ambient canvas gradient
export default function SignalBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        background: 'radial-gradient(circle at 50% 0%, rgba(0, 113, 227, 0.03) 0%, transparent 60%), radial-gradient(circle at 100% 100%, rgba(175, 82, 222, 0.02) 0%, transparent 50%)',
      }}
    />
  );
}
