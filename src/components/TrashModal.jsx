import React, { useState, useEffect } from 'react';
import { X, Trash2, RotateCcw } from 'lucide-react';
import { getTrashSnippets, restoreSnippet, permanentlyDeleteSnippet } from '../utils/db';

export default function TrashModal({ onClose, subjects, onSnippetRestored, onShowToast }) {
  const [trashList, setTrashList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const loadTrash = async () => {
    setLoading(true);
    try {
      const items = await getTrashSnippets();
      setTrashList(items);
    } catch (err) {
      console.error('Failed to load trash:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrash();
  }, []);

  const handleRestore = async (snippet) => {
    try {
      await restoreSnippet(snippet.id);
      setTrashList((prev) => prev.filter((s) => s.id !== snippet.id));
      onSnippetRestored();
      onShowToast(`Restored "${snippet.title}"`);
    } catch (err) {
      alert(`Failed to restore: ${err.message}`);
    }
  };

  const handlePermanentDelete = async (snippet) => {
    if (window.confirm(`Permanently delete "${snippet.title}"? This cannot be undone.`)) {
      try {
        await permanentlyDeleteSnippet(snippet.id);
        setTrashList((prev) => prev.filter((s) => s.id !== snippet.id));
        onShowToast(`Permanently deleted "${snippet.title}"`);
      } catch (err) {
        alert(`Failed to delete: ${err.message}`);
      }
    }
  };

  const getSubjectName = (subId) => {
    const sub = subjects.find((s) => s.id === subId);
    return sub ? sub.name : 'Unknown';
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
          maxWidth: '560px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trash2 size={16} color="var(--danger)" />
            <h3
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em'
              }}
            >
              Trash ({trashList.length})
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

        {/* List Body */}
        <div style={{ padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px' }}>
              Loading trash...
            </div>
          ) : trashList.length === 0 ? (
            <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-dim)' }}>
              <Trash2 size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <p style={{ margin: 0, fontSize: '13px' }}>Trash is empty. Deleted snippets will appear here.</p>
            </div>
          ) : (
            trashList.map((snip) => (
              <div
                key={snip.id}
                style={{
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-m)',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {snip.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-dim)', marginTop: '3px' }}>
                    <span>{getSubjectName(snip.subjectId)}</span>
                    <span>·</span>
                    <span style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>{snip.language}</span>
                    <span>·</span>
                    <span>Deleted {snip.deleted_at ? new Date(snip.deleted_at).toLocaleDateString() : ''}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => handleRestore(snip)}
                    title="Restore snippet"
                    style={{
                      minHeight: '36px',
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
                    <RotateCcw size={13} color="var(--accent)" />
                    <span>Restore</span>
                  </button>

                  <button
                    onClick={() => handlePermanentDelete(snip)}
                    title="Delete permanently"
                    style={{
                      minHeight: '36px',
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-s)',
                      padding: '6px 10px',
                      color: 'var(--danger)',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
