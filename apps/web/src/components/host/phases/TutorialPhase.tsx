import type { HostPhaseProps } from "./types";

export default function TutorialPhase({ state }: HostPhaseProps) {
  const vipName =
    Object.values(state.context.players).find((p) => p.isVip)?.name ?? "VIP";
  return (
    <div className="tutorial-screen">
      <section className="tutorial-copy">
        <div className="deck-label">Procedure · The rules of engagement</div>
        <h1>
          How to{" "}
          <em>
            argue
            <br />
            like you mean it.
          </em>
        </h1>
        <ol>
          <li>
            You'll be paired up. One of you draws a <b>subject</b>; the other
            draws a <b>predicate</b>.
          </li>
          <li>
            The two get smashed together into a <b>ridiculous claim</b>.
          </li>
          <li>
            One argues <span className="for-mark">FOR</span>. The other argues{" "}
            <span className="against-mark">AGAINST</span>. Thirty seconds each.
          </li>
          <li>
            The audience submits questions. The court selects two for
            cross-examination.
          </li>
          <li>
            The audience <b>renders verdict</b>. Points scale with vote share.
            Round II doubles the stakes.
          </li>
        </ol>
      </section>

      <section className="tutorial-example">
        <div className="deck-label">For instance · your honor</div>
        <div className="case-file">
          <div className="case-file-label">The People v. Plausibility</div>
          <div className="case-file-stamp">Exhibit A</div>
          <p className="case-file-claim">
            A surprisingly ambitious raccoon was the original lead singer of
            Nickelback.
          </p>
          <div className="case-file-meta">
            <span>
              Filed <strong>Round I</strong>
            </span>
            <span>
              Pot <strong>1,000 pts</strong>
            </span>
            <span>
              Counsel <strong>Two</strong>
            </span>
          </div>
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-mute">
          Waiting on Counsel {vipName} to advance
          <span className="blink-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </p>
      </section>
    </div>
  );
}
