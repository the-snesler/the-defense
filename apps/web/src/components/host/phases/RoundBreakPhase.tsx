import type { HostPhaseProps } from "./types";

export default function RoundBreakPhase({ state }: HostPhaseProps) {
  const ctx = state.context;
  const r2 = ctx.rounds[1];
  const players = ctx.players;
  return (
    <div className="text-white p-8 space-y-6 text-center">
      <h1 className="text-6xl font-bold">Round 2</h1>
      <p className="text-3xl text-yellow-300 font-semibold">DOUBLE POINTS</p>
      <ul className="space-y-3 max-w-2xl mx-auto">
        {r2?.pairs.map((p, i) => (
          <li
            key={p.id}
            className="bg-gray-800 rounded p-4 flex items-center justify-between"
          >
            <span className="text-gray-500 text-xl">#{i + 1}</span>
            <span className="text-2xl font-semibold">
              {players[p.playerAId]?.name ?? "?"}
            </span>
            <span className="text-gray-500">vs</span>
            <span className="text-2xl font-semibold">
              {players[p.playerBId]?.name ?? "?"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
