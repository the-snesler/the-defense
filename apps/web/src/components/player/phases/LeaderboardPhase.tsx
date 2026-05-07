import type { Player } from "@nofus/shared";

interface LeaderboardPhaseProps {
  playerId: string;
  players: Record<
    string,
    Pick<Player, "id" | "name" | "score" | "isVip" | "isConnected" | "avatarId">
  >;
}

export default function LeaderboardPhase({
  playerId,
  players,
}: LeaderboardPhaseProps) {
  const sortedPlayers = Object.values(players).sort(
    (a, b) => b.score - a.score,
  );
  const rank = sortedPlayers.findIndex((p) => p.id === playerId) + 1;
  const myScore = players[playerId]?.score || 0;

  return (
    <div className="flex flex-col gap-6 text-center">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 flex flex-col gap-4">
        <h2 className="text-3xl font-bold text-white">Game Over!</h2>

        <div className="flex flex-col items-center">
          <div className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-1">
            Your Final Rank:
          </div>
          <div className="text-6xl font-black text-blue-500 mb-2">#{rank}</div>
          <div className="text-xl font-bold text-white">
            with {myScore} points
          </div>
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-500/50 rounded-xl p-6">
        <p className="text-gray-300 italic">
          {rank === 1
            ? "Congratulations! You are the ultimate truth-teller (or the best liar)!"
            : rank <= 3
              ? "So close! Great job!"
              : "Better luck next time! Keep practicing those lies."}
        </p>
      </div>

      <p className="text-gray-500 text-sm">
        Check the big screen for the full results.
      </p>
    </div>
  );
}
