#!/usr/bin/env python3
"""Render one or more title-bar ASCII boxes for the box-bordered forms in
FORMS.md — Pseudocode boxes and State/ER entity boxes.

Every content line is padded to one fixed inner width, and the top/bottom
borders are built to that same exact width, so a box cannot come out
misaligned the way a hand-typed one can. This replaces the manual
column-by-column check in FORMS.md for the box shape specifically — the
script's own check below is the proof, not a human re-count.

Input: a JSON array of boxes on stdin, each `{"title": str, "lines": [str, ...]}`.
Multiple boxes print with one blank line between them, matching how FORMS.md
shows a before/after pair or several State/ER entities together.

Usage:
    python3 box.py <<'JSON'
    [
      {"title": "example.ts - before", "lines": ["do_thing()"]},
      {"title": "example.ts - after",  "lines": ["do_thing(opts)"]}
    ]
    JSON

Limitation: width is measured in Unicode code points (`len()`), not display
columns, so a line holding a wide character (CJK, emoji) will under-pad. The
forms this script covers hold code and prose, not wide-character content, so
this hasn't needed solving.
"""
import json
import sys


def render_box(title, lines):
    content_w = max((len(line) for line in lines), default=0)
    # Wide enough for the longest content line ("│ " + line + " │"), and
    # for the title with at least one dash before "┐" — whichever is bigger.
    total_w = max(content_w + 4, len(title) + 6)
    inner_w = total_w - 4
    n_dash = total_w - 5 - len(title)

    rows = ["┌─ " + title + " " + "─" * n_dash + "┐"]
    for line in lines:
        rows.append("│ " + line.ljust(inner_w) + " │")
    rows.append("└" + "─" * (total_w - 2) + "┘")
    return rows


def check_aligned(rows, title):
    widths = {len(row) for row in rows}
    if len(widths) != 1:
        raise SystemExit(
            f'box "{title}" misaligned: line widths {sorted(widths)} — this is a bug '
            "in box.py, not something to fix by hand"
        )


def main():
    raw = sys.stdin.read()
    try:
        boxes = json.loads(raw)
    except json.JSONDecodeError as e:
        raise SystemExit(f"box.py expects a JSON array on stdin: {e}")

    if not isinstance(boxes, list) or not boxes:
        raise SystemExit('box.py expects a JSON array like [{"title": "...", "lines": ["..."]}]')

    rendered = []
    for i, box in enumerate(boxes):
        if not isinstance(box, dict) or "title" not in box or "lines" not in box:
            raise SystemExit(f'box {i} needs both "title" and "lines"')
        rows = render_box(box["title"], box["lines"])
        check_aligned(rows, box["title"])
        rendered.append(rows)

    print("\n\n".join("\n".join(rows) for rows in rendered))


if __name__ == "__main__":
    main()
