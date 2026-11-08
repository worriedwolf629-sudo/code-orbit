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
  AlertCircle,
  AlertTriangle,
  Star,
  Eye,
  EyeOff,
  Clock,
  HardDrive,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { highlightCode, SUPPORTED_LANGUAGES } from '../utils/syntaxHighlight';
import { copyToClipboard } from '../utils/clipboard';
import { checkSnippetSize, validateOrRepairSnippet } from '../utils/schema';

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
  const [isCodeHidden, setIsCodeHidden] = useState(false);

  const [editTitle, setEditTitle] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editLanguage, setEditLanguage] = useState('java');
  const [editNotes, setEditNotes] = useState('');
  const [editSerial, setEditSerial] = useState(1);
  const [editTags, setEditTags] = useState('');
  const [editTimeComplexity, setEditTimeComplexity] = useState('');
  const [editSpaceComplexity, setEditSpaceComplexity] = useState('');
  const [editCommonMistake, setEditCommonMistake] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (snippet) {
      setEditTitle(snippet.title || '');
      setEditCode(snippet.code || '');
      setEditLanguage(snippet.language || 'java');
      setEditNotes(snippet.notes || '');
      setEditSerial(snippet.serialNumber || 1);
      setEditTags(Array.isArray(snippet.tags) ? snippet.tags.join(', ') : '');
      setEditTimeComplexity(snippet.time_complexity || '');
      setEditSpaceComplexity(snippet.space_complexity || '');
      setEditCommonMistake(snippet.common_mistake || '');
      setIsEditing(false);
      setShowDeleteConfirm(false);
      setIsCodeHidden(false);
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

  const editSizeCheck = checkSnippetSize(editCode);

  const handleCopy = async () => {
    const textToCopy = isEditing ? editCode : (snippet.code || '');
    const res = await copyToClipboard(textToCopy);
    if (res.success) {
      setCopied(true);
      onShowToast('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } else {
      onShowToast('Copy failed, select manually');
    }
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

    if (!editSizeCheck.ok) {
      if (!window.confirm(`${editSizeCheck.warning}\n\nSave anyway?`)) {
        return;
      }
    }

    const parsedTags = editTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const updatedRaw = {
      ...snippet,
      title: editTitle.trim(),
      code: editCode,
      language: editLanguage,
      notes: editNotes.trim(),
      serialNumber: parseInt(editSerial, 10) || snippet.serialNumber,
      tags: parsedTags,
      time_complexity: editTimeComplexity.trim(),
      space_complexity: editSpaceComplexity.trim(),
      common_mistake: editCommonMistake.trim(),
      updated_at: new Date().toISOString()
    };

    const validated = validateOrRepairSnippet(updatedRaw, snippet.subjectId);
    onUpdateSnippet(validated);
    setIsEditing(false);
    onShowToast('Updated');
  };

  const handleToggleStar = () => {
    const updated = {
      ...snippet,
      is_starred: !snippet.is_starred,
      updated_at: new Date().toISOString()
    };
    onUpdateSnippet(updated);
    onShowToast(updated.is_starred ? 'Added to Exam List ⭐' : 'Removed from Exam List');
  };

  const handleRecallResult = (result) => {
    const isKnew = result === 'knew';
    const updated = {
      ...snippet,
      recall_score: isKnew ? 'knew' : 'missed',
      review_count: isKnew ? (snippet.review_count || 0) + 1 : (snippet.review_count || 0),
      missed_count: !isKnew ? (snippet.missed_count || 0) + 1 : (snippet.missed_count || 0),
      last_reviewed: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    onUpdateSnippet(updated);
    onShowToast(isKnew ? 'Great job! Marked as Known ✅' : 'Marked for Practice 🚨');
  };

  const formatLastReviewed = (iso) => {
    if (!iso) return 'Not reviewed yet';
    try {
      const diffMs = Date.now() - new Date(iso).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const handleDownloadFile = () => {
    const extMap = {
      java: 'java', cpp: 'cpp', c: 'c', python: 'py',
      javascript: 'js', sql: 'sql', plaintext: 'txt'
    };
    const ext = extMap[snippet.language] || 'txt';
    const safeName = (snippet.title || 'snippet').toLowerCase().replace(/[^a-z0-9]/gi, '_') || 'snippet';
    const filename = `${safeName}.${ext}`;

    const blob = new Blob([snippet.code || ''], { type: 'text/plain;charset=utf-8' });
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

  const codeHtml = highlightCode(snippet.code || '', snippet.language || 'java');
  const codeLines = (snippet.code || '').split('\n');

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
              onClick={handleToggleStar}
              title={snippet.is_starred ? 'Remove from Exam List' : 'Add to Exam List'}
              aria-label="Star snippet"
              style={{
                background: snippet.is_starred ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                border: snippet.is_starred ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border)',
                borderRadius: 'var(--radius-s)',
                width: '30px', height: '30px',
                color: snippet.is_starred ? '#f59e0b' : 'var(--text-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <Star size={14} fill={snippet.is_starred ? '#f59e0b' : 'none'} />
            </button>

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
                {editSizeCheck.warning && (
                  <div
                    style={{
                      marginTop: '6px',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-s)',
                      background: editSizeCheck.ok ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      border: `1px solid ${editSizeCheck.ok ? '#f59e0b' : 'var(--danger)'}`,
                      color: editSizeCheck.ok ? '#f59e0b' : 'var(--danger)',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <AlertTriangle size={13} />
                    <span>{editSizeCheck.warning}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 180px' }}>
                  <label style={labelStyle}>Time Complexity</label>
                  <input
                    type="text"
                    value={editTimeComplexity}
                    onChange={(e) => setEditTimeComplexity(e.target.value)}
                    placeholder="e.g. O(log N)"
                    style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
                  />
                </div>
                <div style={{ flex: '1 1 180px' }}>
                  <label style={labelStyle}>Space Complexity</label>
                  <input
                    type="text"
                    value={editSpaceComplexity}
                    onChange={(e) => setEditSpaceComplexity(e.target.value)}
                    placeholder="e.g. O(1)"
                    style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="e.g. Binary Search, Arrays, Two Pointers"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Common Exam Mistake / Trap (optional)</label>
                <textarea
                  rows={2}
                  value={editCommonMistake}
                  onChange={(e) => setEditCommonMistake(e.target.value)}
                  placeholder="e.g. Integer overflow on (low+high)/2; use low + (high-low)/2 instead."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={labelStyle}>Notes / Revision Key Points</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Key takeaways, base cases, logic summary..."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            </div>
          ) : (
            <>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  {snippet.time_complexity && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        color: '#38bdf8',
                        background: 'rgba(56, 189, 248, 0.1)',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Clock size={11} /> {snippet.time_complexity}
                    </span>
                  )}

                  {snippet.space_complexity && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        color: '#a78bfa',
                        background: 'rgba(167, 139, 250, 0.1)',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <HardDrive size={11} /> {snippet.space_complexity}
                    </span>
                  )}

                  {Array.isArray(snippet.tags) && snippet.tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-dim)',
                        background: 'var(--bg-raised)',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}
                    >
                      #{t}
                    </span>
                  ))}
                </div>

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
                    gap: '6px',
                    marginBottom: '10px'
                  }}>
                    <BookOpen size={14} style={{ marginTop: '2px', flexShrink: 0, color: 'var(--text-dim)' }} />
                    <span>{snippet.notes}</span>
                  </div>
                )}
              </div>

              {/* Code block with Active Recall hide-code toggle */}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>
                      {codeLines.length} lines
                    </span>
                    <button
                      onClick={() => setIsCodeHidden(!isCodeHidden)}
                      title={isCodeHidden ? 'Reveal code' : 'Hide code for active recall'}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: isCodeHidden ? 'rgba(45, 212, 191, 0.15)' : 'transparent',
                        border: '1px solid var(--border)',
                        color: isCodeHidden ? 'var(--accent)' : 'var(--text-dim)',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-s)',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      {isCodeHidden ? <Eye size={12} /> : <EyeOff size={12} />}
                      <span>{isCodeHidden ? 'Reveal Code' : 'Hide Code'}</span>
                    </button>
                  </div>

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

                {/* Code or Masked Recall Screen */}
                {isCodeHidden ? (
                  <div
                    style={{
                      padding: '40px 20px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px',
                      background: 'var(--bg-base)'
                    }}
                  >
                    <EyeOff size={32} style={{ color: 'var(--accent)', opacity: 0.8 }} />
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Active Recall Mode Active
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-dim)', maxWidth: '340px' }}>
                        Try to recall the implementation, edge cases, and time complexity before checking the code.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsCodeHidden(false)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-m)',
                        background: 'var(--accent)',
                        color: '#111113',
                        border: 'none',
                        fontWeight: 600,
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        marginTop: '4px'
                      }}
                    >
                      <Eye size={14} /> Reveal Code
                    </button>
                  </div>
                ) : (
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
                )}
              </div>

              {/* Common Exam Mistake Trap Box */}
              {snippet.common_mistake && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-m)',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}
                >
                  <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '13px', color: '#fca5a5', lineHeight: 1.45 }}>
                    <strong style={{ color: '#ef4444' }}>Common Exam Trap: </strong>
                    {snippet.common_mistake}
                  </div>
                </div>
              )}

              {/* Active Recall Scoring Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                  padding: '10px 14px',
                  background: 'var(--bg-raised)',
                  borderRadius: 'var(--radius-m)',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                  <span>Last reviewed: <strong style={{ color: 'var(--text-body)' }}>{formatLastReviewed(snippet.last_reviewed)}</strong></span>
                  {(snippet.review_count > 0 || snippet.missed_count > 0) && (
                    <span style={{ marginLeft: '8px' }}>
                      (Knew: <strong style={{ color: '#4ade80' }}>{snippet.review_count || 0}</strong> • Missed: <strong style={{ color: '#f87171' }}>{snippet.missed_count || 0}</strong>)
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleRecallResult('knew')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-s)',
                      background: snippet.recall_score === 'knew' ? '#22c55e' : 'rgba(34, 197, 94, 0.15)',
                      color: snippet.recall_score === 'knew' ? '#111113' : '#4ade80',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    <CheckCircle2 size={14} /> I knew it
                  </button>

                  <button
                    onClick={() => handleRecallResult('missed')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-s)',
                      background: snippet.recall_score === 'missed' ? '#ef4444' : 'rgba(239, 68, 68, 0.15)',
                      color: snippet.recall_score === 'missed' ? '#ffffff' : '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    <XCircle size={14} /> Missed it
                  </button>
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
