import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Smartphone } from 'lucide-react';

export default function PhoneConnectModal({ onClose, onShowToast }) {
  const [copied, setCopied] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const currentHost = window.location.hostname || 'localhost';
  const currentPort = window.location.port || '5173';
  // Use host or fallback to standard local network IP
  const networkUrl = `http://${currentHost === 'localhost' ? '10.137.92.135' : currentHost}:${currentPort}/`;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(networkUrl)}&bgcolor=18181b&color=f4f4f5&margin=10`;

  const handleCopy = () => {
    navigator.clipboard.writeText(networkUrl);
    setCopied(true);
    onShowToast('Phone link copied');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-l)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-base)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Smartphone size={16} color="var(--accent)" />
            <h3
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em'
              }}
            >
              Open on Phone
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              color: 'var(--text-dim)',
              padding: '6px',
              borderRadius: 'var(--radius-s)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '16px'
          }}
        >
          {/* QR Code */}
          <div
            style={{
              background: 'var(--bg-base)',
              padding: '12px',
              borderRadius: 'var(--radius-m)',
              border: '1px solid var(--border)'
            }}
          >
            <img
              src={qrUrl}
              alt="Scan to open on phone"
              width="180"
              height="180"
              style={{ display: 'block', borderRadius: 'var(--radius-s)' }}
            />
          </div>

          {/* URL Box */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-base)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-m)',
              padding: '8px 12px',
              gap: '8px'
            }}
          >
            <span
              style={{
                flex: 1,
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--text-primary)',
                textAlign: 'left',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {networkUrl}
            </span>
            <button
              onClick={handleCopy}
              style={{
                background: copied ? 'var(--accent)' : 'var(--bg-raised)',
                color: copied ? '#000000' : 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-s)',
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Instructions */}
          <div
            style={{
              width: '100%',
              textAlign: 'left',
              fontSize: '12px',
              color: 'var(--text-body)',
              lineHeight: '1.6',
              background: 'var(--bg-base)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-m)',
              border: '1px solid var(--border)'
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              How real-time sync works:
            </div>
            <ol style={{ paddingLeft: '16px', margin: 0 }}>
              <li>Connect your phone to the same Wi-Fi network as this laptop.</li>
              <li>Scan the QR code or enter the URL into your phone's browser.</li>
              <li>Any snippet added or edited on either device updates instantly.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
