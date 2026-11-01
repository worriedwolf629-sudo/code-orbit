import React, { useRef, useEffect } from 'react';
import { X, Download, Upload, RotateCcw } from 'lucide-react';

export default function BackupModal({
  onClose,
  subjects,
  snippets,
  onImportData,
  onResetToDefaults,
  onShowToast
}) {
  const fileInputRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleExport = () => {
    const data = {
      app: 'CodeOrbit',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      subjects,
      snippets
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codeorbit_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onShowToast('Vault backup downloaded');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (Array.isArray(json.subjects) && Array.isArray(json.snippets)) {
          onImportData(json.subjects, json.snippets);
          onShowToast('Vault restored');
          onClose();
        } else {
          alert('Invalid backup file. Missing subjects or snippets.');
        }
      } catch (err) {
        alert('Failed to parse backup JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
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
          maxWidth: '480px',
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
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em'
              }}
            >
              Vault Backup & Sync
            </h3>
            <p
              style={{
                margin: '2px 0 0 0',
                fontSize: '12px',
                color: 'var(--text-dim)'
              }}
            >
              Export, import, or reset your code vault
            </p>
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

        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Export */}
          <div
            style={{
              padding: '12px 14px',
              background: 'var(--bg-base)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-m)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Export Vault JSON
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                {subjects.length} subjects · {snippets.length} snippets
              </div>
            </div>
            <button
              onClick={handleExport}
              style={{
                background: 'var(--bg-raised)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-s)',
                padding: '6px 12px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Download size={13} />
              <span>Export</span>
            </button>
          </div>

          {/* Import */}
          <div
            style={{
              padding: '12px 14px',
              background: 'var(--bg-base)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-m)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Import Backup
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                Restore snippets from a JSON file
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: 'var(--bg-raised)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-s)',
                padding: '6px 12px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Upload size={13} />
              <span>Import</span>
            </button>
          </div>

          {/* Reset */}
          <div
            style={{
              padding: '12px 14px',
              background: 'var(--bg-base)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-m)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Reset Samples
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                Restore default DSA, OOPs & Java snippets
              </div>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Reset all snippets to initial starter samples?')) {
                  onResetToDefaults();
                  onClose();
                }
              }}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-s)',
                padding: '6px 12px',
                color: 'var(--danger)',
                fontSize: '12px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
