"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
  const [markingProgress, setMarkingProgress] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    setLoading(true);
    setError(null);
    fetch(`/api/student/lessons/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load lesson");
        return r.json();
      })
      .then(setLesson)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params?.id]);

  const markComplete = useCallback(async () => {
    if (!params?.id || markingProgress) return;
    setMarkingProgress(true);
    try {
      const res = await fetch(`/api/student/lessons/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: 100, status: "COMPLETED" }),
      });
      if (res.ok) {
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
      // silently fail
    } finally {
      setMarkingProgress(false);
    }
  }, [params?.id, markingProgress]);

  if (loading) {
    return <div className="py-12 text-center text-gray-500">Loading...</div>;
  }

  if (error || !lesson) {
    return (
      <div className="py-12 text-center text-gray-500">
        {error || "Lesson not found."}
      </div>
    );
  }

  const isCompleted = lesson.lessonProgress?.status === "COMPLETED";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back + Header */}
      <button
        onClick={() => router.push("/dashboard/lessons")}
        className="text-sm text-gray-400 hover:text-white"
      >
        &larr; Back to Lessons
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
              Difficulty: {lesson.difficulty}
            </span>
          )}
          {lesson.estimatedMinutes && <span>{lesson.estimatedMinutes} min read</span>}
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
              {isCompleted ? "Completed" : "In Progress"}
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
            Topic Mastery
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-bold text-white">
                {lesson.progress.mastery}%
              </p>
              <p className="text-xs text-gray-500">Mastery</p>
            </div>
            <div>
              <p className="text-xl font-bold text-white">
                {lesson.progress.accuracy}%
              </p>
              <p className="text-xs text-gray-500">Accuracy</p>
            </div>
            <div>
              <p className="text-xl font-bold text-white">
                {lesson.progress.totalAttempts}
              </p>
              <p className="text-xs text-gray-500">Attempts</p>
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
              Next review:{" "}
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
            {lesson.content}
          </ReactMarkdown>
        </div>
      )}

      {/* External URL link */}
      {lesson.url && (
        <a
          href={lesson.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm text-blue-400 hover:bg-gray-800"
        >
          Open resource
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

      {/* Mark as complete */}
      {!isCompleted && lesson.content && (
        <button
          onClick={markComplete}
          disabled={markingProgress}
          className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {markingProgress ? "Saving..." : "Mark as Complete"}
        </button>
      )}

      {/* Practice action */}
      {lesson.questionsAvailable > 0 && (
        <div className="rounded-xl border border-blue-600/30 bg-blue-600/5 p-4">
          <p className="text-sm text-gray-400">
            {lesson.questionsAvailable} practice questions available for this
            topic.
          </p>
          <button
            onClick={() => router.push("/dashboard/practice")}
            className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Practice Now
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
