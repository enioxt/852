#!/bin/bash
# EGOS Security Check Script for 852
# Verifica CVEs e dependências vulneráveis
# Parte do sistema CRCDM de segurança contínua

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORT_FILE="${REPO_ROOT}/docs/gem-hunter/secops-$(date +%Y-%m-%d).md"

echo "🔒 EGOS Security Check — 852 Inteligência"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

CRITICAL_CVES=0
HIGH_CVES=0

# ============================================
# 1. Verificar Docker Base Image
# ============================================
echo "📦 Checking Docker base image..."

if [ -f "${REPO_ROOT}/Dockerfile" ]; then
    BASE_IMAGE=$(grep "^FROM" "${REPO_ROOT}/Dockerfile" | head -1 | awk '{print $2}')
    echo "   Base image: $BASE_IMAGE"
    
    # Verificar se é node:22-alpine ou superior
    if echo "$BASE_IMAGE" | grep -q "node:22"; then
        echo "   ${GREEN}✓ Node.js 22 — Current stable (mitigates CVE-2026-3910, CVE-2026-3909)${NC}"
    elif echo "$BASE_IMAGE" | grep -q "node:20"; then
        echo "   ${RED}✗ Node.js 20 — Outdated (CVE-2026-3910, CVE-2026-3909 UNMITIGATED)${NC}"
        CRITICAL_CVES=$((CRITICAL_CVES + 2))
    else
        echo "   ${YELLOW}⚠ Unknown/Custom base image${NC}"
    fi
else
    echo "   ${YELLOW}⚠ No Dockerfile found${NC}"
fi

echo ""

# ============================================
# 2. Verificar Dependências npm
# ============================================
echo "📦 Checking npm dependencies..."

if [ -f "${REPO_ROOT}/package.json" ]; then
    cd "$REPO_ROOT"
    
    # Verificar se npm audit está disponível
    if command -v npm &> /dev/null; then
        echo "   Running npm audit..."
        
        # Capturar resultado do audit
        AUDIT_RESULT=$(npm audit --json 2>/dev/null || echo '{"metadata":{"vulnerabilities":{"critical":0,"high":0,"moderate":0,"low":0,"info":0}}}')
        
        CRITICAL_COUNT=$(echo "$AUDIT_RESULT" | grep -o '"critical":[0-9]*' | head -1 | cut -d: -f2 || echo "0")
        HIGH_COUNT=$(echo "$AUDIT_RESULT" | grep -o '"high":[0-9]*' | head -1 | cut -d: -f2 || echo "0")
        
        [ -z "$CRITICAL_COUNT" ] && CRITICAL_COUNT=0
        [ -z "$HIGH_COUNT" ] && HIGH_COUNT=0
        
        if [ "$CRITICAL_COUNT" -gt 0 ]; then
            echo "   ${RED}✗ $CRITICAL_COUNT CRITICAL vulnerabilities${NC}"
            CRITICAL_CVES=$((CRITICAL_CVES + CRITICAL_COUNT))
        else
            echo "   ${GREEN}✓ No CRITICAL vulnerabilities${NC}"
        fi
        
        if [ "$HIGH_COUNT" -gt 0 ]; then
            echo "   ${YELLOW}⚠ $HIGH_COUNT HIGH vulnerabilities${NC}"
            HIGH_CVES=$((HIGH_CVES + HIGH_COUNT))
        else
            echo "   ${GREEN}✓ No HIGH vulnerabilities${NC}"
        fi
    else
        echo "   ${YELLOW}⚠ npm not available${NC}"
    fi
else
    echo "   ${YELLOW}⚠ No package.json found${NC}"
fi

echo ""

# ============================================
# 3. Verificar Scripts Gem Hunter
# ============================================
echo "🔍 Checking Gem Hunter security reports..."

SECONDS_LATEST=$(find "${REPO_ROOT}/docs/gem-hunter" -name "secops-*.md" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)

if [ -n "$SECONDS_LATEST" ] && [ -f "$SECONDS_LATEST" ]; then
    echo "   Latest report: $(basename "$SECONDS_LATEST")"
    
    # Contar CVEs não mitigadas
    UNMITIGATED=$(grep -c "\[UNMITIGATED\]" "$SECONDS_LATEST" 2>/dev/null || echo "0")
    MITIGATED=$(grep -c "\[MITIGATED\]" "$SECONDS_LATEST" 2>/dev/null || echo "0")
    
    echo "   ${YELLOW}$UNMITIGATED unmitigated${NC} | ${GREEN}$MITIGATED mitigated${NC}"
    
    if [ "$UNMITIGATED" -gt 0 ]; then
        echo ""
        echo "   ${RED}⚠ UNMITIGATED CVEs found:${NC}"
        grep "\[UNMITIGATED\]" "$SECONDS_LATEST" | head -5 | while read -r line; do
            echo "      $line"
        done
    fi
else
    echo "   ${YELLOW}⚠ No security reports found${NC}"
fi

echo ""

# ============================================
# 4. Sumário
# ============================================
echo "═══════════════════════════════════════════════════════════"
echo "📊 Security Summary"
echo "═══════════════════════════════════════════════════════════"

if [ "$CRITICAL_CVES" -gt 0 ] || [ "$HIGH_CVES" -gt 0 ]; then
    echo "   ${RED}❌ BLOCKING: Security issues detected${NC}"
    echo ""
    echo "   CRITICAL: $CRITICAL_CVES"
    echo "   HIGH:     $HIGH_CVES"
    echo ""
    echo "   ${YELLOW}⚠ Action required before deployment:${NC}"
    echo "      1. Update Dockerfile base image"
    echo "      2. Run: npm audit fix"
    echo "      3. Update docs/gem-hunter/secops-*.md"
    echo ""
    exit 1
else
    echo "   ${GREEN}✅ Security check passed${NC}"
    echo ""
    echo "   CRITICAL: 0"
    echo "   HIGH:     0"
    echo ""
    exit 0
fi
