import type { HostPhaseProps } from "./types";
import ScoreList from "../ScoreList";

export default function TransitionPhase({ state }: HostPhaseProps) {
  const ctx = state.context;
  const round = ctx.rounds[ctx.currentRoundIndex];
  const pair = round?.pairs[ctx.currentPairIndex];
  if (!pair?.forPlayerId || !pair?.againstPlayerId) {
    return <div className="host-screen host-title">...</div>;
  }
  const forName = ctx.players[pair.forPlayerId]?.name ?? "?";
  const againstName = ctx.players[pair.againstPlayerId]?.name ?? "?";
  const forVotes = pair.votesFor.length;
  const againstVotes = pair.votesAgainst.length;
  return (
    <div className="host-screen host-screen--list">
      <div className="host-eyebrow">The verdict is in</div>
      <div className="side-cards compact">
        <div className="side-card for">
          <span className="side-label">For · {forName}</span>
          <span className="side-points">+{pair.pointsAwardedFor}</span>
          <span className="side-meta">
            {forVotes} {forVotes === 1 ? "vote" : "votes"}
          </span>
        </div>
        <div className="side-card against">
          <span className="side-label">Against · {againstName}</span>
          <span className="side-points">+{pair.pointsAwardedAgainst}</span>
          <span className="side-meta">
            {againstVotes} {againstVotes === 1 ? "vote" : "votes"}
          </span>
        </div>
      </div>
      <div className="list-heading">Standings</div>
      <ScoreList players={Object.values(ctx.players)} compact />
    </div>
  );
}
