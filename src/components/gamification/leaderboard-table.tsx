"use client";

interface LeaderboardUser {
  rank: number;
  userId: string;
  name: string | null;
  image: string | null;
  xp: number;
}

interface LeaderboardData {
  rank: number | null;
  userXp: number;
  top10: LeaderboardUser[];
  week: number;
  year: number;
}

export function LeaderboardTable({
  data,
  currentUserId,
}: {
  data: LeaderboardData;
  currentUserId: string;
}) {
  if (data.top10.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center text-sm text-gray-500">
        No leaderboard data this week. Start earning XP!
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-800 px-5 py-3">
        <h3 className="text-lg font-semibold text-white">Weekly Leaderboard</h3>
        <span className="text-xs text-gray-500">Week {data.week}</span>
      </div>

      <div className="divide-y divide-gray-800">
        {data.top10.map((entry) => {
          const isCurrentUser = entry.userId === currentUserId;
          const rankColors = ["text-yellow-400", "text-gray-300", "text-amber-600"];
          const rankColor = entry.rank <= 3 ? rankColors[entry.rank - 1] : "text-gray-500";

          return (
            <div
              key={entry.userId}
              className={`flex items-center gap-4 px-5 py-3 ${
                isCurrentUser ? "bg-blue-600/5" : ""
              }`}
            >
              <span className={`w-6 text-center text-sm font-bold ${rankColor}`}>
                {entry.rank <= 3
                  ? ["\u{1F947}", "\u{1F948}", "\u{1F949}"][entry.rank - 1]
                  : `#${entry.rank}`}
              </span>

              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-xs font-medium text-gray-300">
                {entry.name?.[0]?.toUpperCase() || "?"}
              </div>

              <div className="flex-1">
                <p className={`text-sm font-medium ${isCurrentUser ? "text-blue-400" : "text-white"}`}>
                  {entry.name || "Anonymous"}
                  {isCurrentUser && " (you)"}
                </p>
              </div>

              <span className="text-sm font-semibold text-purple-400">
                {entry.xp.toLocaleString()} XP
              </span>
            </div>
          );
        })}
      </div>

      {data.rank && data.rank > 10 && (
        <div className="border-t border-gray-800 px-5 py-3 text-center text-sm text-gray-500">
          Your rank: <span className="font-semibold text-white">#{data.rank}</span> with{" "}
          <span className="text-purple-400">{data.userXp.toLocaleString()} XP</span>
        </div>
      )}
    </div>
  );
}
