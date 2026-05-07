import type { HostPhaseProps } from "./types";

export default function TransitionPhase({ state }: HostPhaseProps) {
  const ctx = state.context;
  const round = ctx.rounds[ctx.currentRoundIndex];
  const pair = round?.pairs[ctx.currentPairIndex];
  if (!pair?.forPlayerId || !pair?.againstPlayerId) {
    return <div className="text-white p-8">...</div>;
  }
  const forName = ctx.players[pair.forPlayerId]?.name ?? "?";
  const againstName = ctx.players[pair.againstPlayerId]?.name ?? "?";
  const forVotes = pair.votesFor.length;
  const againstVotes = pair.votesAgainst.length;
  return (
    <div className="text-white p-8 space-y-8 text-center">
      <h1 className="text-4xl font-bold">Verdict</h1>
      <div className="grid grid-cols-2 gap-6 max-w-3xl mx-auto">
        <div className="bg-green-900/40 rounded p-6 border border-green-600">
          <p className="text-green-300 uppercase tracking-wide">
            For · {forName}
          </p>
          <p className="text-5xl font-bold mt-2">+{pair.pointsAwardedFor}</p>
          <p className="text-gray-400 mt-1">{forVotes} votes</p>
        </div>
        <div className="bg-red-900/40 rounded p-6 border border-red-600">
          <p className="text-red-300 uppercase tracking-wide">
            Against · {againstName}
          </p>
          <p className="text-5xl font-bold mt-2">
            +{pair.pointsAwardedAgainst}
          </p>
          <p className="text-gray-400 mt-1">{againstVotes} votes</p>
        </div>
      </div>
    </div>
  );
}
