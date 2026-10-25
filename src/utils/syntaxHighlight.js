import Prism from 'prismjs';

// Import essential language syntaxes
import 'prismjs/components/prism-clike.js';
import 'prismjs/components/prism-javascript.js';
import 'prismjs/components/prism-java.js';
import 'prismjs/components/prism-c.js';
import 'prismjs/components/prism-cpp.js';
import 'prismjs/components/prism-python.js';
import 'prismjs/components/prism-sql.js';

export const SUPPORTED_LANGUAGES = [
  { id: 'java', name: 'Java', color: '#f59e0b' },
  { id: 'cpp', name: 'C++', color: '#06b6d4' },
  { id: 'c', name: 'C', color: '#64748b' },
  { id: 'python', name: 'Python', color: '#3b82f6' },
  { id: 'javascript', name: 'JavaScript', color: '#eab308' },
  { id: 'sql', name: 'SQL', color: '#10b981' },
  { id: 'plaintext', name: 'Plain Text', color: '#94a3b8' }
];

export function highlightCode(code, language = 'java') {
  if (!code) return '';
  const langKey = language.toLowerCase();
  const grammar = Prism.languages[langKey] || Prism.languages.javascript || Prism.languages.clike;
  
  try {
    return Prism.highlight(code, grammar, langKey);
  } catch (err) {
    console.warn('Prism highlight error, falling back:', err);
    return escapeHtml(code);
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
