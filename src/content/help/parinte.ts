import { NUDGE_MAX_AGE_HOURS, PARENT_RENOTIFY_MIN } from "@/lib/escalation/config";
import { cascadeSection, reportSection, setupSection, telegramSection } from "./shared";
import type { HelpContent } from "./types";

export const PARINTE: HelpContent = {
  ro: [
    {
      id: "start",
      title: "Cum funcționează pentru tine",
      paragraphs: [
        "Copilul își pune orele de studiu în program. La ora aceea îl împingem noi, pe canalele lui, " +
          "începând cu cele gratuite.",
        "Pe tine te anunțăm doar dacă a ignorat TOT lanțul, într-o zi cu program. Ideea e să nu fii tu " +
          "cel care întreabă zilnic „ai învățat?”, ci să afli doar când chiar e cazul.",
        "Separat de alerte, primești un raport periodic cu ce a lucrat, cum a stat la timp și unde " +
          "greșește des.",
      ],
      links: [
        { label: "Monitorizare", href: "/dashboard/watcher" },
        { label: "Raport", href: "/dashboard/rapoarte" },
      ],
    },
    {
      id: "familie",
      title: "Familia mea: locuri și conturi",
      paragraphs: [
        "Fiecare are cont propriu și vede doar ce i se cuvine: copilul învață, tu monitorizezi, " +
          "meditatorul (dacă e în pachet) vede progresul elevului.",
        "Pachetul decide câte locuri ai: Family = 1 părinte + 1 copil · Duo = 2 părinți + 1 copil · " +
          "Trio = 1 părinte + 1 copil + meditator · Family Trio = 2 părinți + 1 copil + meditator.",
        "Invitația pleacă pe email sau ca link/cod pe care îl trimiți tu. Expiră în 7 zile.",
      ],
      links: [
        { label: "Familia mea", href: "/dashboard/family" },
        { label: "Abonament", href: "/dashboard/packages" },
      ],
    },
    {
      id: "monitorizare",
      title: "Monitorizare: ce vezi",
      paragraphs: [
        "Fiecare copil are un capitol cu patru părți: Sesiuni (ce a lucrat și cu ce scor), Remindere " +
          "(ce a primit și dacă a reacționat), Program (zilele și orele de studiu) și Vacanță (zile fără " +
          "mementouri).",
        "Datele sunt la zi de fiecare dată când deschizi pagina — nu trebuie să aștepți raportul ca să " +
          "vezi cum a fost azi.",
      ],
      links: [{ label: "Monitorizare", href: "/dashboard/watcher" }],
    },
    {
      id: "program",
      title: "Programul copilului și ritmul mementourilor",
      paragraphs: [
        "Orele de studiu decid când pleacă primul memento. Ritmul dintre canale îl alegi tu, cu trei " +
          "preseturi, și îl poți schimba oricând.",
        "În zilele de vacanță pe care le marchezi nu se trimit mementouri și nu primești alerte.",
      ],
      links: [{ label: "Cadență alerte", href: "/dashboard/watcher/setari" }],
    },
    cascadeSection("ro", "child"),
    {
      id: "alerte",
      title: "Când te anunțăm pe tine",
      paragraphs: [
        "Doar când copilul a ignorat tot lanțul, într-o zi cu program. Nu te anunțăm pentru un memento " +
          "ratat, ci pentru o zi ratată.",
        `Cât timp nu reacționează, te re-anunțăm la ${PARENT_RENOTIFY_MIN} de minute — sau la intervalul ` +
          `pe care îl alegi tu: din X în X ore, o dată pe zi la o oră fixă, ori o singură dată.`,
        `Din capitolul copilului poți trimite un memento chiar acum, pe canalele gratuite. Se repetă până ` +
          `reacționează și se oprește singur după ${NUDGE_MAX_AGE_HOURS} de ore.`,
        "Dacă ai pachet Trio, meditatorul primește alerte separate, pe pragurile lui (serie, scor, zile " +
          "fără sesiune) — nu episodul tău.",
      ],
      links: [{ label: "Alerte", href: "/dashboard/watcher/notifications" }],
    },
    telegramSection("ro", "/dashboard/watcher/setari#telegram"),
    reportSection("ro", "child"),
    setupSection("ro", true),
  ],
  en: [
    {
      id: "start",
      title: "How this works for you",
      paragraphs: [
        "Your child sets their study hours. At that hour we push them, on their own channels, starting " +
          "with the free ones.",
        "We only alert you if they ignored the WHOLE chain, on a scheduled day. The point is that you stop " +
          "being the one asking daily, and hear from us only when it matters.",
        "Separately, you get a periodic report with what they worked on, how punctual they were and where " +
          "they keep going wrong.",
      ],
      links: [
        { label: "Monitoring", href: "/dashboard/watcher" },
        { label: "Report", href: "/dashboard/rapoarte" },
      ],
    },
    {
      id: "familie",
      title: "My family: seats and accounts",
      paragraphs: [
        "Everyone has their own account and sees only what is theirs: the child studies, you monitor, the " +
          "tutor (if your plan includes one) sees the student's progress.",
        "The plan sets the seats: Family = 1 parent + 1 child · Duo = 2 parents + 1 child · Trio = 1 parent " +
          "+ 1 child + tutor · Family Trio = 2 parents + 1 child + tutor.",
        "Invitations go by email, or as a link/code you send yourself. They expire in 7 days.",
      ],
      links: [
        { label: "My family", href: "/dashboard/family" },
        { label: "Subscription", href: "/dashboard/packages" },
      ],
    },
    {
      id: "monitorizare",
      title: "Monitoring: what you see",
      paragraphs: [
        "Each child has a chapter with four parts: Sessions (what they worked on and how they scored), " +
          "Reminders (what they received and whether they reacted), Schedule (study days and hours) and " +
          "Holidays (days with no reminders).",
        "The data is current every time you open the page — you never have to wait for the report to see " +
          "how today went.",
      ],
      links: [{ label: "Monitoring", href: "/dashboard/watcher" }],
    },
    {
      id: "program",
      title: "Your child's schedule and the reminder pace",
      paragraphs: [
        "The study hours decide when the first reminder goes out. You choose the pace between channels " +
          "with three presets, and can change it at any time.",
        "On holidays you mark, no reminders are sent and you get no alerts.",
      ],
      links: [{ label: "Alert cadence", href: "/dashboard/watcher/setari" }],
    },
    cascadeSection("en", "child"),
    {
      id: "alerte",
      title: "When we alert you",
      paragraphs: [
        "Only when your child ignored the whole chain, on a scheduled day. We do not alert you for a missed " +
          "reminder — only for a missed day.",
        `While there is still no reaction we re-alert you every ${PARENT_RENOTIFY_MIN} minutes — or at the ` +
          `interval you choose: every X hours, once a day at a fixed time, or only once.`,
        `From your child's chapter you can send a reminder right now, on the free channels. It repeats until ` +
          `they react and stops on its own after ${NUDGE_MAX_AGE_HOURS} hours.`,
        "On a Trio plan the tutor gets their own alerts, on their own thresholds (streak, score, days " +
          "without a session) — not your episode.",
      ],
      links: [{ label: "Alerts", href: "/dashboard/watcher/notifications" }],
    },
    telegramSection("en", "/dashboard/watcher/setari#telegram"),
    reportSection("en", "child"),
    setupSection("en", true),
  ],
};
