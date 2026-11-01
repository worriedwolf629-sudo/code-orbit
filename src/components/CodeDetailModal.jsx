import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Edit3,
  Trash2,
  Download,
  Maximize2,
  Minimize2,
  Save,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { highlightCode, SUPPORTED_LANGUAGES } from '../utils/syntaxHighlight';

export default function CodeDetailModal({
  snippet,
  subject,
  onClose,
  onUpdateSnippet,
  onDeleteSnippet,
  onShowToast
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [editTitle, setEditTitle] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editLanguage, setEditLanguage] = useState('java');
  const [editNotes, setEditNotes] = useState('');
  const [editSerial, setEditSerial] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (snippet) {
      setEditTitle(snippet.title || '');
      setEditCode(snippet.code || '');
      setEditLanguage(snippet.language || 'java');
      setEditNotes(snippet.notes || '');
      setEditSerial(snippet.serialNumber || 1);
      setIsEditing(false);
      setShowDeleteConfirm(false);
    }
  }, [snippet]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!snippet) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(isEditing ? editCode : snippet.code);
    setCopied(true);
    onShowToast('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!editTitle.trim()) {
      onShowToast('Title is required');
      return;
    }
    if (!editCode.trim()) {
      onShowToast('Code is required');
      return;
    }

    onUpdateSnippet({
      ...snippet,
      title: editTitle.trim(),
      code: editCode,
      language: editLanguage,
      notes: editNotes.trim(),
      serialNumber: parseInt(editSerial, 10) || snippet.serialNumber
    });

    setIsEditing(false);
    onShowToast('Updated');
  };

  const handleDownloadFile = () => {
    const extMap = {
      java: 'java', cpp: 'cpp', c: 'c', python: 'py',
      javascript: 'js', sql: 'sql', plaintext: 'txt'
    };
    const ext = extMap[snippet.language] || 'txt';
    const safeName = snippet.title.toLowerCase().replace(/[^a-z0-9]/gi, '_') || 'snippet';
    const filename = `${safeName}.${ext}`;

    const blob = new Blob([snippet.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast(`Downloaded ${filename}`);
  };

  const codeHtml = highlightCode(snippet.code, snippet.language);
  const codeLines = snippet.code.split('\n');

  const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    background: 'var(--bg-base)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-m)',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-dim)',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em'
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 100,
        display: 'flex',
        alignItems: isFullscreen ? 'stretch' : 'center',
        justifyContent: 'center',
        padding: isFullscreen ? '0' : '12px'
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: isFullscreen ? '100%' : '720px',
          height: isFullscreen ? '100%' : 'calc(100vh - 40px)',
          maxHeight: isFullscreen ? '100vh' : '800px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: isFullscreen ? '0' : 'var(--radius-l)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '10px 14px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 600,
              color: subject?.color || 'var(--accent)',
              background: `${subject?.color || 'var(--accent)'}14`,
              padding: '3px 8px',
              borderRadius: 'var(--radius-s)',
              whiteSpace: 'nowrap'
            }}>
              #{snippet.serialNumber}
            </span>

            <span style={{
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--text-body)',
              whiteSpace: 'nowrap'
            }}>
              {subject?.name}
            </span>

            {!isEditing && (
              <span style={{
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--text-dim)',
                background: 'var(--bg-raised)',
                padding: '2px 6px',
                borderRadius: '3px',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-mono)'
              }}>
                {snippet.language}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              aria-label="Toggle fullscreen"
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-s)',
                width: '30px', height: '30px',
                color: 'var(--text-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            <button
              onClick={onClose}
              title="Close"
              aria-label="Close"
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-s)',
                width: '30px', height: '30px',
                color: 'var(--text-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 220px' }}>
                  <label style={labelStyle}>Title</label>
                  <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Binary Search" style={{ ...inputStyle, fontWeight: 600 }} />
                </div>
                <div style={{ width: '120px' }}>
                  <label style={labelStyle}>Language</label>
                  <select value={editLanguage} onChange={(e) => setEditLanguage(e.target.value)}
                    style={inputStyle}>
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.id} value={l.id} style={{ background: 'var(--bg-base)' }}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ width: '80px' }}>
                  <label style={labelStyle}>Serial</label>
                  <input type="number" min="1" value={editSerial}
                    onChange={(e) => setEditSerial(e.target.value)}
                    style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Code</label>
                <textarea rows={14} value={editCode} onChange={(e) => setEditCode(e.target.value)}
                  placeholder="Paste code here"
                  style={{
                    ...inputStyle,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12.5px',
                    lineHeight: 1.5,
                    resize: 'vertical',
                    background: 'var(--code-bg)'
                  }} />
              </div>

              <div>
                <label style={labelStyle}>Notes (optional)</label>
                <input type="text" value={editNotes} onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Time complexity, key takeaways..."
                  style={{ ...inputStyle, fontSize: '13px' }} />
              </div>
            </div>
          ) : (
            <>
              <div>
                <h2 style={{
                  margin: '0 0 6px 0',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.3
                }}>
                  {snippet.title}
                </h2>

                {snippet.notes && (
                  <div style={{
                    background: 'var(--bg-raised)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-m)',
                    padding: '8px 12px',
                    fontSize: '13px',
                    color: 'var(--text-body)',
                    lineHeight: 1.45,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px'
                  }}>
                    <BookOpen size={14} style={{ marginTop: '2px', flexShrink: 0, color: 'var(--text-dim)' }} />
                    <span>{snippet.notes}</span>
                  </div>
                )}
              </div>

              {/* Code block */}
              <div style={{
                backgroundColor: 'var(--code-bg)',
                borderRadius: 'var(--radius-m)',
                border: '1px solid var(--border)',
                overflow: 'hidden'
              }}>
                {/* Code toolbar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 12px',
                  borderBottom: '1px solid var(--border)',
                  fontSize: '11px',
                  color: 'var(--text-dim)'
                }}>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    {codeLines.length} lines
                  </span>
                  <button
                    onClick={handleCopy}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: copied ? 'var(--accent-dim)' : 'transparent',
                      border: '1px solid var(--border)',
                      color: copied ? 'var(--accent)' : 'var(--text-body)',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-s)',
                      fontSize: '11px',
                      fontWeight: 500,
                      transition: 'all 0.12s ease'
                    }}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Code with line numbers */}
                <div style={{
                  display: 'flex',
                  maxHeight: isFullscreen ? 'calc(100vh - 200px)' : '380px',
                  overflowY: 'auto',
                  overflowX: 'auto',
                  padding: '10px 0'
                }}>
                  <div style={{
                    padding: '0 10px 0 12px',
                    userSelect: 'none',
                    textAlign: 'right',
                    color: 'var(--text-dim)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    lineHeight: '20px',
                    borderRight: '1px solid var(--border)'
                  }}>
                    {codeLines.map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>

                  <pre style={{
                    margin: 0,
                    padding: '0 14px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    lineHeight: '20px',
                    color: 'var(--text-primary)',
                    flex: 1
                  }}>
                    <code dangerouslySetInnerHTML={{ __html: codeHtml }} />
                  </pre>
                </div>
              </div>
            </>
          )}

          {/* Delete confirmation */}
          {showDeleteConfirm && (
            <div style={{
              background: 'var(--danger-dim)',
              border: '1px solid rgba(229, 83, 83, 0.25)',
              borderRadius: 'var(--radius-m)',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f08080', fontSize: '13px' }}>
                <AlertCircle size={16} />
                <span>Delete permanently?</span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    padding: '5px 10px',
                    background: 'var(--bg-raised)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-s)',
                    color: 'var(--text-body)',
                    fontSize: '12px'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDeleteSnippet(snippet.id);
                    onClose();
                    onShowToast('Deleted');
                  }}
                  style={{
                    padding: '5px 12px',
                    background: 'var(--danger)',
                    border: 'none',
                    borderRadius: 'var(--radius-s)',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{
          padding: '10px 14px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {isEditing ? (
            <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsEditing(false)}
                style={{
                  padding: '7px 14px',
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-m)',
                  color: 'var(--text-body)',
                  fontSize: '13px',
                  fontWeight: 500
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: '7px 16px',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: 'var(--radius-m)',
                  color: '#111113',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Save size={14} />
                Save
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={handleDownloadFile}
                  title="Download file"
                  style={{
                    padding: '6px 10px',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-s)',
                    color: 'var(--text-dim)',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Download size={13} />
                  <span className="hide-on-small-mobile">Export</span>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  title="Delete"
                  style={{
                    padding: '6px 10px',
                    background: 'var(--danger-dim)',
                    border: '1px solid rgba(229, 83, 83, 0.2)',
                    borderRadius: 'var(--radius-s)',
                    color: '#e55353',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Trash2 size={13} />
                  <span className="hide-on-small-mobile">Delete</span>
                </button>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: '7px 12px',
                    background: 'var(--bg-raised)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-m)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Edit3 size={13} />
                  Edit
                </button>
                <button
                  onClick={handleCopy}
                  style={{
                    padding: '7px 14px',
                    background: 'var(--accent)',
                    border: 'none',
                    borderRadius: 'var(--radius-m)',
                    color: '#111113',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
