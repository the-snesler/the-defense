import type { PlayerPhaseProps } from "./types";

export default function PairingPhase({ view }: PlayerPhaseProps) {
  const partner = view.myPairPartnerId
    ? view.players[view.myPairPartnerId]?.name
    : null;
  return (
    <div className="space-y-3 text-white text-center">
      <h2 className="text-2xl font-bold">Round 1 Pairings</h2>
      {partner ? (
        <p className="text-xl">
          You're paired with <span className="font-bold">{partner}</span>
        </p>
      ) : (
        <p className="text-gray-400">Pairings shown on the host screen</p>
      )}
    </div>
  );
}
