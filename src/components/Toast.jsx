import React from 'react';
import { Check } from 'lucide-react';

export default function Toast({ message }) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--bg-raised)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-m)',
        padding: '8px 16px',
        color: 'var(--text-primary)',
        fontSize: '13px',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 200,
        animation: 'toastIn 0.15s ease forwards',
        pointerEvents: 'none',
        whiteSpace: 'nowrap'
      }}
    >
      <Check size={14} color="var(--accent)" />
      <span>{message}</span>
    </div>
  );
}
