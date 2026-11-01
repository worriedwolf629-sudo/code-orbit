import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check } from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Teal', hex: '#2dd4bf' },
  { name: 'Sky', hex: '#38bdf8' },
  { name: 'Indigo', hex: '#818cf8' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Emerald', hex: '#34d399' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Slate', hex: '#94a3b8' }
];

export default function SubjectModal({
  onClose,
  onCreateSubject,
  subjects,
  onDeleteSubject,
  onShowToast
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0].hex);
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'manage'

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      onShowToast('Please enter a subject name');
      return;
    }

    const newSubject = {
      id: `sub-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'Code & Study Notes',
      color: color,
      createdAt: new Date().toISOString().split('T')[0]
    };

    onCreateSubject(newSubject);
    onShowToast(`Created subject "${name.trim()}"`);
    setName('');
    setDescription('');
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
              Subjects
            </h3>
            <p
              style={{
                margin: '2px 0 0 0',
                fontSize: '12px',
                color: 'var(--text-dim)'
              }}
            >
              Organize your code vault by topic
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
            onClick={() => setActiveTab('create')}
            style={{
              padding: '6px 12px',
              fontSize: '12.5px',
              fontWeight: 500,
              background: activeTab === 'create' ? 'var(--bg-raised)' : 'transparent',
              color: activeTab === 'create' ? 'var(--text-primary)' : 'var(--text-dim)',
              borderRadius: 'var(--radius-s)',
              border: 'none'
            }}
          >
            Add New Subject
          </button>
          <button
            onClick={() => setActiveTab('manage')}
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
            All Subjects ({subjects.length})
          </button>
        </div>

        {/* Tab Body */}
        <div style={{ padding: '16px 18px', overflowY: 'auto' }}>
          {activeTab === 'create' ? (
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                  Subject Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. DSA, OOPs, Java, Dynamic Programming"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-m)',
                    padding: '9px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '13px'
                  }}
                />
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
                  Description (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Data Structures & Algorithms in Java"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-m)',
                    padding: '9px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--text-dim)',
                    marginBottom: '8px'
                  }}
                >
                  Indicator Color
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {PRESET_COLORS.map((c) => {
                    const isSelected = color === c.hex;
                    return (
                      <button
                        type="button"
                        key={c.hex}
                        onClick={() => setColor(c.hex)}
                        title={c.name}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: c.hex,
                          border: isSelected ? '2px solid #ffffff' : '2px solid transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0
                        }}
                      >
                        {isSelected && <Check size={14} color="#000000" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  paddingTop: '10px',
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
                    fontSize: '13px'
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
                  <Plus size={14} />
                  <span>Create Subject</span>
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {subjects.map((sub) => (
                <div
                  key={sub.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-m)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: sub.color || 'var(--accent)'
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'var(--text-primary)'
                        }}
                      >
                        {sub.name}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-dim)'
                        }}
                      >
                        {sub.description || 'Subject'}
                      </div>
                    </div>
                  </div>

                  {subjects.length > 1 && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete subject "${sub.name}" and its snippets?`)) {
                          onDeleteSubject(sub.id);
                        }
                      }}
                      title="Delete subject"
                      style={{
                        background: 'transparent',
                        color: 'var(--text-dim)',
                        border: 'none',
                        padding: '6px',
                        borderRadius: 'var(--radius-s)'
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
