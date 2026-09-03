import { cascadeSection, reportSection, setupSection, telegramSection } from "./shared";
import type { HelpContent } from "./types";

export const MEDITATOR: HelpContent = {
  ro: [
    {
      id: "rol",
      title: "Rolul tău",
      paragraphs: [
        "Ca meditator vezi progresul elevului, sesiunile și zonele unde greșește, și primești alerte când " +
          "seria, scorul sau zilele fără sesiune trec de pragurile pe care le setezi tu.",
        "Accesul e plătit de familie — tu nu plătești nimic. Vezi doar elevii care ți-au fost dați în " +
          "grijă, nu pe toți din platformă.",
      ],
      links: [{ label: "Elevii mei", href: "/dashboard/instructor" }],
    },
    {
      id: "elev",
      title: "Ce vezi despre elev",
      paragraphs: [
        "Statisticile lui, primele zone slabe, sesiunile recente și istoricul de simulări. Nu vezi " +
          "răspunsurile lui unul câte unul — vezi tiparul, care e ce-ți trebuie ca să știi ce să reiei.",
        "Poți să-i atribui o sesiune, să-i pui un obiectiv și să-i scrii în aplicație.",
      ],
      links: [{ label: "Elevii mei", href: "/dashboard/instructor" }],
    },
    {
      id: "praguri",
      title: "Pragurile tale de alertă",
      paragraphs: [
        "Tu decizi când vrei să afli: la câte zile fără sesiune, sub ce scor pe ultimele 7 zile, sau la " +
          "ruperea seriei. Alertele vin cel mult o dată pe zi per elev, ca să rămână un semnal, nu zgomot.",
      ],
      links: [{ label: "Notificări", href: "/dashboard/instructor/notificari" }],
    },
    cascadeSection("ro", "child"),
    telegramSection("ro", "/dashboard/settings/notifications#telegram"),
    reportSection("ro", "child"),
    {
      id: "recomandari",
      title: "Invită și câștigi",
      paragraphs: [
        "Dacă aduci un elev sau un părinte, primești 50% din abonamentul lui în primele 3 luni plătite. " +
          "La tine vin ca bani în cont, nu ca reducere — spre deosebire de elevi și părinți, care primesc credit.",
        "Se acordă doar pe lunile chiar încasate, lună de lună.",
      ],
      links: [{ label: "Invită un prieten", href: "/dashboard/referrals" }],
    },
    setupSection("ro", false),
  ],
  en: [
    {
      id: "rol",
      title: "Your role",
      paragraphs: [
        "As a tutor you see the student's progress, their sessions and where they go wrong, and you get " +
          "alerts when the streak, the score or the days without a session cross thresholds you set.",
        "The family pays for the access — you pay nothing. You only see the students placed in your care, " +
          "not everyone on the platform.",
      ],
      links: [{ label: "My students", href: "/dashboard/instructor" }],
    },
    {
      id: "elev",
      title: "What you see about a student",
      paragraphs: [
        "Their statistics, top weak areas, recent sessions and mock-exam history. You do not see their " +
          "answers one by one — you see the pattern, which is what tells you what to go over again.",
        "You can assign a session, set a goal and message them in the app.",
      ],
      links: [{ label: "My students", href: "/dashboard/instructor" }],
    },
    {
      id: "praguri",
      title: "Your alert thresholds",
      paragraphs: [
        "You decide when to hear about it: after how many days without a session, below what score over the " +
          "last 7 days, or on a broken streak. Alerts fire at most once a day per student, so they stay a " +
          "signal rather than noise.",
      ],
      links: [{ label: "Notifications", href: "/dashboard/instructor/notificari" }],
    },
    cascadeSection("en", "child"),
    telegramSection("en", "/dashboard/settings/notifications#telegram"),
    reportSection("en", "child"),
    {
      id: "recomandari",
      title: "Invite and earn",
      paragraphs: [
        "If you bring in a student or a parent, you get 50% of their subscription for their first 3 paid " +
          "months. For you it arrives as money in your account, not as a discount — unlike students and " +
          "parents, who receive credit.",
        "It accrues only on months actually paid, month by month.",
      ],
      links: [{ label: "Invite a friend", href: "/dashboard/referrals" }],
    },
    setupSection("en", false),
  ],
};
