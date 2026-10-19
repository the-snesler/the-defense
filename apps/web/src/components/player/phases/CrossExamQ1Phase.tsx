import type { PlayerPhaseProps } from "./types";
import ReactionRow from "../components/ReactionRow";

// Cross-examination: each debater answers their own question.
// Q1 → FOR debater, Q2 → AGAINST debater.
function CrossExamPlayerScreen({ view, actions }: PlayerPhaseProps) {
  const q = view.currentCrossExamQuestion;
  if (!q) {
    return (
      <p className="text-center text-sm text-ink-mute">
        Selecting a question...
      </p>
    );
  }

  const isDebater =
    view.role === "DEBATER_FOR" || view.role === "DEBATER_AGAINST";
  const sideClass = q.targetSide === "FOR" ? "for-name" : "against-name";

  // The debater with the floor.
  if (q.isForMe) {
    return (
      <div className="text-center">
        <div className="claim-card">
          <div className="claim-card-label">
            Your question · you have the floor (30s)
          </div>
          <div className="claim-card-text">"{q.text}"</div>
          <div className="claim-card-sides">
            <span className={sideClass}>You are {q.targetSide}</span>
          </div>
        </div>
        <p className="text-sm text-ink-mute">
          Answer out loud. Stay in character.
        </p>
      </div>
    );
  }

  // The other debater waits.
  if (isDebater) {
    return (
      <div className="text-center">
        <div className="claim-card">
          <div className="claim-card-label">
            {q.targetPlayerName} is answering · wait
          </div>
          <div className="claim-card-text">"{q.text}"</div>
          <div className="claim-card-sides">
            <span className={sideClass}>
              Question for {q.targetPlayerName} · {q.targetSide}
            </span>
          </div>
        </div>
        <p className="text-sm text-ink-mute">
          {q.questionNumber === 1
            ? "Your question is next."
            : "Hold your objections. Verdict is next."}
        </p>
      </div>
    );
  }

  // AUDIENCE
  return (
    <div>
      <div className="claim-card">
        <div className="claim-card-label">Cross-exam · Q{q.questionNumber}</div>
        <div className="claim-card-text">"{q.text}"</div>
        <div className="claim-card-sides">
          Question for{" "}
          <span className={sideClass}>
            {q.targetPlayerName} · {q.targetSide}
          </span>
        </div>
      </div>
      {view.canReact && <ReactionRow onReact={actions.sendReaction} />}
    </div>
  );
}

export default function CrossExamQ1Phase(props: PlayerPhaseProps) {
  return <CrossExamPlayerScreen {...props} />;
}

export { CrossExamPlayerScreen };
