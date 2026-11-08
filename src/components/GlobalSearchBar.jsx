import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { searchVaultSnippets } from '../utils/searchService';

export default function GlobalSearchBar({
  snippets,
  subjects,
  onSelectSnippet,
  onSelectSubject
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Global Keyboard Shortcut: Cmd+K / Ctrl+K or '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in an input/textarea
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) {
        if (e.key === 'Escape' && isOpen) {
          setIsOpen(false);
          inputRef.current?.blur();
        }
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === '/' && !isOpen) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  // Update fuzzy search results as user types
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const matches = searchVaultSnippets(query, snippets, subjects, 20);
    setResults(matches);
    setSelectedIndex(0);
    setIsOpen(true);
  }, [query, snippets, subjects]);

  const handlePickResult = (result) => {
    if (!result) return;
    if (result.subject && result.subject.id) {
      onSelectSubject(result.subject.id);
    }
    onSelectSnippet(result.snippet);
    setIsOpen(false);
    setQuery('');
  };

  const handleKeyDownInInput = (e) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handlePickResult(results[selectedIndex]);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        marginBottom: '12px'
      }}
    >
      {/* Search Input Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-m)',
          padding: '0 12px',
          minHeight: '44px',
          transition: 'border-color 0.12s ease',
          boxShadow: isOpen ? '0 4px 16px rgba(0,0,0,0.4)' : 'none'
        }}
      >
        <Search size={16} color="var(--text-dim)" style={{ flexShrink: 0 }} />

        <input
          ref={inputRef}
          type="text"
          placeholder="Search all subjects, algorithms, notes, code... (Press ⌘K or /)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDownInInput}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '13px',
            padding: '10px 0'
          }}
        />

        {query ? (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            title="Clear search"
            style={{
              background: 'transparent',
              border: 'none',
              padding: '6px',
              color: 'var(--text-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={15} />
          </button>
        ) : (
          <span
            className="hide-on-small-mobile"
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-dim)',
              background: 'var(--bg-base)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: '2px 6px',
              userSelect: 'none'
            }}
          >
            ⌘K
          </span>
        )}
      </div>

      {/* Floating Results Dropdown */}
      {isOpen && query.trim() && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            maxHeight: '380px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-l)',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.65)',
            zIndex: 150,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {results.length === 0 ? (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                color: 'var(--text-dim)',
                fontSize: '13px'
              }}
            >
              No code snippets found matching "{query}".
            </div>
          ) : (
            <div style={{ padding: '6px' }}>
              <div
                style={{
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-dim)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
              >
                <span>Matching Vault Snippets ({results.length})</span>
                <span className="hide-on-small-mobile">Use ↑ ↓ and Enter</span>
              </div>

              {results.map((res, index) => {
                const isSelected = index === selectedIndex;
                const { snippet, subject, matchedIn, matchSnippet } = res;

                return (
                  <div
                    key={snippet.id}
                    onClick={() => handlePickResult(res)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-m)',
                      backgroundColor: isSelected ? 'var(--bg-raised)' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      transition: 'background-color 0.1s ease',
                      borderLeft: isSelected ? `2px solid ${subject.color || 'var(--accent)'}` : '2px solid transparent'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '10px',
                            fontWeight: 700,
                            color: subject.color || 'var(--accent)',
                            background: `${subject.color || 'var(--accent)'}15`,
                            padding: '2px 6px',
                            borderRadius: '3px',
                            flexShrink: 0
                          }}
                        >
                          #{snippet.serialNumber || 1}
                        </span>

                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {snippet.title}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <span
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-body)',
                            fontWeight: 500
                          }}
                        >
                          {subject.name}
                        </span>

                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            color: 'var(--text-dim)',
                            background: 'var(--bg-base)',
                            padding: '2px 5px',
                            borderRadius: '3px',
                            textTransform: 'uppercase',
                            fontFamily: 'var(--font-mono)'
                          }}
                        >
                          {snippet.language}
                        </span>
                      </div>
                    </div>

                    {/* Matched context snippet */}
                    {matchedIn !== 'title' && matchSnippet && (
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-dim)',
                          fontFamily: matchedIn === 'code' ? 'var(--font-mono)' : 'var(--font-sans)',
                          background: 'var(--bg-base)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <span style={{ color: 'var(--accent)' }}>[{matchedIn}]:</span> {matchSnippet}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
