# ATRiAN v2 — Real-Time Streaming Validation Design

> Post-streaming validation using NeMo Guardrails-inspired architecture

**Status:** Design Phase | **Target:** v2.1.0

---

## Problem Statement

Current ATRiAN (v1) validates responses **after** streaming completes:
- ✅ Post-hoc validation works
- ❌ No real-time intervention during streaming
- ❌ Violations only detected at end, after tokens sent

**Goal:** Validate and potentially block/correct content **during** streaming.

---

## Solution: Rolling Buffer Validation

Inspired by NeMo Guardrails v0.21.0 IORails engine.

### Architecture

```
LLM Stream → Rolling Buffer → Validator → Output Stream
                    ↓
            Policy Checks (async)
```

### Components

1. **RollingBuffer** — Accumulates tokens, maintains context window
2. **Validator** — Runs checks on buffer chunks
3. **PolicyEngine** — Rules for blocking/allowing/modifying
4. **OutputGate** — Controls what reaches client

### Validation Triggers

| Trigger | When | Action |
|---------|------|--------|
| Entity Detection | PII/Sensitive entity in buffer | Mask or block |
| Jailbreak Pattern | Attack pattern detected | Abort stream |
| Hallucination Mark | "segundo dados" without source | Flag for review |
| Topic Violation | Off-topic content | Warn or block |
| ATRiAN Axiom | Absolute claim detected | Log violation |

---

## Implementation Phases

### Phase 1: Rolling Buffer (2h)

```typescript
class RollingBuffer {
  private buffer: string[];
  private maxSize: number; // tokens or chars
  
  add(token: string): void;
  getContext(): string; // Current buffer content
  slide(): void; // Remove oldest tokens
}
```

### Phase 2: Async Validator (3h)

```typescript
interface ValidationRule {
  id: string;
  pattern: RegExp;
  severity: 'block' | 'warn' | 'log';
  action: 'mask' | 'abort' | 'continue';
}

async function validateChunk(
  chunk: string,
  rules: ValidationRule[]
): Promise<ValidationResult>
```

### Phase 3: Output Gate (2h)

```typescript
class OutputGate {
  private status: 'open' | 'paused' | 'closed';
  
  async process(chunk: string): Promise<string | null>;
  // Returns null to block, modified string, or original
}
```

### Phase 4: Integration (3h)

Hook into existing `streamText()` pipeline in `/api/chat/route.ts`.

---

## Configuration (config.yml equivalent)

```yaml
streaming_validation:
  enabled: true
  
  buffer:
    max_tokens: 200
    context_window: 50
    
  rules:
    - id: 'pii_detection'
      pattern: '\\b\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}\\b'  # CPF
      severity: block
      action: mask
      
    - id: 'absolute_claim'
      pattern: '(segundo dados|de acordo com|estatísticas mostram)'
      severity: warn
      action: log
      
    - id: 'jailbreak_attempt'
      pattern: '(ignore previous|bypass|diga algo ilegal)'
      severity: block
      action: abort
      
    - id: 'blocklist_entity'
      entities: ['SINDPOL', 'APEX']
      severity: block
      action: mask
```

---

## Performance Considerations

| Metric | Target | Notes |
|--------|--------|-------|
| Latency overhead | <50ms per chunk | Async validation |
| Buffer memory | <10KB | 200 tokens * 50 bytes |
| False positive rate | <5% | Tuned patterns |

---

## Testing Strategy

1. **Unit tests:** Validator with synthetic chunks
2. **Integration tests:** Full streaming pipeline
3. **Red team:** Known attack patterns
4. **Golden cases:** 20 eval scenarios with streaming

---

## Migration Plan

1. Add feature flag `ATRIAN_V2_ENABLED`
2. Deploy Phase 1-2 (buffer + validator, no blocking)
3. Monitor logs, tune thresholds
4. Enable blocking mode
5. Remove v1 post-hoc validation (optional)

---

## References

- NeMo Guardrails v0.21.0 IORails: https://github.com/NVIDIA-NeMo/Guardrails
- Streaming validation: https://docs.nvidia.com/nemo/guardrails/latest/run-rails/using-python-apis/streaming.html
- Rolling buffer pattern: NeMo `RollingBuffer.format_chunks`

---

**Author:** Cascade (EGOS Agent)  
**Date:** 2026-04-08  
**Ref:** ATRiAN-002, CHAT-011
