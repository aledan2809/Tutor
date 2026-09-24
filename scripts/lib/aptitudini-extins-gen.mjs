/**
 * Generators for "Aptitudini Aviație — Set extins" (Rareș, 24.09.2026).
 *
 * ORIGINAL exercises, generated here, in the FORMATS airline aptitude batteries use (cut-e/COMPASS:
 * number series, numerical reasoning on airline figures). Nothing is copied from any provider or
 * practice site: Airmappr, the site Rareș found, forbids scraping and commercial use in its terms,
 * so we build the same kind of practice ourselves — as with the chained-arithmetic sprint.
 *
 * Every item carries its own answer computed by the generator, 5 options (the cut-e format), the
 * distractors are the typical mistakes, and `validateItem` refuses an item whose options are not
 * unique or do not contain the answer. Pure: no DB, testable (tests/unit/aptitudini-extins-gen.test.ts).
 */

export const MARK = "aptitudini-ext-gen";

/** Deterministic PRNG so a run can be reproduced (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function tools(rand) {
  const int = (lo, hi) => Math.floor(rand() * (hi - lo + 1)) + lo;
  const pick = (arr) => arr[int(0, arr.length - 1)];
  const shuffle = (a) => {
    const x = [...a];
    for (let i = x.length - 1; i > 0; i--) {
      const j = int(0, i);
      [x[i], x[j]] = [x[j], x[i]];
    }
    return x;
  };
  return { int, pick, shuffle };
}

/** Five options: the answer + the first distinct distractors, topped up with near values. */
function fiveOptions(t, answer, distractors, fmt = String) {
  const out = [answer];
  for (const d of distractors) {
    if (out.length >= 5) break;
    if (Number.isFinite(d) && !out.some((o) => fmt(o) === fmt(d))) out.push(d);
  }
  let step = 1;
  while (out.length < 5) {
    for (const d of [answer + step, answer - step]) {
      if (out.length < 5 && !out.some((o) => fmt(o) === fmt(d))) out.push(d);
    }
    step++;
  }
  return t.shuffle(out.map(fmt));
}

// ── Number series ────────────────────────────────────────────────────────────
const SERIES_RULES = [
  {
    name: "pas constant",
    difficulty: 1,
    make: (t) => {
      const a = t.int(2, 60), d = t.pick([3, 4, 6, 7, 8, 9, 11, 12, 13, 15, 17]) * t.pick([1, 1, -1]);
      const s = Array.from({ length: 7 }, (_, i) => a + d * i);
      return { s, why: d > 0 ? `Fiecare termen crește cu ${d}.` : `Fiecare termen scade cu ${-d}.` };
    },
  },
  {
    name: "înmulțire",
    difficulty: 2,
    make: (t) => {
      const r = t.pick([2, 3]), a = t.int(1, r === 2 ? 9 : 4);
      const s = Array.from({ length: 6 }, (_, i) => a * r ** i);
      return { s, why: `Fiecare termen e cel dinainte înmulțit cu ${r}.` };
    },
  },
  {
    name: "diferențe care cresc",
    difficulty: 3,
    make: (t) => {
      const a = t.int(1, 30), d0 = t.int(1, 6), k = t.int(1, 4);
      const s = [a];
      for (let i = 0; i < 6; i++) s.push(s[i] + d0 + k * i);
      return { s, why: `Diferențele cresc cu ${k} de fiecare dată (${d0}, ${d0 + k}, ${d0 + 2 * k}, …).` };
    },
  },
  {
    name: "pași alternanți",
    difficulty: 3,
    make: (t) => {
      const a = t.int(2, 20), p = t.int(3, 12), q = t.int(1, p - 1);
      const s = [a];
      for (let i = 0; i < 6; i++) s.push(i % 2 === 0 ? s[i] + p : s[i] - q);
      return { s, why: `Alternează: +${p}, apoi −${q}.` };
    },
  },
  {
    name: "pătrate",
    difficulty: 3,
    make: (t) => {
      const n0 = t.int(1, 6), c = t.int(-3, 5);
      const s = Array.from({ length: 6 }, (_, i) => (n0 + i) ** 2 + c);
      return { s, why: `Termenii sunt pătrate perfecte${c ? ` ${c > 0 ? "+" : "−"} ${Math.abs(c)}` : ""}: ${n0}², ${n0 + 1}², ${n0 + 2}², …` };
    },
  },
  {
    name: "suma celor două dinainte",
    difficulty: 3,
    make: (t) => {
      const a = t.int(1, 6), b = t.int(a, a + 6);
      const s = [a, b];
      while (s.length < 7) s.push(s[s.length - 1] + s[s.length - 2]);
      return { s, why: "Fiecare termen e suma celor doi dinaintea lui." };
    },
  },
  {
    name: "două serii intercalate",
    difficulty: 4,
    make: (t) => {
      const a = t.int(1, 20), da = t.int(2, 9), b = t.int(30, 60), db = -t.int(2, 7);
      const s = Array.from({ length: 8 }, (_, i) => (i % 2 === 0 ? a + da * (i / 2) : b + db * ((i - 1) / 2)));
      return { s, why: `Două serii intercalate: pe pozițiile impare +${da}, pe cele pare ${db}.` };
    },
  },
  {
    name: "înmulțire și adunare",
    difficulty: 4,
    make: (t) => {
      const m = t.pick([2, 3]), c = t.pick([-2, -1, 1, 2, 3]), a = t.int(1, 5);
      const s = [a];
      for (let i = 0; i < 5; i++) s.push(s[i] * m + c);
      return { s, why: `Fiecare termen = cel dinainte × ${m} ${c > 0 ? "+" : "−"} ${Math.abs(c)}.` };
    },
  },
];

