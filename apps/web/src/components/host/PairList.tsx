import type { Pair, Player } from "@defense/shared";
import { listLayout } from "./ScoreList";

export default function PairList({
  pairs,
  players,
}: {
  pairs: Pair[];
  players: Record<string, Player>;
}) {
  const layout = listLayout(pairs.length);
  return (
    <ul className={`pair-list ${layout.className}`} style={layout.style}>
      {pairs.map((p, i) => (
        <li key={p.id} className="pair-row">
          <span className="pair-num">{String(i + 1).padStart(2, "0")}</span>
          <span className="pair-player a">
            {players[p.playerAId]?.name ?? "?"}
          </span>
          <span className="vs">vs</span>
          <span className="pair-player b">
            {players[p.playerBId]?.name ?? "?"}
          </span>
        </li>
      ))}
    </ul>
  );
}
