import type { HostPhaseProps } from "./types";

// Cross-examination: each debater gets their own audience question.
// Q1 → FOR debater answers alone; Q2 → AGAINST debater answers alone.
function CrossExamScreen({
  state,
  which,
}: HostPhaseProps & { which: "q1" | "q2" }) {
  const ctx = state.context;
  const pair = ctx.rounds[ctx.currentRoundIndex]?.pairs[ctx.currentPairIndex];
  const a = ctx.crossExamAssignments[which];
  if (!a) {
    return (
      <div className="p-16 text-center font-display text-5xl text-ink">
        Selecting a question...
      </div>
    );
  }

  const q = ctx.audienceQuestionsForCurrentPair.find(
    (qq) => qq.id === a.questionId,
  );
  const target = ctx.players[a.targetPlayerId];
  const otherId =
    a.targetSide === "FOR" ? pair?.againstPlayerId : pair?.forPlayerId;
  const other = otherId ? ctx.players[otherId] : null;
  const isFor = a.targetSide === "FOR";
  const sideText = isFor ? "text-for" : "text-against";
  const sideBorder = isFor ? "border-for" : "border-against";
  const questionNumber = which === "q1" ? 1 : 2;

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col items-center gap-10 px-16 py-10 text-center text-ink">
      <p className="font-mono text-2xl font-bold uppercase tracking-[0.2em] text-ink-dim">
        Cross-Examination · Question {questionNumber} of 2
      </p>

      <h2 className="font-display text-6xl leading-tight">
        Question for <span className={sideText}>{target?.name ?? "?"}</span>
        <span
          className={`ml-6 inline-block border-4 px-5 py-1 align-middle font-mono text-4xl font-bold ${sideBorder} ${sideText}`}
        >
          {a.targetSide}
        </span>
      </h2>

      <blockquote
        className={`w-full border-l-8 bg-bg-1 px-12 py-10 text-left font-display text-7xl leading-tight text-ink ${sideBorder}`}
      >
        &ldquo;{q?.text ?? "..."}&rdquo;
        {q?.isFallback && (
          <span className="mt-6 block font-mono text-2xl uppercase tracking-[0.2em] text-ink-dim">
            Asked by the court
          </span>
        )}
      </blockquote>

      <p className="text-4xl font-bold">
        <span className={sideText}>{target?.name ?? "?"}</span> has the floor ·{" "}
        {ctx.config.crossExamResponseSeconds} seconds
      </p>
      {other && (
        <p className="text-3xl text-ink-dim">
          {other.name}, hold your objections.
        </p>
      )}

      {pair?.claim && (
        <p className="text-2xl italic text-ink-dim">
          The claim: &ldquo;{pair.claim.text}&rdquo;
        </p>
      )}
    </div>
  );
}

export default function CrossExamQ1Phase({ state }: HostPhaseProps) {
  return <CrossExamScreen state={state} which="q1" />;
}

export { CrossExamScreen };
