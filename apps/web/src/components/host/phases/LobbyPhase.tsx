import type { Player } from "@nofus/shared";
import PlayerGrid from "../../shared/PlayerGrid";
import PlayerCard from "../../shared/PlayerCard";

interface LobbyPhaseProps {
  players: Record<string, Player>;
}

export default function LobbyPhase({ players }: LobbyPhaseProps) {
  return (
    <div className="bg-gray-800 text-white rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Players</h3>
      <PlayerGrid>
        {Object.values(players).map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </PlayerGrid>
    </div>
  );
}
