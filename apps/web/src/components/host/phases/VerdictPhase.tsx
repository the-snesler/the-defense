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
    <div className="host-screen">
      <div className="host-eyebrow">Deliberation</div>
      <h1 className="host-title">Audience is voting</h1>
      {pair?.claim && <p className="host-claim">{pair.claim.text}</p>}
      <p className="host-subtitle">Who argued better? Vote on your phone.</p>
      <p className="host-tally">
        <b>{total}</b> / {audienceCount} votes received
      </p>
    </div>
  );
}
