"use client";

interface SessionTypeOption {
  type: string;
  label: string;
  duration: number;
  questionCount: number;
}

interface Recommendation {
  type: string;
  reason: string;
  label: string;
  duration: number;
  questionCount: number;
}

interface SessionSelectorProps {
  availableTypes: SessionTypeOption[];
  recommended: Recommendation;
  stats: { totalQuestions: number; topicsStudied: number; weakAreas: number };
  onSelect: (type: string) => void;
  loading?: boolean;
}

const SESSION_ICONS: Record<string, string> = {
  micro: "⚡",
  quick: "🎯",
  deep: "📚",
  repair: "🔧",
  recovery: "🔄",
  intensive: "🔥",
};

export function SessionSelector({
  availableTypes,
  recommended,
  stats,
  onSelect,
  loading = false,
}: SessionSelectorProps) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
          <p className="text-2xl font-bold text-white">{stats.totalQuestions}</p>
          <p className="text-xs text-gray-500">Questions Available</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
          <p className="text-2xl font-bold text-white">{stats.topicsStudied}</p>
          <p className="text-xs text-gray-500">Topics Studied</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{stats.weakAreas}</p>
          <p className="text-xs text-gray-500">Weak Areas</p>
        </div>
      </div>

      {/* Recommended */}
      <div className="rounded-xl border-2 border-blue-600 bg-blue-600/5 p-6">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
            RECOMMENDED
          </span>
        </div>
        <h3 className="mb-1 text-lg font-semibold text-white">
          {SESSION_ICONS[recommended.type]} {recommended.label}
        </h3>
        <p className="mb-3 text-sm text-gray-400">{recommended.reason}</p>
        <div className="mb-4 flex gap-4 text-sm text-gray-500">
          <span>{Math.round(recommended.duration / 60)} min</span>
          <span>{recommended.questionCount} questions</span>
        </div>
        <button
          onClick={() => onSelect(recommended.type)}
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Starting..." : "Start Session"}
        </button>
      </div>

      {/* All session types */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-gray-400">
          All Session Types
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {availableTypes
            .filter((t) => t.type !== recommended.type)
            .map((st) => (
              <button
                key={st.type}
                onClick={() => onSelect(st.type)}
                disabled={loading}
                className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-left transition-colors hover:border-gray-700 disabled:opacity-50"
              >
                <h4 className="font-medium text-white">
                  {SESSION_ICONS[st.type]} {st.label}
                </h4>
                <div className="mt-1 flex gap-3 text-xs text-gray-500">
                  <span>{Math.round(st.duration / 60)} min</span>
                  <span>{st.questionCount} questions</span>
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
