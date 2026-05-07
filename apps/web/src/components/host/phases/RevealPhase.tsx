import type { HostPhaseProps } from "./types";

export default function RevealPhase({ state }: HostPhaseProps) {
  const round = state.context.rounds[state.context.currentRoundIndex];
  const pair = round?.pairs[state.context.currentPairIndex];
  const players = state.context.players;
  if (!pair?.claim || !pair.forPlayerId || !pair.againstPlayerId) {
    return <div className="text-white p-8 text-center">Revealing...</div>;
  }
  const forName = players[pair.forPlayerId]?.name ?? "?";
  const againstName = players[pair.againstPlayerId]?.name ?? "?";
  return (
    <div className="text-white p-8 space-y-8 text-center">
      <p className="text-gray-400 uppercase tracking-widest">The Claim</p>
      <h1 className="text-5xl font-bold leading-snug">{pair.claim.text}</h1>
      <div className="grid grid-cols-2 gap-6 max-w-3xl mx-auto">
        <div className="bg-green-900/40 rounded p-6 border border-green-600">
          <p className="text-green-300 uppercase tracking-wide text-sm">For</p>
          <p className="text-3xl font-bold mt-2">{forName}</p>
        </div>
        <div className="bg-red-900/40 rounded p-6 border border-red-600">
          <p className="text-red-300 uppercase tracking-wide text-sm">
            Against
          </p>
          <p className="text-3xl font-bold mt-2">{againstName}</p>
        </div>
      </div>
    </div>
  );
}
