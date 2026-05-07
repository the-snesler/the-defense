import type { PlayerPhaseProps } from "./types";
import ReactionRow from "../components/ReactionRow";

export default function CrossExamQ1Phase({
  view,
  actions,
}: PlayerPhaseProps) {
  const q = view.currentCrossExamQuestion;

  if (view.role === "DEBATER_FOR" || view.role === "DEBATER_AGAINST") {
    const isFor = view.role === "DEBATER_FOR";
    return (
      <div className="space-y-3 text-white text-center">
        <p
          className={`text-xs uppercase tracking-wide ${isFor ? "text-green-300" : "text-red-300"}`}
        >
          Debate this question · You are {isFor ? "FOR" : "AGAINST"}
        </p>
        <h2 className="text-xl font-bold">"{q?.text}"</h2>
        <p className="text-gray-400 text-sm">Argue your side. 30 seconds.</p>
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
