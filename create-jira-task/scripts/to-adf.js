#!/usr/bin/env node
// Convert a plain-text block to an Atlassian Document Format (ADF) doc object.
// Template custom fields (Background / Acceptance Criteria / Technical Requirements)
// are textareas that reject markdown — they need ADF JSON. This makes that
// conversion deterministic instead of hand-built per ticket.
//
// Input: text on stdin (or as argv[2]). Rules:
//   - Blank line separates blocks.
//   - A run of lines each starting with "- " becomes one bulletList.
//   - Any other block becomes a paragraph (internal newlines -> hardBreak).
// Output: ADF doc object as JSON on stdout.
//
// Usage:  echo "$TEXT" | node to-adf.js
//         node to-adf.js "$TEXT"

function text(t) {
  return { type: 'text', text: t };
}

function paragraph(lines) {
  const content = [];
  lines.forEach((line, i) => {
    if (i > 0) content.push({ type: 'hardBreak' });
    if (line) content.push(text(line));
  });
  return { type: 'paragraph', content: content.length ? content : [text('')] };
}

function bulletList(items) {
  return {
    type: 'bulletList',
    content: items.map((item) => ({
      type: 'listItem',
      content: [{ type: 'paragraph', content: [text(item)] }],
    })),
  };
}

function toAdf(input) {
  const blocks = input.replace(/\r\n/g, '\n').split(/\n\s*\n/);
  const content = [];
  for (const block of blocks) {
    const lines = block.split('\n').filter((l) => l.trim().length);
    if (!lines.length) continue;
    const isList = lines.every((l) => l.trimStart().startsWith('- '));
    if (isList) {
      content.push(bulletList(lines.map((l) => l.trimStart().slice(2).trim())));
    } else {
      content.push(paragraph(lines));
    }
  }
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
