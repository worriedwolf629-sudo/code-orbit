import React from 'react';
import {
  ListFilter,
  Sparkles,
  Plus,
  Layers,
  FileJson,
  Smartphone,
  Share2
} from 'lucide-react';

export default function Navbar({
  activeView,
  setActiveView,
  subjects,
  activeSubjectId,
  setActiveSubjectId,
  snippets,
  onOpenSubjectModal,
  onOpenNewSnippetModal,
  onOpenBackupModal,
  onOpenPhoneModal
}) {
  return (
    <header
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '14px 16px',
        background: 'rgba(10, 14, 26, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}
    >
      {/* Top App Bar: Brand Logo, View Switcher & Action Icons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}
      >
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(14, 165, 233, 0.5)',
              position: 'relative'
            }}
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#ffffff',
                boxShadow: '0 0 8px #ffffff'
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                border: '1.5px dashed rgba(255, 255, 255, 0.6)'
              }}
            />
          </div>

          <div>
            <h1
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 800,
                letterSpacing: '-0.5px',
                background: 'linear-gradient(90deg, #f8fafc, #93c5fd)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              CodeOrbit
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: '11px',
                color: '#64748b',
                fontWeight: 500
              }}
            >
              Mobile Subject & Code Vault
            </p>
          </div>
        </div>

        {/* View Switcher: Serial List vs Orb Network Diagram */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '3px',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <button
            onClick={() => setActiveView('list')}
            aria-label="Serial Wise List View"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '11px',
              border: 'none',
              background: activeView === 'list' ? 'linear-gradient(135deg, #0ea5e9, #38bdf8)' : 'transparent',
              color: activeView === 'list' ? '#090d16' : '#94a3b8',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <ListFilter size={15} />
            <span>List</span>
          </button>

          <button
            onClick={() => setActiveView('network')}
            aria-label="Orb Network Diagram View"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '11px',
              border: 'none',
              background: activeView === 'network' ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'transparent',
              color: activeView === 'network' ? '#ffffff' : '#94a3b8',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeView === 'network' ? '0 0 12px rgba(168, 85, 247, 0.4)' : 'none'
            }}
          >
            <Sparkles size={15} />
            <span>Orb Net</span>
          </button>
        </div>

        {/* Action icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={onOpenPhoneModal}
            title="Open on Phone"
            aria-label="Open on phone"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Smartphone size={16} />
          </button>

          <button
            onClick={onOpenBackupModal}
            title="Backup & Sync"
            aria-label="Backup and sync vault"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <FileJson size={16} />
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Subject Pills */}
      <div
        className="subject-pills-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '2px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {subjects.map((sub) => {
          const isActive = sub.id === activeSubjectId;
          const count = snippets.filter((s) => s.subjectId === sub.id).length;

          return (
            <button
              key={sub.id}
              onClick={() => setActiveSubjectId(sub.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 14px',
                borderRadius: '999px',
                border: isActive
                  ? `1.5px solid ${sub.color || '#38bdf8'}`
                  : '1px solid rgba(255, 255, 255, 0.08)',
                background: isActive
                  ? `${sub.color || '#38bdf8'}22`
                  : 'rgba(15, 23, 42, 0.6)',
                color: isActive ? '#ffffff' : '#94a3b8',
                fontWeight: isActive ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                flexShrink: 0,
                boxShadow: isActive ? `0 0 14px ${sub.color || '#38bdf8'}33` : 'none'
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: sub.color || '#38bdf8',
                  boxShadow: isActive ? `0 0 8px ${sub.color || '#38bdf8'}` : 'none'
                }}
              />
              <span>{sub.name}</span>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: '"JetBrains Mono", monospace',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: isActive ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.06)',
                  color: isActive ? '#ffffff' : '#64748b'
                }}
              >
                {count}
              </span>
            </button>
          );
        })}

        {/* Add Subject Button */}
        <button
          onClick={onOpenSubjectModal}
          title="Add New Subject"
          aria-label="Add new subject"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            borderRadius: '999px',
            border: '1px dashed rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.03)',
            color: '#cbd5e1',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          <Plus size={14} />
          <span>Add Sub</span>
        </button>
      </div>
    </header>
  );
}
