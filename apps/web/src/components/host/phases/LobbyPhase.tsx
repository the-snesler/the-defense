import type { HostPhaseProps } from "./types";
import PlayerCard from "../../shared/PlayerCard";
import { QRCodeSVG } from "qrcode.react";

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
    <div className="lobby-screen">
      <div className="lobby-tagline">
        A party game of unreasonable debate · case open
      </div>

      <div className="wordmark lobby-wordmark-real">
        <span className="the">Now Presenting</span>
        <span className="defense">
          The Defense<span className="amp">.</span>
        </span>
      </div>

      <p className="lobby-subtitle">All rise. Or don't. We're not your boss.</p>

      <div className="lobby-join">
        <span>
          Join at <strong>{window.location.origin}</strong> · room
        </span>
        <b>{state.context.roomCode}</b>
      </div>

      <div className="bg-white p-4 rounded-lg w-fit mx-auto my-6">
        <QRCodeSVG
          value={`${window.location.origin}/?code=${state.context.roomCode}`}
          size={200}
          level="M"
        />
      </div>

      <div className="lobby-player-list">
        <div className="brass-rule">
          Counsel Assembled · {count} of {cfg.maxPlayers}
        </div>
        <div className="lobby-player-row">
          {players.map((p, index) => (
            <PlayerCard
              key={p.id}
              player={p}
              seatNumber={index + 1}
              variant={p.isVip ? "success" : "default"}
            />
          ))}
          {count < cfg.maxPlayers && (
            <div className="player-card-host awaiting">
              <span className="seat-num">
                {String(count + 1).padStart(2, "0")}
              </span>
              <span className="player-name">awaiting...</span>
            </div>
          )}
        </div>
      </div>

      <p className={`lobby-help ${ok ? "text-for" : "text-ink-mute"}`}>
        {helpText}
      </p>
    </div>
  );
}
