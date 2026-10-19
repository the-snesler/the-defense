import type { HostPhaseProps } from "./types";
import PairList from "../PairList";

export default function RoundBreakPhase({ state }: HostPhaseProps) {
  const ctx = state.context;
  const r2 = ctx.rounds[1];
  return (
    <div className="host-screen host-screen--list">
      <h1 className="host-title">Round 2</h1>
      <div className="double-points">Double Points</div>
      <div className="list-heading">New pairings</div>
      <PairList pairs={r2?.pairs ?? []} players={ctx.players} />
    </div>
  );
}
