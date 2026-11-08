/**
 * CodeOrbit Export Service
 * Markdown notes export and printable exam revision cheat sheet generation.
 */

/**
 * Convert a subject's snippets into clean Markdown suitable for Obsidian, Notion, or GitHub.
 */
export function generateSubjectMarkdown(subject, snippets) {
  const safeSubjectName = subject?.name || 'General';
  const dateStr = new Date().toISOString().split('T')[0];

  const sorted = [...(snippets || [])].sort(
    (a, b) => (a.serialNumber || 0) - (b.serialNumber || 0)
  );

  let md = `# ${safeSubjectName} — CodeOrbit Exam Revision Vault\n\n`;
  md += `> Exported on: ${dateStr}  \n`;
  if (subject?.description) {
    md += `> ${subject.description}  \n`;
  }
  md += `> Total Snippets: ${sorted.length}\n\n`;
  md += `---\n\n`;

  // Table of Contents
  md += `## Table of Contents\n\n`;
  sorted.forEach((snip) => {
    const title = snip.title || 'Untitled Snippet';
    const anchor = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    const star = snip.is_starred ? ' ⭐' : '';
    md += `- [${String(snip.serialNumber || 1).padStart(2, '0')}. ${title}${star}](#${anchor})\n`;
  });
  md += `\n---\n\n`;

  // Snippets content
  sorted.forEach((snip) => {
    const title = snip.title || 'Untitled Snippet';
    const lang = (snip.language || 'text').toLowerCase();
    const star = snip.is_starred ? ' ⭐ [Exam List]' : '';

    md += `### ${String(snip.serialNumber || 1).padStart(2, '0')}. ${title}${star}\n\n`;

    // Metadata block
    const metaParts = [];
    if (snip.time_complexity) metaParts.push(`**Time:** \`${snip.time_complexity}\``);
    if (snip.space_complexity) metaParts.push(`**Space:** \`${snip.space_complexity}\``);
    if (Array.isArray(snip.tags) && snip.tags.length > 0) {
      metaParts.push(`**Tags:** ${snip.tags.map((t) => `\`#${t}\``).join(' ')}`);
    }

    if (metaParts.length > 0) {
      md += `${metaParts.join(' | ')}\n\n`;
    }

    // Notes
    if (snip.notes) {
      md += `**Key Insight & Notes:**\n> ${snip.notes.replace(/\n/g, '\n> ')}\n\n`;
    }

    // Common Exam Mistake
    if (snip.common_mistake) {
      md += `> ⚠️ **Common Exam Trap:** ${snip.common_mistake}\n\n`;
    }

    // Code Block
    md += `\`\`\`${lang}\n${snip.code || ''}\n\`\`\`\n\n`;
    md += `---\n\n`;
  });

  return md;
}

/**
 * Trigger download of Markdown file in browser.
 */
export function downloadSubjectMarkdown(subject, snippets) {
  const mdContent = generateSubjectMarkdown(subject, snippets);
  const safeName = (subject?.name || 'notes')
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '_') || 'subject';

  const date = new Date().toISOString().split('T')[0];
  const filename = `${safeName}_revision_sheet_${date}.md`;

  const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return filename;
}

/**
 * Opens a clean, dedicated print-ready window for an exam revision cheat sheet.
 */
export function openPrintRevisionSheet(subject, snippets) {
  const safeSubjectName = subject?.name || 'Exam Revision';
  const sorted = [...(snippets || [])].sort(
    (a, b) => (a.serialNumber || 0) - (b.serialNumber || 0)
  );

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to open the printable revision sheet.');
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${safeSubjectName} — Revision Cheat Sheet</title>
  <style>
    @page {
      margin: 1.5cm;
      size: A4 portrait;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      color: #111;
      background: #fff;
      margin: 0;
      padding: 20px;
      font-size: 11pt;
      line-height: 1.4;
    }
    .header {
      border-bottom: 2px solid #222;
      padding-bottom: 8px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    h1 {
      margin: 0;
      font-size: 20pt;
      letter-spacing: -0.02em;
    }
    .subhead {
      font-size: 9pt;
      color: #555;
    }
    .snippet-card {
      border: 1px solid #ccc;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 14px;
      page-break-inside: avoid;
      break-inside: avoid;
      background: #fafafa;
    }
    .snippet-title {
      font-size: 12pt;
      font-weight: 700;
      margin: 0 0 4px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .badges {
      display: flex;
      gap: 8px;
      font-size: 8.5pt;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      margin-bottom: 6px;
      color: #333;
    }
    .badge {
      background: #e5e7eb;
      padding: 2px 6px;
      border-radius: 3px;
    }
    .notes-box {
      font-size: 9.5pt;
      background: #fff;
      border-left: 3px solid #2563eb;
      padding: 6px 10px;
      margin-bottom: 8px;
      color: #222;
    }
    .trap-box {
      font-size: 9pt;
      background: #fee2e2;
      border-left: 3px solid #dc2626;
      padding: 6px 10px;
      margin-bottom: 8px;
      color: #991b1b;
    }
    pre {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 8px 10px;
      font-size: 9pt;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      line-height: 1.35;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-all;
      margin: 0;
      color: #0f172a;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
      .snippet-card {
        border-color: #ddd;
        background: #fff;
      }
      pre {
        background: #f8fafc;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 16px; padding: 12px; background: #e0f2fe; border: 1px solid #7dd3fc; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
    <div>
      <strong>Exam Revision Cheat Sheet Ready</strong>
      <div style="font-size: 11px; color: #0369a1;">Use standard browser print (Ctrl+P / Cmd+P) to save as PDF or print.</div>
    </div>
    <button onclick="window.print()" style="padding: 8px 18px; background: #0284c7; color: white; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;">
      🖨️ Print / Save as PDF
    </button>
  </div>

  <div class="header">
    <div>
      <h1>${safeSubjectName} Revision Sheet</h1>
      <div class="subhead">${subject?.description || 'Code & Algorithm Study Guide'} • ${sorted.length} topics</div>
    </div>
    <div class="subhead" style="text-align: right;">
      CodeOrbit Vault<br>
      ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
    </div>
  </div>

  ${sorted.map((item) => `
    <div class="snippet-card">
      <div class="snippet-title">
        <span>#${item.serialNumber} ${item.title}</span>
        ${item.is_starred ? '<span style="color: #d97706; font-size: 10pt;">⭐ [EXAM CORE]</span>' : ''}
      </div>

      <div class="badges">
        <span class="badge">${(item.language || 'code').toUpperCase()}</span>
        ${item.time_complexity ? `<span class="badge">⏱ ${item.time_complexity}</span>` : ''}
        ${item.space_complexity ? `<span class="badge">💾 ${item.space_complexity}</span>` : ''}
        ${Array.isArray(item.tags) && item.tags.length > 0 ? item.tags.map(t => `<span class="badge">#${t}</span>`).join('') : ''}
      </div>

      ${item.notes ? `<div class="notes-box"><strong>Insight:</strong> ${item.notes}</div>` : ''}
      ${item.common_mistake ? `<div class="trap-box"><strong>⚠️ Exam Trap:</strong> ${item.common_mistake}</div>` : ''}

      <pre><code>${escapeHtml(item.code || '')}</code></pre>
    </div>
  `).join('')}

</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

