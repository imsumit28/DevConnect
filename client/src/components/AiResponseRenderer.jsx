import React from 'react';

/**
 * Lightweight markdown renderer for AI responses.
 * Handles: headings, bold, italic, inline code, code blocks, lists, line breaks.
 * No external dependencies.
 */
const AiResponseRenderer = ({ content }) => {
  if (!content) return null;

  const renderInline = (text, keyPrefix = '') => {
    // Process inline markdown: bold, italic, inline code
    const parts = [];
    let remaining = text;
    let i = 0;

    while (remaining.length > 0) {
      // Inline code `...`
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        parts.push(
          <code key={`${keyPrefix}-${i}`} className="ai-inline-code">{codeMatch[1]}</code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        i++;
        continue;
      }

      // Bold **...**
      const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
      if (boldMatch) {
        parts.push(<strong key={`${keyPrefix}-${i}`} className="ai-bold">{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch[0].length);
        i++;
        continue;
      }

      // Italic *...*
      const italicMatch = remaining.match(/^\*(.+?)\*/);
      if (italicMatch) {
        parts.push(<em key={`${keyPrefix}-${i}`}>{italicMatch[1]}</em>);
        remaining = remaining.slice(italicMatch[0].length);
        i++;
        continue;
      }

      // Regular text — consume one character at a time until next special char
      const nextSpecial = remaining.slice(1).search(/[`*]/);
      if (nextSpecial === -1) {
        parts.push(<span key={`${keyPrefix}-${i}`}>{remaining}</span>);
        remaining = '';
      } else {
        parts.push(<span key={`${keyPrefix}-${i}`}>{remaining.slice(0, nextSpecial + 1)}</span>);
        remaining = remaining.slice(nextSpecial + 1);
      }
      i++;
    }

    return parts;
  };

  const lines = content.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code blocks ```...```
    if (line.trim().startsWith('```')) {
      const lang = line.trim().replace('```', '').trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <div key={`block-${i}`} className="ai-code-block">
          {lang && <div className="ai-code-lang">{lang}</div>}
          <pre><code>{codeLines.join('\n')}</code></pre>
        </div>
      );
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(<h4 key={`h-${i}`} className="ai-h3">{renderInline(line.slice(4), `h3-${i}`)}</h4>);
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<h3 key={`h-${i}`} className="ai-h2">{renderInline(line.slice(3), `h2-${i}`)}</h3>);
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(<h2 key={`h-${i}`} className="ai-h1">{renderInline(line.slice(2), `h1-${i}`)}</h2>);
      i++;
      continue;
    }

    // Unordered list items
    if (/^[\-\*]\s/.test(line.trim())) {
      const listItems = [];
      while (i < lines.length && /^[\-\*]\s/.test(lines[i].trim())) {
        listItems.push(
          <li key={`li-${i}`}>{renderInline(lines[i].trim().slice(2), `li-${i}`)}</li>
        );
        i++;
      }
      elements.push(<ul key={`ul-${i}`} className="ai-list">{listItems}</ul>);
      continue;
    }

    // Numbered list items
    if (/^\d+\.\s/.test(line.trim())) {
      const listItems = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        const text = lines[i].trim().replace(/^\d+\.\s/, '');
        listItems.push(
          <li key={`oli-${i}`}>{renderInline(text, `oli-${i}`)}</li>
        );
        i++;
      }
      elements.push(<ol key={`ol-${i}`} className="ai-list ai-list-ordered">{listItems}</ol>);
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={`hr-${i}`} className="ai-hr" />);
      i++;
      continue;
    }

    // Empty line → spacing
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${i}`} className="ai-paragraph">{renderInline(line, `p-${i}`)}</p>
    );
    i++;
  }

  return <div className="ai-response-content">{elements}</div>;
};

export default AiResponseRenderer;
