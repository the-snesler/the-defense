import type { HostPhaseProps } from "./types";

export default function OpeningAgainstPhase({ state }: HostPhaseProps) {
  const ctx = state.context;
  const pair = ctx.rounds[ctx.currentRoundIndex]?.pairs[ctx.currentPairIndex];
  const speakerName = pair?.againstPlayerId
    ? ctx.players[pair.againstPlayerId]?.name
    : "?";
  return (
    <div className="text-white p-8 text-center space-y-6">
      <p className="text-red-300 uppercase tracking-widest text-2xl">
        Against — Opening Statement
      </p>
      <h1 className="text-6xl font-bold">{speakerName}</h1>
      {pair?.claim && (
        <p className="text-2xl text-gray-300">"{pair.claim.text}"</p>
      )}
      <p className="text-gray-500">
        Audience: keep submitting questions for cross-exam.
      </p>
    </div>
  );
}
