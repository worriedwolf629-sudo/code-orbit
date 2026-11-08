import Fuse from 'fuse.js';

let fuseInstance = null;
let cachedSnippetsRef = null;

const FUSE_OPTIONS = {
  keys: [
    { name: 'title', weight: 0.45 },
    { name: 'tags', weight: 0.25 },
    { name: 'notes', weight: 0.15 },
    { name: 'code', weight: 0.15 }
  ],
  threshold: 0.35,          // Typo tolerance without returning irrelevant noise
  ignoreLocation: true,     // Match anywhere in snippet
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
  useExtendedSearch: false
};

export function getOrCreateFuse(snippets) {
  if (fuseInstance && cachedSnippetsRef === snippets) {
    return fuseInstance;
  }

  // Pre-process snippets for fast search
  const searchable = (Array.isArray(snippets) ? snippets : []).map((snip) => ({
    id: snip.id,
    subjectId: snip.subjectId,
    serialNumber: snip.serialNumber || 1,
    title: snip.title || '',
    language: snip.language || 'plaintext',
    tags: Array.isArray(snip.tags) ? snip.tags : [],
    notes: snip.notes || '',
    code: snip.code || '',
    raw: snip
  }));

  fuseInstance = new Fuse(searchable, FUSE_OPTIONS);
  cachedSnippetsRef = snippets;
  return fuseInstance;
}

export function searchVaultSnippets(query, snippets, subjects = [], limit = 25) {
  const trimmed = (query || '').trim();
  if (!trimmed) return [];

  const fuse = getOrCreateFuse(snippets);
  const results = fuse.search(trimmed, { limit });

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  return results.map((res) => {
    const item = res.item.raw;
    const subject = subjectMap.get(item.subjectId) || {
      id: item.subjectId,
      name: 'Unknown',
      color: '#2dd4bf'
    };

    // Extract highlight snippet context
    let matchedIn = 'title';
    let matchSnippet = '';

    if (res.matches && res.matches.length > 0) {
      const bestMatch = res.matches[0];
      matchedIn = bestMatch.key;

      if (bestMatch.key === 'code' && typeof item.code === 'string') {
        const idx = item.code.toLowerCase().indexOf(trimmed.toLowerCase());
        const start = Math.max(0, idx - 30);
        const end = Math.min(item.code.length, idx + trimmed.length + 50);
        matchSnippet = (start > 0 ? '…' : '') + item.code.slice(start, end) + (end < item.code.length ? '…' : '');
      } else if (bestMatch.key === 'notes') {
        matchSnippet = item.notes;
      }
    }

    return {
      snippet: item,
      subject,
      score: res.score,
      matchedIn,
      matchSnippet
    };
  });
}

