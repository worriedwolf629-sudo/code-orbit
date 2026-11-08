import { describe, it, expect } from 'vitest';
import { searchVaultSnippets } from '../utils/searchService';

describe('Global Fuzzy Search (Fuse.js)', () => {
  const subjects = [
    { id: 'sub-dsa', name: 'DSA', color: '#38bdf8' },
    { id: 'sub-oops', name: 'OOPs', color: '#a855f7' },
    { id: 'sub-java', name: 'Java', color: '#f59e0b' }
  ];

  const snippets = [
    {
      id: 'snip-1',
      subjectId: 'sub-dsa',
      title: 'Binary Search (Iterative & Robust)',
      language: 'java',
      tags: ['Searching', 'Arrays', 'Divide and Conquer'],
      notes: 'Calculate mid using low + (high - low) / 2 to prevent integer overflow.',
      code: 'public int search(int[] nums, int target) { return 0; }'
    },
    {
      id: 'snip-2',
      subjectId: 'sub-oops',
      title: 'Singleton Pattern (Thread-Safe Bill Pugh)',
      language: 'java',
      tags: ['Creational', 'Design Patterns'],
      notes: 'Uses private static inner class for lazy initialization without synchronization overhead.',
      code: 'public class Singleton { private Singleton() {} }'
    },
    {
      id: 'snip-3',
      subjectId: 'sub-java',
      title: 'Virtual Threads (Java 21 Project Loom)',
      language: 'java',
      tags: ['Concurrency', 'Threading'],
      notes: 'Lightweight threads managed by the JVM instead of the OS.',
      code: 'Thread.ofVirtual().start(() -> {});'
    }
  ];

  it('matches by title with typo tolerance', () => {
    // "binry sarch" with 2 typos
    const results = searchVaultSnippets('binry sarch', snippets, subjects);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].snippet.title).toBe('Binary Search (Iterative & Robust)');
    expect(results[0].subject.name).toBe('DSA');
  });

  it('matches by topic tags across different subjects', () => {
    const results = searchVaultSnippets('Creational', snippets, subjects);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].snippet.title).toBe('Singleton Pattern (Thread-Safe Bill Pugh)');
    expect(results[0].subject.name).toBe('OOPs');
  });

  it('matches within notes explanation', () => {
    const results = searchVaultSnippets('integer overflow', snippets, subjects);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].snippet.title).toBe('Binary Search (Iterative & Robust)');
  });

  it('matches code body keywords', () => {
    const results = searchVaultSnippets('ofVirtual', snippets, subjects);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].snippet.title).toBe('Virtual Threads (Java 21 Project Loom)');
    expect(results[0].subject.name).toBe('Java');
  });

  it('returns empty array when query is whitespace or empty', () => {
    expect(searchVaultSnippets('', snippets, subjects)).toEqual([]);
    expect(searchVaultSnippets('   ', snippets, subjects)).toEqual([]);
  });

  it('scales efficiently with 500+ snippets', () => {
    const largeList = [];
    for (let i = 0; i < 600; i++) {
      largeList.push({
        id: `snip-perf-${i}`,
        subjectId: i % 2 === 0 ? 'sub-dsa' : 'sub-oops',
        serialNumber: i + 1,
        title: `Dynamic Programming Problem #${i} - Longest Common Subsequence`,
        language: 'java',
        tags: ['DP', 'Optimization'],
        notes: `Tabulation approach with memoization state table for problem #${i}`,
        code: `int dp[][] = new int[${i}][${i}];`
      });
    }

    // Warm up index creation
    searchVaultSnippets('warmup', largeList, subjects);

    const t0 = performance.now();
    const results = searchVaultSnippets('#420', largeList, subjects);
    const duration = performance.now() - t0;

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].snippet.title).toContain('#420');
    // Ensure search executes quickly (< 100ms on 600 full code records)
    expect(duration).toBeLessThan(100);
  });
});
