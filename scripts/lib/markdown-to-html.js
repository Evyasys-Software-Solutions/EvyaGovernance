/**
 * Lightweight Markdown → HTML converter for Azure DevOps work item descriptions.
 * ADO renders HTML in description fields; raw Markdown shows as symbols.
 * No external dependencies — uses only regex transforms.
 *
 * Supported syntax:
 *   Headings h1–h4, bold/italic/bold+italic/strikethrough, unordered & ordered lists,
 *   checkboxes (- [ ] / - [x]), GFM pipe tables, blockquotes, horizontal rules,
 *   fenced code blocks (``` / ~~~), inline code, links, paragraphs.
 */

function markdownToHtml(md) {
  if (!md || typeof md !== 'string') return '';

  let html = md;

  // ── Fenced code blocks ───────────────────────────────────────────────────
  html = html.replace(/```([^\n]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = escapeHtml(code.trimEnd());
    const cls = lang.trim() ? ` class="language-${escapeAttr(lang.trim())}"` : '';
    return `<pre><code${cls}>${escaped}</code></pre>`;
  });
  html = html.replace(/~~~([^\n]*)\n([\s\S]*?)~~~/g, (_, lang, code) => {
    const escaped = escapeHtml(code.trimEnd());
    const cls = lang.trim() ? ` class="language-${escapeAttr(lang.trim())}"` : '';
    return `<pre><code${cls}>${escaped}</code></pre>`;
  });

  // ── GFM pipe tables ───────────────────────────────────────────────────────
  html = html.replace(/(?:^|\n)((?:\|[^\n]+\|\s*\n)+)/g, (_, tableBlock) => {
    const rows = tableBlock.trim().split('\n').filter(Boolean);
    if (rows.length < 2) return _;
    const isAlignRow = (r) => /^\|[\s:|-]+\|$/.test(r.trim());
    const parseRow = (r) => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim());

    let out = '<table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse">';
    let headerDone = false;
    for (let i = 0; i < rows.length; i++) {
      if (isAlignRow(rows[i])) continue;
      const cells = parseRow(rows[i]);
      if (!headerDone && i === 0) {
        out += '<thead><tr>' + cells.map(c => `<th>${inlineToHtml(c)}</th>`).join('') + '</tr></thead><tbody>';
        headerDone = true;
      } else {
        out += '<tr>' + cells.map(c => `<td>${inlineToHtml(c)}</td>`).join('') + '</tr>';
      }
    }
    out += '</tbody></table>';
    return '\n' + out + '\n';
  });

  // ── Headings ──────────────────────────────────────────────────────────────
  html = html.replace(/^#{4}\s+(.+)$/gm, (_, t) => `<h4>${inlineToHtml(t)}</h4>`);
  html = html.replace(/^#{3}\s+(.+)$/gm, (_, t) => `<h3>${inlineToHtml(t)}</h3>`);
  html = html.replace(/^#{2}\s+(.+)$/gm, (_, t) => `<h2>${inlineToHtml(t)}</h2>`);
  html = html.replace(/^#{1}\s+(.+)$/gm, (_, t) => `<h1>${inlineToHtml(t)}</h1>`);

  // ── Horizontal rules ─────────────────────────────────────────────────────
  html = html.replace(/^(?:---+|===+|\*\*\*+)\s*$/gm, '<hr/>');

  // ── Blockquotes ───────────────────────────────────────────────────────────
  html = html.replace(/(?:^|\n)((?:^>\s?[^\n]*\n?)+)/gm, (_, block) => {
    const inner = block.replace(/^>\s?/gm, '').trim();
    return `\n<blockquote>${inlineToHtml(inner)}</blockquote>\n`;
  });

  // ── Lists ─────────────────────────────────────────────────────────────────
  // Unordered — checkboxes first
  html = html.replace(/(?:^|\n)((?:[ \t]*[-*+]\s+.+\n?)+)/g, (_, block) => {
    const items = block.trim().split('\n');
    const lis = items.map(item => {
      const checkboxMatch = item.match(/^[ \t]*[-*+]\s+\[([ xX])\]\s+(.*)/);
      if (checkboxMatch) {
        const checked = checkboxMatch[1].toLowerCase() === 'x';
        return `<li><input type="checkbox"${checked ? ' checked' : ''} disabled> ${inlineToHtml(checkboxMatch[2])}</li>`;
      }
      const text = item.replace(/^[ \t]*[-*+]\s+/, '');
      return `<li>${inlineToHtml(text)}</li>`;
    }).join('');
    return `\n<ul>${lis}</ul>\n`;
  });

  // Ordered
  html = html.replace(/(?:^|\n)((?:[ \t]*\d+\.\s+.+\n?)+)/g, (_, block) => {
    const items = block.trim().split('\n');
    const lis = items.map(item => {
      const text = item.replace(/^[ \t]*\d+\.\s+/, '');
      return `<li>${inlineToHtml(text)}</li>`;
    }).join('');
    return `\n<ol>${lis}</ol>\n`;
  });

  // ── Paragraphs ────────────────────────────────────────────────────────────
  // Split remaining text on blank lines; wrap plain text blocks in <p>
  const blockTags = /^<(h[1-6]|ul|ol|li|table|thead|tbody|tr|th|td|blockquote|pre|hr|p)/;
  const parts = html.split(/\n{2,}/);
  html = parts.map(part => {
    const trimmed = part.trim();
    if (!trimmed) return '';
    if (blockTags.test(trimmed)) return trimmed;
    return `<p>${inlineToHtml(trimmed.replace(/\n/g, '<br/>'))}</p>`;
  }).filter(Boolean).join('\n');

  return html;
}

// ── Inline transforms ─────────────────────────────────────────────────────

function inlineToHtml(text) {
  if (!text) return '';
  let t = text;

  // Inline code (before bold/italic to avoid nesting)
  t = t.replace(/`([^`]+)`/g, (_, code) => `<code>${escapeHtml(code)}</code>`);

  // Bold + italic
  t = t.replace(/\*{3}(.+?)\*{3}/g, '<strong><em>$1</em></strong>');
  t = t.replace(/_{3}(.+?)_{3}/g, '<strong><em>$1</em></strong>');

  // Bold
  t = t.replace(/\*{2}(.+?)\*{2}/g, '<strong>$1</strong>');
  t = t.replace(/_{2}(.+?)_{2}/g, '<strong>$1</strong>');

  // Italic
  t = t.replace(/\*(.+?)\*/g, '<em>$1</em>');
  t = t.replace(/_(.+?)_/g, '<em>$1</em>');

  // Strikethrough
  t = t.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Links
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) =>
    `<a href="${escapeAttr(href)}">${label}</a>`);

  return t;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

module.exports = { markdownToHtml };
