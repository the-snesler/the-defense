import type { HostPhaseProps } from "./types";

export default function CrossExamQ2Phase({ state }: HostPhaseProps) {
  const ctx = state.context;
  const pair = ctx.rounds[ctx.currentRoundIndex]?.pairs[ctx.currentPairIndex];
  const a = ctx.crossExamAssignments.q2;
  if (!a) {
    return (
      <div className="text-white p-8 text-center">Loading question...</div>
    );
  }
  const q = ctx.audienceQuestionsForCurrentPair.find(
    (qq) => qq.id === a.questionId,
  );
  const forPlayer = pair?.forPlayerId
    ? ctx.players[pair.forPlayerId]
    : null;
  const againstPlayer = pair?.againstPlayerId
    ? ctx.players[pair.againstPlayerId]
    : null;
  return (
    <div className="text-white p-8 space-y-8 text-center">
      <p className="text-gray-400 uppercase tracking-widest">
        Cross-Examination · Q2
      </p>
      <h1 className="text-4xl font-bold leading-snug">
        "{q?.text ?? "..."}"
      </h1>
      <div className="flex items-center justify-center gap-8 text-2xl">
        <span className="text-green-300 font-bold">
          {forPlayer?.name ?? "?"} <span className="text-green-500">(FOR)</span>
        </span>
        <span className="text-gray-500">vs.</span>
        <span className="text-red-300 font-bold">
          {againstPlayer?.name ?? "?"}{" "}
          <span className="text-red-500">(AGAINST)</span>
        </span>
      </div>
      {pair?.claim && (
        <p className="text-sm text-gray-500">"{pair.claim.text}"</p>
      )}
    </div>
  );
}
