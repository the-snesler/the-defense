import type { HostPhaseProps } from "./types";
import ScoreList from "../ScoreList";

export default function FinalePhase({ state }: HostPhaseProps) {
  const players = Object.values(state.context.players);
  return (
    <div className="host-screen host-screen--list">
      <div className="host-eyebrow">The court has ruled</div>
      <h1 className="host-title">Final Scores</h1>
      <ScoreList players={players} />
    </div>
  );
}
