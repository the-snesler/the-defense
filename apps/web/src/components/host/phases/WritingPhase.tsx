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
    <div className="text-white p-8 text-center space-y-8">
      <h1 className="text-5xl font-bold">
        Round {currentRoundIndex + 1}: Write!
      </h1>
      <p className="text-gray-400 text-xl">
        Half of the players are writing subjects, half are writing predicates.
        Anything goes.
      </p>

      <div className="grid grid-cols-2 gap-8 max-w-3xl mx-auto">
        <div className="bg-blue-900/30 border border-blue-500/40 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-blue-300 mb-2">Subjects</h2>
          <p className="text-5xl font-bold">{subjectCount}</p>
          <p className="text-gray-400 text-sm mt-3">
            {subjectWriters.join(", ")}
          </p>
        </div>
        <div className="bg-purple-900/30 border border-purple-500/40 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-purple-300 mb-2">
            Predicates
          </h2>
          <p className="text-5xl font-bold">{predicateCount}</p>
          <p className="text-gray-400 text-sm mt-3">
            {predicateWriters.join(", ")}
          </p>
        </div>
      </div>
    </div>
  );
}
