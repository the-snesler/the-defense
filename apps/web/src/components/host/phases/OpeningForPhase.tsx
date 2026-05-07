import type { HostPhaseProps } from "./types";

function OpeningStatementScreen({
  state,
  side,
}: HostPhaseProps & { side: "FOR" | "AGAINST" }) {
  const ctx = state.context;
  const round = ctx.rounds[ctx.currentRoundIndex];
  const pair = round?.pairs[ctx.currentPairIndex];
  const forPlayer = pair?.forPlayerId ? ctx.players[pair.forPlayerId] : null;
  const againstPlayer = pair?.againstPlayerId
    ? ctx.players[pair.againstPlayerId]
    : null;
  const speaker = side === "FOR" ? forPlayer : againstPlayer;
  const waiting = side === "FOR" ? againstPlayer : forPlayer;
  const questions = ctx.audienceQuestionsForCurrentPair.slice(-4);
  const speakerRole = side === "FOR" ? "affirmative" : "negative";
  const waitingRole = side === "FOR" ? "negative" : "affirmative";

  return (
    <div className="opening-screen">
      <aside
        className={`opening-side ${side === "FOR" ? "active for" : "idle for"}`}
      >
        <div className="opening-role for">Counsel for the affirmative</div>
        <div className="opening-name">{forPlayer?.name ?? "?"}</div>
        <div className="opening-rule" />
        <div className="opening-stat">
          Score · <span>{forPlayer?.score ?? 0} pts</span>
        </div>
        <div className="opening-state">
          {side === "FOR" ? (
            <span className="live">Now Speaking</span>
          ) : (
            "Awaiting"
          )}
        </div>
      </aside>

      <section className="opening-center">
        <div className="opening-tag">The Claim, as filed</div>
        {pair?.claim && <p className="opening-claim">{pair.claim.text}</p>}

        <div className="opening-hero">
          {speaker?.name ?? "?"}
          <span>.</span>
        </div>
        <div className="opening-label">
          Opening statement for the {speakerRole}
        </div>
        <div className="opening-next">
          {waiting?.name ?? "Opposing counsel"} is counsel for the {waitingRole}
        </div>
      </section>

      <aside
        className={`opening-side ${side === "AGAINST" ? "active against" : "idle against"}`}
      >
        <div className="opening-role against">Counsel for the negative</div>
        <div className="opening-name">{againstPlayer?.name ?? "?"}</div>
        <div className="opening-rule" />
        <div className="opening-stat">
          Score · <span>{againstPlayer?.score ?? 0} pts</span>
        </div>
        <div className="opening-state">
          {side === "AGAINST" ? (
            <span className="live">Now Speaking</span>
          ) : (
            "Awaiting"
          )}
        </div>
      </aside>

      <div className="ticker">
        <span className="ticker-label">
          Audience questions · {ctx.audienceQuestionsForCurrentPair.length}{" "}
          incoming
        </span>
        {questions.length > 0 ? (
          questions.map((q) => (
            <span className="ticker-pill" key={q.id}>
              {q.text}
            </span>
          ))
        ) : (
          <span className="ticker-pill">
            Phones are open for cross-exam questions
          </span>
        )}
      </div>
    </div>
  );
}

export default function OpeningForPhase({ state }: HostPhaseProps) {
  return <OpeningStatementScreen state={state} side="FOR" />;
}

export { OpeningStatementScreen };
