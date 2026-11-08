import { describe, it, expect } from 'vitest';
import { validateOrRepairSnippet } from '../utils/schema';

describe('Phase 5: Revision & Active Recall Logic', () => {
  it('validates and preserves revision fields in snippet', () => {
    const raw = {
      id: 'snip-rev-1',
      subjectId: 'sub-dsa',
      title: 'Binary Search',
      code: 'int mid = low + (high - low) / 2;',
      language: 'java',
      tags: ['Binary Search', 'Divide and Conquer'],
      time_complexity: 'O(log N)',
      space_complexity: 'O(1)',
      common_mistake: 'Integer overflow with (low + high) / 2',
      is_starred: true,
      recall_score: 'knew',
      review_count: 3,
      missed_count: 1,
      last_reviewed: '2026-11-08T10:00:00.000Z'
    };

    const validated = validateOrRepairSnippet(raw, 'sub-dsa');
    expect(validated.is_starred).toBe(true);
    expect(validated.time_complexity).toBe('O(log N)');
    expect(validated.space_complexity).toBe('O(1)');
    expect(validated.common_mistake).toBe('Integer overflow with (low + high) / 2');
    expect(validated.tags).toEqual(['Binary Search', 'Divide and Conquer']);
    expect(validated.recall_score).toBe('knew');
    expect(validated.review_count).toBe(3);
    expect(validated.missed_count).toBe(1);
    expect(validated.last_reviewed).toBe('2026-11-08T10:00:00.000Z');
  });

  it('correctly filters snippets by tag across multiple topics', () => {
    const snippets = [
      { id: '1', title: 'Binary Search', tags: ['dsa', 'searching', 'arrays'] },
      { id: '2', title: 'QuickSort', tags: ['dsa', 'sorting', 'recursion'] },
      { id: '3', title: 'Singleton', tags: ['oops', 'design patterns'] }
    ];

    const filterByTag = (tag) => snippets.filter(s => Array.isArray(s.tags) && s.tags.includes(tag));

    expect(filterByTag('searching')).toHaveLength(1);
    expect(filterByTag('searching')[0].title).toBe('Binary Search');
    expect(filterByTag('dsa')).toHaveLength(2);
    expect(filterByTag('nonexistent')).toHaveLength(0);
  });

  it('filters only starred snippets for the Exam List', () => {
    const snippets = [
      { id: '1', title: 'Two Sum', is_starred: true },
      { id: '2', title: 'Reverse String', is_starred: false },
      { id: '3', title: 'LRU Cache', is_starred: true }
    ];

    const examList = snippets.filter(s => Boolean(s.is_starred));
    expect(examList).toHaveLength(2);
    expect(examList.map(s => s.title)).toEqual(['Two Sum', 'LRU Cache']);
  });

  it('updates recall score for "I knew it" vs "Missed it"', () => {
    let snippet = {
      id: 'snip-1',
      review_count: 2,
      missed_count: 1,
      recall_score: null,
      last_reviewed: null
    };

    // User marks "I knew it"
    const now = new Date().toISOString();
    snippet = {
      ...snippet,
      recall_score: 'knew',
      review_count: (snippet.review_count || 0) + 1,
      last_reviewed: now
    };

    expect(snippet.recall_score).toBe('knew');
    expect(snippet.review_count).toBe(3);
    expect(snippet.missed_count).toBe(1);
    expect(snippet.last_reviewed).toBe(now);

    // Later, user marks "Missed it"
    const later = new Date(Date.now() + 60000).toISOString();
    snippet = {
      ...snippet,
      recall_score: 'missed',
      missed_count: (snippet.missed_count || 0) + 1,
      last_reviewed: later
    };

    expect(snippet.recall_score).toBe('missed');
    expect(snippet.review_count).toBe(3);
    expect(snippet.missed_count).toBe(2);
    expect(snippet.last_reviewed).toBe(later);
  });

  it('prioritizes missed and unreviewed snippets for study revision', () => {
    const snippets = [
      { id: '1', title: 'Easy loop', recall_score: 'knew', missed_count: 0 },
      { id: '2', title: 'Red-Black Trees', recall_score: 'missed', missed_count: 3 },
      { id: '3', title: 'Graph Dijkstra', recall_score: null, missed_count: 0 },
      { id: '4', title: 'KMP Algorithm', recall_score: 'missed', missed_count: 1 }
    ];

    // Priority comparator: missed first (descending missed_count), then unreviewed, then knew
    const revisionSorter = (a, b) => {
      const scoreWeight = (item) => {
        if (item.recall_score === 'missed') return 3 + (item.missed_count || 0);
        if (!item.recall_score) return 2; // unreviewed
        return 1; // knew it
      };
      return scoreWeight(b) - scoreWeight(a);
    };

    const sorted = [...snippets].sort(revisionSorter);
    expect(sorted[0].title).toBe('Red-Black Trees');
    expect(sorted[1].title).toBe('KMP Algorithm');
    expect(sorted[2].title).toBe('Graph Dijkstra');
    expect(sorted[3].title).toBe('Easy loop');
  });
});

