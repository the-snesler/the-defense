import type { HostPhaseProps } from "./types";

export default function ClaimGenerationPhase({ state }: HostPhaseProps) {
  const round = state.context.rounds[state.context.currentRoundIndex];
  const total = round?.pairs.length ?? 0;
  const done =
    round?.pairs.filter((p) => p.chosenSubject && p.chosenPredicate).length ??
    0;
  return (
    <div className="text-white p-8 text-center space-y-6">
      <h1 className="text-5xl font-bold">Crafting claims...</h1>
      <p className="text-gray-400 text-xl">
        Each pair is choosing a subject and a predicate.
      </p>
      <p className="text-3xl">
        <span className="font-bold">{done}</span>{" "}
        <span className="text-gray-500">/</span> {total} pairs ready
      </p>
    </div>
  );
}
