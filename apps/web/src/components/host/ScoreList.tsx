import type { Player } from "@defense/shared";

/**
 * Lay a list out in up to 3 column-major columns so it fits a 16:9 TV
 * without scrolling (rowsPerCol rows each). If it still doesn't fit (small
 * viewport), the list scrolls inside its own box, never under the footer.
 */
export function listLayout(count: number, rowsPerCol = 5) {
  const cols = Math.min(3, Math.max(1, Math.ceil(count / rowsPerCol)));
  if (cols === 1) return { className: "", style: undefined };
  return {
    className: `multi cols-${cols}`,
    style: {
      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      gridTemplateRows: `repeat(${Math.ceil(count / cols)}, auto)`,
      gridAutoFlow: "column" as const,
    },
  };
}

export default function ScoreList({
  players,
  compact = false,
}: {
  players: Player[];
  compact?: boolean;
}) {
  const ranked = [...players].sort((a, b) => b.score - a.score);
  const layout = listLayout(ranked.length, compact ? 4 : 5);
  return (
    <ol
      className={`score-list ${layout.className} ${compact ? "compact" : ""}`}
      style={layout.style}
    >
      {ranked.map((p, i) => (
        <li key={p.id} className={`score-row ${i === 0 ? "first" : ""}`}>
          <span className="score-rank">{String(i + 1).padStart(2, "0")}</span>
          <span className="score-name">
            {p.name}
            {i === 0 && " 👑"}
          </span>
          <span className="score-points">{p.score}</span>
        </li>
      ))}
    </ol>
  );
}
