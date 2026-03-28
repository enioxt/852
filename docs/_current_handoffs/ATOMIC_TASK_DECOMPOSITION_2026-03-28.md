# Atomic Task Decomposition — Ready for Execution
**Date:** 2026-03-28
**Format:** P0 blockers → P1 features (atomic, sequenced, with subtasks)
**Target:** Sonnet 4.6 executor (or team running this phase)

---

## PHASE 0 — GOVERNANCE FOUNDATION (3-4 Days, BLOCKING)

### EGOS-001: Merge BLUEPRINT-EGOS Into Kernel — Packages & Integrations

**What:** Extract reusable code from BLUEPRINT-EGOS into egos/packages and egos/integrations following canonical structure. Reduce duplication, establish clear kernel vs. template boundaries.

**Why:** BLUEPRINT has strong patterns (AAR, module registry, integration adapters) that should live in kernel once stabilized. Leaving them in separate repo causes governance drift.

**Subtasks:**

#### EGOS-001.1: Create egos/packages/search-engine with AAR
- [ ] Copy `BLUEPRINT-EGOS/packages/search-engine/` → `egos/packages/search-engine/`
- [ ] Verify exports: `InMemorySearchEngine`, `SearchResult`, `defaultAtomizer`
- [ ] Update tsconfig aliases: `@egos/search-engine/*`
- [ ] Add to `egos/pnpm-workspace.yaml`
- [ ] Run `pnpm install && pnpm build --filter search-engine`
- [ ] Verify 0 errors
- [ ] Test with sample atoms (100+ dummy records)
- [ ] Document: `egos/packages/search-engine/README.md` with usage examples
- **Time:** 3h

#### EGOS-001.2: Create egos/packages/atomizer with default implementation
- [ ] Copy `BLUEPRINT-EGOS/packages/atomizer/` → `egos/packages/atomizer/`
- [ ] Verify exports: `DefaultAtomizer`, `AtomizeInput`, `Atom`
- [ ] Add to workspace
- [ ] Test: atomize sample text → 10+ atoms
- [ ] Document: reference pattern for custom atomizers
- **Time:** 2h

#### EGOS-001.3: Create egos/integrations with standardized contracts
- [ ] Create directory: `egos/integrations/`
- [ ] Copy contract files from BLUEPRINT:
  - [ ] `_contracts/slack.ts` → `egos/integrations/_contracts/slack.ts`
  - [ ] `_contracts/discord.ts`
  - [ ] `_contracts/telegram.ts`
  - [ ] `_contracts/whatsapp.ts`
  - [ ] `_contracts/webhook.ts`
  - [ ] `_contracts/github.ts`
- [ ] Create `egos/integrations/README.md` with adapter pattern
- [ ] Document: how to implement new integration (copy contract + fill in implementation)
- **Time:** 2h

#### EGOS-001.4: Update egos/AGENTS.md with AAR + integrations
- [ ] Add agent capabilities:
  - [ ] "Adaptive Atomic Retrieval (AAR)" — search, indexing, semantic clustering
  - [ ] "Integration Adapter Framework" — Slack, Discord, Telegram, WhatsApp, webhooks, GitHub
- [ ] Link to: `packages/search-engine/README.md`, `integrations/README.md`
- **Time:** 1h

#### EGOS-001.5: Deprecate duplicate governance in BLUEPRINT-EGOS
- [ ] In BLUEPRINT-EGOS/.windsurfrules: add "inherit from enioxt/egos"
- [ ] In BLUEPRINT-EGOS/AGENTS.md: add "see enioxt/egos/AGENTS.md for canonical"
- [ ] Create BLUEPRINT-EGOS/README.md note: "Template repo — governance inherits from kernel"
- **Time:** 1h

