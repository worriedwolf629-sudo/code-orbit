import React, { useRef, useState, useEffect } from 'react';
import { X, Download, Upload, RotateCcw, Clock, Check, FileText, Printer } from 'lucide-react';
import {
  parseBackupPreview,
  applyRestore,
  getRollingSnapshots,
  createRollingSnapshot
} from '../utils/backupService';
import { downloadSubjectMarkdown, openPrintRevisionSheet } from '../utils/exportService';

export default function BackupModal({
  onClose,
  subjects,
  snippets,
  onImportData,
  onResetToDefaults,
  onShowToast
}) {
  const fileInputRef = useRef(null);
  const [previewData, setPreviewData] = useState(null);
  const [rollingSnapshots, setRollingSnapshots] = useState([]);
  const [activeTab, setActiveTab] = useState('manage'); // 'manage' | 'snapshots'
  const [exportSubjectId, setExportSubjectId] = useState(subjects[0]?.id || '');

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    getRollingSnapshots().then(setRollingSnapshots);
  }, []);

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
      const preview = parseBackupPreview(event.target.result);
      if (preview.ok) {
        setPreviewData(preview);
      } else {
        alert(preview.error);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmRestore = async (mode = 'replace') => {
    if (!previewData) return;
    try {
      await applyRestore(previewData.repairedSubjects, previewData.repairedSnippets, mode);
      await onImportData(previewData.repairedSubjects, previewData.repairedSnippets);
      onShowToast(`Restored ${previewData.snippetCount} snippets!`);
      setPreviewData(null);
      onClose();
    } catch (err) {
      alert(`Restore failed: ${err.message}`);
    }
  };

  const handleRestoreSnapshot = async (snap) => {
    if (window.confirm(`Restore automatic snapshot from ${new Date(snap.timestamp).toLocaleString()}?`)) {
      try {
        const preview = parseBackupPreview(JSON.stringify(snap.data));
        if (preview.ok) {
          await applyRestore(preview.repairedSubjects, preview.repairedSnippets, 'replace');
          await onImportData(preview.repairedSubjects, preview.repairedSnippets);
          onShowToast('Restored automatic snapshot!');
          onClose();
        }
      } catch (err) {
        alert(`Failed to restore snapshot: ${err.message}`);
      }
    }
  };

  const handleTakeManualSnapshot = async () => {
    const snap = await createRollingSnapshot('Manual snapshot');
    if (snap) {
      const updated = await getRollingSnapshots();
      setRollingSnapshots(updated);
      onShowToast('Snapshot saved locally');
    }
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
          maxWidth: '520px',
          maxHeight: 'calc(100vh - 40px)',
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
              Vault Backup & Snapshots
            </h3>
            <p
              style={{
                margin: '2px 0 0 0',
                fontSize: '12px',
                color: 'var(--text-dim)'
              }}
            >
              Export, restore, or rollback to rolling snapshots
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

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            padding: '4px 18px',
            background: 'var(--bg-base)',
            gap: '8px'
          }}
        >
          <button
            onClick={() => { setActiveTab('manage'); setPreviewData(null); }}
            style={{
              padding: '6px 12px',
              fontSize: '12.5px',
              fontWeight: 500,
              background: activeTab === 'manage' ? 'var(--bg-raised)' : 'transparent',
              color: activeTab === 'manage' ? 'var(--text-primary)' : 'var(--text-dim)',
              borderRadius: 'var(--radius-s)',
              border: 'none'
            }}
          >
            Backup & Restore
          </button>
          <button
            onClick={() => setActiveTab('snapshots')}
            style={{
              padding: '6px 12px',
              fontSize: '12.5px',
              fontWeight: 500,
              background: activeTab === 'snapshots' ? 'var(--bg-raised)' : 'transparent',
              color: activeTab === 'snapshots' ? 'var(--text-primary)' : 'var(--text-dim)',
              borderRadius: 'var(--radius-s)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Clock size={13} />
            <span>Rolling Snapshots ({rollingSnapshots.length})</span>
          </button>
        </div>

        <div style={{ padding: '18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {activeTab === 'manage' ? (
            previewData ? (
              /* RESTORE PREVIEW SCREEN */
              <div
                style={{
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-m)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontWeight: 600, fontSize: '14px' }}>
                  <Check size={16} />
                  <span>Backup File Validated</span>
                </div>

                <div style={{ fontSize: '12.5px', color: 'var(--text-body)', lineHeight: '1.6' }}>
                  <div><strong>Exported:</strong> {new Date(previewData.exportedAt).toLocaleString()}</div>
                  <div><strong>Subjects:</strong> {previewData.subjectCount} subjects</div>
                  <div><strong>Snippets:</strong> {previewData.snippetCount} code snippets</div>
                </div>

                {previewData.sampleTitles.length > 0 && (
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Preview snippets:
                    </span>
                    <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '12px', color: 'var(--text-dim)' }}>
                      {previewData.sampleTitles.map((title, i) => (
                        <li key={i}>{title}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                  <button
                    onClick={() => setPreviewData(null)}
                    style={{
                      flex: 1,
                      minHeight: '44px',
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-s)',
                      padding: '8px 12px',
                      color: 'var(--text-body)',
                      fontSize: '12.5px'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleConfirmRestore('replace')}
                    style={{
                      flex: 1,
                      minHeight: '44px',
                      background: 'var(--accent)',
                      border: 'none',
                      borderRadius: 'var(--radius-s)',
                      padding: '8px 12px',
                      color: '#000000',
                      fontSize: '12.5px',
                      fontWeight: 600
                    }}
                  >
                    Confirm Restore
                  </button>
                </div>
              </div>
            ) : (
              /* STANDARD BACKUP OPTIONS */
              <>
                {/* Export */}
                <div
                  style={{
                    padding: '12px 14px',
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-m)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
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
                      minHeight: '44px',
                      background: 'var(--bg-raised)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-s)',
                      padding: '6px 14px',
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
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Import Backup (with Preview)
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                      Validate schema and preview before applying
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
                      minHeight: '44px',
                      background: 'var(--bg-raised)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-s)',
                      padding: '6px 14px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Upload size={13} />
                    <span>Choose File</span>
                  </button>
                </div>

                {/* Markdown Notes & Printable Exam Cheat Sheet */}
                <div
                  style={{
                    padding: '14px',
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-m)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Markdown Export & Printable Exam Sheet
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                      Export revision notes per subject for Obsidian/Notion, or print an A4 cheat sheet
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select
                      value={exportSubjectId || (subjects[0]?.id || '')}
                      onChange={(e) => setExportSubjectId(e.target.value)}
                      style={{
                        flex: '1 1 180px',
                        padding: '8px 10px',
                        background: 'var(--bg-raised)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-s)',
                        color: 'var(--text-primary)',
                        fontSize: '12px'
                      }}
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({snippets.filter((snip) => snip.subjectId === s.id).length} snippets)
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => {
                        const targetSub = subjects.find((s) => s.id === (exportSubjectId || subjects[0]?.id)) || subjects[0];
                        const subSnippets = snippets.filter((s) => s.subjectId === targetSub.id);
                        const filename = downloadSubjectMarkdown(targetSub, subSnippets);
                        onShowToast(`Exported ${filename}`);
                      }}
                      style={{
                        minHeight: '38px',
                        background: 'var(--bg-raised)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-s)',
                        padding: '6px 12px',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <FileText size={13} />
                      <span>Download .md</span>
                    </button>

                    <button
                      onClick={() => {
                        const targetSub = subjects.find((s) => s.id === (exportSubjectId || subjects[0]?.id)) || subjects[0];
                        const subSnippets = snippets.filter((s) => s.subjectId === targetSub.id);
                        openPrintRevisionSheet(targetSub, subSnippets);
                        onShowToast('Revision sheet opened for printing');
                      }}
                      style={{
                        minHeight: '38px',
                        background: 'var(--accent)',
                        border: 'none',
                        borderRadius: 'var(--radius-s)',
                        padding: '6px 12px',
                        color: '#111113',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <Printer size={13} />
                      <span>Print Sheet</span>
                    </button>
                  </div>
                </div>

                {/* Reset to Samples */}
                <div
                  style={{
                    padding: '12px 14px',
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-m)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Reset Starter Samples
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                      Restore initial DSA, OOPs & Java snippets
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
                      minHeight: '44px',
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-s)',
                      padding: '6px 14px',
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
              </>
            )
          ) : (
            /* ROLLING SNAPSHOTS TAB */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                  Auto-saved every 5 changes in local IndexedDB
                </span>
                <button
                  onClick={handleTakeManualSnapshot}
                  style={{
                    background: 'var(--bg-raised)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-s)',
                    padding: '4px 10px',
                    fontSize: '11px',
                    color: 'var(--text-primary)'
                  }}
                >
                  + Snapshot Now
                </button>
              </div>

              {rollingSnapshots.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '12px' }}>
                  No rolling snapshots yet. They will appear here automatically as you create or edit snippets.
                </div>
              ) : (
                rollingSnapshots.map((snap) => (
                  <div
                    key={snap.id}
                    style={{
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-m)',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} — {new Date(snap.timestamp).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        {snap.note || 'Snapshot'} · {snap.subjectCount} subjects · {snap.snippetCount} snippets
                      </div>
                    </div>

                    <button
                      onClick={() => handleRestoreSnapshot(snap)}
                      style={{
                        minHeight: '36px',
                        background: 'var(--bg-raised)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-s)',
                        padding: '4px 10px',
                        fontSize: '11.5px',
                        color: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <RotateCcw size={12} />
                      <span>Rollback</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
