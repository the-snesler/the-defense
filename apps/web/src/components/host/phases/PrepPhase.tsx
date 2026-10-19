import type { HostPhaseProps } from "./types";

export default function PrepPhase({ state }: HostPhaseProps) {
  const round = state.context.rounds[state.context.currentRoundIndex];
  const pair = round?.pairs[state.context.currentPairIndex];
  const players = state.context.players;
  const forName = pair?.forPlayerId ? players[pair.forPlayerId]?.name : "?";
  const againstName = pair?.againstPlayerId
    ? players[pair.againstPlayerId]?.name
    : "?";
  return (
    <div className="host-screen">
      <div className="host-eyebrow">Silent prep</div>
      <h1 className="host-title">Debaters preparing...</h1>
      {pair?.claim && <p className="host-claim">{pair.claim.text}</p>}
      <div className="matchup">
        <span className="side-name for">
          {forName}
          <span className="side-tag for">FOR</span>
        </span>
        <span className="vs">vs</span>
        <span className="side-name against">
          {againstName}
          <span className="side-tag against">AGAINST</span>
        </span>
      </div>
    </div>
  );
}
