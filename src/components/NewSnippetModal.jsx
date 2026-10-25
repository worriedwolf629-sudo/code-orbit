import React, { useState } from 'react';
import { X, Code2, Clipboard, Plus, Check } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../utils/syntaxHighlight';

export default function NewSnippetModal({
  subjects,
  activeSubjectId,
  currentSnippetsCount,
  onClose,
  onCreateSnippet,
  onShowToast
}) {
  const [selectedSubjectId, setSelectedSubjectId] = useState(activeSubjectId || (subjects[0] && subjects[0].id));
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('java');
  const [notes, setNotes] = useState('');
  const [serialNumber, setSerialNumber] = useState(currentSnippetsCount + 1);

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setCode(text);
        onShowToast('Pasted code from clipboard!');
      } else {
        onShowToast('Clipboard is empty');
      }
    } catch (err) {
      onShowToast('Please long-press the code box to paste');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      onShowToast('Please enter a heading/title for this code');
      return;
    }

    if (!code.trim()) {
      onShowToast('Please paste or enter code below the heading');
      return;
    }

    const newSnippet = {
      id: `snip-${Date.now()}`,
      subjectId: selectedSubjectId,
      title: title.trim(),
      code: code,
      language: language,
      notes: notes.trim(),
      serialNumber: parseInt(serialNumber, 10) || (currentSnippetsCount + 1),
      createdAt: new Date().toISOString().split('T')[0]
    };

    onCreateSnippet(newSnippet);
    onShowToast(`Saved "${title.trim()}" successfully!`);
    onClose();
  };

  const activeSub = subjects.find(s => s.id === selectedSubjectId) || subjects[0];

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
          maxWidth: '680px',
          maxHeight: 'calc(100vh - 30px)',
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
                background: `linear-gradient(135deg, ${activeSub?.color || '#38bdf8'}33, #6366f133)`,
                color: activeSub?.color || '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Code2 size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#ffffff', fontWeight: 700 }}>
                Store New Code
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                Add heading name and paste your code below
              </p>
            </div>
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

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {/* Row 1: Target Subject & Serial Number */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#94a3b8',
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
                  padding: '11px 14px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '14px',
                  fontWeight: 600,
                  outline: 'none'
                }}
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id} style={{ background: '#0f172a' }}>
                    {s.name} ({s.description || 'Subject'})
                  </option>
                ))}
              </select>
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
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 12px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
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
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 12px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '14px',
                  fontFamily: '"JetBrains Mono", monospace',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Heading Name (USER REQUIREMENT) */}
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
              Name Heading *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., QuickSort Partitioning, BFS Graph, Singleton Pattern"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 600,
                outline: 'none'
              }}
            />
          </div>

          {/* Code Paste Area with Quick Paste Button */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px'
              }}
            >
              <label
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#94a3b8'
                }}
              >
                Code (Paste below) *
              </label>

              <button
                type="button"
                onClick={handlePasteFromClipboard}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '8px',
                  color: '#38bdf8',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                <Clipboard size={13} />
                <span>Paste from Clipboard</span>
              </button>
            </div>

            <textarea
              rows={10}
              required
              placeholder="// Paste your code here..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
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

          {/* Notes / Highlights (Optional) */}
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
              Notes / Complexity / Key Details (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Time: O(N log N), Space: O(log N). Pivot chosen as middle."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 14px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                color: '#cbd5e1',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          {/* Bottom Save Action */}
          <div style={{ marginTop: '8px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '11px 18px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#cbd5e1',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              style={{
                padding: '11px 24px',
                background: `linear-gradient(135deg, ${activeSub?.color || '#38bdf8'}, #6366f1)`,
                border: 'none',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: `0 4px 18px ${activeSub?.color || '#38bdf8'}66`
              }}
            >
              <Plus size={18} />
              Store Code Snippet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
