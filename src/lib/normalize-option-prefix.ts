// Single source of truth for stripping an embedded answer-letter prefix from
// question options / correctAnswer. The generator stores options like
// ["a) 10", "b) 15", ...] while the renderers add their own letter, so the
// prefix must NOT be persisted. Deliberately NARROW: lowercase a-d + closing
// paren only, so legitimate content like "C.pen." (Codul penal) is never touched.
const PREFIX = /^\s*[a-d]\)\s*/;

export function stripOptionPrefix<T>(s: T): T {
  if (typeof s !== "string") return s;
  const out = s.replace(PREFIX, "").trim();
  return (out.length > 0 ? out : s.trim()) as unknown as T;
}

// Mutates+returns a Prisma `data` object: cleans options[] and correctAnswer
// when present. Safe to call on partial update payloads (skips missing fields).
export function normalizeQuestionData<T extends Record<string, unknown>>(
  d: T | null | undefined
): T | null | undefined {
  if (!d || typeof d !== "object") return d;
  const data = d as Record<string, unknown>;
  if (Array.isArray(data.options)) {
    data.options = (data.options as unknown[]).map(stripOptionPrefix);
  }
  if (typeof data.correctAnswer === "string") {
    data.correctAnswer = stripOptionPrefix(data.correctAnswer);
  }
  return d;
}
