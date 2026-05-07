import { useState } from "react";
import type { PlayerPhaseProps } from "./types";

export default function ClaimGenerationPhase({
  view,
  actions,
}: PlayerPhaseProps) {
  const [pickedLocally, setPickedLocally] = useState(false);

  const subjects = view.subjectOptions;
  const predicates = view.predicateOptions;

  if (subjects && subjects.length > 0) {
    if (view.hasSubmittedSubject || pickedLocally) {
      return <Waiting message="Waiting for your opponent's predicate..." />;
    }
    return (
      <div className="space-y-3 text-white">
        <h2 className="text-xl font-bold text-center">Pick a subject</h2>
        <p className="text-gray-400 text-xs text-center">
          Your opponent is picking a predicate.
        </p>
        {subjects.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setPickedLocally(true);
              actions.submitSubject(s.id);
            }}
            className="w-full bg-gray-700 hover:bg-gray-600 rounded px-4 py-3 text-left text-lg"
          >
            {s.text}
          </button>
        ))}
      </div>
    );
  }

  if (predicates && predicates.length > 0) {
    if (view.hasSubmittedPredicate || pickedLocally) {
      return <Waiting message="Waiting for your opponent's subject..." />;
    }
    return (
      <div className="space-y-3 text-white">
        <h2 className="text-xl font-bold text-center">Pick a predicate</h2>
        <p className="text-gray-400 text-xs text-center">
          Your opponent is picking a subject.
        </p>
        {predicates.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setPickedLocally(true);
              actions.submitPredicate(p.id);
            }}
            className="w-full bg-gray-700 hover:bg-gray-600 rounded px-4 py-3 text-left text-lg"
          >
            ...{p.text}
          </button>
        ))}
      </div>
    );
  }

  return <Waiting message="Waiting for other pairs..." />;
}

function Waiting({ message }: { message: string }) {
  return (
    <div className="text-white text-center space-y-2">
      <h2 className="text-2xl font-bold">Got it!</h2>
      <p className="text-gray-400">{message}</p>
    </div>
  );
}
