// One-shot migration: strip embedded answer-letter prefixes from question
// options[] and correctAnswer.
//
// Root cause: generated questions store options like ["a) 10", "b) 15", ...]
// (and correctAnswer "c) 16.66"), while BOTH renderers prepend their own
// letter -> students saw "A. a) 10". Grading already strips prefixes on both
// sides (checkAnswer), so cleaning the stored data is safe and idempotent.
//
// Usage (on VPS, from /var/www/tutor):
//   DATABASE_URL=$(grep ^DATABASE_URL= .env|cut -d= -f2-|tr -d '"') \
//     node scripts/normalize-option-prefixes.mjs --dry
//   ... then --apply
//
//   node scripts/normalize-option-prefixes.mjs --selftest   (no DB needed)

// Strip a single leading answer-letter marker, matching ONLY the format the
// generator actually stores: a lowercase letter a-d immediately followed by a
// closing paren, e.g. "a) 10". Deliberately NARROW: we do NOT match uppercase
// (A-D) nor a dot/dash marker, because that would eat legitimate content like
// "C.pen." (Codul penal) or "C.civ.". Keeps original if stripping empties it.
const PREFIX = /^\s*[a-d]\)\s*/;
export function stripPrefix(s) {
  if (typeof s !== "string") return s;
  const out = s.replace(PREFIX, "").trim();
  return out.length > 0 ? out : s.trim();
}

function selftest() {
  const cases = [
    ["a) 10 exerciții", "10 exerciții"],
    ["b) 15 exerciții", "15 exerciții"],
    ["c) 16.66 exerciții", "16.66 exerciții"],
    ["d) 20 exerciții", "20 exerciții"],
    ["C.pen. - Codul penal", "C.pen. - Codul penal"], // legal abbr -> MUST stay
    ["C.civ. - Codul civil", "C.civ. - Codul civil"], // legal abbr -> MUST stay
    ["B. 55°", "B. 55°"],                     // uppercase+dot -> not a generated prefix
    ["c- 65", "c- 65"],                       // dash marker -> not stripped (narrow)
    ["10 exerciții", "10 exerciții"],         // already clean -> unchanged
    ["a) ", "a)"],                             // empty after strip -> keep original
    ["amplificarea fracției", "amplificarea fracției"], // starts with 'a' but no marker
  ];
  let ok = 0;
  for (const [inp, exp] of cases) {
    const got = stripPrefix(inp);
    const pass = got === exp;
    if (pass) ok++;
    console.log(`${pass ? "ok " : "FAIL"}  ${JSON.stringify(inp)} -> ${JSON.stringify(got)}${pass ? "" : ` (expected ${JSON.stringify(exp)})`}`);
  }
  console.log(`\n${ok}/${cases.length} passed`);
  process.exit(ok === cases.length ? 0 : 1);
}

async function run(apply) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  const rows = await prisma.question.findMany({
    select: { id: true, options: true, correctAnswer: true },
  });

  let changed = 0;
  const samples = [];
  for (const q of rows) {
    const opts = Array.isArray(q.options) ? q.options : null;
    const newOpts = opts ? opts.map((o) => stripPrefix(o)) : opts;
    const newCorrect = stripPrefix(q.correctAnswer);

    const optsChanged = opts && JSON.stringify(newOpts) !== JSON.stringify(opts);
    const correctChanged = newCorrect !== q.correctAnswer;
    if (!optsChanged && !correctChanged) continue;

    changed++;
    if (samples.length < 6) {
      samples.push({ id: q.id, before: { options: opts, correctAnswer: q.correctAnswer }, after: { options: newOpts, correctAnswer: newCorrect } });
    }
    if (apply) {
      await prisma.question.update({
        where: { id: q.id },
        data: { options: newOpts ?? undefined, correctAnswer: newCorrect },
      });
    }
  }

  console.log(`Scanned ${rows.length} questions; ${changed} need normalization.`);
  console.log("Samples:");
  for (const s of samples) console.log(JSON.stringify(s, null, 2));
  console.log(apply ? `\nAPPLIED to ${changed} rows.` : `\nDRY RUN — no writes. Re-run with --apply.`);
  await prisma.$disconnect();
}

const arg = process.argv[2];
if (arg === "--selftest") selftest();
else if (arg === "--apply") run(true);
else run(false);
