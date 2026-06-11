export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let inCode = false;
  let inList = false;
  let inTable = false;

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inTable) {
        html.push('</tbody></table>');
        inTable = false;
      }
      if (inList) {
        html.push('</ul>');
        inList = false;
      }
      html.push(inCode ? '</code></pre>' : '<pre><code>');
      inCode = !inCode;
      continue;
    }

    if (inCode) {
      html.push(`${escapeHtml(line)}\n`);
      continue;
    }

    if (isTableLine(line)) {
      if (!inTable) {
        if (inList) {
          html.push('</ul>');
          inList = false;
        }
        html.push('<table><tbody>');
        inTable = true;
      }
      if (/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line)) continue;
      html.push(`<tr>${splitTable(line).map((cell) => `<td>${inlineMarkdown(cell.trim())}</td>`).join('')}</tr>`);
      continue;
    }

    if (inTable) {
      html.push('</tbody></table>');
      inTable = false;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      html.push(`<li>${inlineMarkdown(line.replace(/^\s*[-*]\s+/, ''))}</li>`);
      continue;
    }

    if (inList) {
      html.push('</ul>');
      inList = false;
    }

    if (/^#{1,6}\s+/.test(line)) {
      const level = Math.min(6, line.match(/^#+/)?.[0].length ?? 2);
      html.push(`<h${level}>${inlineMarkdown(line.replace(/^#{1,6}\s+/, ''))}</h${level}>`);
      continue;
    }

    if (!line.trim()) {
      html.push('');
      continue;
    }

    html.push(`<p>${inlineMarkdown(line)}</p>`);
  }

  if (inCode) html.push('</code></pre>');
  if (inList) html.push('</ul>');
  if (inTable) html.push('</tbody></table>');
  return html.join('\n');
}

export function previewMarkdown(markdown: string, maxLength = 320): string {
  return markdown.replace(/[#*_`>\-|]/g, '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function inlineMarkdown(value: string): string {
  const escaped = escapeHtml(value);
  return escaped
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" rel="noreferrer">$1</a>');
}

function isTableLine(line: string): boolean {
  return line.includes('|') && line.trim().split('|').length >= 3;
}

function splitTable(line: string): string[] {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|');
}
