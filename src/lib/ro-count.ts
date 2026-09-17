/**
 * A count with its noun, in Romanian: „o zi", „2 zile", „20 de zile", „101 zile", „120 de zile".
 * Romanian puts „de" between a number and its noun when the last two digits are 00 or 20–99.
 * One helper for every page and message, so none of them says „20 capitole" (review r6, U8 / K10).
 */
export function countRo(n: number, one: string, many: string): string {
  if (n === 1) return one;
  const rest = n % 100;
  return `${n}${n >= 20 && (rest === 0 || rest >= 20) ? " de" : ""} ${many}`;
}
