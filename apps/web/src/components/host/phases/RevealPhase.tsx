import type { HostPhaseProps } from "./types";

export default function RevealPhase({ state }: HostPhaseProps) {
  const round = state.context.rounds[state.context.currentRoundIndex];
  const pair = round?.pairs[state.context.currentPairIndex];
  const players = state.context.players;
  if (!pair?.claim || !pair.forPlayerId || !pair.againstPlayerId) {
    return (
      <div className="host-screen">
        <h1 className="host-title">Revealing...</h1>
      </div>
    );
  }
  const forName = players[pair.forPlayerId]?.name ?? "?";
  const againstName = players[pair.againstPlayerId]?.name ?? "?";
  return (
    <div className="host-screen">
      <div className="host-eyebrow">The Claim</div>
      <h1 className="host-claim hero">{pair.claim.text}</h1>
      <div className="side-cards">
        <div className="side-card for">
          <span className="side-label">For</span>
          <span className="side-name">{forName}</span>
        </div>
        <div className="side-card against">
          <span className="side-label">Against</span>
          <span className="side-name">{againstName}</span>
        </div>
      </div>
    </div>
  );
}
