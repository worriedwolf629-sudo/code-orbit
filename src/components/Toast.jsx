import React from 'react';
import { Sparkles, CheckCircle } from 'lucide-react';

export default function Toast({ message }) {
  if (!message) return null;

  return (
    <div
      className="toast-notification"
      style={{
        position: 'fixed',
        bottom: '88px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(56, 189, 248, 0.4)',
        borderRadius: '999px',
        padding: '10px 20px',
        color: '#f8fafc',
        fontSize: '13px',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(56, 189, 248, 0.2)',
        zIndex: 200,
        animation: 'slideUpToast 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: 'none',
        whiteSpace: 'nowrap'
      }}
    >
      <CheckCircle size={16} color="#38bdf8" />
      <span>{message}</span>
    </div>
  );
}
