/**
 * „Se poate răspunde fără să citești întrebarea?"
 *
 * Am reparat pe rând indiciul de lungime (L34) și pe cel de poziție (L35), și de
 * fiecare dată defectul s-a mutat în dimensiunea vecină: caractere → cuvinte →
 * virgule → propoziții. Enumerarea indiciilor e o cursă care nu se câștigă.
 *
 * Măsurat pe lotul „reparat" de 62: șase atacuri diferite care vedeau DOAR cele
 * patru variante, fără enunț, au dat 95-100%. Cel care avea voie să folosească
 * exclusiv criterii formale de item defect (variante care se suprapun, absurde,
 * prea absolute) a dat 62 din 62. Distractorii nu erau tentanți, erau
 * recognoscibil falși — deci enunțul nu făcea nicio muncă.
 *
 * De-asta verificăm aici PROPRIETATEA, nu indiciile: îi arătăm judecătorului doar
 * variantele. Dacă le poate departaja și își justifică alegerea, itemul măsoară
 * recunoașterea unei afirmații adevărate, nu răspunsul la întrebarea pusă.
 *
 * Spre deosebire de `question-gate`, aici NU se închide poarta când judecătorul e
 * inaccesibil: un item rezolvabil orb e corect, doar slab. Blocarea generării
 * pentru un defect de discriminare ar costa mai mult decât repară. Dar rezultatul
 * spune întotdeauna explicit dacă verificarea a rulat — „neverificat" nu are voie
 * să arate ca „trecut".
 */

import { callClaudeCli } from "@/lib/claude-cli";

export interface BlindItem {
  options: string[];
  correctAnswer: string;
}

export interface BlindVerdict {
  index: number;
  /** Ce a ales judecătorul orb, 0-based; null dacă a spus că nu poate. */
  picked: number | null;
  /** A ales corect ȘI a spus că e sigur — adică itemul se rezolvă fără enunț. */
  solvedBlind: boolean;
}

export interface BlindOutcome {
  /** false când judecătorul n-a putut fi întrebat — rezultatul NU e o promovare. */
  ran: boolean;
  verdicts: BlindVerdict[];
  /** Indicii itemilor care s-au rezolvat fără enunț. */
  solvable: number[];
  note: string;
}

/** Câți itemi într-o singură întrebare către judecător. */
export const BLIND_BATCH = 8;

export function buildBlindPrompt(items: readonly BlindItem[], offset = 0): string {
  const blocks = items.map((it, i) => {
    const n = offset + i + 1;
    const opts = it.options.map((o, k) => `  ${k + 1}. ${o}`).join("\n");
    return `Q${String(n).padStart(2, "0")}:\n${opts}`;
  });

  return `Mai jos sunt ${items.length} seturi de variante de răspuns dintr-un test grilă în română. **Nu îți dau întrebările** — doar variantele.

Pentru fiecare set, spune dacă poți identifica varianta pe care autorul a marcat-o drept corectă, FĂRĂ să vezi întrebarea. Ai voie să te bazezi pe orice: care afirmație e adevărată, care e formulată ca răspuns-model, care distractori sunt recognoscibil falși, absurzi sau se suprapun între ei.

Răspunde EXACT o linie per set, în forma:
Q01: <număr 1-4> sigur
Q01: <număr 1-4> ghicesc
Q01: nu

Folosește „sigur" doar când chiar poți justifica alegerea din variante. Folosește „ghicesc" dacă înclini spre una fără temei solid, și „nu" dacă cele patru variante ți se par la fel de plauzibile. Nicio altă ieșire, fără explicații.

${blocks.join("\n\n")}`;
}

export function parseBlindReply(raw: string, count: number, offset = 0): (BlindVerdict | null)[] {
  const out: (BlindVerdict | null)[] = new Array(count).fill(null);
  const line = /Q(\d{1,3})\s*:\s*(nu|[1-9])\s*(sigur|ghicesc)?/gi;
  let m: RegExpExecArray | null;
  while ((m = line.exec(raw)) !== null) {
    const idx = parseInt(m[1], 10) - 1 - offset;
    if (idx < 0 || idx >= count) continue;
    const answer = m[2].toLowerCase();
    if (answer === "nu") {
      out[idx] = { index: idx + offset, picked: null, solvedBlind: false };
      continue;
    }
    const picked = parseInt(answer, 10) - 1;
    out[idx] = {
      index: idx + offset,
      picked,
      // „sigur" e cerința: la 4 variante, un ghicit nimerește 1 din 4 oricum, iar
      // aruncarea acelor itemi ar tăia conținut bun pentru pură întâmplare.
      solvedBlind: (m[3] ?? "").toLowerCase() === "sigur",
    };
  }
  return out;
}

export async function findBlindSolvable(
  items: readonly BlindItem[],
  opts: { timeoutMs?: number; model?: string } = {},
): Promise<BlindOutcome> {
  if (!items.length) return { ran: true, verdicts: [], solvable: [], note: "Niciun item de verificat." };

  const verdicts: BlindVerdict[] = [];
  let failures = 0;

  for (let start = 0; start < items.length; start += BLIND_BATCH) {
    const slice = items.slice(start, start + BLIND_BATCH);
    const res = await callClaudeCli(buildBlindPrompt(slice, start), {
      timeoutMs: opts.timeoutMs ?? 120_000,
      model: opts.model ?? "sonnet",
    });
    if (!res.ok || !res.text) {
      failures++;
      continue;
    }
    const parsed = parseBlindReply(res.text, slice.length, start);
    parsed.forEach((v, k) => {
      if (!v) return;
      const it = slice[k];
      const correct = it.options.indexOf(it.correctAnswer);
      verdicts.push({ ...v, solvedBlind: v.solvedBlind && v.picked === correct });
    });
  }

  const ran = verdicts.length > 0;
  const solvable = verdicts.filter((v) => v.solvedBlind).map((v) => v.index);

  let note: string;
  if (!ran) {
    note = "Verificarea oarbă NU a rulat (judecătorul inaccesibil) — itemii nu au fost testați pe acest criteriu.";
  } else {
    const checked = verdicts.length;
    note =
      solvable.length === 0
        ? `Verificarea oarbă: niciun item din ${checked} nu s-a putut rezolva fără enunț.`
        : `Verificarea oarbă: ${solvable.length} din ${checked} s-au rezolvat fără enunț (enunțul nu departajează).`;
    if (failures) note += ` ${failures} loturi nu au putut fi verificate.`;
  }

  return { ran, verdicts, solvable, note };
}
