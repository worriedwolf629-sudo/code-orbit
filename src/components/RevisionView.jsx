import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Star,
  Clock,
  HardDrive,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  BookOpen,
  Filter,
  FileText,
  Printer
} from 'lucide-react';
import { highlightCode } from '../utils/syntaxHighlight';
import { downloadSubjectMarkdown, openPrintRevisionSheet } from '../utils/exportService';

export default function RevisionView({
  subject,
  snippets,
  onUpdateSnippet,
  onSelectSnippet,
  onShowToast
}) {
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'starred' | 'practice'
  const [selectedTag, setSelectedTag] = useState(null);
  const [revealedIds, setRevealedIds] = useState({});
  const [sortByPriority, setSortByPriority] = useState(true);

  // Extract all unique tags
  const allTags = Array.from(
    new Set(
      snippets.flatMap((s) => (Array.isArray(s.tags) ? s.tags : []))
    )
  ).filter(Boolean);

  // Filter snippets
  const filtered = snippets.filter((s) => {
    if (filterMode === 'starred' && !s.is_starred) return false;
    if (filterMode === 'practice') {
      const isMissed = s.recall_score === 'missed' || (s.missed_count || 0) > 0;
      const isUnreviewed = !s.last_reviewed;
      if (!isMissed && !isUnreviewed) return false;
    }
    if (selectedTag && (!Array.isArray(s.tags) || !s.tags.includes(selectedTag))) {
      return false;
    }
    return true;
  });

  // Sort: Priority (missed first, then unreviewed, then knew) or Serial #
  const sorted = [...filtered].sort((a, b) => {
    if (sortByPriority) {
      const getPriority = (item) => {
        if (item.recall_score === 'missed') return 30 + (item.missed_count || 0);
        if (!item.last_reviewed) return 20;
        return 10;
      };
      const diff = getPriority(b) - getPriority(a);
      if (diff !== 0) return diff;
    }
    return (a.serialNumber || 0) - (b.serialNumber || 0);
  });

  const toggleReveal = (id) => {
    setRevealedIds((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleToggleStar = (e, snippet) => {
    e.stopPropagation();
    const updated = {
      ...snippet,
      is_starred: !snippet.is_starred,
      updated_at: new Date().toISOString()
    };
    onUpdateSnippet(updated);
    onShowToast(updated.is_starred ? 'Added to Exam List ⭐' : 'Removed from Exam List');
  };

  const handleRecallResult = (snippet, result) => {
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

  const starredCount = snippets.filter((s) => s.is_starred).length;
  const practiceCount = snippets.filter(
    (s) => s.recall_score === 'missed' || (s.missed_count || 0) > 0 || !s.last_reviewed
  ).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Top Banner / Mode Controls */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-l)',
          border: '1px solid var(--border)',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-m)',
                background: 'rgba(45, 212, 191, 0.12)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Active Recall Mode
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-dim)' }}>
                Hide code, recall from memory, then verify & track recall score.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                const filename = downloadSubjectMarkdown(subject, filtered);
                onShowToast(`Exported ${filename}`);
              }}
              title="Download Markdown for Obsidian/Notion"
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--radius-m)',
                background: 'var(--bg-raised)',
                border: '1px solid var(--border)',
                color: 'var(--text-body)',
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
            >
              <FileText size={12} />
              <span>Export .md</span>
            </button>

            <button
              onClick={() => {
                openPrintRevisionSheet(subject, filtered);
                onShowToast('Cheat sheet opened for printing');
              }}
              title="Printable Exam Revision Sheet"
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--radius-m)',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
            >
              <Printer size={12} />
              <span>Print Sheet</span>
            </button>

            <button
              onClick={() => setSortByPriority(!sortByPriority)}
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--radius-m)',
                background: sortByPriority ? 'var(--bg-raised)' : 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text-body)',
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={12} />
              {sortByPriority ? 'Priority: Missed' : 'Serial #'}
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          <button
            onClick={() => setFilterMode('all')}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-s)',
              background: filterMode === 'all' ? 'var(--accent)' : 'var(--bg-raised)',
              color: filterMode === 'all' ? '#111113' : 'var(--text-body)',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              minHeight: '34px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              whiteSpace: 'nowrap'
            }}
          >
            All ({snippets.length})
          </button>

          <button
            onClick={() => setFilterMode('starred')}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-s)',
              background: filterMode === 'starred' ? '#f59e0b' : 'var(--bg-raised)',
              color: filterMode === 'starred' ? '#111113' : 'var(--text-body)',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              minHeight: '34px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              whiteSpace: 'nowrap'
            }}
          >
            <Star size={13} fill={filterMode === 'starred' ? '#111113' : 'currentColor'} />
            Exam List ({starredCount})
          </button>

          <button
            onClick={() => setFilterMode('practice')}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-s)',
              background: filterMode === 'practice' ? 'var(--danger)' : 'var(--bg-raised)',
              color: filterMode === 'practice' ? '#ffffff' : 'var(--text-body)',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              minHeight: '34px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              whiteSpace: 'nowrap'
            }}
          >
            <AlertTriangle size={13} />
            Needs Practice ({practiceCount})
          </button>
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Filter size={10} /> Tag:
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
              any
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
      </div>

      {/* Empty State */}
      {sorted.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-l)',
            border: '1px dashed var(--border-focus)'
          }}
        >
          <BookOpen size={30} style={{ color: 'var(--text-dim)', marginBottom: '8px' }} />
          <p style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 600, margin: '0 0 6px 0' }}>
            No snippets match this revision filter
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-body)', margin: 0 }}>
            {filterMode === 'starred'
              ? 'Star snippets with the ⭐ button to add them to your Exam Revision list.'
              : 'Try clearing the tag filter or switching back to "All".'}
          </p>
        </div>
      )}

      {/* Snippet Active Recall Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sorted.map((item) => {
          const isRevealed = Boolean(revealedIds[item.id]);
          const codeHtml = highlightCode(item.code || '', item.language || 'java');
          const isMissed = item.recall_score === 'missed';
          const isKnew = item.recall_score === 'knew';

          return (
            <div
              key={item.id}
              style={{
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-l)',
                border: isMissed
                  ? '1px solid rgba(239, 68, 68, 0.4)'
                  : isKnew
                  ? '1px solid rgba(34, 197, 94, 0.3)'
                  : '1px solid var(--border)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: subject.color || 'var(--accent)',
                        background: `${subject.color || 'var(--accent)'}14`,
                        padding: '2px 7px',
                        borderRadius: 'var(--radius-s)'
                      }}
                    >
                      #{item.serialNumber}
                    </span>

                    {item.time_complexity && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          color: '#38bdf8',
                          background: 'rgba(56, 189, 248, 0.1)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <Clock size={11} /> {item.time_complexity}
                      </span>
                    )}

                    {item.space_complexity && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          color: '#a78bfa',
                          background: 'rgba(167, 139, 250, 0.1)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <HardDrive size={11} /> {item.space_complexity}
                      </span>
                    )}

                    {Array.isArray(item.tags) && item.tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: '10px',
                          color: 'var(--text-dim)',
                          background: 'var(--bg-raised)',
                          padding: '1px 5px',
                          borderRadius: '3px'
                        }}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>

                  <h4
                    onClick={() => onSelectSnippet(item)}
                    style={{
                      margin: '0 0 4px 0',
                      fontSize: '15px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      cursor: 'pointer'
                    }}
                  >
                    {item.title}
                  </h4>

                  {/* Notes / Explanation shown as hint */}
                  {item.notes && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-body)',
                        lineHeight: 1.45,
                        background: 'var(--bg-base)',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-m)',
                        marginTop: '6px',
                        borderLeft: `3px solid ${subject.color || 'var(--accent)'}`
                      }}
                    >
                      {item.notes}
                    </div>
                  )}
                </div>

                {/* Star Button */}
                <button
                  onClick={(e) => handleToggleStar(e, item)}
                  title={item.is_starred ? 'Remove from Exam List' : 'Add to Exam List'}
                  aria-label="Star"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-m)',
                    border: '1px solid var(--border)',
                    background: item.is_starred ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                    color: item.is_starred ? '#f59e0b' : 'var(--text-dim)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Star size={16} fill={item.is_starred ? '#f59e0b' : 'none'} />
                </button>
              </div>

              {/* Code Reveal Toggle */}
              {!isRevealed ? (
                <button
                  onClick={() => toggleReveal(item.id)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: 'var(--radius-m)',
                    background: 'var(--bg-base)',
                    border: '1px dashed var(--border-focus)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    minHeight: '48px',
                    transition: 'border-color 0.15s ease'
                  }}
                >
                  <Eye size={16} style={{ color: 'var(--accent)' }} />
                  Tap to Reveal Code & Test Recall
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Revealed Code Block */}
                  <div
                    style={{
                      background: 'var(--code-bg)',
                      borderRadius: 'var(--radius-m)',
                      border: '1px solid var(--border)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 10px',
                        background: 'rgba(0,0,0,0.25)',
                        borderBottom: '1px solid var(--border)',
                        fontSize: '11px',
                        color: 'var(--text-dim)'
                      }}
                    >
                      <span style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                        {item.language || 'code'}
                      </span>
                      <button
                        onClick={() => toggleReveal(item.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-dim)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px'
                        }}
                      >
                        <EyeOff size={12} /> Hide
                      </button>
                    </div>

                    <pre
                      style={{
                        margin: 0,
                        padding: '12px',
                        fontSize: '12px',
                        lineHeight: 1.5,
                        fontFamily: 'var(--font-mono)',
                        color: '#d4d4d8',
                        overflowX: 'auto',
                        whiteSpace: 'pre'
                      }}
                      dangerouslySetInnerHTML={{ __html: codeHtml }}
                    />
                  </div>

                  {/* Common Mistake Warning */}
                  {item.common_mistake && (
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-m)',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px'
                      }}
                    >
                      <AlertTriangle size={15} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ fontSize: '12px', color: '#fca5a5', lineHeight: 1.4 }}>
                        <strong style={{ color: '#ef4444' }}>Common Exam Trap: </strong>
                        {item.common_mistake}
                      </div>
                    </div>
                  )}

                  {/* Active Recall Scoring Check */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                      padding: '10px 12px',
                      background: 'var(--bg-base)',
                      borderRadius: 'var(--radius-m)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                      Last test: <strong style={{ color: 'var(--text-body)' }}>{formatLastReviewed(item.last_reviewed)}</strong>
                      {item.review_count > 0 && ` • Knew: ${item.review_count} / Missed: ${item.missed_count || 0}`}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleRecallResult(item, 'knew')}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 'var(--radius-m)',
                          background: isKnew ? '#22c55e' : 'rgba(34, 197, 94, 0.15)',
                          color: isKnew ? '#111113' : '#4ade80',
                          border: '1px solid rgba(34, 197, 94, 0.3)',
                          fontSize: '12px',
                          fontWeight: 600,
                          minHeight: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <CheckCircle2 size={15} />
                        I knew it
                      </button>

                      <button
                        onClick={() => handleRecallResult(item, 'missed')}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 'var(--radius-m)',
                          background: isMissed ? '#ef4444' : 'rgba(239, 68, 68, 0.15)',
                          color: isMissed ? '#ffffff' : '#f87171',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          fontSize: '12px',
                          fontWeight: 600,
                          minHeight: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <XCircle size={15} />
                        Missed it
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
