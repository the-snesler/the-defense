import type { PlayerPhaseProps } from "./types";
import ReactionRow from "../components/ReactionRow";

export default function CrossExamQ1Phase({
  view,
  actions,
}: PlayerPhaseProps) {
  const q = view.currentCrossExamQuestion;
  const isResponder = !!q && q.responderId === view.playerId;

  if (isResponder) {
    return (
      <div className="space-y-3 text-white text-center">
        <p className="text-xs text-green-300 uppercase tracking-wide">
          Question for you
        </p>
        <h2 className="text-xl font-bold">"{q?.text}"</h2>
        <p className="text-gray-400 text-sm">Answer out loud. 30 seconds.</p>
      </div>
    );
  }

  if (view.role === "DEBATER_FOR" || view.role === "DEBATER_AGAINST") {
    return (
      <div className="text-white text-center space-y-2">
        <p className="text-xs text-gray-400 uppercase">Cross-exam · Q1</p>
        <p className="text-gray-300">"{q?.text}"</p>
        <p className="text-gray-500 text-sm">Your turn next.</p>
      </div>
    );
  }

  // AUDIENCE
  return (
    <div className="space-y-3 text-white">
      <p className="text-xs text-gray-400 uppercase tracking-wide">
        Cross-exam · Q1
      </p>
      <p className="text-base">"{q?.text}"</p>
      {view.canReact && <ReactionRow onReact={actions.sendReaction} />}
    </div>
  );
}
