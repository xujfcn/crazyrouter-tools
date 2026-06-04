#!/usr/bin/env bash
set -euo pipefail

# agent_worktree_launcher.sh
#
# Recreate the "background coding agent" pattern without depending on Cursor-specific
# infrastructure: each async task gets a git worktree, a packet, a trace file, and a
# merge/review gate.
#
# Usage:
#   tools/agent_workflows/agent_worktree_launcher.sh \
#     --repo . \
#     --task "Add billing CSV export" \
#     --base main \
#     --out generated/background_agents/demo \
#     --mode dry-run
#
# Modes:
#   dry-run  Create packet + commands only. Does not modify git worktrees.
#   create   Create a branch/worktree and packet. Requires a clean git repo.

MODE="dry-run"
REPO="."
TASK=""
BASE="main"
OUT=""
AGENT_NAME="background-agent"
BASE_URL="https://cn.crazyrouter.com/v1"

usage() {
  sed -n '2,34p' "$0" | sed 's/^# \{0,1\}//'
}

slugify() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g; s/--+/-/g'
}

json_escape() {
  python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))'
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode) MODE="$2"; shift 2 ;;
    --repo) REPO="$2"; shift 2 ;;
    --task) TASK="$2"; shift 2 ;;
    --base) BASE="$2"; shift 2 ;;
    --out) OUT="$2"; shift 2 ;;
    --agent-name) AGENT_NAME="$2"; shift 2 ;;
    --base-url) BASE_URL="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

if [[ -z "$TASK" ]]; then
  echo "--task is required" >&2
  exit 2
fi

SLUG="$(slugify "$TASK")"
[[ -n "$SLUG" ]] || SLUG="background-task"
[[ -n "$OUT" ]] || OUT="generated/background_agents/$SLUG"
BRANCH="agent/$SLUG"
WORKTREE_DIR="$OUT/worktrees/$SLUG"
PACKET_DIR="$OUT/packets"
TRACE="$OUT/trace.jsonl"
mkdir -p "$PACKET_DIR" "$OUT/commands" "$OUT/review"
: > "$TRACE"

cat > "$OUT/README.md" <<EOF
# Background Agent Worktree: $TASK

This folder recreates the Cursor-style background-agent pattern with plain git worktrees.

## Pattern

1. Keep the main working tree stable.
2. Launch isolated async tasks in separate git worktrees.
3. Give each task a clear packet: scope, constraints, commands, and done criteria.
4. Require review gates before merging back.
5. Log every step in JSONL so async work is inspectable.

## Base URL for model calls

\`$BASE_URL\`

## Suggested flow

\`\`\`bash
bash $0 --repo $REPO --task "$TASK" --base $BASE --out $OUT --mode create
# Run an AI coding agent inside: $WORKTREE_DIR
# Then inspect diff and review packet before merge.
\`\`\`
EOF

cat > "$PACKET_DIR/01-background-agent.md" <<EOF
# Background Agent Packet

## Task
$TASK

## Agent name
$AGENT_NAME

## Isolation rule
Work only inside this git worktree:

\`\`\`text
$WORKTREE_DIR
\`\`\`

Do not modify the main working tree.

## Branch
\`$BRANCH\` from \`$BASE\`.

## Required output
- Summary of changes
- Files touched
- Test/build commands run
- Risks and assumptions
- Diff link or \`git diff --stat\`
- Merge recommendation: merge / request changes / abandon

## Review gate
A human or reviewer model must inspect:

\`\`\`bash
git -C $WORKTREE_DIR diff $BASE...HEAD
git -C $WORKTREE_DIR status --short
\`\`\`

## Model routing note
Use a stronger model for planning/review and a cheaper or coding-optimized model for routine implementation through:

\`$BASE_URL\`
EOF

cat > "$OUT/commands/create-worktree.sh" <<EOF
#!/usr/bin/env bash
set -euo pipefail
git -C "$REPO" fetch --all --prune || true
git -C "$REPO" worktree add -b "$BRANCH" "$WORKTREE_DIR" "$BASE"
printf 'Worktree ready: %s\n' "$WORKTREE_DIR"
EOF
chmod +x "$OUT/commands/create-worktree.sh"

cat > "$OUT/commands/review-before-merge.sh" <<EOF
#!/usr/bin/env bash
set -euo pipefail
git -C "$WORKTREE_DIR" status --short
git -C "$WORKTREE_DIR" diff --stat "$BASE"...HEAD
git -C "$WORKTREE_DIR" diff "$BASE"...HEAD > "$OUT/review/diff.patch"
printf 'Saved diff to %s\n' "$OUT/review/diff.patch"
EOF
chmod +x "$OUT/commands/review-before-merge.sh"

python3 - <<PY
import json, time, pathlib
trace = pathlib.Path('$TRACE')
for event in [
  {'event':'packet-created','task':'$TASK','branch':'$BRANCH','worktree':'$WORKTREE_DIR','mode':'$MODE'},
  {'event':'review-gate-created','commands':['$OUT/commands/create-worktree.sh','$OUT/commands/review-before-merge.sh']},
]:
  event['ts']=time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
  trace.open('a', encoding='utf-8').write(json.dumps(event, ensure_ascii=False)+'\n')
PY

if [[ "$MODE" == "create" ]]; then
  if [[ -n "$(git -C "$REPO" status --short)" ]]; then
    echo "Repo has uncommitted changes. Refusing to create worktree; use dry-run or commit/stash first." >&2
    exit 1
  fi
  "$OUT/commands/create-worktree.sh"
elif [[ "$MODE" != "dry-run" ]]; then
  echo "Unknown --mode: $MODE" >&2
  exit 2
fi

printf '%s\n' "$OUT"
