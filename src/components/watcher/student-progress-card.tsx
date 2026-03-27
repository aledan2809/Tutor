"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";

interface StudentProgressCardProps {
  student: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    domains: { id: string; name: string; slug: string; icon: string | null }[];
    progress: {
      totalAttempts: number;
      accuracy: number;
      topicsStudied: number;
    };
    gamification: {
      totalXp: number;
      currentStreak: number;
      longestStreak: number;
      level: string;
    };
    weakAreas: { subject: string; topic: string; errorRate: number }[];
    examHistory: { score: number | null; passed: boolean | null; submittedAt: Date | string | null }[];
  };
  linkBase: string;
}

export function StudentProgressCard({ student, linkBase }: StudentProgressCardProps) {
  const t = useTranslations("watcher");

  const streakColor =
    student.gamification.currentStreak >= 7
      ? "text-green-400"
      : student.gamification.currentStreak >= 3
        ? "text-yellow-400"
        : "text-red-400";

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <div className="flex items-center gap-3 mb-4">
        {student.image ? (
          <Image
            src={student.image}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 rounded-full"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/20 text-blue-400 text-sm font-bold">
            {(student.name ?? "?")[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <Link
            href={`${linkBase}/${student.id}`}
            className="text-sm font-semibold text-white hover:text-blue-400 truncate block"
          >
            {student.name ?? student.email}
          </Link>
          <p className="text-xs text-gray-500 truncate">{student.email}</p>
        </div>
        <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
          {student.gamification.level}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="text-center">
          <p className="text-lg font-bold text-white">{student.progress.accuracy}%</p>
          <p className="text-xs text-gray-500">{t("accuracy")}</p>
        </div>
        <div className="text-center">
          <p className={`text-lg font-bold ${streakColor}`}>
            {student.gamification.currentStreak}
          </p>
          <p className="text-xs text-gray-500">{t("streak")}</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-white">{student.gamification.totalXp}</p>
          <p className="text-xs text-gray-500">XP</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-white">{student.progress.topicsStudied}</p>
          <p className="text-xs text-gray-500">{t("topics")}</p>
        </div>
      </div>

      {student.domains.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {student.domains.map((d) => (
            <span
              key={d.id}
              className="rounded bg-blue-600/20 px-2 py-0.5 text-xs text-blue-400"
            >
              {d.icon} {d.name}
            </span>
          ))}
        </div>
      )}

      {student.weakAreas.length > 0 && (
        <div className="border-t border-gray-800 pt-3">
          <p className="text-xs font-medium text-gray-400 mb-1">{t("weakAreas")}</p>
          <div className="flex flex-wrap gap-1">
            {student.weakAreas.slice(0, 3).map((w) => (
              <span
                key={`${w.subject}-${w.topic}`}
                className="rounded bg-red-600/10 px-2 py-0.5 text-xs text-red-400"
              >
                {w.topic} ({w.errorRate}%)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
