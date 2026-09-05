/**
 * Getting JSON out of a model's answer.
 *
 * Not `JSON.parse` on the raw string, because what comes back is rarely only JSON:
 * a code fence, a sentence before it, a trailing note. And not the providers' own
 * "JSON mode" either — groq's rejects prompts it cannot satisfy with a 400, and it
 * is the only provider answering on this box today.
 *
 * So: strip fences, then take the first balanced object or array. Balanced, not
 * greedy-regex, because a brace inside a string value would end the match early.
 */

export function extractJson(raw: string): unknown {
  const text = String(raw ?? "")
    .trim()
    .replace(/^\`\`\`(?:json)?\s*/i, "")
    .replace(/\s*\`\`\`$/, "")
    .trim();

  try {
    return JSON.parse(text);
  } catch {
    // fall through to scanning
  }

  const start = text.search(/[[{]/);
  if (start === -1) throw new Error("Răspunsul nu conține JSON.");

  const open = text[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) {
        return JSON.parse(text.slice(start, i + 1));
      }
    }
  }
  throw new Error("JSON-ul din răspuns nu se închide.");
}

/**
 * A list of objects out of an answer that may be partly broken.
 *
 * `extractJson` is all-or-nothing: one unescaped newline inside a markdown field,
 * or a response cut short by an output limit, and the whole batch is lost. Observed
 * on both counts while generating eight questions with a lesson as context — once a
 * parse error at character 1519, once an array that never closed.
 *
 * So: try the clean parse first, and if it fails, walk the text picking out every
 * balanced `{...}` and parsing each on its own. A malformed question is dropped; the
 * seven good ones survive. Order is preserved.
 */
export function extractJsonObjects(raw: string): unknown[] {
  try {
    const whole = extractJson(raw);
    if (Array.isArray(whole)) return whole;
    if (whole && typeof whole === "object") return [whole];
  } catch {
    // fall through to per-object recovery
  }

  const text = String(raw ?? "");
  const out: unknown[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        try {
          out.push(JSON.parse(text.slice(start, i + 1)));
        } catch {
          // one bad object, not a bad batch
        }
        start = -1;
      }
      if (depth < 0) depth = 0; // a stray closer must not desynchronise the rest
    }
  }
  return out;
}
