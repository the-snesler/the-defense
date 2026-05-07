import type { HostPhaseProps } from "./types";

export default function VerdictPhase({ state }: HostPhaseProps) {
  const ctx = state.context;
  const pair = ctx.rounds[ctx.currentRoundIndex]?.pairs[ctx.currentPairIndex];
  const total =
    (pair?.votesFor.length ?? 0) + (pair?.votesAgainst.length ?? 0);
  const audienceCount = Object.values(ctx.players).filter(
    (p) =>
      p.isConnected &&
      p.id !== pair?.forPlayerId &&
      p.id !== pair?.againstPlayerId,
  ).length;
  return (
    <div className="text-white p-8 space-y-6 text-center">
      <h1 className="text-5xl font-bold">Audience is voting</h1>
      {pair?.claim && (
        <p className="text-2xl text-gray-300">"{pair.claim.text}"</p>
      )}
      <p className="text-3xl text-gray-400">
        <span className="font-bold">{total}</span>{" "}
        <span className="text-gray-500">/</span> {audienceCount} votes received
      </p>
    </div>
  );
}
