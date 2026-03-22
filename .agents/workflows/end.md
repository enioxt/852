---
description: end workflow
---
# /end — Session Finalization (v5.5)

> **Sacred Code:** 000.111.369.963.1618
> **Works in:** ANY EGOS repo
> **Auto-trigger:** Context Tracker reaches ⛔ CRITICAL (CTX 280+) → agent executes /end autonomously

## Phase 1: Collect Session Data // turbo

```bash
ROOT="$PWD"; CUR="$ROOT"
while [ "$CUR" != "/" ] && [ ! -e "$CUR/.git" ]; do CUR="$(dirname "$CUR")"; done
[ -e "$CUR/.git" ] && ROOT="$CUR"
export ROOT

printf "📂 Repo: %s | Last: %s | Uncommitted: %s | Session commits: %s\n" \
  "$(basename "$ROOT")" \
  "$(git -C "$ROOT" log --oneline -1 2>/dev/null)" \
  "$(git -C "$ROOT" status --short 2>/dev/null | wc -l)" \
  "$(git -C "$ROOT" log --oneline --since='6 hours ago' 2>/dev/null | wc -l)"
git -C "$ROOT" log --oneline --since="6 hours ago" 2>/dev/null || git -C "$ROOT" log --oneline -5
[ -f "$ROOT/TASKS.md" ] && printf "📝 TASKS.md: %s lines\n" "$(wc -l < "$ROOT/TASKS.md")"
[ -f "$ROOT/egos.config.json" ] && printf "🏷️  Role: %s\n" "$(cat "$ROOT/egos.config.json" | grep -o '"role": "[^"]*"')" || printf "🏷️  Role: (no egos.config.json — heuristic detection)\n"
```

## Phase 2: Agent Handoff Generation

The agent MUST create `docs/_current_handoffs/handoff_YYYY-MM-DD.md`.

Required sections:
- `Accomplished` — bullet list with file links
- `In Progress` — include % completion
- `Blocked` — reason + required action
- `Next Steps` — ordered by priority
- `Environment State` — builds/tests status with evidence
- `Decision Trail` — selected `ask_user_question` branches/options

## Phase 3: Update TASKS.md

The agent SHALL ensure `TASKS.md` reflects the current state:
- Mark completed tasks with `[x]`
- Mark in-progress with `[/]`
- Add newly discovered tasks
- Update version + `LAST SESSION` line

## Phase 4: Documentation Freshness Check (BLOCKING)

The agent MUST verify documentation is current before finalizing.
**The agent SHALL NOT finalize `/end` if:**
1. Code changed in `src/app/api/` or `src/lib/` AND `SYSTEM_MAP.md` not updated in session
2. New capability added AND `AGENTS.md` capabilities table not updated
3. `TASKS.md` not reflecting current state

## Phase 4.1: Security Dependency Check (BLOCKING)
The agent MUST run a vulnerability scan / check `package.json` logic or `grep UNMITIGATED docs/gem-hunter/secops-*.md`.
If an active CVE affecting the stack (e.g. CVE-2026-3910 for Chromium) is unaccounted for, the session CANNOT END until patched or explicitly overridden by the user.

## Phase 5: Disseminate Knowledge

Before ending, the agent MUST persist knowledge:
| Condition | Required action |
|------|----------------|
| Any session | `create_memory()` with patterns, decisions, gotchas |
| SecOps Mitigated | Distribute patch pattern to `HARVEST.md` |
| Meta-prompt trigger suspected | Check `.guarani/prompts/triggers.json` |
| Architecture changed | Document in `.guarani/` or repo docs |
| Kernel governance / workflows changed | Run `bun run governance:sync:exec` then `bun run governance:check` |
| New reusable pattern | Append to `docs/knowledge/HARVEST.md` |
| Capability created / improved / adopted | Update `docs/CAPABILITY_REGISTRY.md` + `SYSTEM_MAP.md` |
| Chatbot surface changed | Re-check `docs/modules/CHATBOT_SSOT.md` adoption table + rollout protocol |
| Agents / dashboards / mesh claims changed | Apply `.windsurf/workflows/mycelium.md` logic and add maturity snapshot to handoff |

## Phase 6: Codex Cleanup

```bash
if command -v codex &> /dev/null; then
  codex --version 2>/dev/null && codex cloud list 2>/dev/null | head -5 || true
  [ "$(git -C "$ROOT" status --short 2>/dev/null | wc -l)" -gt 0 ] && codex review --uncommitted 2>/dev/null || true
else
  printf "Codex not installed\n"
fi
```

## Phase 7: Commit If Needed // turbo

```bash
UNCOMMITTED=$(git -C "$ROOT" status --short 2>/dev/null | wc -l)
if [ "$UNCOMMITTED" -gt 0 ]; then
  printf "⚠️  %s uncommitted files — commit now or state explicitly in handoff why not.\n" "$UNCOMMITTED"
  git -C "$ROOT" status --short
fi
```

## Phase 8: Session Summary

The agent MUST display this structure in chat:
```text
SESSION SUMMARY
===============
Repo: [name]
Commits: [N] this session
Security: [Patched CVEs or Clean]
Files changed: [list key files]
What was done: [2-4 lines]
Next steps: [P0/P1 priorities]
Meta-prompts used: [any triggered?]
Context Tracker: [final CTX value/280] [zone emoji]
Signed by: cascade-agent — [ISO8601]
```

---
_v5.5 — Added Phase 4.1 (Security Dependency Check) and Security Status in Session Summary._
