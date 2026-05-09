import type { Player } from "@defense/shared";

interface PlayerCardProps {
  player: Player;
  variant?: "default" | "success" | "waiting" | "presenting";
  showScore?: boolean;
  seatNumber?: number;
  children?: React.ReactNode;
}

export default function PlayerCard({
  player,
  variant = "default",
  showScore = false,
  seatNumber,
  children,
}: PlayerCardProps) {
  const borderTopColor = {
    default: "var(--brass-deep)",
    success: "var(--brass)",
    waiting: "var(--brass-deep)",
    presenting: "var(--ox-glow)",
  }[variant];

  return (
    <div
      className={`player-card-host ${player.isVip ? "vip" : ""}`}
      style={{ borderTopColor }}
    >
      {seatNumber !== undefined && (
        <span className="seat-num">{String(seatNumber).padStart(2, "0")}</span>
      )}
      <span className="player-name">{player.name}</span>
      {showScore && (
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: "var(--brass)",
            letterSpacing: "0.1em",
          }}
        >
          {player.score}
        </span>
      )}
      {player.isVip && <span className="vip-badge">⚖</span>}
      {children}
    </div>
  );
}
