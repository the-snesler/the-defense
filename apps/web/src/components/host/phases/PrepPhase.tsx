import type { HostPhaseProps } from "./types";

export default function PrepPhase({ state }: HostPhaseProps) {
  const round = state.context.rounds[state.context.currentRoundIndex];
  const pair = round?.pairs[state.context.currentPairIndex];
  const players = state.context.players;
  const forName = pair?.forPlayerId ? players[pair.forPlayerId]?.name : "?";
  const againstName = pair?.againstPlayerId
    ? players[pair.againstPlayerId]?.name
    : "?";
  return (
    <div className="text-white p-8 text-center space-y-6">
      <h1 className="text-4xl font-bold">Debaters preparing...</h1>
      {pair?.claim && (
        <p className="text-3xl text-gray-300">"{pair.claim.text}"</p>
      )}
      <p className="text-gray-500">
        <span className="text-green-400 font-semibold">{forName}</span> (FOR)
        vs <span className="text-red-400 font-semibold">{againstName}</span>{" "}
        (AGAINST)
      </p>
    </div>
  );
}
