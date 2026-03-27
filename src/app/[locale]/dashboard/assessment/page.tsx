"use client";

import { useState, useEffect } from "react";

interface Question {
  id: string;
  subject: string;
  topic: string;
  difficulty: number;
  type: "MULTIPLE_CHOICE" | "OPEN";
  content: string;
  options: { label: string; value: string }[] | null;
}

interface AssessmentResult {
  sessionId: string;
  score: number;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  correctCount: number;
  totalQuestions: number;
  results: {
    questionId: string;
    isCorrect: boolean;
    correctAnswer: string;
    explanation?: string | null;
  }[];
  weakAreas: { subject: string; topic: string; accuracy: number }[];
}

interface EnrolledDomain {
  id: string;
  name: string;
  slug: string;
}

type Phase = "select" | "loading" | "quiz" | "results";

export default function AssessmentPage() {
  const [phase, setPhase] = useState<Phase>("select");
  const [domains, setDomains] = useState<EnrolledDomain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [results, setResults] = useState<AssessmentResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/student/domains")
      .then((r) => r.json())
      .then((d) => {
        if (d.enrolled?.length) {
          setDomains(d.enrolled);
          setSelectedDomain(d.enrolled[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const startAssessment = async () => {
    if (!selectedDomain) return;
    setPhase("loading");
    try {
      const res = await fetch(`/api/student/assessment?domainId=${selectedDomain}`);
      const data = await res.json();
      if (data.questions?.length) {
        setQuestions(data.questions);
        setCurrentIndex(0);
        setAnswers(new Map());
        setCurrentAnswer("");
        setPhase("quiz");
      } else {
        setPhase("select");
      }
    } catch {
      setPhase("select");
    }
  };

  const handleAnswer = () => {
    if (!currentAnswer) return;
    const q = questions[currentIndex];
    const newAnswers = new Map(answers);
    newAnswers.set(q.id, currentAnswer);
    setAnswers(newAnswers);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      setCurrentAnswer(newAnswers.get(questions[currentIndex + 1]?.id) || "");
    }
  };

  const submitAssessment = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/student/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domainId: selectedDomain,
          answers: Array.from(answers.entries()).map(([questionId, answer]) => ({
            questionId,
            answer,
          })),
        }),
      });
      const data = await res.json();
      setResults(data);
      setPhase("results");
    } catch {
      setSubmitting(false);
    }
  };

  // Select domain
  if (phase === "select") {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-8">
        <h1 className="text-2xl font-bold text-white">Level Assessment</h1>
        <p className="text-sm text-gray-400">
          Answer 10 questions to determine your initial level (Beginner, Intermediate, or Advanced).
        </p>
        {domains.length > 0 ? (
          <>
            <div>
              <label className="mb-2 block text-sm text-gray-400">Select Domain</label>
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
              >
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={startAssessment}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700"
            >
              Start Assessment
            </button>
          </>
        ) : (
          <p className="text-sm text-gray-500">You need to enroll in a domain first.</p>
        )}
      </div>
    );
  }

  if (phase === "loading") {
    return <div className="py-12 text-center text-gray-500">Loading questions...</div>;
  }

  // Quiz
  if (phase === "quiz") {
    const q = questions[currentIndex];
    const allAnswered = answers.size === questions.length;

    return (
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Progress */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-white">
            Question {currentIndex + 1} of {questions.length}
          </h1>
          <span className="text-sm text-gray-500">{answers.size} answered</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-700">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${(answers.size / questions.length) * 100}%` }}
          />
        </div>

        {/* Question */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <div className="mb-4 flex gap-2 text-xs text-gray-500">
            <span className="rounded bg-gray-800 px-1.5 py-0.5">{q.subject}</span>
            <span className="rounded bg-gray-800 px-1.5 py-0.5">{q.topic}</span>
            <span className="rounded bg-gray-800 px-1.5 py-0.5">Difficulty: {q.difficulty}</span>
          </div>
          <p className="text-sm text-white">{q.content}</p>

          {q.type === "MULTIPLE_CHOICE" && q.options ? (
            <div className="mt-4 space-y-2">
              {q.options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setCurrentAnswer(opt.value)}
                  className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                    currentAnswer === opt.value
                      ? "border-blue-600 bg-blue-600/10 text-white"
                      : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600"
                  }`}
                >
                  <span className="mr-2 font-medium">{opt.label}.</span>
                  {opt.value}
                </button>
              ))}
            </div>
          ) : (
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Type your answer..."
              className="mt-4 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500"
              rows={3}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (currentIndex > 0) {
                setCurrentIndex(currentIndex - 1);
                setCurrentAnswer(answers.get(questions[currentIndex - 1].id) || "");
              }
            }}
            disabled={currentIndex === 0}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 disabled:opacity-50"
          >
            Previous
          </button>

          <div className="flex gap-2">
            {currentIndex < questions.length - 1 ? (
              <button
                onClick={handleAnswer}
                disabled={!currentAnswer}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Next
              </button>
            ) : (
              <button
                onClick={() => {
                  if (currentAnswer) handleAnswer();
                }}
                disabled={!currentAnswer && !answers.has(q.id)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Save Answer
              </button>
            )}
          </div>
        </div>

        {allAnswered && (
          <button
            onClick={submitAssessment}
            disabled={submitting}
            className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Assessment"}
          </button>
        )}

        {/* Question dots */}
        <div className="flex flex-wrap justify-center gap-1">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => {
                if (currentAnswer && !answers.has(questions[currentIndex].id)) handleAnswer();
                setCurrentIndex(i);
                setCurrentAnswer(answers.get(q.id) || "");
              }}
              className={`h-3 w-3 rounded-full transition-colors ${
                i === currentIndex
                  ? "bg-blue-500"
                  : answers.has(q.id)
                    ? "bg-green-500"
                    : "bg-gray-700"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  // Results
  if (phase === "results" && results) {
    const levelColors = {
      BEGINNER: "text-orange-400 border-orange-400/30 bg-orange-400/5",
      INTERMEDIATE: "text-blue-400 border-blue-400/30 bg-blue-400/5",
      ADVANCED: "text-green-400 border-green-400/30 bg-green-400/5",
    };

    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-white">Assessment Complete</h1>

        {/* Level badge */}
        <div className={`rounded-xl border p-6 text-center ${levelColors[results.level]}`}>
          <p className="text-sm font-semibold uppercase">Your Level</p>
          <p className="mt-1 text-3xl font-bold">{results.level}</p>
          <p className="mt-2 text-sm opacity-80">
            {results.correctCount} / {results.totalQuestions} correct ({results.score}%)
          </p>
        </div>

        {/* Weak areas */}
        {results.weakAreas.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Areas to Improve</h2>
            <div className="space-y-2">
              {results.weakAreas.map((w) => (
                <div
                  key={`${w.subject}-${w.topic}`}
                  className="flex items-center justify-between rounded-lg border border-red-900/30 bg-red-900/5 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{w.topic}</p>
                    <p className="text-xs text-gray-500">{w.subject}</p>
                  </div>
                  <span className="text-sm text-red-400">{w.accuracy}%</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Question results */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">Question Review</h2>
          <div className="space-y-2">
            {results.results.map((r, i) => (
              <div
                key={r.questionId}
                className={`rounded-lg border px-4 py-3 ${
                  r.isCorrect
                    ? "border-green-900/30 bg-green-900/5"
                    : "border-red-900/30 bg-red-900/5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">Question {i + 1}</span>
                  <span className={`text-sm font-medium ${r.isCorrect ? "text-green-400" : "text-red-400"}`}>
                    {r.isCorrect ? "Correct" : "Incorrect"}
                  </span>
                </div>
                {!r.isCorrect && (
                  <p className="mt-1 text-xs text-gray-400">
                    Correct answer: {r.correctAnswer}
                  </p>
                )}
                {r.explanation && (
                  <p className="mt-1 text-xs text-gray-500">{r.explanation}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <button
          onClick={() => {
            setPhase("select");
            setResults(null);
            setQuestions([]);
            setAnswers(new Map());
          }}
          className="w-full rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 hover:bg-gray-800"
        >
          Take Another Assessment
        </button>
      </div>
    );
  }

  return null;
}
