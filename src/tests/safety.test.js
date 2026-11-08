import { describe, it, expect } from 'vitest';
import {
  validateOrRepairSubject,
  validateOrRepairSnippet,
  migrateSnippetSchema,
  checkSnippetSize,
  CURRENT_SCHEMA_VERSION,
  MAX_SNIPPET_BYTES
} from '../utils/schema';
import { copyToClipboard } from '../utils/clipboard';

describe('Data Safety & Schema Repair (Zod)', () => {
  it('repairs null or non-object subject gracefully without crashing', () => {
    const repaired = validateOrRepairSubject(null);
    expect(repaired).toBeDefined();
    expect(repaired.id).toContain('sub-repaired');
    expect(repaired.name).toBe('Recovered Subject');
    expect(repaired.deleted_at).toBeNull();
  });

  it('validates a well-formed subject', () => {
    const valid = {
      id: 'sub-dsa',
      name: 'DSA Mastery',
      description: 'Data Structures and Algorithms',
      color: '#38bdf8'
    };
    const result = validateOrRepairSubject(valid);
    expect(result.id).toBe('sub-dsa');
    expect(result.name).toBe('DSA Mastery');
    expect(result.description).toBe('Data Structures and Algorithms');
    expect(result.color).toBe('#38bdf8');
  });

  it('repairs snippet with null code or invalid fields', () => {
    const corrupt = {
      id: 'snip-test-1',
      subjectId: 'sub-dsa',
      title: null, // Bad title
      code: null,  // Bad code
      tags: 'not-an-array' // Bad tags
    };

    const repaired = validateOrRepairSnippet(corrupt, 'sub-dsa');
    expect(repaired.id).toBe('snip-test-1');
    expect(repaired.title).toBe('Untitled Snippet');
    expect(repaired.code).toBe('');
    expect(Array.isArray(repaired.tags)).toBe(true);
    expect(repaired.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('migrates v0 schema to latest schema version', () => {
    const v0Snippet = {
      id: 'snip-v0',
      title: 'Old Snippet',
      code: 'console.log("hello");',
      schemaVersion: 0
    };

    const migrated = migrateSnippetSchema(v0Snippet);
    expect(migrated.schemaVersion).toBe(1);
    expect(Array.isArray(migrated.tags)).toBe(true);
    expect(migrated.deleted_at).toBeNull();
  });
});

describe('Paste Guard & Size Limits', () => {
  it('passes normal sized snippets without warning', () => {
    const code = 'const x = 10;\nfunction test() { return x * 2; }';
    const check = checkSnippetSize(code);
    expect(check.ok).toBe(true);
    expect(check.warning).toBeUndefined();
  });

  it('warns when code exceeds 250 KB limit', () => {
    // Generate large string > 250KB
    const largeCode = 'a'.repeat(MAX_SNIPPET_BYTES + 1024);
    const check = checkSnippetSize(largeCode);
    expect(check.ok).toBe(false);
    expect(check.warning).toBeDefined();
    expect(check.warning).toContain('exceeds the recommended limit');
  });
});

describe('Bulletproof Clipboard Helper', () => {
  it('handles null/undefined text gracefully without throwing', async () => {
    const res = await copyToClipboard(null);
    expect(res).toBeDefined();
    expect(typeof res.success).toBe('boolean');
  });
});

describe('Safe Search Logic', () => {
  it('safely filters snippets with missing title or code without throwing', () => {
    const testSnippets = [
      { id: '1', title: null, code: null },
      { id: '2', title: 'Binary Search', code: 'public void search() {}' },
      null,
      undefined
    ];

    const q = 'binary';
    const filtered = testSnippets.filter((item) => {
      if (!item) return false;
      const title = String(item.title || '').toLowerCase();
      const code = String(item.code || '').toLowerCase();
      return title.includes(q) || code.includes(q);
    });

    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe('Binary Search');
  });
});

