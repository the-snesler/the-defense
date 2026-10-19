import type { PlayerPhaseProps } from "./types";

export default function FinalePhase({ view }: PlayerPhaseProps) {
  const ranked = Object.values(view.players).sort((a, b) => b.score - a.score);
  return (
    <div className="space-y-3 text-ink">
      <h2 className="text-center font-display text-3xl">Final Scores</h2>
      <ol className="space-y-2">
        {ranked.map((p, i) => {
          const isMe = p.id === view.playerId;
          return (
            <li
              key={p.id}
              className={`flex min-w-0 items-center gap-3 border px-3 py-3 ${
                isMe
                  ? "border-brass bg-bg-2"
                  : "border-line bg-bg-1"
              }`}
            >
              <span className="w-8 shrink-0 font-mono text-sm font-bold text-brass">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1 truncate text-lg">
                {p.name}
                {i === 0 && " 👑"}
                {isMe && (
                  <span className="ml-2 font-mono text-xs uppercase tracking-widest text-ink-dim">
                    you
                  </span>
                )}
              </span>
              <span className="shrink-0 font-mono text-lg font-bold text-brass-soft">
                {p.score}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
