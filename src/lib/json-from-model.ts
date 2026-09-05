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
