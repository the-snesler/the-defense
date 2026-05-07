import type { PlayerPhaseProps } from "./types";

export default function FinalePhase({ view }: PlayerPhaseProps) {
  const ranked = Object.values(view.players).sort((a, b) => b.score - a.score);
  return (
    <div className="space-y-3 text-white">
      <h2 className="text-xl font-bold text-center">Final Scores</h2>
      <ol className="space-y-2">
        {ranked.map((p, i) => (
          <li
            key={p.id}
            className={`flex items-center justify-between rounded p-3 ${
              p.id === view.playerId ? "bg-blue-900/50" : "bg-gray-700"
            }`}
          >
            <span className="text-gray-400">
              #{i + 1} {p.name}
              {i === 0 && " 👑"}
            </span>
            <span className="font-bold">{p.score}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
