import type { HostPhaseProps } from "./types";

export default function ClaimGenerationPhase({ state }: HostPhaseProps) {
  const round = state.context.rounds[state.context.currentRoundIndex];
  const total = round?.pairs.length ?? 0;
  const done =
    round?.pairs.filter((p) => p.chosenSubject && p.chosenPredicate).length ??
    0;
  return (
    <div className="host-screen">
      <div className="host-eyebrow">Drafting the charges</div>
      <h1 className="host-title">Crafting claims...</h1>
      <p className="host-subtitle">
        Each pair is choosing a subject and a predicate.
      </p>
      <p className="host-tally">
        <b>{done}</b> / {total} pairs ready
      </p>
    </div>
  );
}
