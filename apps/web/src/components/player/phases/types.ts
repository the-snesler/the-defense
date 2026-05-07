import type {
  DebateSide,
  PlayerViewState,
  Reaction,
} from "@defense/shared";

export interface PlayerPhaseActions {
  startGame(): void;
  nextPhase(): void;
  submitSubject(id: string): void;
  submitPredicate(id: string): void;
  submitQuestion(text: string): void;
  submitVerdict(side: DebateSide): void;
  sendReaction(r: Reaction): void;
}

export interface PlayerPhaseProps {
  view: PlayerViewState;
  actions: PlayerPhaseActions;
}
