import type { HostPhaseProps } from "./types";

export default function CrossExamQ1Phase({ state }: HostPhaseProps) {
  const ctx = state.context;
  const pair = ctx.rounds[ctx.currentRoundIndex]?.pairs[ctx.currentPairIndex];
  const a = ctx.crossExamAssignments.q1;
  if (!a) {
    return (
      <div className="text-white p-8 text-center">Loading question...</div>
    );
  }
  const q = ctx.audienceQuestionsForCurrentPair.find(
    (qq) => qq.id === a.questionId,
  );
  const responder = ctx.players[a.responderId];
  return (
    <div className="text-white p-8 space-y-8 text-center">
      <p className="text-gray-400 uppercase tracking-widest">
        Cross-Examination · Q1
      </p>
      <h1 className="text-4xl font-bold leading-snug">
        "{q?.text ?? "..."}"
      </h1>
      <p className="text-2xl text-green-300">
        For <span className="font-bold">{responder?.name ?? "?"}</span> (FOR)
      </p>
      {pair?.claim && (
        <p className="text-sm text-gray-500">"{pair.claim.text}"</p>
      )}
    </div>
  );
}
