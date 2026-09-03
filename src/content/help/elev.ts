import {
  DEFAULT_LEVELS,
  LEADERBOARD_TOP,
  ON_TIME_BONUS,
  STREAK_RECOVERY,
  XP_REWARDS,
} from "@/lib/gamification-constants";
import { ON_TIME_WINDOW_MIN } from "@/lib/escalation/config";
import { cascadeSection, reportSection, telegramSection, setupSection } from "./shared";
import type { HelpContent } from "./types";

const MIN = STREAK_RECOVERY.timeLimitMs / 60_000;
const LADDER_RO = DEFAULT_LEVELS.map((l) => `${l.name} ${l.minXp.toLocaleString("ro-RO")}`).join(" → ");
const LADDER_EN = DEFAULT_LEVELS.map((l) => `${l.name} ${l.minXp}`).join(" → ");

export const ELEV: HelpContent = {
  ro: [
    {
      id: "start",
      title: "Ce faci aici, pe scurt",
      paragraphs: [
        "Alegi materia, răspunzi la grile și aplicația reține ce știi și unde te împiedici. De aici încolo " +
          "îți dă mai des exact ce ai greșit, nu la întâmplare.",
        "Nu trebuie să ții tu socoteala: mementourile vin la orele pe care ți le pui în program, iar " +
          "progresul se vede singur în Progresul meu.",
      ],
      links: [
        { label: "Începe o sesiune", href: "/dashboard/practice" },
        { label: "Progresul meu", href: "/dashboard/progress" },
      ],
    },
    {
      id: "programa",
      title: "Materia parcursă la clasă",
      paragraphs: [
        "Bulina arată ce ar fi trebuit predat până azi, după programă. Bifează în dreptul fiecărei lecții " +
          "dacă s-a predat efectiv la clasa ta — grilele se aleg după bifele tale, nu după calendar.",
        "De asta prima sesiune pe o materie cu programă îți cere bifele: fără ele n-avem de unde ști ce " +
          "e corect să te întrebăm. Durează un minut și se face o singură dată, apoi doar completezi.",
      ],
      links: [{ label: "Grile", href: "/dashboard/practice" }],
    },
    {
      id: "sesiuni",
      title: "Tipurile de sesiune",
      paragraphs: ["Alegi după timpul pe care îl ai, nu după cât de disciplinat te simți."],
      bullets: [
        "Micro — 2 minute, 5 întrebări. Între alte activități.",
        "Rapidă — 10 minute, 15 întrebări. Ritmul obișnuit.",
        "Lungă — 20 de minute, 30 de întrebări.",
        "Remediere — se concentrează pe punctele tale slabe.",
        "Recuperare — reintri ușor după o pauză: recapitulări și întrebări ușoare, NU greșelile tale.",
        "Sprint — lanțuri de operații în cap, cu timp limită care scade pe parcurs.",
      ],
    },
    {
      id: "simulari",
      title: "Simulări de examen",
      paragraphs: [
        "Subiecte reale, corectate după baremul oficial. Răspunzi, trimiți și vezi nota estimată pe 10. " +
          "Itemii cu rezolvare scrisă îi notezi tu, după barem — nimeni nu-ți poate corecta o demonstrație " +
          "în locul tău.",
      ],
      links: [{ label: "Simulări", href: "/dashboard/exam-bank" }],
    },
    {
      id: "puncte",
      title: "Puncte, serie, nivel, clasament",
      paragraphs: [
        "Nu sunt decorative: seria și punctele decid ce ți se propune mai departe, iar seria e singura care " +
          "măsoară constanța, nu cât ai lucrat într-o zi.",
      ],
      bullets: [
        `${XP_REWARDS.CORRECT_ANSWER} puncte pentru fiecare răspuns corect, +${XP_REWARDS.FAST_ANSWER_BONUS} ` +
          `dacă răspunzi în sub 5 secunde.`,
        `${XP_REWARDS.SESSION_COMPLETE} de puncte la fiecare sesiune terminată, +${XP_REWARDS.PERFECT_SCORE} ` +
          `dacă e fără greșeală.`,
        `+${ON_TIME_BONUS} dacă termini în ${ON_TIME_WINDOW_MIN} de minute de la memento.`,
        `Provocarea zilei valorează dublu (×${XP_REWARDS.DAILY_CHALLENGE_MULTIPLIER}).`,
        `Niveluri implicite: ${LADDER_RO} puncte. Materia ta poate avea alte praguri — le vezi în Realizări.`,
        "Serie — zilele CU PROGRAM în care ai terminat o sesiune. Weekendul sau vacanța fără program nu " +
          "o rup; o zi cu program ratată o resetează.",
        `Dacă ai rupt seria, o recuperezi în cel mult ${STREAK_RECOVERY.maxMissedDays} zile: ` +
          `${STREAK_RECOVERY.questions} întrebări în ${MIN} minute, minimum ${STREAK_RECOVERY.requiredCorrect} ` +
          `corecte. Revine minus câte o zi pentru fiecare zi ratată.`,
        `Clasament — punctele din săptămâna curentă, în grupa ta. Se resetează lunea; primii ` +
          `${LEADERBOARD_TOP} apar în Realizări.`,
      ],
      links: [{ label: "Realizări", href: "/dashboard/gamification" }],
    },
    cascadeSection("ro", "self"),
    telegramSection("ro", "/dashboard/settings/notifications#telegram"),
    reportSection("ro", "self"),
    {
      id: "familie",
      title: "Dacă ai părinte sau meditator în cont",
      paragraphs: [
        "Ei văd cum stai: sesiunile, scorurile și zonele unde greșești. Nu văd răspunsurile tale unul câte " +
          "unul și nu pot răspunde în locul tău.",
        "Un părinte îți poate administra canalele de notificare (dacă ai bifat asta) și îți poate trimite " +
          "un memento. Programul de studiu rămâne al tău dacă nu ai delegat.",
      ],
      links: [{ label: "Familia mea", href: "/dashboard/family" }],
    },
    setupSection("ro", false),
  ],
  en: [
    {
      id: "start",
      title: "What this is, briefly",
      paragraphs: [
        "You pick a subject, answer questions, and the app remembers what you know and where you get stuck. " +
          "From then on it gives you more of what you got wrong, instead of random practice.",
        "You do not have to keep track: reminders arrive at the hours you set, and your progress is visible " +
          "in My Progress.",
      ],
      links: [
        { label: "Start a session", href: "/dashboard/practice" },
        { label: "My Progress", href: "/dashboard/progress" },
      ],
    },
    {
      id: "programa",
      title: "What has been taught in class",
      paragraphs: [
        "The dot shows what the syllabus says should have been taught by today. Tick each lesson that was " +
          "actually taught in your class — questions are picked from your ticks, not from the calendar.",
        "That is why the first session on a syllabus subject asks for your ticks: without them we cannot " +
          "know what it is fair to ask. It takes a minute, once.",
      ],
      links: [{ label: "Quizzes", href: "/dashboard/practice" }],
    },
    {
      id: "sesiuni",
      title: "Session types",
      paragraphs: ["Pick by the time you have, not by how disciplined you feel."],
      bullets: [
        "Micro — 2 minutes, 5 questions. Between other things.",
        "Quick — 10 minutes, 15 questions. The usual pace.",
        "Long — 20 minutes, 30 questions.",
        "Repair — targets your weak spots.",
        "Recovery — an easy way back after a break: reviews and easy questions, NOT your mistakes.",
        "Sprint — mental arithmetic chains, with a time limit that shrinks as you go.",
      ],
    },
    {
      id: "simulari",
      title: "Mock exams",
      paragraphs: [
        "Real papers, marked against the official scheme. You answer, submit and see an estimated mark out " +
          "of 10. Written-answer items you mark yourself against the scheme — nobody can grade a proof for you.",
      ],
      links: [{ label: "Mock exams", href: "/dashboard/exam-bank" }],
    },
    {
      id: "puncte",
      title: "Points, streak, level, leaderboard",
      paragraphs: [
        "These are not decoration: your streak and points shape what you are offered next, and the streak is " +
          "the only thing that measures consistency rather than one big day.",
      ],
      bullets: [
        `${XP_REWARDS.CORRECT_ANSWER} points per correct answer, +${XP_REWARDS.FAST_ANSWER_BONUS} if you answer under 5 seconds.`,
        `${XP_REWARDS.SESSION_COMPLETE} points per finished session, +${XP_REWARDS.PERFECT_SCORE} for a perfect one.`,
        `+${ON_TIME_BONUS} for finishing within ${ON_TIME_WINDOW_MIN} minutes of the reminder.`,
        `The daily challenge is worth double (×${XP_REWARDS.DAILY_CHALLENGE_MULTIPLIER}).`,
        `Default levels: ${LADDER_EN} points. Your subject may set its own — see Achievements.`,
        "Streak — SCHEDULED days on which you finished a session. Weekends or holidays with no schedule do " +
          "not break it; a missed scheduled day resets it.",
        `If it breaks, you can recover within ${STREAK_RECOVERY.maxMissedDays} days: ${STREAK_RECOVERY.questions} ` +
          `questions in ${MIN} minutes, at least ${STREAK_RECOVERY.requiredCorrect} correct. It returns minus one ` +
          `day per day missed.`,
        `Leaderboard — this week's points, within your group. It resets on Monday; the top ${LEADERBOARD_TOP} show in Achievements.`,
      ],
      links: [{ label: "Achievements", href: "/dashboard/gamification" }],
    },
    cascadeSection("en", "self"),
    telegramSection("en", "/dashboard/settings/notifications#telegram"),
    reportSection("en", "self"),
    {
      id: "familie",
      title: "If a parent or tutor is on your account",
      paragraphs: [
        "They see how you are doing: sessions, scores and where you go wrong. They do not see your answers " +
          "one by one and cannot answer for you.",
        "A parent can manage your notification channels (if you allowed it) and can send you a reminder. " +
          "Your study schedule stays yours unless you delegated it.",
      ],
      links: [{ label: "My family", href: "/dashboard/family" }],
    },
    setupSection("en", false),
  ],
};
