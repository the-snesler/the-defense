import type { HostPhaseProps } from "./types";

export default function OpeningForPhase({ state }: HostPhaseProps) {
  const ctx = state.context;
  const pair = ctx.rounds[ctx.currentRoundIndex]?.pairs[ctx.currentPairIndex];
  const speakerName = pair?.forPlayerId
    ? ctx.players[pair.forPlayerId]?.name
    : "?";
  return (
    <div className="text-white p-8 text-center space-y-6">
      <p className="text-green-300 uppercase tracking-widest text-2xl">
        For — Opening Statement
      </p>
      <h1 className="text-6xl font-bold">{speakerName}</h1>
      {pair?.claim && (
        <p className="text-2xl text-gray-300">"{pair.claim.text}"</p>
      )}
      <p className="text-gray-500">
        Audience: submit questions on your phones for cross-exam.
      </p>
    </div>
  );
}
