import React, { useState } from 'react';
import { X, Layers, Plus, Trash2, Check } from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Sky Cyan', hex: '#38bdf8' },
  { name: 'Electric Violet', hex: '#a855f7' },
  { name: 'Amber Gold', hex: '#f59e0b' },
  { name: 'Emerald Mint', hex: '#10b981' },
  { name: 'Neon Rose', hex: '#f43f5e' },
  { name: 'Indigo Core', hex: '#6366f1' },
  { name: 'Sunset Orange', hex: '#fb923c' }
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

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      onShowToast('Please enter a subject name');
      return;
    }

    const newSubject = {
      id: `sub-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'Custom Code & Algorithms Subject',
      color: color,
      createdAt: new Date().toISOString().split('T')[0]
    };

    onCreateSubject(newSubject);
    onShowToast(`Subject "${name.trim()}" added!`);
    onClose();
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
          maxWidth: '520px',
          maxHeight: 'calc(100vh - 40px)',
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
                background: `linear-gradient(135deg, ${color}33, #6366f133)`,
                color: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Layers size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '17px', color: '#ffffff', fontWeight: 700 }}>
              Subject Manager
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

        {/* Tab switch: Add Subject vs Manage Existing */}
        <div
          style={{
            display: 'flex',
            padding: '8px 20px',
            background: 'rgba(9, 13, 22, 0.5)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            gap: '8px'
          }}
        >
          <button
            onClick={() => setActiveTab('create')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'create' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: activeTab === 'create' ? '#38bdf8' : '#94a3b8',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            + Add New Subject
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'manage' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: activeTab === 'manage' ? '#38bdf8' : '#94a3b8',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Your Subjects ({subjects.length})
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'create' ? (
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                  Subject Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., DSA, OOPs, Java, Python, System Design"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                  Description / Topic Focus (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., LeetCode patterns, Semester exams, Concepts"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#94a3b8',
                    marginBottom: '8px'
                  }}
                >
                  Theme Accent Color & Orb Glow
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setColor(c.hex)}
                      title={c.name}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '12px',
                        background: c.hex,
                        border: color === c.hex ? '3px solid #ffffff' : '1px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: color === c.hex ? `0 0 16px ${c.hex}` : 'none'
                      }}
                    >
                      {color === c.hex && <Check size={18} color="#000000" />}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
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
                    padding: '11px 22px',
                    background: `linear-gradient(135deg, ${color}, #6366f1)`,
                    border: 'none',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: `0 4px 18px ${color}66`
                  }}
                >
                  <Plus size={18} />
                  Add Subject
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {subjects.map((sub) => (
                <div
                  key={sub.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: sub.color || '#38bdf8',
                        boxShadow: `0 0 10px ${sub.color || '#38bdf8'}`
                      }}
                    />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15px', color: '#f8fafc', fontWeight: 600 }}>
                        {sub.name}
                      </h4>
                      <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                        {sub.description}
                      </p>
                    </div>
                  </div>

                  {subjects.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`Delete subject "${sub.name}" and all its code?`)) {
                          onDeleteSubject(sub.id);
                          onShowToast(`Subject ${sub.name} removed`);
                        }
                      }}
                      title="Delete Subject"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#f87171',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
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
