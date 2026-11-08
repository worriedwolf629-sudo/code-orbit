import React, { useState } from 'react';
import {
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
  Search,
  Plus,
  ArrowUpDown,
  Star,
  Clock,
  HardDrive,
  AlertTriangle,
  Filter
} from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';

export default function SerialListView({
  subject,
  snippets,
  onSelectSnippet,
  onAddNewSnippet,
  onMoveSnippet,
  _onDeleteSnippet,
  onShowToast,
  onUpdateSnippet
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [starredOnly, setStarredOnly] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);

  // Extract all unique tags in this subject
  const allTags = Array.from(
    new Set(
      (Array.isArray(snippets) ? snippets : []).flatMap((s) => (Array.isArray(s.tags) ? s.tags : []))
    )
  ).filter(Boolean);

  const filteredSnippets = (Array.isArray(snippets) ? snippets : []).filter((item) => {
    if (!item) return false;
    if (starredOnly && !item.is_starred) return false;
    if (selectedTag && (!Array.isArray(item.tags) || !item.tags.includes(selectedTag))) return false;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const title = String(item.title || '').toLowerCase();
    const code = String(item.code || '').toLowerCase();
    const lang = String(item.language || '').toLowerCase();
    const notes = String(item.notes || '').toLowerCase();
    const tags = Array.isArray(item.tags) ? item.tags.join(' ').toLowerCase() : '';
    return title.includes(q) || code.includes(q) || lang.includes(q) || tags.includes(q) || notes.includes(q);
  });

  const sortedSnippets = [...filteredSnippets].sort((a, b) => {
    return sortAsc
      ? (a.serialNumber || 0) - (b.serialNumber || 0)
      : (b.serialNumber || 0) - (a.serialNumber || 0);
  });

  const handleQuickCopy = async (e, snippet) => {
    e.stopPropagation();
    const res = await copyToClipboard(snippet.code || '');
    if (res.success) {
      setCopiedId(snippet.id);
      onShowToast(`Copied "${snippet.title || 'snippet'}"`);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      onShowToast('Copy failed, select manually');
    }
  };

  const handleToggleStar = (e, snippet) => {
    e.stopPropagation();
    if (!onUpdateSnippet) return;
    const updated = {
      ...snippet,
      is_starred: !snippet.is_starred,
      updated_at: new Date().toISOString()
    };
    onUpdateSnippet(updated);
    onShowToast(updated.is_starred ? 'Added to Exam List ⭐' : 'Removed from Exam List');
  };

  const starredCount = (Array.isArray(snippets) ? snippets : []).filter((s) => s.is_starred).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Search and sort */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-dim)',
              pointerEvents: 'none'
            }}
          />
          <input
            type="text"
            placeholder={`Search ${subject.name}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 10px 9px 32px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-m)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none',
              transition: 'border-color 0.12s ease'
            }}
          />
        </div>

        {/* Exam List Quick Filter Button */}
        <button
          onClick={() => setStarredOnly(!starredOnly)}
          title="Filter only Starred / Exam snippets"
          aria-label="Exam List filter"
          style={{
            padding: '8px 12px',
            background: starredOnly ? '#f59e0b' : 'var(--bg-surface)',
            border: starredOnly ? '1px solid #f59e0b' : '1px solid var(--border)',
            borderRadius: 'var(--radius-m)',
            color: starredOnly ? '#111113' : 'var(--text-body)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '12px',
            fontWeight: 600,
            whiteSpace: 'nowrap'
          }}
        >
          <Star size={13} fill={starredOnly ? '#111113' : 'none'} />
          <span>Exam List {starredCount > 0 ? `(${starredCount})` : ''}</span>
        </button>

        <button
          onClick={() => setSortAsc(!sortAsc)}
          title={`Sort: ${sortAsc ? '1 to N' : 'N to 1'}`}
          aria-label="Toggle sort order"
          style={{
            padding: '9px 10px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-m)',
            color: 'var(--text-body)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px'
          }}
        >
          <ArrowUpDown size={14} />
          <span className="hide-on-small-mobile">#{sortAsc ? '1-N' : 'N-1'}</span>
        </button>
      </div>

      {/* Tag Filter Chips Bar */}
      {allTags.length > 0 && (
        <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', alignItems: 'center', paddingBottom: '2px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Filter size={10} /> Tags:
          </span>
          <button
            onClick={() => setSelectedTag(null)}
            style={{
              padding: '3px 8px',
              borderRadius: '12px',
              background: selectedTag === null ? 'var(--accent-dim)' : 'transparent',
              border: selectedTag === null ? '1px solid var(--accent)' : '1px solid var(--border)',
              color: selectedTag === null ? 'var(--accent)' : 'var(--text-dim)',
              fontSize: '11px',
              fontWeight: 500,
              whiteSpace: 'nowrap'
            }}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              style={{
                padding: '3px 8px',
                borderRadius: '12px',
                background: selectedTag === tag ? 'var(--accent-dim)' : 'transparent',
                border: selectedTag === tag ? '1px solid var(--accent)' : '1px solid var(--border)',
                color: selectedTag === tag ? 'var(--accent)' : 'var(--text-dim)',
                fontSize: '11px',
                fontWeight: 500,
                whiteSpace: 'nowrap'
              }}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Count */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: 'var(--text-dim)',
          padding: '0 2px'
        }}
      >
        <span>
          {sortedSnippets.length} of {snippets.length} in{' '}
          <span style={{ color: subject.color }}>{subject.name}</span>
        </span>
        <span>Tap to view</span>
      </div>

      {/* Empty state */}
      {sortedSnippets.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-l)',
            border: '1px dashed var(--border-focus)'
          }}
        >
          <p style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '6px' }}>
            {searchQuery ? 'No results' : `No snippets in ${subject.name}`}
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-body)', marginBottom: '16px', maxWidth: '260px', marginLeft: 'auto', marginRight: 'auto' }}>
            {searchQuery
              ? 'Try different keywords or clear the search.'
              : 'Add your first code snippet to get started.'}
          </p>
          <button
            onClick={onAddNewSnippet}
            style={{
              padding: '8px 16px',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: 'var(--radius-m)',
              color: '#111113',
              fontWeight: 600,
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Plus size={15} />
            Add Code
          </button>
        </div>
      )}

      {/* Snippet cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sortedSnippets.map((item, index) => {
          const lines = item.code.split('\n');
          const lineCount = lines.length;
          const previewSnippet = lines.slice(0, 3).join('\n');
          const isCopied = copiedId === item.id;

          return (
            <div
              key={item.id}
              onClick={() => onSelectSnippet(item)}
              className="serial-card-item"
              style={{
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-l)',
                border: '1px solid var(--border)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                cursor: 'pointer'
              }}
            >
              {/* Top: serial, heading, actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                  {/* Serial number */}
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: subject.color || 'var(--accent)',
                      background: `${subject.color || 'var(--accent)'}14`,
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-s)',
                      flexShrink: 0
                    }}
                  >
                    {String(item.serialNumber || index + 1).padStart(2, '0')}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{
                      margin: '0 0 3px 0',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      lineHeight: 1.3,
                      wordBreak: 'break-word'
                    }}>
                      {item.title}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: '3px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: 'var(--text-body)',
                        textTransform: 'uppercase',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {item.language || 'code'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        {lineCount} lines
                      </span>

                      {item.time_complexity && (
                        <span style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          color: '#38bdf8',
                          background: 'rgba(56, 189, 248, 0.1)',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}>
                          <Clock size={10} /> {item.time_complexity}
                        </span>
                      )}

                      {item.space_complexity && (
                        <span style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          color: '#a78bfa',
                          background: 'rgba(167, 139, 250, 0.1)',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}>
                          <HardDrive size={10} /> {item.space_complexity}
                        </span>
                      )}

                      {Array.isArray(item.tags) && item.tags.slice(0, 3).map((t) => (
                        <span key={t} style={{
                          fontSize: '10px',
                          color: 'var(--text-dim)',
                          background: 'var(--bg-raised)',
                          padding: '1px 5px',
                          borderRadius: '3px'
                        }}>
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Star / Exam List Toggle Button */}
                  <button
                    onClick={(e) => handleToggleStar(e, item)}
                    title={item.is_starred ? 'Remove from Exam List' : 'Add to Exam List'}
                    aria-label="Star snippet"
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: 'var(--radius-s)',
                      border: item.is_starred ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border)',
                      background: item.is_starred ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                      color: item.is_starred ? '#f59e0b' : 'var(--text-dim)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    <Star size={13} fill={item.is_starred ? '#f59e0b' : 'none'} />
                  </button>

                  <button
                    onClick={(e) => handleQuickCopy(e, item)}
                    title="Copy code"
                    aria-label={`Copy ${item.title}`}
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: 'var(--radius-s)',
                      border: '1px solid var(--border)',
                      background: isCopied ? 'var(--accent-dim)' : 'transparent',
                      color: isCopied ? 'var(--accent)' : 'var(--text-dim)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    {isCopied ? <Check size={13} /> : <Copy size={13} />}
                  </button>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <button
                      onClick={() => onMoveSnippet(item.id, -1)}
                      title="Move up"
                      aria-label="Move snippet up"
                      disabled={index === 0}
                      style={{
                        width: '22px',
                        height: '15px',
                        background: 'transparent',
                        border: 'none',
                        color: index === 0 ? 'var(--border)' : 'var(--text-dim)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      onClick={() => onMoveSnippet(item.id, 1)}
                      title="Move down"
                      aria-label="Move snippet down"
                      disabled={index === sortedSnippets.length - 1}
                      style={{
                        width: '22px',
                        height: '15px',
                        background: 'transparent',
                        border: 'none',
                        color: index === sortedSnippets.length - 1 ? 'var(--border)' : 'var(--text-dim)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Code preview */}
              <div
                style={{
                  background: 'var(--code-bg)',
                  borderRadius: 'var(--radius-s)',
                  padding: '8px 10px',
                  border: '1px solid var(--border)',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-body)',
                  overflow: 'hidden',
                  maxHeight: '56px',
                  lineHeight: 1.45,
                  position: 'relative'
                }}
              >
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {previewSnippet}
                </pre>
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '20px',
                    background: 'linear-gradient(to bottom, transparent, var(--code-bg))',
                    pointerEvents: 'none'
                  }}
                />
              </div>

              {/* Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '11px',
                color: 'var(--text-dim)'
              }}>
                <span>{item.createdAt || ''}</span>
                <span style={{ color: 'var(--text-body)', fontWeight: 500 }}>
                  Open
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* FAB */}
      <button
        onClick={onAddNewSnippet}
        title="Add code snippet"
        aria-label="Add code snippet"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '16px',
          width: '48px',
          height: '48px',
          borderRadius: 'var(--radius-l)',
          background: 'var(--accent)',
          border: 'none',
          color: '#111113',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 80,
          transition: 'transform 0.12s ease'
        }}
      >
        <Plus size={22} />
      </button>
    </div>
  );
}
