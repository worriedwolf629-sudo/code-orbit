import React from 'react';
import {
  List,
  GitFork,
  Plus,
  FileJson,
  Smartphone,
  Trash2,
  User,
  Sparkles
} from 'lucide-react';

export default function Navbar({
  activeView,
  setActiveView,
  subjects,
  activeSubjectId,
  setActiveSubjectId,
  snippets,
  syncStatus = 'offline',
  user = null,
  onManualSync,
  onOpenSubjectModal,
  onOpenNewSnippetModal,
  onOpenBackupModal,
  onOpenPhoneModal,
  onOpenAuthModal,
  onOpenTrashModal,
  trashCount = 0
}) {
  // Sync Status Indicator Styling
  const getSyncBadge = () => {
    switch (syncStatus) {
      case 'synced':
        return {
          dotColor: 'var(--accent)',
          label: 'Synced',
          title: 'Synced with cloud (click to sync now)'
        };
      case 'syncing':
        return {
          dotColor: '#f59e0b',
          label: 'Syncing...',
          title: 'Synchronizing changes with cloud...'
        };
      case 'error':
        return {
          dotColor: 'var(--danger)',
          label: 'Sync Error',
          title: 'Sync failed (click to retry)'
        };
      case 'offline':
      default:
        return {
          dotColor: 'var(--text-dim)',
          label: user ? 'Offline' : 'Local Only',
          title: user ? 'Working offline (cached in IndexedDB)' : 'Sign in to enable cloud sync'
        };
    }
  };

  const syncBadge = getSyncBadge();

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
          gap: '8px'
        }}
      >
        {/* Brand & Sync Pill */}
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
            title={syncBadge.title}
            aria-label="Sync status"
            style={{
              background: 'var(--bg-base)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-s)',
              padding: '3px 7px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              color: 'var(--text-body)',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: syncBadge.dotColor
              }}
            />
            <span style={{ fontSize: '11px', color: syncBadge.dotColor }}>{syncBadge.label}</span>
          </button>
        </div>

        {/* View toggle and actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
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

            <button
              onClick={() => setActiveView('revision')}
              aria-label="Revision active recall view"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '6px',
                background: activeView === 'revision' ? 'var(--bg-raised)' : 'transparent',
                color: activeView === 'revision' ? 'var(--accent)' : 'var(--text-dim)',
                fontWeight: 600,
                fontSize: '12px',
                transition: 'background-color 0.12s ease'
              }}
            >
              <Sparkles size={14} />
              <span>Recall</span>
            </button>
          </div>

          {/* Account / Cloud Sign In Button */}
          <button
            onClick={onOpenAuthModal}
            title={user ? `Signed in as ${user.email}` : 'Sign in to cloud sync'}
            aria-label="Account"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-m)',
              background: user ? 'var(--bg-raised)' : 'transparent',
              border: '1px solid var(--border)',
              color: user ? 'var(--accent)' : 'var(--text-body)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            {user && user.email ? (
              user.email[0].toUpperCase()
            ) : (
              <User size={14} />
            )}
          </button>

          {/* Trash Button */}
          <button
            onClick={onOpenTrashModal}
            title="Trash / Deleted snippets"
            aria-label="Trash"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-m)',
              background: 'transparent',
              border: '1px solid var(--border)',
              color: trashCount > 0 ? 'var(--danger)' : 'var(--text-body)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            <Trash2 size={14} />
            {trashCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  background: 'var(--danger)',
                  color: '#ffffff',
                  fontSize: '9px',
                  fontWeight: 700,
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {trashCount}
              </span>
            )}
          </button>

          {/* Backup / Export */}
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
              justifyContent: 'center'
            }}
          >
            <FileJson size={14} />
          </button>

          {/* Connect Phone */}
          <button
            onClick={onOpenPhoneModal}
            title="Open on phone"
            aria-label="Open on phone"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-m)',
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-body)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Smartphone size={14} />
          </button>

          {/* Add Snippet Button */}
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
