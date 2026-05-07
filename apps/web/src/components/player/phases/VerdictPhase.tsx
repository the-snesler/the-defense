import { useState } from "react";
import type { PlayerPhaseProps } from "./types";

export default function VerdictPhase({ view, actions }: PlayerPhaseProps) {
  const [submittedLocally, setSubmittedLocally] = useState(false);
  const isDebater =
    view.role === "DEBATER_FOR" || view.role === "DEBATER_AGAINST";

  if (isDebater) {
    return (
      <div className="text-white text-center space-y-2">
        <h2 className="text-xl font-bold">Audience is voting...</h2>
        {view.currentClaim && (
          <p className="text-gray-400 text-sm">"{view.currentClaim.text}"</p>
        )}
      </div>
    );
  }

  if (view.hasSubmittedVerdict || submittedLocally) {
    return (
      <div className="text-white text-center">
        <h2 className="text-2xl font-bold">Vote submitted ✓</h2>
        <p className="text-gray-400 text-sm mt-1">
          Waiting for the rest of the audience...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-white">
      <h2 className="text-xl font-bold text-center">Who won?</h2>
      {view.currentClaim && (
        <p className="text-gray-400 text-center text-sm">
          "{view.currentClaim.text}"
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => {
            setSubmittedLocally(true);
            actions.submitVerdict("FOR");
          }}
          className="bg-green-600 hover:bg-green-700 active:bg-green-800 rounded px-4 py-4 font-bold"
        >
          FOR
          <br />
          <span className="text-sm font-normal">
            {view.currentPair?.forPlayerName}
          </span>
        </button>
        <button
          onClick={() => {
            setSubmittedLocally(true);
            actions.submitVerdict("AGAINST");
          }}
          className="bg-red-600 hover:bg-red-700 active:bg-red-800 rounded px-4 py-4 font-bold"
        >
          AGAINST
          <br />
          <span className="text-sm font-normal">
            {view.currentPair?.againstPlayerName}
          </span>
        </button>
      </div>
    </div>
  );
}
