import type { PlayerPhaseProps } from "./types";

export default function RoundBreakPhase({ view }: PlayerPhaseProps) {
  const partner = view.myUpcomingRound2PartnerId
    ? view.players[view.myUpcomingRound2PartnerId]?.name
    : null;
  return (
    <div className="text-white text-center space-y-3">
      <h2 className="text-2xl font-bold">Round 2</h2>
      <p className="text-yellow-300 font-semibold">DOUBLE POINTS</p>
      {partner ? (
        <p className="text-lg">
          Your next opponent:{" "}
          <span className="font-bold">{partner}</span>
        </p>
      ) : (
        <p className="text-gray-400 text-sm">See host screen for pairings</p>
      )}
    </div>
  );
}
