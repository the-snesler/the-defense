import type { HostPhaseProps } from "./types";

export default function LobbyPhase({ state }: HostPhaseProps) {
  const players = Object.values(state.context.players).filter(
    (p) => p.isConnected,
  );
  const count = players.length;
  const cfg = state.context.config;
  const ok =
    count >= cfg.minPlayers && count <= cfg.maxPlayers && count % 2 === 0;
  let helpText: string;
  if (count < cfg.minPlayers) {
    helpText = `Need at least ${cfg.minPlayers} players`;
  } else if (count > cfg.maxPlayers) {
    helpText = `Max ${cfg.maxPlayers} players`;
  } else if (count % 2 !== 0) {
    helpText = "Need an even number of players";
  } else {
    helpText = "VIP can press Start";
  }
  return (
    <div className="text-white p-8 text-center space-y-6">
      <h1 className="text-6xl font-bold">The Defense</h1>
      <p className="text-xl text-gray-400">
        {count} / {cfg.maxPlayers} players connected
      </p>
      <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {players.map((p) => (
          <li
            key={p.id}
            className="bg-gray-800 rounded p-3 text-lg flex items-center justify-center gap-2"
          >
            {p.name}
            {p.isVip && <span title="VIP">👑</span>}
          </li>
        ))}
      </ul>
      <p className={ok ? "text-green-400" : "text-gray-500"}>{helpText}</p>
    </div>
  );
}
