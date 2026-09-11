"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { pregatesteLectia, eReplica, textDinCopii } from "@/lib/lesson-format";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface LessonDetail {
  id: string;
  name: string;
  type: string;
  url?: string | null;
  subject: string;
  topic: string;
  content: string | null;
  summary?: string | null;
  description: string | null;
  difficulty: number | null;
  estimatedMinutes?: number | null;
  domain: { id: string; name: string; slug: string };
  lessonProgress: {
    status: string;
    progress: number;
    completedAt: string | null;
  } | null;
  progress: {
    mastery: number;
    accuracy: number;
    totalAttempts: number;
    lastPracticed: string | null;
    nextReview: string | null;
  } | null;
  questionsAvailable: number;
  navigation?: {
    prev: { id: string; title: string } | null;
    next: { id: string; title: string } | null;
  };
}

export default function LessonDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations();
  const [markingProgress, setMarkingProgress] = useState(false);
  /**
   * `markComplete` înghițea orice răspuns non-OK („silently fail"), deci bifa nu
   * se scria, testul modulului nu se deschidea niciodată, iar butonul se întorcea
   * la starea inițială ca și cum n-ai fi apăsat. Un refuz trebuie SPUS.
   */
  const [completeError, setCompleteError] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    setLoading(true);
    setError(null);
    fetch(`/api/student/lessons/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("LOAD_FAILED");
        return r.json();
      })
      .then(setLesson)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params?.id]);

  const markComplete = useCallback(async () => {
    if (!params?.id || markingProgress) return;
    setMarkingProgress(true);
    setCompleteError(false);
    try {
      const res = await fetch(`/api/student/lessons/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: 100, status: "COMPLETED" }),
      });
      if (!res.ok) {
        setCompleteError(true);
        return;
      }
      {
        const data = await res.json();
        setLesson((prev) =>
          prev
            ? {
                ...prev,
                lessonProgress: {
                  status: data.status,
                  progress: data.progress,
                  completedAt: data.completedAt,
                },
              }
            : prev
        );
      }
    } catch {
      setCompleteError(true);
    } finally {
      setMarkingProgress(false);
    }
  }, [params?.id, markingProgress]);

  if (loading) {
    return <div className="py-12 text-center text-gray-500">{t("common.loading")}</div>;
  }

  if (error || !lesson) {
    return (
      <div className="py-12 text-center text-gray-500">
        {error === "LOAD_FAILED" ? t("lessons.loadFailed") : t("lessons.notFound")}
      </div>
    );
  }

  const isCompleted = lesson.lessonProgress?.status === "COMPLETED";

  // Ipotezele ies din corpul lecției și devin note de subsol. Nu se șterg —
  // marcarea fiecărei presupuneri e chiar argumentul de vânzare al cursului — dar
  // opt casete identice pe o pagină înseamnă opt întreruperi, iar cititul se rupe.
  const { corp, ipoteze } = pregatesteLectia(lesson.content ?? "");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back + Header */}
      <button
        onClick={() => router.push("/dashboard/lessons")}
        className="text-sm text-gray-400 hover:text-white"
      >
        {t("lessons.backToLessons")}
      </button>

      <div>
        <div className="mb-2 flex flex-wrap gap-2 text-xs text-gray-500">
          <span className="rounded bg-gray-800 px-2 py-0.5">{lesson.domain.name}</span>
          {lesson.subject && (
            <span className="rounded bg-gray-800 px-2 py-0.5">{lesson.subject}</span>
          )}
          {lesson.topic && (
            <span className="rounded bg-gray-800 px-2 py-0.5">{lesson.topic}</span>
          )}
          {lesson.difficulty && (
            <span className="rounded bg-gray-800 px-2 py-0.5">
              {t("lessons.difficulty")}: {lesson.difficulty}
            </span>
          )}
          {lesson.estimatedMinutes && <span>{t("lessons.minRead", { n: lesson.estimatedMinutes })}</span>}
        </div>
        <h1 className="text-2xl font-bold text-white">{lesson.name}</h1>
        {lesson.description && (
          <p className="mt-2 text-sm text-gray-400">{lesson.description}</p>
        )}
      </div>

      {/* Lesson progress status */}
      {lesson.lessonProgress && (
        <div
          className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
            isCompleted
              ? "border-green-900/30 bg-green-900/5"
              : "border-blue-900/30 bg-blue-900/5"
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-medium ${
                isCompleted ? "text-green-400" : "text-blue-400"
              }`}
            >
              {isCompleted ? t("lessons.statusCompleted") : t("lessons.statusInProgress")}
            </span>
            {!isCompleted && (
              <span className="text-xs text-gray-500">
                {Math.round(lesson.lessonProgress.progress)}%
              </span>
            )}
          </div>
          {isCompleted && lesson.lessonProgress.completedAt && (
            <span className="text-xs text-gray-500">
              {new Date(lesson.lessonProgress.completedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {/* Topic mastery card */}
      {lesson.progress && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-400">
            {t("lessons.topicMastery")}
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-bold text-white">
                {lesson.progress.mastery}%
              </p>
              <p className="text-xs text-gray-500">{t("lessons.mastery")}</p>
            </div>
            <div>
              <p className="text-xl font-bold text-white">
                {lesson.progress.accuracy}%
              </p>
              <p className="text-xs text-gray-500">{t("lessons.accuracy")}</p>
            </div>
            <div>
              <p className="text-xl font-bold text-white">
                {lesson.progress.totalAttempts}
              </p>
              <p className="text-xs text-gray-500">{t("lessons.attempts")}</p>
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-gray-700">
            <div
              className={`h-full rounded-full ${
                lesson.progress.mastery >= 80
                  ? "bg-green-500"
                  : lesson.progress.mastery >= 40
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${lesson.progress.mastery}%` }}
            />
          </div>
          {lesson.progress.nextReview && (
            <p className="mt-2 text-xs text-gray-500">
              {t("lessons.nextReview")}:{" "}
              {new Date(lesson.progress.nextReview).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Lesson content (markdown) */}
      {lesson.content && (
        <div className="prose prose-invert max-w-none rounded-xl border border-gray-800 bg-gray-900 p-6 prose-headings:text-white prose-p:text-gray-300 prose-a:text-blue-400 prose-strong:text-white prose-code:rounded prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:text-green-400 prose-pre:bg-transparent prose-pre:p-0">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              /*
               * Titlurile, paragrafele și listele au stil scris aici, pe element.
               *
               * Motivul, măsurat: clasele `prose` de pe containerul de mai sus nu fac
               * nimic — `@tailwindcss/typography` nu e instalat. Iar resetarea implicită
               * din Tailwind aduce `h2` la mărimea și grosimea textului, fără margine.
               * Efectul, raportat de un cursant: „nu e nicio pauză, nici nu-ți dai seama
               * când se trece la alt subiect" — deși titlurile existau în lecție.
               * Stilul pus pe element nu depinde de niciun plugin.
               */
              h2({ children }) {
                return (
                  <h2 className="not-prose mb-3 mt-10 border-t border-gray-800 pt-6 text-xl font-bold text-white first:mt-0 first:border-t-0 first:pt-0">
                    {children}
                  </h2>
                );
              },
              h3({ children }) {
                return <h3 className="not-prose mb-2 mt-6 text-base font-bold text-white">{children}</h3>;
              },
              p({ children }) {
                return <p className="my-3 leading-relaxed text-gray-300">{children}</p>;
              },
              ul({ children }) {
                return <ul className="my-3 list-disc space-y-1.5 pl-6 text-gray-300">{children}</ul>;
              },
              ol({ children }) {
                return <ol className="my-3 list-decimal space-y-1.5 pl-6 text-gray-300">{children}</ol>;
              },
              strong({ children }) {
                return <strong className="font-semibold text-white">{children}</strong>;
              },
              // Replica de spus: singurul lucru de pe pagină pe care omul îl
              // ROSTEȘTE, nu îl citește. Galben, ca în macheta aprobată.
              blockquote({ children }) {
                const text = textDinCopii(children);
                if (!eReplica(text)) {
                  return (
                    <blockquote className="border-l-4 border-gray-700 pl-4 text-gray-400">
                      {children}
                    </blockquote>
                  );
                }
                return (
                  <div className="not-prose my-5 rounded-r-xl border-l-4 border-amber-400 bg-amber-400/10 px-5 py-4">
                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-amber-300">
                      Ce spui
                    </span>
                    <div className="text-[17px] leading-relaxed text-gray-100">{children}</div>
                  </div>
                );
              },
              // Marcherul de notă: mic, stins, nu întrerupe fraza.
              a({ href, children, ...props }) {
                if (typeof href === "string" && href.startsWith("#ip-")) {
                  return (
                    <a
                      href={href}
                      className="not-prose ml-0.5 rounded bg-gray-800 px-1 align-super text-[10px] font-bold leading-none text-gray-400 no-underline hover:text-white"
                    >
                      {children}
                    </a>
                  );
                }
                return (
                  <a href={href} {...props}>
                    {children}
                  </a>
                );
              },
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                const inline = !match && !className;
                if (inline) {
                  return (
                    <code className="rounded bg-gray-800 px-1.5 py-0.5 text-sm text-green-400" {...props}>
                      {children}
                    </code>
                  );
                }
                return (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match ? match[1] : "text"}
                    PreTag="div"
                    className="rounded-lg !bg-gray-950 text-sm"
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                );
              },
            }}
          >
            {corp}
          </ReactMarkdown>
        </div>
      )}

      {/*
        Ipotezele, adunate la final. Nu sunt un apendice: pentru clientul care
        primește cursul, asta e lista lui de lucru — „ne dați procedura,
        presupunerea devine fraza voastră". De-aia titlul spune de confirmat, nu
        „note".
      */}
      {ipoteze.length > 0 && (
        <section className="not-prose rounded-xl border border-gray-800 bg-gray-900/60 p-5">
          <h2 className="text-base font-semibold text-white">
            De confirmat cu clientul{" "}
            <span className="font-normal text-gray-500">({ipoteze.length})</span>
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Materialul e scris din surse publice. Fiecare loc în care a trebuit să
            presupunem ceva e numerotat în text și listat aici.
          </p>
          <ol className="mt-4 space-y-3">
            {ipoteze.map((ip) => (
              <li key={ip.n} id={`ip-${ip.n}`} className="flex gap-3 text-sm text-gray-400">
                <span className="shrink-0 font-semibold text-gray-500">{ip.n}.</span>
                <span className="leading-relaxed">{ip.text}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* External URL link */}
      {lesson.url && (
        <a
          href={lesson.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm text-blue-400 hover:bg-gray-800"
        >
          {t("lessons.openResource")}
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      )}

      {completeError && (
        <div
          role="status"
          className="mb-3 rounded-lg border border-amber-800 bg-amber-950/20 px-3 py-2 text-sm text-amber-200"
        >
          {t("lessons.completeFailed")}
        </div>
      )}

      {/* Mark as complete */}
      {!isCompleted && lesson.content && (
        <button
          onClick={markComplete}
          disabled={markingProgress}
          className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {markingProgress ? t("lessons.saving") : t("lessons.markComplete")}
        </button>
      )}

      {/* Practice action */}
      {lesson.questionsAvailable > 0 && (
        <div className="rounded-xl border border-blue-600/30 bg-blue-600/5 p-4">
          <p className="text-sm text-gray-400">
            {t("lessons.questionsAvailable", { n: lesson.questionsAvailable })}
          </p>
          <button
            onClick={() => router.push("/dashboard/practice")}
            className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {t("lessons.practiceNow")}
          </button>
        </div>
      )}

      {/* Lesson navigation */}
      {lesson.navigation &&
        (lesson.navigation.prev || lesson.navigation.next) && (
          <div className="flex items-center justify-between border-t border-gray-800 pt-4">
            {lesson.navigation.prev ? (
              <Link
                href={`/dashboard/lessons/${lesson.navigation.prev.id}`}
                className="text-sm text-gray-400 hover:text-white"
              >
                &larr; {lesson.navigation.prev.title}
              </Link>
            ) : (
              <div />
            )}
            {lesson.navigation.next ? (
              <Link
                href={`/dashboard/lessons/${lesson.navigation.next.id}`}
                className="text-sm text-gray-400 hover:text-white"
              >
                {lesson.navigation.next.title} &rarr;
              </Link>
            ) : (
              <div />
            )}
          </div>
        )}
    </div>
  );
}
