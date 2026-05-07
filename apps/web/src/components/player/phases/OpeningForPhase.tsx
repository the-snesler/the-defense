import type { PlayerPhaseProps } from "./types";
import QuestionBox from "../components/QuestionBox";
import ReactionRow from "../components/ReactionRow";

export default function OpeningForPhase({ view, actions }: PlayerPhaseProps) {
  if (view.role === "DEBATER_FOR") {
    return (
      <div className="text-white text-center space-y-3">
        <h2 className="text-2xl font-bold text-green-400">YOU'RE UP — FOR</h2>
        <p className="text-lg">"{view.currentClaim?.text}"</p>
        <p className="text-gray-400 text-sm">
          Defend the claim. 30 seconds. Speak out loud.
        </p>
      </div>
    );
  }
  if (view.role === "DEBATER_AGAINST") {
    return (
      <div className="text-white text-center space-y-2">
        <h2 className="text-xl font-bold">FOR is speaking...</h2>
        <p className="text-gray-400 text-sm">You're up next.</p>
      </div>
    );
  }
  // AUDIENCE
  return (
    <div className="space-y-3 text-white">
      <p className="text-xs text-gray-400 uppercase tracking-wide">
        FOR is speaking
      </p>
      <p className="text-base">"{view.currentClaim?.text}"</p>
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