**Acceptance Criteria:**
- [ ] egos/packages/{search-engine,atomizer,registry} exist + build
- [ ] egos/integrations/_contracts/* present
- [ ] No duplication between egos and BLUEPRINT-EGOS (check via diff)
- [ ] CI passes for egos repo
- [ ] AGENTS.md updated in egos (canonical point)

---

### EGOS-002: Universal Activation Layer — Identity, Permission, Audit

**What:** Build framework allowing any tool (ChatGPT, Codex, Claude Code, local IDE, mobile) to activate EGOS rules + request resources under controlled identity.

**Why:** Currently, rules live in repo but activation is manual/implicit. Need explicit identity, scoped permission, audit trail.

**Subtasks:**

#### EGOS-002.1: Create Identity & Permission Contracts
- [ ] File: `egos/packages/core/src/auth/contracts.ts`
- [ ] Define interfaces:
  ```typescript
  interface Identity {
    userId: string;
    source: 'chatgpt' | 'codex' | 'claude-code' | 'local-ide' | 'github-actions' | 'api' | 'custom';
    scopes: string[]; // ['read:rules', 'execute:tasks', 'write:code', ...]
    token?: string;
    expiresAt?: Date;
  }

  interface ActivationRequest {
    identity: Identity;
    action: 'read' | 'execute' | 'write' | 'deploy';
    resource: string; // "egos:rules", "egos:tasks", "project:852", ...
    context?: Record<string, unknown>;
  }

  interface ActivationResponse {
    authorized: boolean;
    reasoning: string;
    scope: string;
    auditId: string;
    context: Record<string, unknown>;
  }
  ```
- [ ] Document each field purpose
- **Time:** 2h

#### EGOS-002.2: Create Audit Logger Interface + Console Implementation
- [ ] File: `egos/packages/audit/src/activation-audit.ts`
- [ ] Implement:
  ```typescript
  export interface AuditEntry {
    id: string; // UUID
    timestamp: Date;
    identity: Identity;
    action: string;
    resource: string;
    result: 'allowed' | 'denied';
    reasoning: string;
    context?: Record<string, unknown>;
  }

  export class ConsoleAuditLogger {
    log(entry: AuditEntry): void { /* write to console */ }
    // TODO: later → PostgreSQL, file, cloud
  }
  ```
- [ ] Document: "audit trail for governance compliance"
- **Time:** 2h

#### EGOS-002.3: Create default Policy Evaluator
- [ ] File: `egos/packages/core/src/auth/policy-evaluator.ts`
- [ ] Implement basic rules:
  - [ ] Public read (anyone can read rules, docs)
  - [ ] GitHub auth (via token, can write/execute)
  - [ ] ChatGPT/Codex connector (identity from token, scoped to read)
  - [ ] Local execution (full scope, audit logged)
- [ ] Allow override via config:
  ```typescript
  const config = {
    policies: [
      { source: 'chatgpt', resource: 'read:rules', scope: 'read' },
      { source: 'github-actions', resource: 'execute:tasks', scope: 'execute' },
    ]
  };
  ```
- **Time:** 3h

#### EGOS-002.4: Create activation endpoint (for API-based tools)
- [ ] File: `egos/apps/api/src/routes/activate.ts` (or adapt existing)
- [ ] Endpoint: `POST /auth/activate`
- [ ] Request body:
  ```json
  {
    "source": "chatgpt",
    "token": "...",
    "action": "read",
    "resource": "egos:rules"
  }
  ```
- [ ] Response:
  ```json
  {
    "authorized": true,
    "scope": "read",
    "auditId": "audit_xyz",
    "context": {
      "userId": "user_abc",
      "expiresAt": "2026-03-29T..."
    }
  }
  ```
- [ ] Test with curl + mock identity
- **Time:** 3h

#### EGOS-002.5: Document activation flow for each platform
- [ ] File: `egos/docs/ACTIVATION_FLOW.md`
- [ ] Sections:
  - [ ] **ChatGPT connector** — how to authenticate via callback
  - [ ] **Codex** — how to use GitHub app + token
  - [ ] **Claude Code / Local IDE** — env var activation
  - [ ] **GitHub Actions** — GITHUB_TOKEN scoping
  - [ ] **Mobile/Custom** — API activation pattern
- **Time:** 2h

**Acceptance Criteria:**
- [ ] Identity + Permission contracts defined + TypeScript-checked
- [ ] Policy evaluator implemented + tested (10 test cases)
- [ ] Activation endpoint functional (returns correct JSON)
- [ ] Audit trail captured (console or file)
- [ ] Documentation clear (new user can activate in <5 minutes)
- [ ] All 5 platform flows documented

---

### EGOS-003: Create frozen-zones/lgpd-health.md — Healthcare Compliance

**What:** Document LGPD/healthcare data handling rules as frozen zone (immutable policy). Enforce by default in any health-related system.

**Why:** 852 + Forja may integrate with hospitals. ANPD active. Risk is real. Codify it so machines can check.

**Subtasks:**

#### EGOS-003.1: Write frozen zone policy
- [ ] File: `egos/frozen-zones/lgpd-health.md`
- [ ] Structure:
  ```markdown
  # LGPD Health Data Frozen Zone

  **Status:** IMMUTABLE POLICY — cannot be overridden per instance
  **Last Updated:** 2026-03-28
  **Regulatory Basis:** Law 13.709/2018, Resolução CD/ANPD nº 30/2025, Law 13.787 (prontuário)

  ## 1. Classification
  - Health data = **sensitive personal data** (Art. 5º, II LGPD)
  - Includes: symptoms, diagnoses, medications, test results, metadata (timestamps, locations)
  - Metadata also sensitive (can re-identify via correlation)

  ## 2. Storage Rules
  ### Raw conversation
  - Retain: **0 days** (delete immediately after integration to clinical system)
  - Exception: None. Raw chat is highest-risk.
  - Implementation: Delete async job within 1h of success

  ### Structured clinical extract
  - Retain: per Law 13.787 (20 years minimum)
  - Location: in clinical system (MV/Tasy), not in middleware
  - Access: Role-based, audit-logged

  ### Consent evidence
  - Retain: Duration of contract + 5 years
  - Content: {timestamp_iso, hash_phone, version_term, response, session_id}
  - Immutable: append-only log

  ### Telemetry/operational logs
  - Retain: 90 days
  - Content: Pseudonymized (id_hash, not phone number)
  - Use: Debugging, performance analysis only

  ## 3. Processing Mandates
  ### Consent
  - **For channel** (WhatsApp): explicit opt-in required, recorded immutably
  - **For clinical use:** base legal is assistential care (Art. 11, II-a) — no new consent needed if patient is registered
  - **Combined:** Channel consent + assistential base = dual-layer

  ### Pseudonymization
  - **Mandatory** for all operational logs
  - Hash function: SHA-256(phone_number + salt), salt stored separately
  - Re-id map: Encrypted (AES-256), access logged, limited to hospital staff

  ### Encryption
  - Data at rest: AES-256
  - Data in transit: TLS 1.3+
  - Keys: Rotated quarterly, audit-logged

  ### Access Control
  - RLS (Row-Level Security) mandatory in database
  - Role-based: patient, healthcare_provider, admin, auditor
  - No admin bypass without explicit audit event

  ## 4. Incident Response
  - **Detection:** Within 12 hours
  - **ANPD notification:** Within 3 business days if risk/harm detected
  - **Patient notification:** Within 72 hours if risk/harm
  - **Playbook:** docs/INCIDENT_RESPONSE_HEALTH.md

  ## 5. Contracting
  ### DPA Requirements
  - Purpose clearly defined
  - Data types explicitly listed
  - Retention periods per type
  - Sub-processor approvals
  - Breach notification timeline
  - Audit rights (hospital can inspect)
  - Liability & indemnification

  ## 6. Enforcement
  - [ ] Pre-deploy checklist (auto)
  - [ ] Weekly audit (automated scan for violations)
  - [ ] Quarterly external review (legal + infosec)
  - [ ] Breach simulation (tabletop)
  ```
- **Time:** 3h

#### EGOS-003.2: Create enforcement checklist
- [ ] File: `egos/frozen-zones/lgpd-health-checklist.md`
- [ ] Checklist (for team + CI):
  ```markdown
  # Pre-Deploy Checklist — Health-Data Systems

  - [ ] No raw phone numbers in logs (all hashed)
  - [ ] No test/real CPF in code
  - [ ] Retention window defined for each data type
  - [ ] Delete cron job confirmed for raw conversations
  - [ ] Audit log captures consent with timestamp
  - [ ] RLS policies enforced in DB
  - [ ] DPA signed by hospital
  - [ ] Encryption at rest enabled
  - [ ] TLS 1.3+ enforced
  - [ ] Incident playbook accessible to team
  ```
- **Time:** 1h

#### EGOS-003.3: Create incident response playbook
- [ ] File: `egos/docs/INCIDENT_RESPONSE_HEALTH.md`
- [ ] Scenarios:
  - [ ] Unauthorized access detected
  - [ ] Phone number exposed in log
  - [ ] Deletion failed (data not purged)
  - [ ] System down (unavailable for >1h)
  - [ ] Third party (hospital) reports breach
- [ ] For each: steps, timeline, notifications, legal
- **Time:** 2h

#### EGOS-003.4: Update 852 + Forja deployments with policy
- [ ] In `852/CLAUDE.md`: add section "LGPD Compliance" → link to frozen zone
- [ ] In `forja/CLAUDE.md`: add same
- [ ] In CI pipeline (GitHub Actions): add check for `frozen-zones/lgpd-health.md` compliance
- **Time:** 1.5h

**Acceptance Criteria:**
- [ ] Frozen zone document complete (all 6 sections)
- [ ] Checklist created (automatic + manual checks)
- [ ] Incident response playbook written (4+ scenarios)
- [ ] Both projects (852 + Forja) reference policy in CLAUDE.md
- [ ] CI can validate LGPD compliance (lint check)

---

### EGOS-004: MCP Security Hardening — Secrets Vault + Scope Minimization

**What:** Implement secure MCP configuration: no hardcoded secrets, scope minimization per tool, audit logging.

**Why:** EGOS docs note 24k+ MCP config exposures in wild. Current state has risk.

**Subtasks:**

#### EGOS-004.1: Create secrets vault abstraction
- [ ] File: `egos/packages/core/src/secrets/vault.ts`
- [ ] Interface:
  ```typescript
  export interface SecretStore {
    get(key: string): Promise<string | undefined>;
    set(key: string, value: string): Promise<void>;
    list(): Promise<string[]>; // list keys, not values
    delete(key: string): Promise<void>;
  }

  export class EnvSecretStore implements SecretStore {
    // Read from process.env only
  }

  export class VaultSecretStore implements SecretStore {
    // Later: HashiCorp Vault integration
  }
  ```
- **Time:** 2h

#### EGOS-004.2: Update all MCP server configs to use vault
- [ ] Find all `.mcp.json` or MCP configs in egos + BLUEPRINT-EGOS
- [ ] Replace hardcoded API keys with env var references:
  ```json
  {
    "environment": {
      "OPENAI_API_KEY": "${process.env.OPENAI_API_KEY}",
      "GITHUB_TOKEN": "${process.env.GITHUB_TOKEN}"
    }
  }
  ```
- [ ] Document: which env vars are required per MCP server
- **Time:** 1.5h

#### EGOS-004.3: Define scope minimization per tool
- [ ] File: `egos/docs/MCP_SCOPE_POLICY.md`
- [ ] Define tool scopes:
  - [ ] GitHub MCP: `read:public`, `read:org:repos`, `write:own-repo` (not org-wide write)
  - [ ] OpenAI MCP: `api:chat`, `api:embed` (not fine-tune)
  - [ ] Custom integrations: Minimal necessary scopes, documented
- **Time:** 1h

#### EGOS-004.4: Add audit logging to MCP calls
- [ ] Update MCP handler to log:
  ```typescript
  {
    timestamp: Date,
    mcp_server: string,
    identity: Identity,
    scope_requested: string[],
    scope_granted: string[],
    call: string,
    result: 'success' | 'denied' | 'error'
  }
  ```
- **Time:** 2h

#### EGOS-004.5: Create MCP deployment checklist
- [ ] File: `egos/docs/MCP_DEPLOYMENT_CHECKLIST.md`
- [ ] Checklist:
  - [ ] No hardcoded secrets in repo
  - [ ] All API keys from env vars only
  - [ ] Scopes minimized per tool
  - [ ] Audit logging enabled
  - [ ] Secret rotation policy documented (quarterly)
  - [ ] Incident response for leaked token (revoke + rotate)
- **Time:** 1h

**Acceptance Criteria:**
- [ ] Secrets vault interface defined + mock implementation working
- [ ] All MCP configs updated (no hardcoded secrets in repo)
- [ ] Scope policy documented (each tool listed with allowed operations)
- [ ] MCP calls audit-logged with identity + scope
- [ ] Deployment checklist complete + integrated into CI

---

### 852-CORE-001: Apply Supabase Migrations — Email Notifications

**What:** Push Supabase migrations to production: user_notification_preferences table + get_issue_participants RPC.

**Why:** Email notification feature ready but migrations not applied to DB yet.

**Subtasks:**

#### 852-CORE-001.1: Verify migrations exist + are syntactically correct
- [ ] Check files:
  - [ ] `supabase/migrations/20260328000000_user_notification_preferences.sql`
  - [ ] `supabase/migrations/20260328000001_issue_participants_function.sql`
- [ ] Verify no syntax errors:
  - [ ] Valid SQL
  - [ ] RLS policies defined
  - [ ] Function signatures correct
- **Time:** 0.5h

#### 852-CORE-001.2: Apply to staging environment
- [ ] Command: `supabase db push --experimental` (or via dashboard)
- [ ] Verify:
  - [ ] Table created: `user_notification_preferences_852`
  - [ ] RLS policies active
  - [ ] RPC function `get_issue_participants()` callable
- [ ] Test: Create test user, set preferences, query participants
- **Time:** 1h

#### 852-CORE-001.3: Verify email endpoint works
- [ ] Endpoint: `GET /api/auth/notification-preferences`
- [ ] Test:
  - [ ] Authenticated user sees preferences
  - [ ] Defaults provided if not set
  - [ ] Update via PUT works
- [ ] Check: NotificationPreferencesForm component renders correctly
- **Time:** 1h

#### 852-CORE-001.4: Send test email
- [ ] Trigger vote on issue
- [ ] Check: Email sent to participants (not voter themselves)
- [ ] Verify: Subject, body, headers correct
- [ ] Check logs: telemetry event `issue_vote_emails_sent` recorded
- **Time:** 1h

#### 852-CORE-001.5: Deploy to production
- [ ] Verify staging is stable
- [ ] Create tag: `v852-email-notifications-2026-03-28`
- [ ] Deploy to prod (Vercel auto-deploy or manual)
- [ ] Monitor: Logs for errors, email deliverability
- [ ] Announce: Release notes to team
- **Time:** 1h

**Acceptance Criteria:**
- [ ] Migrations applied to Supabase (staging + prod)
- [ ] user_notification_preferences_852 table exists + RLS active
- [ ] get_issue_participants() RPC works
- [ ] Email sent on vote (verified via logs + actual inbox)
- [ ] Zero errors in deployment
- [ ] Rollback plan documented

---

### 852-CORE-002: Implement Phase 1 Features 3-4 — Clustering + KB Weighting

**What:** Complete cross-conversation insight aggregation Phase 1: fuzzy semantic clustering (Feature 3) + knowledge base weighting (Feature 4).

**Why:** Phase 1-2 already done (date-range + multi-category weighting). Features 3-4 reduce duplicate insights 30-40% + add evidence-based prioritization.

**Subtasks:**

#### 852-CORE-002.1: Implement fuzzy semantic clustering
- [ ] File: `src/lib/clustering.ts`
- [ ] Function: `clusterInsights(insights, threshold=0.7)`
- [ ] Logic:
  - [ ] Use fuse.js (already in package.json)
  - [ ] Levenshtein distance for titulo similarity
  - [ ] Merge insights if similarity > threshold
  - [ ] Keep highest-scored insight, merge evidence counts
- [ ] Test: Run on 100+ sample insights, verify 30-40% reduction
- **Time:** 3h

#### 852-CORE-002.2: Integrate clustering into report generation
- [ ] File: `src/app/api/ai-reports/generate/route.ts`
- [ ] After weighting, call: `clusterInsights(weightedInsights)`
- [ ] Verify: Insights re-sorted after clustering
- [ ] Add telemetry: `insights_clustered_count`, `deduplication_ratio`
- **Time:** 2h

#### 852-CORE-002.3: Implement KB weighting
- [ ] File: `src/lib/knowledge-weighting.ts`
- [ ] Function: `applyKnowledgeWeighting(insights, kb_articles)`
- [ ] Logic:
  - [ ] Query `knowledge_base_852` table
  - [ ] Match insight categoria to KB topics
  - [ ] Multiply insight final_score by KB credibility_score
  - [ ] Re-sort by new final score
- [ ] Test: Verify insights with matching KB articles score higher
- **Time:** 2h

#### 852-CORE-002.4: Integrate KB weighting into report flow
- [ ] Fetch KB articles in report generation
- [ ] Call `applyKnowledgeWeighting()` after clustering
- [ ] Include KB match metadata in response
- [ ] Add telemetry: `insights_with_kb_match`, `kb_boost_average`
- **Time:** 1h

#### 852-CORE-002.5: Test Phase 1 complete
- [ ] End-to-end test:
  - [ ] Generate report with `?window=7`
  - [ ] Verify all 4 features active: date-range ✓, weighting ✓, clustering ✓, KB ✓
  - [ ] Check metrics: reduction in duplicates, improvement in relevance
  - [ ] No TypeScript errors
- [ ] Performance test: <5s for 100 conversations
- **Time:** 2h

#### 852-CORE-002.6: Update docs + merge
- [ ] Update `PHASE_1_PLAN_2026-03-28.md`: mark Features 3-4 COMPLETE
- [ ] Add telemetry events to `src/lib/telemetry.ts`
- [ ] Commit: `feat: implement Phase 1 Features 3-4 (clustering + KB weighting)`
- [ ] Create PR for review
- **Time:** 1h

**Acceptance Criteria:**
- [ ] `src/lib/clustering.ts` implemented + tested
- [ ] `src/lib/knowledge-weighting.ts` implemented + tested
- [ ] Both integrated into report flow
- [ ] Telemetry captured for both
- [ ] Performance <5s for 100 conversations
- [ ] Zero TypeScript errors
- [ ] PR merged + deployed to staging

---

## SUMMARY: PHASE 0 EFFORT

| Task | Hours | Blocker? |
|------|-------|----------|
| EGOS-001 (Merge Blueprint) | 10h | Yes |
| EGOS-002 (Universal activation) | 13h | Yes |
| EGOS-003 (LGPD frozen zones) | 9.5h | Yes |
| EGOS-004 (MCP security) | 7.5h | Yes |
| 852-CORE-001 (Migrations) | 4.5h | Yes (for email) |
| 852-CORE-002 (Clustering + KB) | 11h | No (parallel) |
| **TOTAL** | **55.5h** | ~4 days (8h/day) |

---

## PHASE 1 — CORE FEATURES (5 Days, Following Phase 0)

*(Detailed breakdown will follow in separate document once Phase 0 consensus reached)*

### P1 Task Queue (Waiting for Phase 0):
- `852-FEAT-101` — ATRiAN v2 (Guardrails integration)
- `852-FEAT-102` — Admin dashboard for shared reports
- `852-FEAT-103` → `852-FEAT-109` — Web search, collaboration, BYOK, forum, reports v2, lotação, external LLM
- `EGOS-LAND-001` — Landing page reposition
- `EGOS-AAR-001` — Deploy AAR backend + vector indexing
- `FORJA-VISAO-001` — Complete Vision module

---

**Next Step:** Review Phase 0 breakdown above. Confirm readiness. Assign executor (Sonnet 4.6). Begin EGOS-001.

Signed: Claude Code (Haiku 4.5)
