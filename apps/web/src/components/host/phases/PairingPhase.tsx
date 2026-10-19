import type { HostPhaseProps } from "./types";
import PairList from "../PairList";

export default function PairingPhase({ state }: HostPhaseProps) {
  const round = state.context.rounds[0];
  return (
    <div className="host-screen host-screen--list">
      <div className="host-eyebrow">The docket</div>
      <h1 className="host-title">Round 1 Pairings</h1>
      <PairList pairs={round?.pairs ?? []} players={state.context.players} />
    </div>
  );
}
