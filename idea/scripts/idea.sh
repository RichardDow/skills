#!/usr/bin/env bash
# idea.sh — capture/list/bury/revive ideas as one markdown file each.
set -euo pipefail

# Resolve ideas dir. Override with IDEAS_DIR env.
# From repo root: docs/ideas. From inside docs/: ideas.
if [[ -n "${IDEAS_DIR:-}" ]]; then
  DIR="$IDEAS_DIR"
elif [[ -d docs ]]; then
  DIR="docs/ideas"
else
  DIR="ideas"
fi
GRAVE="$DIR/graveyard"

slug() {
  echo "$1" | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//' | cut -c1-50
}

cmd="${1:-help}"; shift || true

case "$cmd" in
  new)
    title="${1:-}"; [[ -z "$title" ]] && { echo "need title"; exit 1; }
    shift || true
    tags="${*:-}"                          # remaining args = tags, space-sep
    mkdir -p "$DIR"
    date="$(date +%F)"
    file="$DIR/$date-$(slug "$title").md"
    [[ -e "$file" ]] && file="$DIR/$date-$(slug "$title")-$(date +%H%M%S).md"
    {
      echo "---"
      echo "title: $title"
      echo "date: $date"
      echo "status: seed"                  # seed -> alive -> dead
      echo "tags: [${tags// /, }]"
      echo "---"
      echo ""
    } > "$file"
    echo "$file"
    ;;

  list)
    [[ -d "$DIR" ]] || { echo "no ideas yet"; exit 0; }
    echo "# alive"
    for f in "$DIR"/*.md; do
      [[ -e "$f" ]] || continue
      st=$(sed -n 's/^status: //p' "$f" | head -1)
      ti=$(sed -n 's/^title: //p' "$f" | head -1)
      printf '  [%s] %s  (%s)\n' "${st:-?}" "$ti" "$f"
    done
    if [[ -d "$GRAVE" ]]; then
      n=$(find "$GRAVE" -name '*.md' | wc -l)
      echo "# graveyard: $n"
    fi
    ;;

  bury)
    f="${1:-}"; [[ -z "$f" || ! -e "$f" ]] && { echo "need existing file"; exit 1; }
    reason="${2:-}"
    mkdir -p "$GRAVE"
    # flip status, append reason
    sed -i 's/^status: .*/status: dead/' "$f"
    [[ -n "$reason" ]] && sed -i "/^status: dead/a reason: $reason" "$f"
    dest="$GRAVE/$(basename "$f")"
    mv "$f" "$dest"
    echo "buried -> $dest"
    ;;

  revive)
    f="${1:-}"; [[ -z "$f" || ! -e "$f" ]] && { echo "need existing file"; exit 1; }
    mkdir -p "$DIR"
    sed -i 's/^status: .*/status: alive/; /^reason: /d' "$f"
    dest="$DIR/$(basename "$f")"
    mv "$f" "$dest"
    echo "revived -> $dest"
    ;;

  *)
    cat <<EOF
idea.sh — one file per idea, most will die.
  new "<title>" [tags...]   create seed, prints path
  list                      show alive ideas + graveyard count
  bury <file> ["reason"]    mark dead, move to graveyard/
  revive <file>             move back, mark alive
env: IDEAS_DIR overrides target dir (default docs/ideas)
EOF
    ;;
esac
