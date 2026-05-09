import type { PlayerPhaseProps } from "./types";
import QuestionBox from "../components/QuestionBox";
import ReactionRow from "../components/ReactionRow";

export default function OpeningAgainstPhase({
  view,
  actions,
}: PlayerPhaseProps) {
  if (view.role === "DEBATER_AGAINST") {
    return (
      <div className="text-center">
        <div className="claim-card">
          <div className="claim-card-label">You're up · AGAINST</div>
          <div className="claim-card-text">{view.currentClaim?.text}</div>
        </div>
        <p className="text-sm text-ink-mute">
          Poke holes in FOR's argument. 30 seconds. Speak out loud.
        </p>
      </div>
    );
  }
  if (view.role === "DEBATER_FOR") {
    return (
      <div className="text-center">
        <div className="claim-card">
          <div className="claim-card-label">AGAINST is speaking</div>
          <div className="claim-card-text">{view.currentClaim?.text}</div>
        </div>
        <p className="text-sm text-ink-mute">Your opening is done.</p>
      </div>
    );
  }
  // AUDIENCE
  return (
    <div>
      <div className="claim-card">
        <div className="claim-card-label">The claim</div>
        <div className="claim-card-text">{view.currentClaim?.text}</div>
        {view.currentPair && (
          <div className="claim-card-sides">
            <span className="for-name">
              {view.currentPair.forPlayerName} · FOR
            </span>{" "}
            vs{" "}
            <span className="against-name">
              {view.currentPair.againstPlayerName} · AGAINST
            </span>
          </div>
        )}
      </div>
      {view.canSubmitQuestion && (
        <QuestionBox
          onSubmit={actions.submitQuestion}
          submittedCount={view.myQuestionsSubmittedCount}
        />
      )}
      {view.canReact && <ReactionRow onReact={actions.sendReaction} />}
    </div>
  );
}
