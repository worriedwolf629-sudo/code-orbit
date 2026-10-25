import React, { useRef } from 'react';
import { X, Download, Upload, RotateCcw, ShieldCheck, FileJson } from 'lucide-react';

export default function BackupModal({
  onClose,
  subjects,
  snippets,
  onImportData,
  onResetToDefaults,
  onShowToast
}) {
  const fileInputRef = useRef(null);

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

    onShowToast('Vault backup downloaded!');
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
          onShowToast('Vault restored successfully!');
          onClose();
        } else {
          alert('Invalid backup file format. Expected subjects and snippets arrays.');
        }
      } catch (err) {
        alert('Failed to parse backup JSON file: ' + err.message);
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
          maxWidth: '480px',
          backgroundColor: '#0c1220',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden'
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FileJson size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '17px', color: '#ffffff', fontWeight: 700 }}>
              Backup & Sync Vault
            </h3>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              width: '34px',
              height: '34px',
              color: '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
            Export your subjects and code snippets to take them anywhere, backup your notes, or transfer them to another phone or computer.
          </p>

          {/* Export Button */}
          <button
            onClick={handleExport}
            style={{
              padding: '14px 18px',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '14px',
              color: '#38bdf8',
              fontWeight: 600,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Download size={18} />
              <div style={{ textAlign: 'left' }}>
                <div>Export Backup JSON</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{subjects.length} subjects • {snippets.length} snippets</div>
              </div>
            </div>
            <span>Download</span>
          </button>

          {/* Import Button */}
          <button
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            style={{
              padding: '14px 18px',
              background: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '14px',
              color: '#c084fc',
              fontWeight: 600,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Upload size={18} />
              <div style={{ textAlign: 'left' }}>
                <div>Import Backup JSON</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Restore from another device</div>
              </div>
            </div>
            <span>Select File</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            style={{ display: 'none' }}
          />

          {/* Reset to Default Starter Data */}
          <button
            onClick={() => {
              if (confirm('Reset all subjects & code snippets to default DSA, OOPs & Java samples?')) {
                onResetToDefaults();
                onShowToast('Reset to default samples!');
                onClose();
              }
            }}
            style={{
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              color: '#94a3b8',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={15} />
            <span>Reset to Default Samples</span>
          </button>
        </div>
      </div>
    </div>
  );
}
