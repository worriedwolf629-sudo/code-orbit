import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
  Trash2,
  ExternalLink,
  Search,
  Sparkles,
  Plus,
  Clock,
  ArrowUpDown
} from 'lucide-react';

export default function SerialListView({
  subject,
  snippets,
  onSelectSnippet,
  onAddNewSnippet,
  onMoveSnippet,
  onDeleteSnippet,
  onShowToast
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  // Filter snippets by search query
  const filteredSnippets = snippets.filter(item => {
    const q = searchQuery.toLowerCase();
    const titleMatch = item.title.toLowerCase().includes(q);
    const codeMatch = item.code.toLowerCase().includes(q);
    const langMatch = (item.language || '').toLowerCase().includes(q);
    return titleMatch || codeMatch || langMatch;
  });

  // Sort by serial number
  const sortedSnippets = [...filteredSnippets].sort((a, b) => {
    return sortAsc
      ? (a.serialNumber || 0) - (b.serialNumber || 0)
      : (b.serialNumber || 0) - (a.serialNumber || 0);
  });

  const handleQuickCopy = (e, snippet) => {
    e.stopPropagation();
    navigator.clipboard.writeText(snippet.code);
    setCopiedId(snippet.id);
    onShowToast(`Copied "${snippet.title}" to clipboard!`);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  return (
    <div className="serial-list-view" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Search & Serial Sort Filter Bar */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}
      >
        <div
          style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '14px',
              color: '#94a3b8',
              pointerEvents: 'none'
            }}
          />
          <input
            type="text"
            placeholder={`Search ${subject.name} by title or code...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px 12px 42px',
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '14px',
              color: '#f8fafc',
              fontSize: '14px',
              outline: 'none',
              backdropFilter: 'blur(10px)',
              transition: 'border-color 0.2s ease'
            }}
          />
        </div>

        <button
          onClick={() => setSortAsc(!sortAsc)}
          title={`Sorting: Serial ${sortAsc ? '1 → N' : 'N → 1'}`}
          aria-label="Toggle serial sort order"
          style={{
            padding: '12px 14px',
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            color: '#cbd5e1',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <ArrowUpDown size={16} />
          <span className="hide-on-small-mobile">#{sortAsc ? '1→N' : 'N→1'}</span>
        </button>
      </div>

      {/* Snippets Count Indicator */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '2px 4px',
          fontSize: '13px',
          color: '#94a3b8'
        }}
      >
        <span>
          Showing <strong style={{ color: '#f8fafc' }}>{sortedSnippets.length}</strong> of{' '}
          {snippets.length} serial items in <span style={{ color: subject.color }}>{subject.name}</span>
        </span>
        <span style={{ fontSize: '12px', opacity: 0.8 }}>
          Tap item to view full code
        </span>
      </div>

      {/* Empty State */}
      {sortedSnippets.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 20px',
            background: 'rgba(15, 23, 42, 0.4)',
            borderRadius: '20px',
            border: '1px dashed rgba(255, 255, 255, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: `${subject.color || '#38bdf8'}1a`,
              color: subject.color || '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Sparkles size={24} />
          </div>
          <h3 style={{ margin: 0, fontSize: '17px', color: '#f1f5f9' }}>
            {searchQuery ? 'No matching code found' : `No snippets in ${subject.name} yet`}
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', maxWidth: '280px' }}>
            {searchQuery
              ? 'Try searching with different keywords or clear the search input.'
              : 'Add your manually titled code snippet to organize your subject notes.'}
          </p>
          <button
            onClick={onAddNewSnippet}
            style={{
              marginTop: '8px',
              padding: '10px 18px',
              background: `linear-gradient(135deg, ${subject.color || '#38bdf8'}, #6366f1)`,
              border: 'none',
              borderRadius: '12px',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Plus size={16} />
            Paste New Code
          </button>
        </div>
      )}

      {/* List of Serial Snippets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                position: 'relative',
                background: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(14px)',
                borderRadius: '18px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
              }}
            >
              {/* Card Top: Serial Badge, Heading, and Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}
              >
                {/* Left: Serial Number Badge & Heading Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: `linear-gradient(135deg, ${subject.color}22, rgba(99, 102, 241, 0.15))`,
                      border: `1.5px solid ${subject.color}55`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <span
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: subject.color || '#38bdf8'
                      }}
                    >
                      {String(item.serialNumber || index + 1).padStart(2, '0')}
                    </span>
                    <span style={{ fontSize: '8px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      NUM
                    </span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4
                      style={{
                        margin: '0 0 4px 0',
                        fontSize: '15px',
                        fontWeight: 600,
                        color: '#f8fafc',
                        lineHeight: 1.3,
                        wordBreak: 'break-word'
                      }}
                    >
                      {item.title}
                    </h4>

                    {/* Metadata tags */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: '#38bdf8',
                          textTransform: 'uppercase',
                          fontFamily: '"JetBrains Mono", monospace'
                        }}
                      >
                        {item.language || 'code'}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {lineCount} lines
                      </span>
                      {item.notes && (
                        <span
                          style={{
                            fontSize: '11px',
                            color: '#a855f7',
                            background: 'rgba(168, 85, 247, 0.12)',
                            padding: '1px 6px',
                            borderRadius: '4px'
                          }}
                        >
                          Notes
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Quick Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Quick Copy Button */}
                  <button
                    onClick={(e) => handleQuickCopy(e, item)}
                    title="Quick Copy Code"
                    aria-label={`Copy ${item.title}`}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      border: isCopied ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: isCopied ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      color: isCopied ? '#10b981' : '#cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isCopied ? <Check size={16} /> : <Copy size={16} />}
                  </button>

                  {/* Serial Reorder Up / Down */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <button
                      onClick={() => onMoveSnippet(item.id, -1)}
                      title="Move Up in Serial List"
                      aria-label="Move snippet up"
                      disabled={index === 0}
                      style={{
                        width: '24px',
                        height: '18px',
                        background: 'transparent',
                        border: 'none',
                        color: index === 0 ? 'rgba(255, 255, 255, 0.15)' : '#94a3b8',
                        cursor: index === 0 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => onMoveSnippet(item.id, 1)}
                      title="Move Down in Serial List"
                      aria-label="Move snippet down"
                      disabled={index === sortedSnippets.length - 1}
                      style={{
                        width: '24px',
                        height: '18px',
                        background: 'transparent',
                        border: 'none',
                        color: index === sortedSnippets.length - 1 ? 'rgba(255, 255, 255, 0.15)' : '#94a3b8',
                        cursor: index === sortedSnippets.length - 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Code Preview Box */}
              <div
                style={{
                  background: 'rgba(9, 13, 22, 0.75)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  fontSize: '12px',
                  fontFamily: '"JetBrains Mono", monospace',
                  color: '#94a3b8',
                  overflow: 'hidden',
                  maxHeight: '68px',
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
                    height: '24px',
                    background: 'linear-gradient(to bottom, transparent, rgba(9, 13, 22, 0.95))',
                    pointerEvents: 'none'
                  }}
                />
              </div>

              {/* Bottom footer: Tap to open indicator */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px',
                  color: '#64748b'
                }}
              >
                <span>Created {item.createdAt || 'Recent'}</span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: subject.color || '#38bdf8',
                    fontWeight: 500
                  }}
                >
                  Full Access <ExternalLink size={12} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Add Snippet Action on mobile */}
      <button
        onClick={onAddNewSnippet}
        className="mobile-fab"
        title="Add Code Snippet"
        aria-label="Add Code Snippet"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '28px',
          background: `linear-gradient(135deg, ${subject.color || '#38bdf8'}, #6366f1)`,
          border: 'none',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 8px 28px ${subject.color || '#38bdf8'}66`,
          cursor: 'pointer',
          zIndex: 80,
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        <Plus size={26} />
      </button>
    </div>
  );
}
