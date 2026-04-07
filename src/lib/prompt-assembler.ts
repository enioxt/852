/**
 * prompt-assembler.ts — Schema-driven system prompt builder
 *
 * Assembles system prompts from typed section definitions.
 * Supports conditional inclusion, priority ordering, and
 * prompt-caching markers (Anthropic cache_control support).
 *
 * Usage:
 *   const sections: PromptSection[] = [
 *     { id: 'foundation', content: FOUNDATION_TEXT, cacheable: true, priority: 10 },
 *     { id: 'legal', content: LEGAL_TEXT, cacheable: true, priority: 30,
 *       condition: (ctx) => ctx === 'chat' || ctx === 'report' },
 *     { id: 'memory', content: () => loadMemory(), cacheable: false, priority: 0 },
 *   ];
 *   const { text } = assemblePrompt(sections, 'chat');
 */

export interface PromptSection<TCtx extends string = string> {
  /** Unique identifier — used for deduplication and cache keys */
  id: string;
  /** Section content (string or lazy evaluator for dynamic content) */
  content: string | (() => string);
  /** Include only when condition returns true for the given context */
  condition?: (ctx: TCtx) => boolean;
  /**
   * True = content is stable across users, eligible for Anthropic prompt caching.
   * Large cacheable prefixes (>1024 tokens) save significant cost on repeated calls.
   * Default: true
   */
  cacheable?: boolean;
  /**
   * Sort order — lower number appears first in the assembled prompt.
   * Dynamic/per-user sections (memory, instructions) should have priority 0.
   * Static sections (rules, legal) should use 10–100.
   * Default: 50
   */
  priority?: number;
}

export interface AssembledPrompt {
  /** Full assembled system prompt text */
  text: string;
  /** IDs of sections marked cacheable=true (in order) */
  cacheableIds: string[];
  /** IDs of sections marked cacheable=false (dynamic/user-specific) */
  dynamicIds: string[];
  /** Number of sections included */
  sectionCount: number;
}

/**
 * Assembles a system prompt from section definitions.
 *
 * @param sections — All registered PromptSection definitions
 * @param ctx — The current prompt context (e.g. 'chat', 'review', 'report')
 * @param extra — Optional ad-hoc sections appended without filtering (e.g. per-user memory)
 * @returns AssembledPrompt with full text + cache metadata
 */
export function assemblePrompt<TCtx extends string = string>(
  sections: PromptSection<TCtx>[],
  ctx: TCtx,
  extra?: Array<{ id: string; content: string; priority?: number }>,
): AssembledPrompt {
  // Filter sections by condition
  const eligible = sections.filter(s =>
    !s.condition || s.condition(ctx)
  );

  // Sort by priority (lower first), stable
  const sorted = eligible.slice().sort(
    (a, b) => (a.priority ?? 50) - (b.priority ?? 50)
  );

  // Append extra sections (e.g. memory block)
  const allSections = [...sorted, ...(extra ?? []).map(e => ({
    ...e,
    cacheable: false as const,
    priority: e.priority ?? 0,
  }))];

  const textParts: string[] = [];
  const cacheableIds: string[] = [];
  const dynamicIds: string[] = [];

  for (const section of allSections) {
    const isCacheable = (section as PromptSection).cacheable !== false;
    const content = typeof section.content === 'function'
      ? section.content()
      : section.content;

    if (!content?.trim()) continue;

    textParts.push(content.trim());
    if (isCacheable) {
      cacheableIds.push(section.id);
    } else {
      dynamicIds.push(section.id);
    }
  }

  return {
    text: textParts.join('\n\n'),
    cacheableIds,
    dynamicIds,
    sectionCount: textParts.length,
  };
}

/**
 * Creates a reusable assembler bound to a fixed set of sections.
 * Useful when sections are defined once at module load.
 *
 * @example
 * const buildPrompt = createAssembler(MY_SECTIONS);
 * const { text } = buildPrompt('chat', [{ id: 'memory', content: userMemory }]);
 */
export function createAssembler<TCtx extends string = string>(
  sections: PromptSection<TCtx>[],
) {
  return (
    ctx: TCtx,
    extra?: Array<{ id: string; content: string; priority?: number }>,
  ): AssembledPrompt => assemblePrompt(sections, ctx, extra);
}
