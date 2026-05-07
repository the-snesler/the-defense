import type { PlayerPhaseProps } from "./types";

export default function LobbyPhase({ view, actions }: PlayerPhaseProps) {
  const me = view.players[view.playerId];
  const isVip = me?.isVip ?? false;
  const connected = Object.values(view.players).filter((p) => p.isConnected);
  const count = connected.length;
  const canStart = isVip && count >= 4 && count <= 10 && count % 2 === 0;
  let helpText = "";
  if (count < 4) helpText = `Need at least 4 players (have ${count})`;
  else if (count > 10) helpText = `Max 10 players`;
  else if (count % 2 !== 0) helpText = "Need an even number of players";

  return (
    <div className="space-y-4 text-white text-center">
      <h2 className="text-2xl font-bold">Lobby</h2>
      <p className="text-gray-400">
        {count} player{count === 1 ? "" : "s"} connected
      </p>
      <ul className="grid grid-cols-2 gap-2 text-sm">
        {connected.map((p) => (
          <li
            key={p.id}
            className={`rounded px-2 py-1 ${
              p.id === view.playerId ? "bg-blue-700" : "bg-gray-700"
            }`}
          >
            {p.name}
            {p.isVip && " 👑"}
          </li>
        ))}
      </ul>
      {isVip ? (
        <button
          onClick={actions.startGame}
          disabled={!canStart}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded px-4 py-3 font-bold"
        >
          {canStart ? "Start Game" : "Start Game"}
        </button>
      ) : (
        <p className="text-gray-400 text-sm">Waiting for VIP to start...</p>
      )}
      {!canStart && helpText && (
        <p className="text-gray-500 text-xs">{helpText}</p>
      )}
    </div>
  );
}
