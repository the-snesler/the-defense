import type { PlayerPhaseProps } from "./types";
import LobbyPhase from "./LobbyPhase";
import TutorialPhase from "./TutorialPhase";
import PairingPhase from "./PairingPhase";
import WritingPhase from "./WritingPhase";
import ClaimGenerationPhase from "./ClaimGenerationPhase";
import RevealPhase from "./RevealPhase";
import PrepPhase from "./PrepPhase";
import OpeningForPhase from "./OpeningForPhase";
import OpeningAgainstPhase from "./OpeningAgainstPhase";
import CrossExamQ1Phase from "./CrossExamQ1Phase";
import CrossExamQ2Phase from "./CrossExamQ2Phase";
import VerdictPhase from "./VerdictPhase";
import TransitionPhase from "./TransitionPhase";
import RoundBreakPhase from "./RoundBreakPhase";
import FinalePhase from "./FinalePhase";

export type { PlayerPhaseActions, PlayerPhaseProps } from "./types";

export default function PlayerPhaseRouter({
  view,
  actions,
}: PlayerPhaseProps) {
  switch (view.phase) {
    case "LOBBY":
      return <LobbyPhase view={view} actions={actions} />;
    case "TUTORIAL":
      return <TutorialPhase view={view} actions={actions} />;
    case "PAIRING":
      return <PairingPhase view={view} actions={actions} />;
    case "WRITING":
      return <WritingPhase view={view} actions={actions} />;
    case "CLAIM_GENERATION":
      return <ClaimGenerationPhase view={view} actions={actions} />;
    case "REVEAL":
      return <RevealPhase view={view} actions={actions} />;
    case "PREP":
      return <PrepPhase view={view} actions={actions} />;
    case "OPENING_FOR":
      return <OpeningForPhase view={view} actions={actions} />;
    case "OPENING_AGAINST":
      return <OpeningAgainstPhase view={view} actions={actions} />;
    case "CROSS_EXAM_Q1":
      return <CrossExamQ1Phase view={view} actions={actions} />;
    case "CROSS_EXAM_Q2":
      return <CrossExamQ2Phase view={view} actions={actions} />;
    case "VERDICT":
      return <VerdictPhase view={view} actions={actions} />;
    case "TRANSITION":
      return <TransitionPhase view={view} actions={actions} />;
    case "ROUND_BREAK":
      return <RoundBreakPhase view={view} actions={actions} />;
    case "FINALE":
      return <FinalePhase view={view} actions={actions} />;
    default:
      return <div className="text-white">Unknown phase: {view.phase}</div>;
  }
}
