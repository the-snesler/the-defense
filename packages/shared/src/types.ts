import { z } from "zod";

// === Game phases ===
// One leaf state per screen so the player-view projection branches cleanly.
export const GamePhaseSchema = z.enum([
  "LOBBY",
  "TUTORIAL",
  "PAIRING",
  "CLAIM_GENERATION",
  "REVEAL",
  "PREP",
  "OPENING_FOR",
  "OPENING_AGAINST",
  "CROSS_EXAM_Q1",
  "CROSS_EXAM_Q2",
  "VERDICT",
  "TRANSITION",
  "ROUND_BREAK",
  "FINALE",
]);
export type GamePhase = z.infer<typeof GamePhaseSchema>;

// === Player ===
export const PlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  score: z.number(),
  isVip: z.boolean(),
  isConnected: z.boolean(),
  avatarId: z.number().min(0).max(9),
});
export type Player = z.infer<typeof PlayerSchema>;

// === Sides & reactions ===
export const DebateSideSchema = z.enum(["FOR", "AGAINST"]);
export type DebateSide = z.infer<typeof DebateSideSchema>;

export const ReactionSchema = z.enum(["LAUGH", "FIRE"]);
export type Reaction = z.infer<typeof ReactionSchema>;

// === Subjects, predicates, claims ===
export const SubjectCategorySchema = z.enum([
  "PERSON",
  "PLACE",
  "THING",
  "GROUP",
]);
export type SubjectCategory = z.infer<typeof SubjectCategorySchema>;

export const SubjectSchema = z.object({
  id: z.string(),
  text: z.string(),
  category: SubjectCategorySchema,
  isPlural: z.boolean().default(false),
});
export type Subject = z.infer<typeof SubjectSchema>;

export const PredicateSchema = z.object({
  id: z.string(),
  text: z.string(),
  pluralText: z.string().optional(),
  acceptsCategories: z.array(SubjectCategorySchema),
});
export type Predicate = z.infer<typeof PredicateSchema>;

export const ClaimSchema = z.object({
  subject: SubjectSchema,
  predicate: PredicateSchema,
  text: z.string(),
});
export type Claim = z.infer<typeof ClaimSchema>;

// === Pair / Round ===
export const PairSchema = z.object({
  id: z.string(),
  // playerAId picks subject, playerBId picks predicate.
  playerAId: z.string(),
  playerBId: z.string(),
  chosenSubject: SubjectSchema.nullable(),
  chosenPredicate: PredicateSchema.nullable(),
  claim: ClaimSchema.nullable(),
  forPlayerId: z.string().nullable(),
  againstPlayerId: z.string().nullable(),
  votesFor: z.array(z.string()).default([]),
  votesAgainst: z.array(z.string()).default([]),
  pointsAwardedFor: z.number().default(0),
  pointsAwardedAgainst: z.number().default(0),
});
export type Pair = z.infer<typeof PairSchema>;

export const RoundSchema = z.object({
  roundNumber: z.union([z.literal(1), z.literal(2)]),
  pointPot: z.number(),
  pairs: z.array(PairSchema),
});
export type Round = z.infer<typeof RoundSchema>;

// === Audience question ===
export const AudienceQuestionSchema = z.object({
  id: z.string(),
  text: z.string().min(1).max(140),
  submitterId: z.string(),
  pairId: z.string(),
  submittedAt: z.number(),
  isFallback: z.boolean().default(false),
});
export type AudienceQuestion = z.infer<typeof AudienceQuestionSchema>;

// === Cross-examination assignment ===
export const CrossExamAssignmentSchema = z.object({
  questionId: z.string(),
  responderId: z.string(),
});
export type CrossExamAssignment = z.infer<typeof CrossExamAssignmentSchema>;

// === Claim generation offers ===
// Per pair: 3 subjects offered to playerA, 3 predicates offered to playerB.
export const ClaimGenerationOffersSchema = z.object({
  subjectsByPairId: z.record(z.string(), z.array(SubjectSchema)),
  predicatesByPairId: z.record(z.string(), z.array(PredicateSchema)),
});
export type ClaimGenerationOffers = z.infer<typeof ClaimGenerationOffersSchema>;

