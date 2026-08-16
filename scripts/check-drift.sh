#!/usr/bin/env bash
#
# Report where this repo's published skills differ from the working copies on
# this machine. Reports only — it never copies, merges or edits anything.
#
# A published skill is the working copy, not a genericised twin of it: every skill
# is written to name no employer, repo, tracker instance or home path, so the two
# copies should be identical. Any divergence is drift to fix, in whichever
# direction is correct — not a deliberate difference.
#
#   LOCAL_SKILLS=... LOCAL_STYLES=... ./scripts/check-drift.sh

set -euo pipefail

LOCAL_SKILLS="${LOCAL_SKILLS:-$HOME/.agents/skills}"
LOCAL_STYLES="${LOCAL_STYLES:-$HOME/.claude/output-styles}"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

md_lines() { find "$1" -name '*.md' -exec cat {} + 2>/dev/null | wc -l; }

report() {
  local repo_dir=$1 local_dir=$2 name=$3
  if [ ! -e "$local_dir" ]; then
    printf '  %-12s %s\n' "absent" "$name"
  elif diff -rq "$repo_dir" "$local_dir" >/dev/null 2>&1; then
    printf '  %-12s %s\n' "identical" "$name"
  else
    local a b
    a=$(md_lines "$repo_dir")
    b=$(md_lines "$local_dir")
    printf '  %-12s %-24s %4d → %4d  (%+d)\n' "diverged" "$name" "$a" "$b" "$((b - a))"
  fi
}

echo
echo "Skills — published (this repo) vs working copy ($LOCAL_SKILLS)"
echo
published=0
for dir in "$REPO"/*/; do
  [ -f "$dir/SKILL.md" ] || continue
  name=$(basename "$dir")
  published=$((published + 1))
  report "$dir" "$LOCAL_SKILLS/$name" "$name"
done

echo
echo "Output styles — published vs working copy ($LOCAL_STYLES)"
echo
for file in "$REPO"/output-styles/*.md; do
  [ -f "$file" ] || continue
  name=$(basename "$file")
  local_file="$LOCAL_STYLES/$name"
  if [ ! -e "$local_file" ]; then
    printf '  %-12s %s\n' "absent" "$name"
  elif cmp -s "$file" "$local_file"; then
    printf '  %-12s %s\n' "identical" "$name"
  else
    printf '  %-12s %-24s %d line(s) differ\n' "diverged" "$name" \
      "$(diff "$file" "$local_file" | grep -c '^[<>]' || true)"
  fi
done
echo
echo "  note: plain-technical-english.md diverges by design — the published"
echo "        Precedence rule names no skill, the working copy names one."

if [ -d "$LOCAL_SKILLS" ]; then
  local_only=$(comm -13 \
    <(find "$REPO" -maxdepth 2 -name SKILL.md -printf '%h\n' | xargs -r -n1 basename | sort) \
    <(find "$LOCAL_SKILLS" -maxdepth 2 -name SKILL.md -printf '%h\n' | xargs -r -n1 basename | sort) \
    | wc -l)
  echo
  printf '  %-12s %d skills on this machine are not published here\n' "local-only" "$local_only"
fi
echo
