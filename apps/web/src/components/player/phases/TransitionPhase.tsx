import type { PlayerPhaseProps } from "./types";

export default function TransitionPhase({ view }: PlayerPhaseProps) {
  const t = view.verdictTallies;
  return (
    <div className="space-y-4 text-white text-center">
      <h2 className="text-xl font-bold">Verdict</h2>
      {t ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-green-900/50 rounded p-3">
            <p className="text-green-300 text-xs uppercase">For</p>
            <p className="text-3xl font-bold">{t.forVotes}</p>
          </div>
          <div className="bg-red-900/50 rounded p-3">
            <p className="text-red-300 text-xs uppercase">Against</p>
            <p className="text-3xl font-bold">{t.againstVotes}</p>
          </div>
        </div>
      ) : (
        <p className="text-gray-400 text-sm">Tallying...</p>
      )}
    </div>
  );
}
