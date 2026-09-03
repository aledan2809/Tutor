/**
 * Who is really a parent (or a family tutor) but carries a STUDENT enrollment.
 *
 * Registering with a subject always granted STUDENT, and the sidebar keys the
 * parent menu on NOT being a student — so every parent who signed themselves up
 * has been looking at the learner menu. This rule decides who to fix.
 *
 * Pure and dependency-free so it can be unit-tested and read by someone who has to
 * approve the list before it is applied to real accounts.
 *
 * The asymmetry is deliberate: mislabelling a parent costs them a tidier menu;
 * mislabelling a LEARNER hides Grile and Simulări from a child who uses them. So
 * any trace of real study activity keeps the account exactly as it is, no matter
 * how many parent signals are also present.
 */

/** @typedef {{
 *   isSuperAdmin: boolean,
 *   hasAdminOrInstructorRole: boolean,
 *   isBanned: boolean,
 *   guardianOfAsParent: number,
 *   guardianOfAsTutor: number,
 *   invitedAChild: number,
 *   usedParentFeatures: number,
 *   hasPaidFamilyPlan: boolean,
 *   isSomeonesChild: boolean,
 *   studyActivity: Record<string, number>,
 *   weakSignals: Record<string, number>,
 * }} Signals */

/** Any non-zero count here blocks a demotion. No exceptions. */
export const STUDY_SIGNALS = [
  "sessions",
  "attempts",
  "examAttempts",
  "examSessions",
  "dailyChallengeAttempts",
  "studySessions",
  "lessonProgress",
  "assessments",
  "curriculumChecks",
  "gamificationXp",
  "schoolYearSet",
  "ownReminders",
];

/** Present but NOT disqualifying — a parent can take the demo quiz or pay. */
export const WEAK_SIGNALS = ["magicQuizzes", "payments"];

export function studyEvidence(signals) {
  const s = signals.studyActivity ?? {};
  return STUDY_SIGNALS.filter((k) => (s[k] ?? 0) > 0);
}

export function weakEvidence(signals) {
  const w = signals.weakSignals ?? {};
  return WEAK_SIGNALS.filter((k) => (w[k] ?? 0) > 0);
}

/**
 * @param {Signals} signals
 * @returns {{ verdict: "APPLY"|"REVIEW"|"KEEP"|"SKIP", role: "PARENT"|"TUTOR"|null, reasons: string[] }}
 */
export function classifyAccount(signals) {
  const reasons = [];

  // Never touch privileged or banned accounts from a script.
  if (signals.isSuperAdmin) return { verdict: "SKIP", role: null, reasons: ["superadmin"] };
  if (signals.hasAdminOrInstructorRole)
    return { verdict: "SKIP", role: null, reasons: ["admin/instructor enrollment"] };
  if (signals.isBanned) return { verdict: "SKIP", role: null, reasons: ["banned"] };

  // Being someone's child is decisive on its own: a child account is a learner,
  // whatever else is attached to it.
  if (signals.isSomeonesChild)
    return { verdict: "KEEP", role: null, reasons: ["is a linked child"] };

  const study = studyEvidence(signals);
  if (study.length) {
    return { verdict: "KEEP", role: null, reasons: [`studies: ${study.join(", ")}`] };
  }

  const asParent = signals.guardianOfAsParent > 0;
  const asTutor = signals.guardianOfAsTutor > 0;
  const invited = signals.invitedAChild > 0;
  const usedParent = signals.usedParentFeatures > 0;

  if (asParent) reasons.push(`guardian of ${signals.guardianOfAsParent} child(ren)`);
  if (asTutor) reasons.push(`tutor of ${signals.guardianOfAsTutor} student(s)`);
  if (invited) reasons.push(`invited ${signals.invitedAChild} child(ren)`);
  if (usedParent) reasons.push(`used parent-only features (${signals.usedParentFeatures})`);

  const strong = asParent || asTutor || invited || usedParent;
  const weak = weakEvidence(signals);

  if (!strong) {
    // A paid family plan alone is suggestive, not proof — a learner can be on a
    // family plan bought for them.
    if (signals.hasPaidFamilyPlan) {
      return { verdict: "REVIEW", role: "PARENT", reasons: ["paid family plan, no other signal"] };
    }
    return { verdict: "KEEP", role: null, reasons: ["no parent signal"] };
  }

  // A tutor relation with no parent relation means the family bought them a tutor
  // seat. Keep WATCHER; INSTRUCTOR is out of scope here — see workstream D.
  const role = asParent || invited || usedParent ? "PARENT" : "TUTOR";

  if (weak.length) {
    reasons.push(`weak learner traces: ${weak.join(", ")}`);
    return { verdict: "REVIEW", role, reasons };
  }

  return { verdict: "APPLY", role, reasons };
}
