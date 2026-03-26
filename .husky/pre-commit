# EGOS Pre-Commit Canônico — Especificação v1.0

> **Aplicação:** Todos os repositórios EGOS (kernel, lab, leaf nodes)
> **Princípio:** FAST blocking checks only (~20-30s total)
> **Local:** `.husky/pre-commit` (kernel canoniza, leaf repos copiam)

---

## 1. Estrutura do Pre-Commit

```bash
#!/bin/sh
# EGOS Pre-Commit Canônico v1.0
# Aplicação: Todos os repositórios EGOS
# Tempo máximo: 30 segundos

set -eu

PRE_START=$(date +%s)

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

step_time() { echo "  ⏱️ $(( $(date +%s) - $1 ))s"; }

# ============================================
# CHECK 1: TypeScript/JavaScript Lint (FAST)
# ============================================
T=$(date +%s)
echo "⚡ [1/6] Type check..."

if [ -f "package.json" ]; then
  # Next.js/React project
  npm run typecheck 2>/dev/null || npx tsc --noEmit 2>/dev/null || true
elif [ -f "bun.lockb" ] || [ -f "bun.lock" ]; then
  # Bun project
  bun run typecheck 2>/dev/null || bunx tsc --noEmit 2>/dev/null || true
fi
step_time $T

# ============================================
# CHECK 2: Secrets Scan (FAST — BLOCKING)
# ============================================
T=$(date +%s)
echo "⚡ [2/6] Secrets scan..."

STAGED=$(git diff --cached --name-only)
SECRETS_FOUND=0

# Check for API keys in staged files (excluding .env and examples)
if echo "$STAGED" | xargs grep -l -E \
  '(sk-[a-zA-Z0-9]{20,}|\\b[0-9a-f]{32}\\b|\\b[0-9a-f]{40}\\b|postgres://[^\s]+|mongodb\+srv://[^\s]+)' \
  2>/dev/null | grep -vE '\\.(env\\.example|example\\.env|sample)$' | grep -v '\\.env' | head -5; then
  echo "${RED}❌ BLOCKED: Possible secrets/API keys in staged files!${NC}"
  SECRETS_FOUND=1
fi

# Gitleaks if available
if command -v gitleaks >/dev/null 2>&1; then
  gitleaks protect --staged --no-banner 2>/dev/null || SECRETS_FOUND=1
fi

if [ "$SECRETS_FOUND" -eq 1 ]; then
  exit 1
fi
step_time $T

# ============================================
# CHECK 3: Doc Proliferation (FAST — BLOCKING)
# ============================================
T=$(date +%s)
echo "⚡ [3/6] Doc proliferation check..."

NEW_DOCS=$(git diff --cached --name-only --diff-filter=A | grep '^docs/' || true)
VIOLATIONS=0

if [ -n "$NEW_DOCS" ]; then
  while IFS= read -r file; do
    # Skip allowed folders
    if [[ "$file" =~ ^docs/_generated/ ]] || [[ "$file" =~ ^docs/_archived(_handoffs)?/ ]]; then
      continue
    fi
    
    # Block timestamped docs
    if [[ "$file" =~ _20[0-9]{2}-[0-9]{2} ]]; then
      echo "${RED}❌ BLOCKED: $file (timestamped)${NC}"
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
    
    # Block AUDIT/DIAGNOSTIC/REPORT files
    if [[ "$file" =~ (AUDIT|DIAGNOSTIC|REPORT).*\\.md$ ]]; then
      echo "${RED}❌ BLOCKED: $file (update AGENTS.md/SYSTEM_MAP.md instead)${NC}"
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
    
    # Block CHECKLIST files
    if [[ "$file" =~ CHECKLIST.*\\.md$ ]]; then
      echo "${RED}❌ BLOCKED: $file (use TASKS.md instead)${NC}"
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
    
  done <<< "$NEW_DOCS"
fi

if [ "$VIOLATIONS" -gt 0 ]; then
  echo "${RED}❌ COMMIT BLOCKED: $VIOLATIONS doc proliferation violation(s)${NC}"
  exit 1
fi
step_time $T

# ============================================
# CHECK 4: SSOT File Size Limits (FAST)
# ============================================
T=$(date +%s)
echo "⚡ [4/6] SSOT size check..."

check_lines() {
  _file="$1"; _max="$2"
  if [ -f "$_file" ]; then
    _lines=$(wc -l < "$_file")
    if [ "$_lines" -gt "$_max" ]; then
      echo "${YELLOW}⚠️  $_file: $_lines lines (max: $_max)${NC}"
      # Warning only, not blocking
    fi
  fi
}

check_lines "AGENTS.md" 200
check_lines "TASKS.md" 500
check_lines ".windsurfrules" 200
check_lines "docs/SYSTEM_MAP.md" 300

step_time $T

# ============================================
# CHECK 5: Handoff Archive Check (FAST — WARNING)
# ============================================
T=$(date +%s)
echo "⚡ [5/6] Handoff freshness check..."

if [ -d "docs/_current_handoffs" ]; then
  HANDOFF_COUNT=$(find docs/_current_handoffs -name "*.md" -type f 2>/dev/null | wc -l)
  if [ "$HANDOFF_COUNT" -gt 5 ]; then
    echo "${YELLOW}⚠️  $HANDOFF_COUNT handoffs in _current_handoffs/ (archive >30 days old)${NC}"
  fi
fi

step_time $T

# ============================================
# CHECK 6: Governance Sync Hint (NON-BLOCKING)
# ============================================
T=$(date +%s)
echo "⚡ [6/6] Governance check..."

# Check if canonical governance files changed
if echo "$STAGED" | grep -Eq '^\\.guarani/|^\\.windsurfrules$|^AGENTS\\.md$|^TASKS\\.md$'; then
  if [ -x "$HOME/.egos/bin/egos-gov" ]; then
    "$HOME/.egos/bin/egos-gov" check --quiet 2>/dev/null || {
      echo "${YELLOW}⚠️  Governance drift detected. Run: egos-gov sync${NC}"
    }
  fi
fi

step_time $T

# ============================================
# RESUMO
# ============================================
TOTAL=$(( $(date +%s) - PRE_START ))
echo "${GREEN}✅ Pre-commit concluído em ${TOTAL}s${NC}"
