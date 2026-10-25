import React, { useState } from 'react';
import { X, Smartphone, Copy, Check, Wifi, Globe } from 'lucide-react';

export default function PhoneConnectModal({ onClose, onShowToast }) {
  const [copied, setCopied] = useState(false);

  // Detect current hostname/port or use standard local network address
  const currentHost = window.location.hostname || 'localhost';
  const currentPort = window.location.port || '5173';
  const networkUrl = `http://${currentHost === 'localhost' ? '10.137.92.135' : currentHost}:${currentPort}/`;

  // QR Code generated via free public high-speed API with offline fallback
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(networkUrl)}&bgcolor=0c1220&color=38bdf8&margin=10`;

  const handleCopy = () => {
    navigator.clipboard.writeText(networkUrl);
    setCopied(true);
    onShowToast('Phone link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 8, 15, 0.85)',
        backdropFilter: 'blur(16px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px'
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#0c1220',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
          textAlign: 'center'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.6)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Smartphone size={18} />
            </div>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#ffffff', fontWeight: 700 }}>
              Use on Your Phone
            </h3>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              color: '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          {/* QR Code Container */}
          <div
            style={{
              padding: '12px',
              background: '#070a12',
              borderRadius: '18px',
              border: '1.5px solid rgba(56, 189, 248, 0.3)',
              boxShadow: '0 0 30px rgba(56, 189, 248, 0.15)',
              display: 'inline-block'
            }}
          >
            <img
              src={qrUrl}
              alt="Scan to open on phone"
              width={180}
              height={180}
              style={{ display: 'block', borderRadius: '10px' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>

          <div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#f8fafc', fontWeight: 600 }}>
              Scan QR or Open URL
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: 1.4, maxWidth: '300px' }}>
              Ensure your phone is connected to the same Wi-Fi, then scan with your phone's camera.
            </p>
          </div>

          {/* URL Box */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              padding: '10px 14px',
              gap: '10px'
            }}
          >
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '13px',
                color: '#38bdf8',
                wordBreak: 'break-all',
                textAlign: 'left'
              }}
            >
              {networkUrl}
            </span>

            <button
              onClick={handleCopy}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                border: copied ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.15)',
                color: copied ? '#10b981' : '#f8fafc',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Quick tip for home screen */}
          <div
            style={{
              fontSize: '12px',
              color: '#64748b',
              lineHeight: 1.4,
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '10px',
              padding: '10px 14px',
              width: '100%'
            }}
          >
            💡 <strong>Pro-Tip:</strong> On your phone's browser, tap <strong>Share → Add to Home Screen</strong> to run CodeOrbit as a fullscreen native app!
          </div>
        </div>
      </div>
    </div>
  );
}
