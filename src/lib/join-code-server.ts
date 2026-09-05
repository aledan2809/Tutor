import { randomInt } from "node:crypto";
import { JOIN_CODE_ALPHABET, JOIN_CODE_LENGTH } from "@/lib/join-code";

/**
 * 8 characters from a 31-symbol alphabet ≈ 8.5e11 combinations. At the 60
 * requests/minute the API middleware allows, guessing one is not a strategy.
 */
export function generateJoinCode(): string {
  let out = "";
  for (let i = 0; i < JOIN_CODE_LENGTH; i++) {
    out += JOIN_CODE_ALPHABET[randomInt(JOIN_CODE_ALPHABET.length)];
  }
  return out;
}
