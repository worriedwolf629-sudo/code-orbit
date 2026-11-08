import React, { useState, useEffect } from 'react';
import { X, Clipboard, Check, AlertTriangle } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../utils/syntaxHighlight';
import { checkSnippetSize, validateOrRepairSnippet } from '../utils/schema';

export default function NewSnippetModal({
  subjects,
  activeSubjectId,
  currentSnippetsCount,
  onClose,
  onCreateSnippet,
  onShowToast
}) {
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    activeSubjectId || (subjects[0] && subjects[0].id)
  );
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('java');
  const [notes, setNotes] = useState('');
  const [serialNumber, setSerialNumber] = useState(currentSnippetsCount + 1);
  const [tags, setTags] = useState('');
  const [timeComplexity, setTimeComplexity] = useState('');
  const [spaceComplexity, setSpaceComplexity] = useState('');
  const [commonMistake, setCommonMistake] = useState('');

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setCode(text);
        onShowToast('Pasted from clipboard');
      } else {
        onShowToast('Clipboard is empty');
      }
    } catch {
      onShowToast('Paste directly into the code box');
    }
  };

  const sizeCheck = checkSnippetSize(code);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      onShowToast('Please enter a heading/title');
      return;
    }

    if (!code.trim()) {
      onShowToast('Please paste or write code');
      return;
    }

    if (!sizeCheck.ok) {
      if (!window.confirm(`${sizeCheck.warning}\n\nDo you want to save it anyway?`)) {
        return;
      }
    }

    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const rawSnippet = {
      id: `snip-${Date.now()}`,
      subjectId: selectedSubjectId,
      title: title.trim(),
      code: code,
      language: language,
      notes: notes.trim(),
      serialNumber: parseInt(serialNumber, 10) || (currentSnippetsCount + 1),
      tags: parsedTags,
      time_complexity: timeComplexity.trim(),
      space_complexity: spaceComplexity.trim(),
      common_mistake: commonMistake.trim(),
      is_starred: false,
      recall_score: null,
      review_count: 0,
      missed_count: 0,
      last_reviewed: null,
      createdAt: new Date().toISOString().split('T')[0]
    };

    const validatedSnippet = validateOrRepairSnippet(rawSnippet, selectedSubjectId);
    onCreateSnippet(validatedSnippet);
    onShowToast(`Saved "${title.trim()}"`);
    onClose();
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
          maxWidth: '620px',
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
              New Code Snippet
            </h3>
            <p
              style={{
                margin: '2px 0 0 0',
                fontSize: '12px',
                color: 'var(--text-dim)'
              }}
            >
              Add a snippet under a subject with heading and code
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

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '16px 18px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          {/* Subject & Order row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 90px',
              gap: '12px'
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--text-dim)',
                  marginBottom: '6px'
                }}
              >
                Subject
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-m)',
                  padding: '9px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '13px'
                }}
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--text-dim)',
                  marginBottom: '6px'
                }}
              >
                Serial #
              </label>
              <input
                type="number"
                min="1"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-m)',
                  padding: '9px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>
          </div>

          {/* Heading / Title */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--text-dim)',
                marginBottom: '6px'
              }}
            >
              Heading / Title
            </label>
            <input
              type="text"
              placeholder="e.g. Reverse a Linked List (Iterative & Recursive)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-m)',
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontSize: '13px'
              }}
            />
          </div>

          {/* Language and paste button row */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px'
              }}
            >
              <label
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--text-dim)'
                }}
              >
                Code
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-s)',
                    padding: '4px 8px',
                    color: 'var(--text-body)',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'var(--bg-raised)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-s)',
                    padding: '4px 8px',
                    color: 'var(--text-body)',
                    fontSize: '11px'
                  }}
                >
                  <Clipboard size={12} />
                  <span>Paste</span>
                </button>
              </div>
            </div>

            <textarea
              placeholder="// Paste your code here..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={10}
              style={{
                width: '100%',
                background: 'var(--code-bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-m)',
                padding: '12px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12.5px',
                lineHeight: '1.5',
                resize: 'vertical',
                tabSize: 2
              }}
            />

            {sizeCheck.warning && (
              <div
                style={{
                  marginTop: '6px',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-s)',
                  background: sizeCheck.ok ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${sizeCheck.ok ? '#f59e0b' : 'var(--danger)'}`,
                  color: sizeCheck.ok ? '#f59e0b' : 'var(--danger)',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <AlertTriangle size={13} />
                <span>{sizeCheck.warning}</span>
              </div>
            )}
          </div>

          {/* Complexity & Tags */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 120px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '4px' }}>
                Time Complexity
              </label>
              <input
                type="text"
                placeholder="e.g. O(log N)"
                value={timeComplexity}
                onChange={(e) => setTimeComplexity(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-m)',
                  padding: '8px 10px',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '4px' }}>
                Space Complexity
              </label>
              <input
                type="text"
                placeholder="e.g. O(1)"
                value={spaceComplexity}
                onChange={(e) => setSpaceComplexity(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-m)',
                  padding: '8px 10px',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '4px' }}>
              Tags (comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Binary Search, Arrays, Two Pointers"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-m)',
                padding: '8px 10px',
                color: 'var(--text-primary)',
                fontSize: '12px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '4px' }}>
              Common Exam Mistake / Trap (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Forget to check if head is null; index out of bounds"
              value={commonMistake}
              onChange={(e) => setCommonMistake(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-m)',
                padding: '8px 10px',
                color: 'var(--text-primary)',
                fontSize: '12px'
              }}
            />
          </div>

          {/* Key Insights / Notes */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--text-dim)',
                marginBottom: '6px'
              }}
            >
              Notes (optional)
            </label>
            <textarea
              placeholder="e.g. Time complexity: O(n), Space complexity: O(1). Remember edge case when head is null."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              style={{
                width: '100%',
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-m)',
                padding: '8px 12px',
                color: 'var(--text-primary)',
                fontSize: '12.5px',
                lineHeight: '1.4',
                resize: 'none'
              }}
            />
          </div>

          {/* Action buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              paddingTop: '8px',
              borderTop: '1px solid var(--border)'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-m)',
                padding: '8px 16px',
                color: 'var(--text-body)',
                fontSize: '13px',
                fontWeight: 500
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                background: 'var(--accent)',
                color: '#000000',
                border: 'none',
                borderRadius: 'var(--radius-m)',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Check size={14} />
              <span>Save Snippet</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
