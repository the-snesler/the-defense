import type { HostPhaseProps } from "./types";

export default function WritingPhase({ state }: HostPhaseProps) {
  const { roundContent, players, currentRoundIndex } = state.context;
  const subjectCount = roundContent.subjects.length;
  const predicateCount = roundContent.predicates.length;

  const writers = Object.entries(roundContent.writerAssignments);
  const subjectWriters = writers
    .filter(([, role]) => role === "SUBJECT")
    .map(([id]) => players[id]?.name ?? "?");
  const predicateWriters = writers
    .filter(([, role]) => role === "PREDICATE")
    .map(([id]) => players[id]?.name ?? "?");

  return (
    <div className="host-screen">
      <div className="host-eyebrow">Round {currentRoundIndex + 1}</div>
      <h1 className="host-title">Write!</h1>
      <p className="host-subtitle">
        Half of the players are writing subjects, half are writing predicates.
        Anything goes.
      </p>

      <div className="pool-cards">
        <div className="pool-card">
          <h2>Subjects</h2>
          <span className="pool-count">{subjectCount}</span>
          <span className="pool-writers">{subjectWriters.join(", ")}</span>
        </div>
        <div className="pool-card">
          <h2>Predicates</h2>
          <span className="pool-count">{predicateCount}</span>
          <span className="pool-writers">{predicateWriters.join(", ")}</span>
        </div>
      </div>
    </div>
  );
}
