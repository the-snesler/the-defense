import type { HostPhaseProps } from "./types";

export default function FinalePhase({ state }: HostPhaseProps) {
  const players = Object.values(state.context.players).sort(
    (a, b) => b.score - a.score,
  );
  return (
    <div className="text-white p-8 space-y-6">
      <h1 className="text-6xl font-bold text-center">Final Scores</h1>
      <ol className="space-y-3 max-w-2xl mx-auto">
        {players.map((p, i) => (
          <li
            key={p.id}
            className={`rounded p-4 flex items-center justify-between ${
              i === 0
                ? "bg-yellow-700/40 border border-yellow-400"
                : "bg-gray-800"
            }`}
          >
            <span className="text-gray-400 text-2xl">#{i + 1}</span>
            <span className="text-3xl font-semibold flex-1 text-center">
              {p.name} {i === 0 && "👑"}
            </span>
            <span className="text-3xl font-bold">{p.score}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