export function genSeries(rand) {
  const t = tools(rand);
  const rule = t.pick(SERIES_RULES);
  const { s, why } = rule.make(t);
  const shown = s.slice(0, -1);
  const answer = s[s.length - 1];
  const last = shown[shown.length - 1], prev = shown[shown.length - 2];
  // Typical mistakes: continue with the last difference, double the last difference, apply the last
  // difference twice, off by one step.
  const distractors = [last + (last - prev), last + 2 * (last - prev), answer + (last - prev), answer - (last - prev), answer + 1, answer - 1];
  return {
    subject: "Raționament inductiv",
    topic: "Serii de numere",
    difficulty: rule.difficulty,
    content: `Care este următorul număr din serie?\n${shown.join(",  ")},  ?`,
    options: fiveOptions(t, answer, distractors),
    correctAnswer: String(answer),
    explanation: `${why} Următorul termen: ${answer}.`,
    ref: `${MARK}:serii:${rule.name}`,
  };
}

// ── Numerical reasoning on airline figures ───────────────────────────────────
/** Romanian decimals (comma), trailing zeros dropped: 0,75 · 1,25 · 1,5. */
const fmtNum = (n, digits = 1) =>
  (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(digits)))).replace(".", ",");

const NUMERIC = [
  {
    name: "grad de ocupare",
    make: (t) => {
      const seats = t.pick([150, 180, 200, 220, 240]);
      const lf = t.pick([60, 65, 70, 75, 80, 85, 90, 95].filter((x) => (seats * x) % 100 === 0));
      const pax = (seats * lf) / 100;
      return {
        content: `Un avion cu ${seats} de locuri a zburat cu ${pax} de pasageri. Care a fost gradul de ocupare?`,
        answer: lf, unit: "%",
        distractors: [100 - lf, Math.round((pax / (seats + 20)) * 100), lf + 5, lf - 5, lf + 10],
        why: `${pax} / ${seats} = ${fmtNum(lf / 100, 2)} → ${lf}%.`,
      };
    },
  },
  {
    name: "variație procentuală",
    make: (t) => {
      const base = t.pick([200, 250, 400, 500, 800]), p = t.pick([10, 15, 20, 25, 30, 40]) * t.pick([1, -1]);
      const now = (base * (100 + p)) / 100;
      return {
        content: `Venitul unei rute a fost de ${base} mii € anul trecut și de ${now} mii € anul acesta. Cu cât s-a modificat, în procente?`,
        answer: p, unit: "%",
        distractors: [Math.round(((now - base) / now) * 100), -p, p + 5, p - 5, Math.round((now / base) * 100)],
        why: `(${now} − ${base}) / ${base} = ${fmtNum(p / 100, 2)} → ${p > 0 ? "+" : ""}${p}%.`,
      };
    },
  },
  {
    name: "preț înainte de scumpire",
    make: (t) => {
      const p = t.pick([10, 20, 25, 50]), orig = t.pick([40, 60, 80, 120, 160, 200, 240]);
      const now = (orig * (100 + p)) / 100;
      return {
        content: `După o scumpire de ${p}%, un bilet costă ${now} €. Cât costa înainte?`,
        answer: orig, unit: " €",
        distractors: [now - (now * p) / 100, now - p, (orig * (100 + p)) / 100 - orig, orig + p],
        why: `${now} / ${fmtNum(1 + p / 100, 2)} = ${orig} €. (Greșeala tipică: să scazi ${p}% din prețul nou.)`,
      };
    },
  },
  {
    name: "combustibil cu rezervă",
    make: (t) => {
      const burn = t.pick([800, 900, 1200, 1500, 2400, 2600]), time = t.pick([1.5, 2, 2.5, 3]), reserve = t.pick([600, 900, 1200, 1500]);
      const total = burn * time + reserve;
      return {
        content: `Un avion consumă ${burn} kg de combustibil pe oră. Zborul durează ${fmtNum(time)} ore și e nevoie de o rezervă de ${reserve} kg. Câți kg trebuie încărcați?`,
        answer: total, unit: " kg",
        distractors: [burn * time, burn * time - reserve, burn * (time + 1) + reserve, burn + reserve],
        why: `${burn} × ${fmtNum(time)} = ${burn * time} kg pentru zbor + ${reserve} kg rezervă = ${total} kg.`,
      };
    },
  },
  {
    name: "medie de pasageri",
    make: (t) => {
      const avg = t.int(120, 190);
      const d = [t.int(-20, 20), t.int(-20, 20), t.int(-20, 20)];
      const vals = [avg + d[0], avg + d[1], avg + d[2], avg * 4 - (3 * avg + d[0] + d[1] + d[2])];
      return {
        content: `Patru zboruri au avut ${vals.join(", ")} de pasageri. Care e media pe zbor?`,
        answer: avg, unit: "",
        distractors: [Math.round((vals[0] + vals[1] + vals[2]) / 3), avg + 10, avg - 10, Math.max(...vals), Math.min(...vals)],
        why: `(${vals.join(" + ")}) / 4 = ${avg * 4} / 4 = ${avg}.`,
      };
    },
  },
  {
    name: "timp de zbor",
    make: (t) => {
      const speed = t.pick([420, 480, 600, 720, 780, 840]), minutes = t.pick([30, 40, 45, 50, 75, 90, 100]);
      const dist = (speed * minutes) / 60;
      return {
        content: `Un avion zboară cu ${speed} km/h. Câte minute îi ia să parcurgă ${dist} km?`,
        answer: minutes, unit: " min",
        distractors: [Math.round((dist / speed) * 100), minutes + 10, minutes - 10, Math.round(dist / 10), minutes + 15],
        why: `${dist} / ${speed} = ${fmtNum(minutes / 60, 2)} h = ${minutes} min.`,
      };
    },
  },
  {
    name: "cost pe loc",
    make: (t) => {
      const seats = t.pick([150, 180, 200, 240]), perSeat = t.pick([35, 40, 45, 50, 55, 60, 75, 80]);
      const cost = seats * perSeat;
      return {
        content: `Un zbor cu ${seats} de locuri costă ${cost} € (combustibil, echipaj, taxe). Cât costă un loc?`,
        answer: perSeat, unit: " €",
        distractors: [Math.round(cost / (seats + 30)), perSeat + 5, perSeat - 5, Math.round(cost / (seats - 30)), perSeat * 2],
        why: `${cost} / ${seats} = ${perSeat} € pe loc.`,
      };
    },
  },
];

export function genNumerical(rand) {
  const t = tools(rand);
  const kind = t.pick(NUMERIC);
  const x = kind.make(t);
  const fmt = (n) => `${fmtNum(n)}${x.unit}`;
  return {
    subject: "Raționament numeric",
    topic: "Raționament numeric (date de zbor)",
    difficulty: 3,
    content: x.content,
    options: fiveOptions(t, x.answer, x.distractors, fmt),
    correctAnswer: fmt(x.answer),
    explanation: x.why,
    ref: `${MARK}:numeric:${kind.name}`,
  };
}

/** Refuse an item a student could not answer cleanly. Returns a reason, or null when it is fine. */
export function validateItem(q) {
  if (!Array.isArray(q.options) || q.options.length !== 5) return "nu are 5 variante";
  if (new Set(q.options).size !== 5) return "variante repetate";
  if (!q.options.includes(q.correctAnswer)) return "răspunsul nu e printre variante";
  if (q.options.some((o) => /NaN|Infinity|undefined/.test(o))) return "variantă invalidă";
  return null;
}
