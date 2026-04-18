# CAPABILITY_REGISTRY_LEAF — 852

> **Leaf registry** for the 852 chatbot platform.
> Format mirrors kernel `docs/CAPABILITY_REGISTRY.md`. Local-only capabilities listed here.
> Kernel capabilities consumed by this repo are NOT listed — see kernel registry.
> **Last updated:** 2026-04-18

| Capability | SSOT | Notes |
|-----------|------|-------|
| Gamification Engine | `src/lib/gamification.ts` | Points, levels, badges — 852-specific |
| Leaderboard | `src/app/api/leaderboard/` | Ranking API, no equivalent in kernel |
| Ethik Agent | `src/lib/ethik-agent.ts`, `src/lib/ethik.ts` | Ethical evaluation of AI outputs |
| ATRiAN v2 | `src/lib/atrian-v2/` | Contextual ethics integration, 852-specific flavor |
| AI Reports v2 | `src/lib/ai-reports-v2/` | Report generation pipeline (multi-template) |
| Cross-Conversation Analyzer | `src/lib/cross-conversation-analyzer.ts` | Patterns across sessions |
| Lotacao Detector | `src/lib/lotacao-detector.ts` | Staff assignment detection (BR context) |
| Proactive Suggestions | `src/lib/proactive-suggestions.ts` | Unsolicited insight engine |
| BYOK Manager | `src/lib/byok-manager.ts` | Bring-Your-Own-Key per-user LLM key management |
| Telegram Integration | `src/services/telegram/` | 852-specific Telegram bot (not kernel adapter contract) |
| Insight Weighting | `src/lib/insight-weighting.ts` | Priority scoring for surfaced insights |
| Nickname Generator | `src/lib/nickname-generator.ts` | User identity layer |
