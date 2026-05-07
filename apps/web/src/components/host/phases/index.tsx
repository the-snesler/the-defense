import type { HostPhaseProps } from "./types";
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

export default function HostPhaseRouter({ state }: HostPhaseProps) {
  const v = state.value.toString();
  switch (v) {
    case "lobby":
      return <LobbyPhase state={state} />;
    case "tutorial":
      return <TutorialPhase state={state} />;
    case "pairing":
      return <PairingPhase state={state} />;
    case "writing":
      return <WritingPhase state={state} />;
    case "claimGeneration":
      return <ClaimGenerationPhase state={state} />;
    case "reveal":
      return <RevealPhase state={state} />;
    case "prep":
      return <PrepPhase state={state} />;
    case "openingFor":
      return <OpeningForPhase state={state} />;
    case "openingAgainst":
      return <OpeningAgainstPhase state={state} />;
    case "crossExamQ1":
      return <CrossExamQ1Phase state={state} />;
    case "crossExamQ2":
      return <CrossExamQ2Phase state={state} />;
    case "verdict":
      return <VerdictPhase state={state} />;
    case "transition":
      return <TransitionPhase state={state} />;
    case "roundBreak":
      return <RoundBreakPhase state={state} />;
    case "finale":
      return <FinalePhase state={state} />;
    default:
      return <div className="text-white p-8">Unknown phase: {v}</div>;
  }
}
