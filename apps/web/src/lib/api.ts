import type {
  GamePhase,
  Pair,
  Player,
  PlayerRole,
  PlayerViewState,
  Round,
} from "@defense/shared";
import { gameMachine } from "../machines/gameMachine";
import { useMachine } from "@xstate/react";

const API_BASE = "/api/v1";

const STATE_TO_PHASE: Record<string, GamePhase> = {
  lobby: "LOBBY",
  tutorial: "TUTORIAL",
  pairing: "PAIRING",
  claimGeneration: "CLAIM_GENERATION",
  reveal: "REVEAL",
  prep: "PREP",
  openingFor: "OPENING_FOR",
  openingAgainst: "OPENING_AGAINST",
  crossExamQ1: "CROSS_EXAM_Q1",
  crossExamQ2: "CROSS_EXAM_Q2",
  verdict: "VERDICT",
  transition: "TRANSITION",
  roundBreak: "ROUND_BREAK",
  finale: "FINALE",
};

function stateToPhase(stateValue: string): GamePhase {
  return STATE_TO_PHASE[stateValue] ?? "LOBBY";
}

export interface CreateRoomResponse {
  roomCode: string;
  hostToken: string;
}

export async function createRoom(): Promise<CreateRoomResponse> {
  const response = await fetch(`${API_BASE}/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error("Failed to create room");
  return response.json();
}

export function getWebSocketUrl(
  roomCode: string,
  params: Record<string, string>,
): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  const queryString = new URLSearchParams(params).toString();
  return `${protocol}//${host}${API_BASE}/rooms/${roomCode}/ws?${queryString}`;
}

// === Player view projection ===

function findPairForPlayer(
  round: Round | undefined,
  playerId: string,
): { pair: Pair; pairIndex: number } | null {
  if (!round) return null;
  for (let i = 0; i < round.pairs.length; i++) {
    const p = round.pairs[i];
    if (p.playerAId === playerId || p.playerBId === playerId) {
      return { pair: p, pairIndex: i };
    }
  }
  return null;
}

function partnerOf(pair: Pair, playerId: string): string | null {
  if (pair.playerAId === playerId) return pair.playerBId;
  if (pair.playerBId === playerId) return pair.playerAId;
  return null;
}

// Phases where reactions are allowed for non-debaters
const REACTION_PHASES: GamePhase[] = [
  "OPENING_FOR",
  "OPENING_AGAINST",
  "CROSS_EXAM_Q1",
  "CROSS_EXAM_Q2",
];

// Phases where audience can submit questions
const QUESTION_PHASES: GamePhase[] = ["OPENING_FOR", "OPENING_AGAINST"];

export function machineStateToPlayerViewState(
  state: ReturnType<typeof useMachine<typeof gameMachine>>[0],
  playerId: string,
): PlayerViewState {
  const ctx = state.context;
  const phase = stateToPhase(state.value.toString());

  const r1 = ctx.rounds[0];
  const r2 = ctx.rounds[1];
  const currentRound = ctx.rounds[ctx.currentRoundIndex];
  const activePair = currentRound?.pairs[ctx.currentPairIndex];

  // Locate this player's pair in the current round (used for PAIR_WAITING / debater detection)
  const myCurrentPair = findPairForPlayer(currentRound, playerId);
  const myR2Pair = findPairForPlayer(r2, playerId);

  // === role ===
  let role: PlayerRole = "NONE";
  if (
    phase === "LOBBY" ||
    phase === "TUTORIAL" ||
    phase === "PAIRING" ||
    phase === "FINALE"
  ) {
    role = "NONE";
  } else if (phase === "CLAIM_GENERATION" || phase === "ROUND_BREAK") {
    role = myCurrentPair ? "PAIR_WAITING" : "AUDIENCE";
  } else if (activePair) {
    if (playerId === activePair.forPlayerId) role = "DEBATER_FOR";
    else if (playerId === activePair.againstPlayerId) role = "DEBATER_AGAINST";
    else role = "AUDIENCE";
  }

  // === pairing-related fields ===
  const myR1Pair = findPairForPlayer(r1, playerId);
  const myPairId = myCurrentPair?.pair.id ?? myR1Pair?.pair.id ?? null;
  const myPairPartnerId = myCurrentPair
    ? partnerOf(myCurrentPair.pair, playerId)
    : myR1Pair
      ? partnerOf(myR1Pair.pair, playerId)
      : null;
  const myUpcomingRound2PartnerId = myR2Pair
    ? partnerOf(myR2Pair.pair, playerId)
    : null;

  // === claim generation: only project this player's own pair offers ===
  let subjectOptions: PlayerViewState["subjectOptions"];
  let predicateOptions: PlayerViewState["predicateOptions"];
  let hasSubmittedSubject: boolean | undefined;
  let hasSubmittedPredicate: boolean | undefined;
  if (phase === "CLAIM_GENERATION" && myCurrentPair) {
    const pair = myCurrentPair.pair;
    if (pair.playerAId === playerId) {
      subjectOptions = ctx.claimOffers.subjectsByPairId[pair.id] ?? [];
      hasSubmittedSubject = pair.chosenSubject !== null;
    } else if (pair.playerBId === playerId) {
      predicateOptions = ctx.claimOffers.predicatesByPairId[pair.id] ?? [];
      hasSubmittedPredicate = pair.chosenPredicate !== null;
    }
  }

  // === active pair claim & names (visible from REVEAL onward) ===
  const claimVisiblePhases: GamePhase[] = [
    "REVEAL",
    "PREP",
    "OPENING_FOR",
    "OPENING_AGAINST",
    "CROSS_EXAM_Q1",
    "CROSS_EXAM_Q2",
    "VERDICT",
    "TRANSITION",
  ];
  const showClaim = claimVisiblePhases.includes(phase) && !!activePair;
  const currentClaim =
    showClaim && activePair?.claim ? activePair.claim : null;
  let currentPair: PlayerViewState["currentPair"] = null;
  if (showClaim && activePair?.forPlayerId && activePair.againstPlayerId) {
    const forP = ctx.players[activePair.forPlayerId];
    const againstP = ctx.players[activePair.againstPlayerId];
    if (forP && againstP) {
      currentPair = {
        forPlayerId: forP.id,
        againstPlayerId: againstP.id,
        forPlayerName: forP.name,
        againstPlayerName: againstP.name,
      };
    }
  }

  // === cross-exam ===
  let currentCrossExamQuestion: PlayerViewState["currentCrossExamQuestion"] =
    null;
  if (phase === "CROSS_EXAM_Q1" || phase === "CROSS_EXAM_Q2") {
    const which = phase === "CROSS_EXAM_Q1" ? "q1" : "q2";
    const assignment = ctx.crossExamAssignments[which];
    if (assignment) {
      const q = ctx.audienceQuestionsForCurrentPair.find(
        (qq) => qq.id === assignment.questionId,
      );
      if (q) {
        currentCrossExamQuestion = {
          text: q.text,
          responderId: assignment.responderId,
          questionNumber: which === "q1" ? 1 : 2,
        };
      }
    }
  }

  // === audience affordances ===
  const isActiveDebater =
    role === "DEBATER_FOR" || role === "DEBATER_AGAINST";
  const canSubmitQuestion =
    !isActiveDebater && QUESTION_PHASES.includes(phase) && !!activePair;
  const canReact =
    !isActiveDebater && REACTION_PHASES.includes(phase) && !!activePair;

  // verdict tracking — has THIS player voted yet?
  let hasSubmittedVerdict: boolean | undefined;
  if (phase === "VERDICT" && activePair) {
    hasSubmittedVerdict =
      activePair.votesFor.includes(playerId) ||
      activePair.votesAgainst.includes(playerId);
  }

  // running count of questions THIS player has submitted for the current pair
  let myQuestionsSubmittedCount: number | undefined;
  if (
    phase === "OPENING_FOR" ||
    phase === "OPENING_AGAINST" ||
    phase === "CROSS_EXAM_Q1" ||
    phase === "CROSS_EXAM_Q2"
  ) {
    myQuestionsSubmittedCount = ctx.audienceQuestionsForCurrentPair.filter(
      (q) => q.submitterId === playerId,
    ).length;
  }

  // === verdict tallies ===
  // Hidden during VERDICT (don't leak mid-vote); revealed from TRANSITION onward.
  let verdictTallies: PlayerViewState["verdictTallies"] = null;
  if (phase === "TRANSITION" && activePair) {
    verdictTallies = {
      forVotes: activePair.votesFor.length,
      againstVotes: activePair.votesAgainst.length,
    };
  }

  // === round meta ===
  const currentRoundNumber = currentRound?.roundNumber ?? null;
  const pointPot = currentRound?.pointPot ?? null;

  // === player roster (sliced shape per schema) ===
  const players: Record<string, Pick<Player, "id" | "name" | "score" | "isVip" | "isConnected" | "avatarId">> = {};
  for (const [id, p] of Object.entries(ctx.players)) {
    players[id] = {
      id: p.id,
      name: p.name,
      score: p.score,
      isVip: p.isVip,
      isConnected: p.isConnected,
      avatarId: p.avatarId,
    };
  }

  return {
    roomCode: ctx.roomCode,
    phase,
    playerId,
    players,
    timer: ctx.timer,
    role,
    myPairId,
    myPairPartnerId,
    myUpcomingRound2PartnerId,
    subjectOptions,
    predicateOptions,
    hasSubmittedSubject,
    hasSubmittedPredicate,
    currentClaim,
    currentPair,
    currentCrossExamQuestion,
    canSubmitQuestion,
    canReact,
    hasSubmittedVerdict,
    myQuestionsSubmittedCount,
    verdictTallies,
    currentRoundNumber,
    pointPot,
  };
}
