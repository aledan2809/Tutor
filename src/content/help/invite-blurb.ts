import { MEDITATOR } from "./meditator";
import { PARINTE } from "./parinte";
import { ELEV } from "./elev";

/**
 * The two or three lines the invitation email adds, so the person being invited
 * knows what they are being invited TO.
 *
 * A tutor invited into a Trio plan used to receive a link and nothing else — no
 * mention of what they would be able to see, or that the family pays. The text is
 * taken from the FIRST paragraph of that role's opening help section, not written
 * again here: one source, so the email and the help page cannot disagree.
 *
 * Romanian only — the invitation email is Romanian today.
 */
export function inviteBlurb(target: "CHILD" | "PARENT" | "TUTOR"): string[] {
  switch (target) {
    case "TUTOR":
      return [
        MEDITATOR.ro[0].paragraphs[0],
        MEDITATOR.ro[0].paragraphs[1],
        "După ce accepți: instalează aplicația și conectează Telegram din Setări → Notificări, " +
          "ca alertele să ajungă gratuit.",
      ];
    case "PARENT":
      return [PARINTE.ro[0].paragraphs[0], PARINTE.ro[0].paragraphs[1]];
    case "CHILD":
      return [ELEV.ro[0].paragraphs[0], ELEV.ro[0].paragraphs[1]];
  }
}