// === Room config ===
export const RoomConfigSchema = z.object({
  minPlayers: z.number().default(4),
  maxPlayers: z.number().default(10),
  // Phase timers (seconds)
  revealSeconds: z.number().default(5),
  prepSeconds: z.number().default(15),
  openingSeconds: z.number().default(30),
  crossExamResponseSeconds: z.number().default(30),
  verdictSeconds: z.number().default(20),
  transitionSeconds: z.number().default(4),
  claimGenerationSeconds: z.number().default(20),
  pairingDisplaySeconds: z.number().default(8),
  roundBreakSeconds: z.number().default(8),
  // Scoring
  round1Pot: z.number().default(1000),
  round2Pot: z.number().default(2000),
  // Content
  subjectsPerPlayer: z.number().default(3),
  predicatesPerPlayer: z.number().default(3),
  // Fallback question pool kicks in if real audience submissions < this.
  minQuestionsBeforeFallback: z.number().default(2),
});
export type RoomConfig = z.infer<typeof RoomConfigSchema>;

// === Game state (host-authoritative) ===
export const GameStateSchema = z.object({
  roomCode: z.string(),
  phase: GamePhaseSchema,
  players: z.record(z.string(), PlayerSchema),
  config: RoomConfigSchema,
  timer: z.number().nullable(),

  // Both rounds pre-computed at PAIRING entry; R2 round-robin guarantees no
  // R1 pair repeats.
  rounds: z.array(RoundSchema),
  currentRoundIndex: z.number(),
  currentPairIndex: z.number(),

  claimOffers: ClaimGenerationOffersSchema,

  // Audience questions reset at each REVEAL.
  audienceQuestionsForCurrentPair: z.array(AudienceQuestionSchema),

  // Q1 → FOR debater answers, Q2 → AGAINST debater answers.
  crossExamAssignments: z.object({
    q1: CrossExamAssignmentSchema.nullable(),
    q2: CrossExamAssignmentSchema.nullable(),
  }),
});
export type GameState = z.infer<typeof GameStateSchema>;

// === Player view ===
// Every player phase component switches on `role` first, then phase.
export const PlayerRoleSchema = z.enum([
  "DEBATER_FOR",
  "DEBATER_AGAINST",
  "AUDIENCE",
  "PAIR_WAITING",
  "NONE",
]);
export type PlayerRole = z.infer<typeof PlayerRoleSchema>;

export const PlayerViewStateSchema = z.object({
  roomCode: z.string(),
  phase: GamePhaseSchema,
  playerId: z.string(),
  players: z.record(
    z.string(),
    PlayerSchema.pick({
      id: true,
      name: true,
      score: true,
      isVip: true,
      isConnected: true,
      avatarId: true,
    }),
  ),
  timer: z.number().nullable(),

  role: PlayerRoleSchema,

  // === Pairing ===
  myPairId: z.string().nullable(),
  myPairPartnerId: z.string().nullable(),
  // Shown briefly during ROUND_BREAK.
  myUpcomingRound2PartnerId: z.string().nullable(),

  // === Claim generation (only this player's pair's offers) ===
  subjectOptions: z.array(SubjectSchema).optional(),
  hasSubmittedSubject: z.boolean().optional(),
  predicateOptions: z.array(PredicateSchema).optional(),
  hasSubmittedPredicate: z.boolean().optional(),

  // === Active pair (visible from REVEAL onward) ===
  currentClaim: ClaimSchema.nullable(),
  currentPair: z
    .object({
      forPlayerId: z.string(),
      againstPlayerId: z.string(),
      forPlayerName: z.string(),
      againstPlayerName: z.string(),
    })
    .nullable(),

  // === Cross-exam ===
  currentCrossExamQuestion: z
    .object({
      text: z.string(),
      responderId: z.string(),
      questionNumber: z.union([z.literal(1), z.literal(2)]),
    })
    .nullable(),

  // === Audience affordances ===
  canSubmitQuestion: z.boolean(),
  canReact: z.boolean(),
  hasSubmittedVerdict: z.boolean().optional(),
  myQuestionsSubmittedCount: z.number().optional(),

  // === Verdict tallies ===
  // Null during VERDICT (don't leak mid-vote); populated from TRANSITION onward.
  verdictTallies: z
    .object({
      forVotes: z.number(),
      againstVotes: z.number(),
    })
    .nullable(),

  // === Round meta ===
  currentRoundNumber: z.union([z.literal(1), z.literal(2)]).nullable(),
  pointPot: z.number().nullable(),
});
export type PlayerViewState = z.infer<typeof PlayerViewStateSchema>;
