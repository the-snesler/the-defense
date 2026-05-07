import { useState } from "react";
import type { PlayerPhaseProps } from "./types";

export default function PrepPhase({ view }: PlayerPhaseProps) {
  const [notes, setNotes] = useState("");
  const isDebater =
    view.role === "DEBATER_FOR" || view.role === "DEBATER_AGAINST";
  if (!isDebater) {
    return (
      <div className="text-white text-center space-y-2">
        <h2 className="text-xl font-bold">Debate starting soon</h2>
        {view.currentClaim && (
          <p className="text-gray-300 text-sm">
            "{view.currentClaim.text}"
          </p>
        )}
      </div>
    );
  }
  const sideColor =
    view.role === "DEBATER_FOR" ? "text-green-400" : "text-red-400";
  const sideLabel = view.role === "DEBATER_FOR" ? "FOR" : "AGAINST";
  return (
    <div className="space-y-3 text-white">
      <p className={`text-xl font-bold text-center ${sideColor}`}>
        You are {sideLabel}
      </p>
      <p className="text-lg text-center">"{view.currentClaim?.text ?? ""}"</p>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Quick notes (private to you)..."
        className="w-full h-32 bg-gray-700 rounded p-3 text-white placeholder-gray-400"
      />
    </div>
  );
}
