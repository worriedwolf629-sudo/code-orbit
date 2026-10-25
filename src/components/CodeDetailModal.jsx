import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Edit3,
  Trash2,
  Download,
  Share2,
  Maximize2,
  Minimize2,
  Save,
  Code2,
  BookOpen,
  Hash,
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

  // Form states for in-place editing
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

  if (!snippet) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(isEditing ? editCode : snippet.code);
    setCopied(true);
    onShowToast('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!editTitle.trim()) {
      onShowToast('Please provide a title heading');
      return;
    }
    if (!editCode.trim()) {
      onShowToast('Please paste or write some code');
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
    onShowToast('Code snippet updated successfully!');
  };

  const handleDownloadFile = () => {
    const extMap = {
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      python: 'py',
      javascript: 'js',
      sql: 'sql',
      plaintext: 'txt'
    };
    const ext = extMap[snippet.language] || 'txt';
    const safeName = snippet.title.toLowerCase().replace(/[^a-z0-9]/gi, '_') || 'code_snippet';
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

    onShowToast(`Downloaded ${filename}!`);
  };

  const codeHtml = highlightCode(snippet.code, snippet.language);
  const codeLines = snippet.code.split('\n');

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
          maxWidth: isFullscreen ? '100%' : '760px',
          height: isFullscreen ? '100%' : 'calc(100vh - 40px)',
          maxHeight: isFullscreen ? '100vh' : '880px',
          backgroundColor: '#0c1220',
          borderRadius: isFullscreen ? '0' : '24px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            background: 'rgba(15, 23, 42, 0.6)'
          }}
        >
          {/* Left: Serial & Subject Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '12px',
                fontWeight: 700,
                color: subject?.color || '#38bdf8',
                background: `${subject?.color || '#38bdf8'}18`,
                padding: '4px 10px',
                borderRadius: '8px',
                border: `1px solid ${subject?.color || '#38bdf8'}44`,
                whiteSpace: 'nowrap'
              }}
            >
              #{snippet.serialNumber}
            </span>

            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#e2e8f0',
                background: 'rgba(255, 255, 255, 0.07)',
                padding: '4px 10px',
                borderRadius: '8px',
                whiteSpace: 'nowrap'
              }}
            >
              {subject?.name}
            </span>

            {!isEditing && (
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#10b981',
                  background: 'rgba(16, 185, 129, 0.15)',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  textTransform: 'uppercase',
                  fontFamily: '"JetBrains Mono", monospace'
                }}
              >
                {snippet.language}
              </span>
            )}
          </div>

          {/* Right Header Action Icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              aria-label="Toggle Fullscreen"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                width: '36px',
                height: '36px',
                color: '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            <button
              onClick={onClose}
              title="Close"
              aria-label="Close code page"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                width: '36px',
                height: '36px',
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
        </div>

        {/* Modal Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}
        >
          {isEditing ? (
            /* --- EDIT MODE: Full Access to Modify Heading, Language, Serial, Notes & Code --- */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 240px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#94a3b8',
                      marginBottom: '6px'
                    }}
                  >
                    Heading / Title Name *
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="e.g., Binary Search Algorithm"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      color: '#f8fafc',
                      fontSize: '15px',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ width: '130px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#94a3b8',
                      marginBottom: '6px'
                    }}
                  >
                    Language
                  </label>
                  <select
                    value={editLanguage}
                    onChange={(e) => setEditLanguage(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      color: '#f8fafc',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.id} value={l.id} style={{ background: '#0f172a' }}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ width: '90px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#94a3b8',
                      marginBottom: '6px'
                    }}
                  >
                    Serial #
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editSerial}
                    onChange={(e) => setEditSerial(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      color: '#f8fafc',
                      fontSize: '14px',
                      fontFamily: '"JetBrains Mono", monospace',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#94a3b8',
                    marginBottom: '6px'
                  }}
                >
                  Code (Paste or edit your code below) *
                </label>
                <textarea
                  rows={14}
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  placeholder="Paste your source code here..."
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: '#070a12',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    color: '#e2e8f0',
                    fontSize: '13px',
                    fontFamily: '"JetBrains Mono", monospace',
                    lineHeight: 1.5,
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#94a3b8',
                    marginBottom: '6px'
                  }}
                >
                  Notes & Key Takeaways (Optional)
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="e.g., Time complexity O(N), edge cases to remember..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '10px',
                    color: '#cbd5e1',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          ) : (
            /* --- VIEW MODE: Pristine Syntax-Highlighted Code & Notes --- */
            <>
              {/* Title & Notes Header */}
              <div>
                <h2
                  style={{
                    margin: '0 0 8px 0',
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#ffffff',
                    lineHeight: 1.3
                  }}
                >
                  {snippet.title}
                </h2>

                {snippet.notes && (
                  <div
                    style={{
                      background: 'rgba(168, 85, 247, 0.08)',
                      border: '1px solid rgba(168, 85, 247, 0.25)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      fontSize: '13px',
                      color: '#d8b4fe',
                      lineHeight: 1.45,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px'
                    }}
                  >
                    <BookOpen size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span>{snippet.notes}</span>
                  </div>
                )}
              </div>

              {/* Code Container with Line Numbers & Copy action */}
              <div
                style={{
                  position: 'relative',
                  backgroundColor: '#070a12',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.09)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Code Top Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 14px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    fontSize: '12px',
                    color: '#94a3b8'
                  }}
                >
                  <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    {codeLines.length} lines • {snippet.language}
                  </span>

                  <button
                    onClick={handleCopy}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                      border: copied ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: copied ? '#10b981' : '#f8fafc',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>

                {/* Highlighted Code Area with Line Numbers */}
                <div
                  style={{
                    display: 'flex',
                    maxHeight: isFullscreen ? 'calc(100vh - 220px)' : '420px',
                    overflowY: 'auto',
                    overflowX: 'auto',
                    padding: '12px 0'
                  }}
                >
                  {/* Line Numbers Column */}
                  <div
                    style={{
                      padding: '0 12px 0 16px',
                      userSelect: 'none',
                      textAlign: 'right',
                      color: '#475569',
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: '12.5px',
                      lineHeight: '20px',
                      borderRight: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    {codeLines.map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>

                  {/* Code Text Content */}
                  <pre
                    style={{
                      margin: 0,
                      padding: '0 16px',
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: '12.5px',
                      lineHeight: '20px',
                      color: '#f8fafc',
                      flex: 1
                    }}
                  >
                    <code dangerouslySetInnerHTML={{ __html: codeHtml }} />
                  </pre>
                </div>
              </div>
            </>
          )}

          {/* Delete Confirmation Box */}
          {showDeleteConfirm && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fca5a5', fontSize: '13px' }}>
                <AlertCircle size={18} />
                <span>Delete this code snippet permanently?</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDeleteSnippet(snippet.id);
                    onClose();
                    onShowToast('Snippet deleted');
                  }}
                  style={{
                    padding: '6px 14px',
                    background: '#ef4444',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.7)',
            gap: '10px',
            flexWrap: 'wrap'
          }}
        >
          {isEditing ? (
            <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsEditing(false)}
                style={{
                  padding: '10px 18px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: '#cbd5e1',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: '10px 20px',
                  background: `linear-gradient(135deg, ${subject?.color || '#38bdf8'}, #6366f1)`,
                  border: 'none',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)'
                }}
              >
                <Save size={16} />
                Save Changes
              </button>
            </div>
          ) : (
            <>
              {/* Left Actions: Download & Delete */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleDownloadFile}
                  title="Download Code File"
                  style={{
                    padding: '8px 14px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#94a3b8',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Download size={14} />
                  <span className="hide-on-small-mobile">Export File</span>
                </button>

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  title="Delete Snippet"
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '10px',
                    color: '#f87171',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={14} />
                  <span className="hide-on-small-mobile">Delete</span>
                </button>
              </div>

              {/* Right Actions: Edit & Copy */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: '9px 16px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Edit3 size={15} />
                  Edit Code
                </button>

                <button
                  onClick={handleCopy}
                  style={{
                    padding: '9px 18px',
                    background: `linear-gradient(135deg, ${subject?.color || '#38bdf8'}, #6366f1)`,
                    border: 'none',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
