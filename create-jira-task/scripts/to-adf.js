#!/usr/bin/env node
// Convert a plain-text block to an Atlassian Document Format (ADF) doc object.
// Template custom fields (Background / Acceptance Criteria / Technical Requirements)
// are textareas that reject markdown — they need ADF JSON. This makes that
// conversion deterministic instead of hand-built per ticket.
//
// Input: text on stdin (or as argv[2]). Rules:
//   - A ```-fenced block becomes a codeBlock, content preserved verbatim
//     (including blank lines) so an ASCII diagram keeps its alignment.
//   - Outside a fence, a blank line separates blocks.
//   - A single line starting with 1-6 `#` becomes an ADF heading at that level.
//   - A block containing a line starting with "- " becomes one bulletList; a
//     line that doesn't start with "- " is a wrapped continuation of the
//     bullet above it, not a bullet of its own.
//   - Inline markdown inside a paragraph, heading, or list item text:
//     `` `code` `` becomes an ADF code mark (its content is never itself
//     parsed for markdown), `**bold**` becomes an ADF strong mark, and
//     `[text](url)` becomes a real ADF link mark when the url is absolute
//     (http/https) — a relative or local path (a plan file) drops the link
//     and keeps only the text, since a plan path must never reach the
//     tracker, linked or not.
//   - Any other block becomes one paragraph, its lines joined with a single
//     space — plan prose is hand-wrapped for the markdown source's own line
//     width, and that wrap point isn't a real line break the reader should
//     see reproduced as one in Jira.
// Output: ADF doc object as JSON on stdout.
//
// Usage:  echo "$TEXT" | node to-adf.js
//         node to-adf.js "$TEXT"

function text(t, marks) {
  const node = { type: 'text', text: t };
  if (marks) node.marks = marks;
  return node;
}

// Order matters: code spans first, since backtick content must never be
// re-parsed for `**bold**` or `[link](url)` markdown inside it.
const INLINE_RE = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;

function parseInline(line) {
  const nodes = [];
  let lastIndex = 0;
  let match;
  INLINE_RE.lastIndex = 0;
  while ((match = INLINE_RE.exec(line)) !== null) {
    if (match.index > lastIndex) nodes.push(text(line.slice(lastIndex, match.index)));
    const [, code, bold, label, href] = match;
    if (code !== undefined) {
      nodes.push(text(code, [{ type: 'code' }]));
    } else if (bold !== undefined) {
      nodes.push(text(bold, [{ type: 'strong' }]));
    } else {
      nodes.push(/^https?:\/\//.test(href) ? text(label, [{ type: 'link', attrs: { href } }]) : text(label));
    }
    lastIndex = INLINE_RE.lastIndex;
  }
  if (lastIndex < line.length) nodes.push(text(line.slice(lastIndex)));
  return nodes.length ? nodes : [text('')];
}

function paragraph(lines) {
  const merged = lines.filter((l) => l.length).join(' ');
  return { type: 'paragraph', content: merged ? parseInline(merged) : [text('')] };
}

function heading(level, line) {
  return { type: 'heading', attrs: { level }, content: parseInline(line) };
}

function bulletList(items) {
  return {
    type: 'bulletList',
    content: items.map((item) => ({
      type: 'listItem',
      content: [{ type: 'paragraph', content: parseInline(item) }],
    })),
  };
}

function codeBlock(code) {
  return { type: 'codeBlock', attrs: {}, content: [text(code)] };
}

const HEADING_RE = /^(#{1,6})\s+(.*)$/;

function mergeWrappedListItems(lines) {
  const items = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) {
      items.push(trimmed.slice(2).trim());
    } else if (items.length) {
      items[items.length - 1] += ' ' + trimmed;
    }
  }
  return items;
}

function blocksFromText(input) {
  const blocks = input.split(/\n\s*\n/);
  const content = [];
  for (const block of blocks) {
    const lines = block.split('\n').filter((l) => l.trim().length);
    if (!lines.length) continue;
    const headingMatch = lines.length === 1 && lines[0].match(HEADING_RE);
    const looksLikeList = lines.some((l) => l.trimStart().startsWith('- '));
    if (headingMatch) {
      content.push(heading(headingMatch[1].length, headingMatch[2]));
    } else if (looksLikeList) {
      content.push(bulletList(mergeWrappedListItems(lines)));
    } else {
      content.push(paragraph(lines));
    }
  }
  return content;
}

function toAdf(input) {
  const normalized = input.replace(/\r\n/g, '\n');
  const fence = /```[^\n]*\n([\s\S]*?)\n?```/g;
  const content = [];
  let lastIndex = 0;
  let match;
  while ((match = fence.exec(normalized)) !== null) {
    content.push(...blocksFromText(normalized.slice(lastIndex, match.index)));
    content.push(codeBlock(match[1]));
    lastIndex = fence.lastIndex;
  }
  content.push(...blocksFromText(normalized.slice(lastIndex)));
  return { type: 'doc', version: 1, content: content.length ? content : [paragraph([''])] };
}

const arg = process.argv[2];
if (arg !== undefined) {
  process.stdout.write(JSON.stringify(toAdf(arg)));
} else {
  let buf = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => (buf += d));
  process.stdin.on('end', () => process.stdout.write(JSON.stringify(toAdf(buf))));
}
