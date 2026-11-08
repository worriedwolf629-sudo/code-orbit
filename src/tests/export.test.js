import { describe, it, expect } from 'vitest';
import { generateSubjectMarkdown } from '../utils/exportService';

describe('Phase 6: Markdown & Sheet Export Service', () => {
  const mockSubject = {
    id: 'sub-dsa',
    name: 'DSA Exam Notes',
    description: 'Core Algorithms and Data Structures'
  };

  const mockSnippets = [
    {
      id: 'snip-1',
      serialNumber: 1,
      title: 'Binary Search',
      language: 'java',
      time_complexity: 'O(log N)',
      space_complexity: 'O(1)',
      tags: ['Searching', 'Arrays'],
      notes: 'Use mid = low + (high - low) / 2 to avoid overflow.',
      common_mistake: 'Off by one on high = mid - 1',
      is_starred: true,
      code: 'int mid = low + (high - low) / 2;'
    },
    {
      id: 'snip-2',
      serialNumber: 2,
      title: 'Merge Sort',
      language: 'cpp',
      time_complexity: 'O(N log N)',
      space_complexity: 'O(N)',
      tags: ['Sorting', 'Recursion'],
      notes: 'Divide and conquer sorting algorithm.',
      is_starred: false,
      code: 'void mergeSort(int arr[], int l, int r) {}'
    }
  ];

  it('generates markdown with subject title, TOC, and metadata', () => {
    const md = generateSubjectMarkdown(mockSubject, mockSnippets);

    expect(md).toContain('# DSA Exam Notes — CodeOrbit Exam Revision Vault');
    expect(md).toContain('## Table of Contents');
    expect(md).toContain('[01. Binary Search ⭐](#binary-search)');
    expect(md).toContain('[02. Merge Sort](#merge-sort)');

    // Snippet 1 checks
    expect(md).toContain('### 01. Binary Search ⭐ [Exam List]');
    expect(md).toContain('**Time:** `O(log N)`');
    expect(md).toContain('**Space:** `O(1)`');
    expect(md).toContain('`#Searching` `#Arrays`');
    expect(md).toContain('> ⚠️ **Common Exam Trap:** Off by one on high = mid - 1');
    expect(md).toContain('```java\nint mid = low + (high - low) / 2;\n```');

    // Snippet 2 checks
    expect(md).toContain('### 02. Merge Sort');
    expect(md).toContain('**Time:** `O(N log N)`');
    expect(md).toContain('```cpp\nvoid mergeSort(int arr[], int l, int r) {}\n```');
  });

  it('handles empty snippets gracefully', () => {
    const md = generateSubjectMarkdown(mockSubject, []);
    expect(md).toContain('# DSA Exam Notes — CodeOrbit Exam Revision Vault');
    expect(md).toContain('Total Snippets: 0');
  });
});
