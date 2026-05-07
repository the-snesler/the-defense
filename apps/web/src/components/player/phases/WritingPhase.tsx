import { useState } from "react";
import type { PlayerPhaseProps } from "./types";

const MAX_LENGTH = 100;

export default function WritingPhase({ view, actions }: PlayerPhaseProps) {
  const [text, setText] = useState("");
  const role = view.writerRole;

  if (!role) {
    return (
      <div className="text-white text-center space-y-2">
        <h2 className="text-2xl font-bold">Hold tight</h2>
        <p className="text-gray-400">Waiting for the writing phase to start...</p>
      </div>
    );
  }

  const isSubject = role === "SUBJECT";
  const submit = () => {
    const trimmed = text.trim();
    if (trimmed.length === 0) return;
    if (isSubject) actions.submitAuthoredSubject(trimmed);
    else actions.submitAuthoredPredicate(trimmed);
    setText("");
  };

  return (
    <div className="text-white space-y-4">
      <h2 className="text-2xl font-bold text-center">
        {isSubject ? "Write subjects" : "Write predicates"}
      </h2>

      {isSubject ? (
        <div className="text-gray-400 text-sm space-y-1 bg-gray-800 rounded p-3">
          <p>
            A <strong>subject</strong> is a person, place, or thing.
          </p>
          <p className="text-gray-500">
            e.g. "Shrek", "the state of Wisconsin", "my landlord"
          </p>
        </div>
      ) : (
        <div className="text-gray-400 text-sm space-y-1 bg-gray-800 rounded p-3">
          <p>
            A <strong>predicate</strong> is what the subject did or is.
          </p>
          <p className="text-gray-500">
            e.g. "invented jazz", "is legally a vegetable"
          </p>
        </div>
      )}

      <div className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={
            isSubject
              ? "type a subject and hit submit"
              : "type a predicate and hit submit"
          }
          rows={2}
          className="w-full bg-gray-700 rounded px-3 py-2 text-lg resize-none"
        />
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{text.length} / {MAX_LENGTH}</span>
          <span>Submit as many as you can!</span>
        </div>
        <button
          onClick={submit}
          disabled={text.trim().length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded py-3 font-semibold text-lg"
        >
          Submit
        </button>
      </div>

      <div className="text-center text-sm text-gray-400">
        Submitted: <strong>{view.myAuthoredCount ?? 0}</strong>
      </div>
    </div>
  );
}
