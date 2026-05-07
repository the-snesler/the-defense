import type { Player } from "@nofus/shared";

interface LobbyPhaseProps {
  players: Record<string, Player>;
  playerId: string;
  onStartGame?: () => void;
}

export default function LobbyPhase({ players, playerId, onStartGame }: LobbyPhaseProps) {
  const playerCount = Object.keys(players).length;
  const currentPlayer = players[playerId];
  const isVIP = currentPlayer?.isVip || false;
  const canStart = playerCount >= 3;

  return (
    <div className="text-center">
      <div className="mb-6">
        <p className="text-gray-300 text-lg mb-2">
          {playerCount} player{playerCount !== 1 ? 's' : ''} connected
        </p>
        <p className="text-gray-400 text-sm">
          {canStart ? 'Ready to start!' : 'Waiting for at least 3 players...'}
        </p>
      </div>

      {isVIP && onStartGame && (
        <button
          onClick={onStartGame}
          disabled={!canStart}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg"
        >
          {canStart ? 'Start Game' : `Need ${3 - playerCount} more player${3 - playerCount !== 1 ? 's' : ''}`}
        </button>
      )}

      {!isVIP && (
        <p className="text-gray-400 text-sm">
          Waiting for host to start the game...
        </p>
      )}
    </div>
  );
}
