/**
 * Which published items the no-account demo may show (api/public/practice/quiz).
 *
 * The wording of an item that leans on a drawing, as the EN/BAC papers put it: „În figura alăturată…",
 * „graficul de mai jos". Such an item with no drawing to show can't be answered — seen live 13.10.2026:
 * a rhombus garden from EN VIII 2021 Model 2 in the demo, no figure in sight (the public route never
 * read `imageUrl`, and the row may not carry one).
 */
export const MENTIONS_FIGURE = /\b(figur[ai]|desen(ul)?|graficul|schi[țt]a|imagin(ea|ii))\s+(al[ăa]turat|de mai (jos|sus))/i;

/** The item can be answered as shown: it has its drawing, or needs none. */
export function demoAnswerable(q: { content: string; imageUrl: string | null }): boolean {
  return Boolean(q.imageUrl) || !MENTIONS_FIGURE.test(q.content);
}
