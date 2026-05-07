import type { HostPhaseProps } from "./types";

export default function PairingPhase({ state }: HostPhaseProps) {
  const round = state.context.rounds[0];
  const players = state.context.players;
  return (
    <div className="text-white p-8 space-y-6">
      <h1 className="text-5xl font-bold text-center">Round 1 Pairings</h1>
      <ul className="space-y-3 max-w-2xl mx-auto">
        {round?.pairs.map((p, i) => (
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
