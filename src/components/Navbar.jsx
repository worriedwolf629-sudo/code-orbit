import React from 'react';
import {
  List,
  GitFork,
  Plus,
  FileJson,
  Smartphone,
} from 'lucide-react';

export default function Navbar({
  activeView,
  setActiveView,
  subjects,
  activeSubjectId,
  setActiveSubjectId,
  snippets,
  isLiveSync,
  onManualSync,
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
        gap: '10px',
        padding: '12px 16px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)'
            }}
          >
            CodeOrbit
          </h1>
          <button
            onClick={onManualSync}
            title="Sync status (click to refresh)"
            aria-label="Sync status"
            style={{
              background: 'none',
              border: 'none',
              padding: '2px 6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              color: isLiveSync ? 'var(--accent)' : 'var(--text-dim)',
              fontWeight: 500
            }}
          >
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: isLiveSync ? 'var(--accent)' : 'var(--text-dim)'
              }}
            />
            <span>{isLiveSync ? 'Synced' : 'Local'}</span>
          </button>
        </div>

        {/* View toggle and actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* View switcher */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-base)',
              padding: '2px',
              borderRadius: 'var(--radius-m)',
              border: '1px solid var(--border)'
            }}
          >
            <button
              onClick={() => setActiveView('network')}
              aria-label="Graph view"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '6px',
                background: activeView === 'network' ? 'var(--bg-raised)' : 'transparent',
                color: activeView === 'network' ? 'var(--text-primary)' : 'var(--text-dim)',
                fontWeight: 600,
                fontSize: '12px',
                transition: 'background-color 0.12s ease'
              }}
            >
              <GitFork size={14} />
              <span>Graph</span>
            </button>

            <button
              onClick={() => setActiveView('list')}
              aria-label="List view"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '6px',
                background: activeView === 'list' ? 'var(--bg-raised)' : 'transparent',
                color: activeView === 'list' ? 'var(--text-primary)' : 'var(--text-dim)',
                fontWeight: 600,
                fontSize: '12px',
                transition: 'background-color 0.12s ease'
              }}
            >
              <List size={14} />
              <span>List</span>
            </button>
          </div>

          <button
            onClick={onOpenPhoneModal}
            title="Connect phone"
            aria-label="Connect phone"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-m)',
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-body)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.12s ease'
            }}
          >
            <Smartphone size={14} />
          </button>

          <button
            onClick={onOpenBackupModal}
            title="Backup and import"
            aria-label="Backup and import"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-m)',
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-body)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.12s ease'
            }}
          >
            <FileJson size={14} />
          </button>

          <button
            onClick={onOpenNewSnippetModal}
            title="New Snippet"
            aria-label="New Snippet"
            style={{
              height: '32px',
              padding: '0 10px',
              borderRadius: 'var(--radius-m)',
              background: 'var(--accent)',
              border: 'none',
              color: '#000000',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            <Plus size={14} />
            <span className="hide-on-small-mobile">Add</span>
          </button>
        </div>
      </div>

      {/* Subject tabs */}
      <div
        className="subject-pills-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          overflowX: 'auto',
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
                gap: '6px',
                padding: '5px 12px',
                borderRadius: 'var(--radius-m)',
                border: isActive
                  ? `1px solid ${sub.color || 'var(--accent)'}`
                  : '1px solid var(--border)',
                background: isActive
                  ? `${sub.color || 'var(--accent)'}14`
                  : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-body)',
                fontWeight: isActive ? 600 : 400,
                fontSize: '13px',
                whiteSpace: 'nowrap',
                transition: 'all 0.12s ease',
                flexShrink: 0
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: sub.color || 'var(--accent)'
                }}
              />
              <span>{sub.name}</span>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  padding: '0 5px',
                  borderRadius: '4px',
                  background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.04)',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-dim)'
                }}
              >
                {count}
              </span>
            </button>
          );
        })}

        <button
          onClick={onOpenSubjectModal}
          title="Add subject"
          aria-label="Add subject"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '5px 10px',
            borderRadius: 'var(--radius-m)',
            border: '1px dashed var(--border-focus)',
            background: 'transparent',
            color: 'var(--text-dim)',
            fontSize: '12px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'color 0.12s ease'
          }}
        >
          <Plus size={13} />
          <span>Add</span>
        </button>
      </div>
    </header>
  );
}
