import type { PlayerPhaseProps } from "./types";

export default function RevealPhase({ view }: PlayerPhaseProps) {
  return (
    <div className="space-y-3 text-white text-center">
      <p className="text-gray-400 uppercase tracking-widest text-xs">
        The Claim
      </p>
      <h2 className="text-2xl font-bold leading-snug">
        {view.currentClaim?.text ?? "..."}
      </h2>
      {view.role === "DEBATER_FOR" && (
        <p className="text-2xl text-green-400 font-bold mt-2">You are FOR</p>
      )}
      {view.role === "DEBATER_AGAINST" && (
        <p className="text-2xl text-red-400 font-bold mt-2">You are AGAINST</p>
      )}
      {view.role === "AUDIENCE" && view.currentPair && (
        <p className="text-gray-400 text-sm">
          <span className="text-green-400">{view.currentPair.forPlayerName}</span>{" "}
          vs{" "}
          <span className="text-red-400">
            {view.currentPair.againstPlayerName}
          </span>
        </p>
      )}
    </div>
  );
}
