import { setup, assign, and } from "xstate";
import {
  FALLBACK_SUBJECT_TEXTS,
  FALLBACK_PREDICATE_TEXTS,
  FALLBACK_QUESTIONS,
  renderClaim,
} from "@defense/shared";
import type {
  AudienceQuestion,
  ClaimGenerationOffers,
  CrossExamAssignment,
  DebateSide,
  Pair,
  Player,
  Predicate,
  RoomConfig,
  Round,
  RoundContent,
  Subject,
  WriterRole,
} from "@defense/shared";

// === Helpers ===

function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

// Canonical round-robin schedule for an even number of players.
// Returns n-1 rounds, each containing n/2 pairs of playerIds.
function buildRoundRobin(playerIds: string[]): [string, string][][] {
  const n = playerIds.length;
  if (n < 2 || n % 2 !== 0) return [];
  const arr = shuffle(playerIds);
  const rounds: [string, string][][] = [];
  for (let r = 0; r < n - 1; r++) {
    const round: [string, string][] = [];
    for (let i = 0; i < n / 2; i++) {
      round.push([arr[i], arr[n - 1 - i]]);
    }
    rounds.push(round);
    // rotate: fix position 0, rotate the rest by one (last → second)
    const fixed = arr[0];
    const tail = arr.slice(1);
    tail.unshift(tail.pop()!);
    arr.splice(0, arr.length, fixed, ...tail);
  }
  return rounds;
}

function buildPairsForRound(
  pairList: [string, string][],
  roundNumber: 1 | 2,
): Pair[] {
  return pairList.map(([a, b]) => {
    // randomize which player picks subject vs predicate
    const [pa, pb] = Math.random() < 0.5 ? [a, b] : [b, a];
    return {
      id: uid(`r${roundNumber}_pair`),
      playerAId: pa,
      playerBId: pb,
      chosenSubject: null,
      chosenPredicate: null,
      claim: null,
      forPlayerId: null,
      againstPlayerId: null,
      votesFor: [],
      votesAgainst: [],
      pointsAwardedFor: 0,
      pointsAwardedAgainst: 0,
    };
  });
}

function findPairContaining(
  rounds: Round[],
  roundIndex: number,
  playerId: string,
): { pair: Pair; pairIndex: number } | null {
  const round = rounds[roundIndex];
  if (!round) return null;
  for (let i = 0; i < round.pairs.length; i++) {
    const p = round.pairs[i];
    if (p.playerAId === playerId || p.playerBId === playerId) {
      return { pair: p, pairIndex: i };
    }
  }
  return null;
}

function replacePair(
  rounds: Round[],
  roundIndex: number,
  pairIndex: number,
  next: Pair,
): Round[] {
  return rounds.map((r, ri) => {
    if (ri !== roundIndex) return r;
    return {
      ...r,
      pairs: r.pairs.map((p, pi) => (pi === pairIndex ? next : p)),
    };
  });
}

function emptyRoundContent(): RoundContent {
  return { subjects: [], predicates: [], writerAssignments: {} };
}

// Walks every pair in every round and collects the ids of subjects/predicates
// that have been committed as a `claim`. Used to enforce the game-wide
// uniqueness rule: any option that was actually picked stays out of the pool
// for the rest of the game; offered-but-rejected options return.
function getChosenIds(rounds: Round[]): {
  subjectIds: Set<string>;
  predicateIds: Set<string>;
} {
  const subjectIds = new Set<string>();
  const predicateIds = new Set<string>();
  for (const r of rounds) {
    for (const p of r.pairs) {
      if (p.chosenSubject) subjectIds.add(p.chosenSubject.id);
      if (p.chosenPredicate) predicateIds.add(p.chosenPredicate.id);
    }
  }
  return { subjectIds, predicateIds };
}

// === Context ===

interface GameContext {
  roomCode: string;
  config: RoomConfig;
  players: Record<string, Player>;
  timer: number | null;

  rounds: Round[]; // length 0 until pairing; then length 2
  currentRoundIndex: number;
  currentPairIndex: number;

  // Replaced fresh at every WRITING entry.
  roundContent: RoundContent;

  claimOffers: ClaimGenerationOffers;

  audienceQuestionsForCurrentPair: AudienceQuestion[];

  crossExamAssignments: {
    q1: CrossExamAssignment | null;
    q2: CrossExamAssignment | null;
  };
}

// === Events ===

type GameEvent =
  | { type: "PLAYER_CONNECTED"; playerId: string; playerName: string }
  | { type: "PLAYER_DISCONNECTED"; playerId: string }
  | { type: "HOST_CONNECTED"; players: { id: string; name: string }[] }
  | { type: "START_GAME"; senderId: string }
  | { type: "NEXT_PHASE"; senderId: string }
  | { type: "SUBMIT_AUTHORED_SUBJECT"; senderId: string; text: string }
  | { type: "SUBMIT_AUTHORED_PREDICATE"; senderId: string; text: string }
  | { type: "SUBMIT_SUBJECT"; senderId: string; subjectId: string }
  | { type: "SUBMIT_PREDICATE"; senderId: string; predicateId: string }
  | { type: "SUBMIT_QUESTION"; senderId: string; text: string }
  | { type: "SUBMIT_VERDICT"; senderId: string; side: DebateSide }
  | { type: "TIMER_TICK" }
  | { type: "TIMER_END" };

// === Machine ===

export const gameMachine = setup({
  types: {
    context: {} as GameContext,
    events: {} as GameEvent,
  },

  actions: {
    addPlayer: assign({
      players: ({ context, event }) => {
        if (event.type !== "PLAYER_CONNECTED") return context.players;
        const existing = context.players[event.playerId];
        if (existing) {
          return {
            ...context.players,
            [event.playerId]: { ...existing, isConnected: true },
          };
        }
        const isFirst = Object.keys(context.players).length === 0;
        const newPlayer: Player = {
          id: event.playerId,
          name: event.playerName,
          score: 0,
          isVip: isFirst,
          isConnected: true,
          avatarId: Math.floor(Math.random() * 10),
        };
        return { ...context.players, [event.playerId]: newPlayer };
      },
    }),

    disconnectPlayer: assign({
      players: ({ context, event }) => {
        if (event.type !== "PLAYER_DISCONNECTED") return context.players;
        const p = context.players[event.playerId];
        if (!p) return context.players;
        return {
          ...context.players,
          [event.playerId]: { ...p, isConnected: false },
        };
      },
    }),

    computePairings: assign(({ context }) => {
      const connectedIds = Object.values(context.players)
        .filter((p) => p.isConnected)
        .map((p) => p.id);

      const schedule = buildRoundRobin(connectedIds);
      // Pick two distinct rounds from the schedule for R1 and R2.
      const indices = shuffle(schedule.map((_, i) => i));
      const r1Idx = indices[0] ?? 0;
      const r2Idx = indices[1] ?? (indices[0] === 0 ? 1 : 0);

      const r1Pairs = buildPairsForRound(schedule[r1Idx] ?? [], 1);
      const r2Pairs = buildPairsForRound(schedule[r2Idx] ?? [], 2);

      const rounds: Round[] = [
        {
          roundNumber: 1,
          pointPot: context.config.round1Pot,
          pairs: r1Pairs,
        },
        {
          roundNumber: 2,
          pointPot: context.config.round2Pot,
          pairs: r2Pairs,
        },
      ];

      return {
        rounds,
        currentRoundIndex: 0,
        currentPairIndex: 0,
      };
    }),

    // Random half-and-half split of currently-connected players. With an even
    // count the split is exact; the START_GAME guard requires even, so we
    // don't need to worry about leftovers here.
    //
    // R1 (rounds not yet computed): start with empty pools.
    // R2: carry forward R1's pool minus the entries that became chosen
    // claims. Game-wide uniqueness rule: chosen subjects/predicates are
    // permanently out, but offered-but-rejected ones return for R2.
    assignWriters: assign(({ context }) => {
      const connectedIds = Object.values(context.players)
        .filter((p) => p.isConnected)
        .map((p) => p.id);
      const shuffled = shuffle(connectedIds);
      const half = Math.floor(shuffled.length / 2);
      const writerAssignments: Record<string, WriterRole> = {};
      for (let i = 0; i < shuffled.length; i++) {
        writerAssignments[shuffled[i]] = i < half ? "SUBJECT" : "PREDICATE";
      }

      const isFirstRoundWriting = context.rounds.length === 0;
      if (isFirstRoundWriting) {
        return {
          roundContent: {
            subjects: [],
            predicates: [],
            writerAssignments,
          } as RoundContent,
        };
      }

      const { subjectIds, predicateIds } = getChosenIds(context.rounds);
      return {
        roundContent: {
          subjects: context.roundContent.subjects.filter(
            (s) => !subjectIds.has(s.id),
          ),
          predicates: context.roundContent.predicates.filter(
            (p) => !predicateIds.has(p.id),
          ),
          writerAssignments,
        } as RoundContent,
      };
    }),

    recordAuthoredSubject: assign({
      roundContent: ({ context, event }) => {
        if (event.type !== "SUBMIT_AUTHORED_SUBJECT")
          return context.roundContent;
        if (
          context.roundContent.writerAssignments[event.senderId] !== "SUBJECT"
        ) {
          return context.roundContent;
        }
        const text = event.text.trim();
        if (text.length === 0) return context.roundContent;
        if (text.length > context.config.maxAuthoredLength)
          return context.roundContent;
        const entry: Subject = {
          id: uid("subj"),
          text,
          authorId: event.senderId,
          isFallback: false,
        };
        return {
          ...context.roundContent,
          subjects: [...context.roundContent.subjects, entry],
        };
      },
    }),

    recordAuthoredPredicate: assign({
      roundContent: ({ context, event }) => {
        if (event.type !== "SUBMIT_AUTHORED_PREDICATE")
          return context.roundContent;
        if (
          context.roundContent.writerAssignments[event.senderId] !== "PREDICATE"
        ) {
          return context.roundContent;
        }
        const text = event.text.trim();
        if (text.length === 0) return context.roundContent;
        if (text.length > context.config.maxAuthoredLength)
          return context.roundContent;
        const entry: Predicate = {
          id: uid("pred"),
          text,
          authorId: event.senderId,
          isFallback: false,
        };
        return {
          ...context.roundContent,
          predicates: [...context.roundContent.predicates, entry],
        };
      },
    }),

    // Run on claimGeneration entry, before drawClaimOffers. The pool needs
    // enough distinct entries for every pair in the round to receive
    // claimOptionsPerSide (default 3) without overlap. Already-chosen
    // entries from prior rounds don't count toward availability.
    topUpRoundContent: assign({
      roundContent: ({ context }) => {
        const round = context.rounds[context.currentRoundIndex];
        if (!round) return context.roundContent;
        const target = round.pairs.length * context.config.claimOptionsPerSide;
        const { subjectIds, predicateIds } = getChosenIds(context.rounds);

        let { subjects, predicates } = context.roundContent;

        const availableSubjects = subjects.filter((s) => !subjectIds.has(s.id));
        if (availableSubjects.length < target) {
          const deficit = target - availableSubjects.length;
          const existingTexts = new Set(
            subjects.map((s) => s.text.toLowerCase()),
          );
          const candidates = shuffle(FALLBACK_SUBJECT_TEXTS).filter(
            (t) => !existingTexts.has(t.toLowerCase()),
          );
          const additions: Subject[] = [];
          for (const text of candidates) {
            if (additions.length >= deficit) break;
            additions.push({
              id: uid("subj_fb"),
              text,
              authorId: "SYSTEM",
              isFallback: true,
            });
          }
          subjects = [...subjects, ...additions];
        }

        const availablePredicates = predicates.filter(
          (p) => !predicateIds.has(p.id),
        );
        if (availablePredicates.length < target) {
          const deficit = target - availablePredicates.length;
          const existingTexts = new Set(
            predicates.map((p) => p.text.toLowerCase()),
          );
          const candidates = shuffle(FALLBACK_PREDICATE_TEXTS).filter(
            (t) => !existingTexts.has(t.toLowerCase()),
          );
          const additions: Predicate[] = [];
          for (const text of candidates) {
            if (additions.length >= deficit) break;
            additions.push({
              id: uid("pred_fb"),
              text,
              authorId: "SYSTEM",
              isFallback: true,
            });
          }
          predicates = [...predicates, ...additions];
        }

        return { ...context.roundContent, subjects, predicates };
      },
    }),

    // Game-wide uniqueness: each pair's options are disjoint from every
    // other pair's options in the same round, and never include any
    // already-chosen subject/predicate from a prior round.
    drawClaimOffers: assign({
      claimOffers: ({ context }) => {
        const round = context.rounds[context.currentRoundIndex];
        if (!round) return context.claimOffers;
        const { subjectIds, predicateIds } = getChosenIds(context.rounds);
        const availableSubjects = shuffle(
          context.roundContent.subjects.filter((s) => !subjectIds.has(s.id)),
        );
        const availablePredicates = shuffle(
          context.roundContent.predicates.filter(
            (p) => !predicateIds.has(p.id),
          ),
        );
        const n = context.config.claimOptionsPerSide;
        const subjectsByPairId: Record<string, Subject[]> = {};
        const predicatesByPairId: Record<string, Predicate[]> = {};
        let si = 0;
        let pi = 0;
        for (const pair of round.pairs) {
          subjectsByPairId[pair.id] = availableSubjects.slice(si, si + n);
          si += n;
          predicatesByPairId[pair.id] = availablePredicates.slice(pi, pi + n);
          pi += n;
        }
        return { subjectsByPairId, predicatesByPairId };
      },
    }),

    recordSubject: assign({
      rounds: ({ context, event }) => {
        if (event.type !== "SUBMIT_SUBJECT") return context.rounds;
        const found = findPairContaining(
          context.rounds,
          context.currentRoundIndex,
          event.senderId,
        );
        if (!found) return context.rounds;
        if (found.pair.playerAId !== event.senderId) return context.rounds;
        if (found.pair.chosenSubject) return context.rounds;
        const offers =
          context.claimOffers.subjectsByPairId[found.pair.id] ?? [];
        const subject = offers.find((s) => s.id === event.subjectId);
        if (!subject) return context.rounds;
        return replacePair(
          context.rounds,
          context.currentRoundIndex,
          found.pairIndex,
          { ...found.pair, chosenSubject: subject },
        );
      },
    }),

    recordPredicate: assign({
      rounds: ({ context, event }) => {
        if (event.type !== "SUBMIT_PREDICATE") return context.rounds;
        const found = findPairContaining(
          context.rounds,
          context.currentRoundIndex,
          event.senderId,
        );
        if (!found) return context.rounds;
        if (found.pair.playerBId !== event.senderId) return context.rounds;
        if (found.pair.chosenPredicate) return context.rounds;
        const offers =
          context.claimOffers.predicatesByPairId[found.pair.id] ?? [];
        const predicate = offers.find((p) => p.id === event.predicateId);
        if (!predicate) return context.rounds;
        return replacePair(
          context.rounds,
          context.currentRoundIndex,
          found.pairIndex,
          { ...found.pair, chosenPredicate: predicate },
        );
      },
    }),

    finalizeClaims: assign({
      rounds: ({ context }) => {
        const ri = context.currentRoundIndex;
        const round = context.rounds[ri];
        if (!round) return context.rounds;
        const updatedPairs = round.pairs.map((pair) => {
          const subj =
            pair.chosenSubject ??
            (context.claimOffers.subjectsByPairId[pair.id] ?? [])[0] ??
            null;
          const pred =
            pair.chosenPredicate ??
            (context.claimOffers.predicatesByPairId[pair.id] ?? [])[0] ??
            null;
          if (!subj || !pred) return pair;
          // assign sides randomly
          const aIsFor = Math.random() < 0.5;
          return {
            ...pair,
            chosenSubject: subj,
            chosenPredicate: pred,
            claim: {
              subject: subj,
              predicate: pred,
              text: renderClaim(subj, pred),
            },
            forPlayerId: aIsFor ? pair.playerAId : pair.playerBId,
            againstPlayerId: aIsFor ? pair.playerBId : pair.playerAId,
          };
        });
        return context.rounds.map((r, i) =>
          i === ri ? { ...r, pairs: updatedPairs } : r,
        );
      },
    }),

    clearAudienceQuestions: assign({
      audienceQuestionsForCurrentPair: () => [],
      crossExamAssignments: () => ({ q1: null, q2: null }),
    }),

    recordAudienceQuestion: assign({
      audienceQuestionsForCurrentPair: ({ context, event }) => {
        if (event.type !== "SUBMIT_QUESTION")
          return context.audienceQuestionsForCurrentPair;
        const round = context.rounds[context.currentRoundIndex];
        const pair = round?.pairs[context.currentPairIndex];
        if (!pair) return context.audienceQuestionsForCurrentPair;
        // Active debaters can't submit
        if (
          event.senderId === pair.forPlayerId ||
          event.senderId === pair.againstPlayerId
        ) {
          return context.audienceQuestionsForCurrentPair;
        }
        if (context.audienceQuestionsForCurrentPair.length >= 50) {
          return context.audienceQuestionsForCurrentPair;
        }
        const q: AudienceQuestion = {
          id: uid("q"),
          text: event.text,
          submitterId: event.senderId,
          pairId: pair.id,
          submittedAt: Date.now(),
          isFallback: false,
        };
        return [...context.audienceQuestionsForCurrentPair, q];
      },
    }),

    setupCrossExam: assign(({ context }) => {
      const round = context.rounds[context.currentRoundIndex];
      const pair = round?.pairs[context.currentPairIndex];
      if (!pair || !pair.forPlayerId || !pair.againstPlayerId) {
        return {};
      }

      // Top up with fallback questions if pool is too thin.
      let pool = [...context.audienceQuestionsForCurrentPair];
      const need = context.config.minQuestionsBeforeFallback - pool.length;
      if (need > 0) {
        const fallbacks = shuffle(FALLBACK_QUESTIONS).slice(0, need);
        for (const text of fallbacks) {
          pool.push({
            id: uid("qf"),
            text,
            submitterId: "SYSTEM",
            pairId: pair.id,
            submittedAt: Date.now(),
            isFallback: true,
          });
        }
      }

      // Pick 2 distinct questions. Both debaters argue each one — no
      // per-debater assignment.
      const picked = shuffle(pool).slice(0, 2);
      const q1 = picked[0];
      const q2 = picked[1] ?? picked[0];

      return {
        audienceQuestionsForCurrentPair: pool,
        crossExamAssignments: {
          q1: q1 ? { questionId: q1.id } : null,
          q2: q2 ? { questionId: q2.id } : null,
        },
      };
    }),

    recordVerdictVote: assign({
      rounds: ({ context, event }) => {
        if (event.type !== "SUBMIT_VERDICT") return context.rounds;
        const ri = context.currentRoundIndex;
        const round = context.rounds[ri];
        const pair = round?.pairs[context.currentPairIndex];
        if (!pair) return context.rounds;
        // active debaters can't vote
        if (
          event.senderId === pair.forPlayerId ||
          event.senderId === pair.againstPlayerId
        ) {
          return context.rounds;
        }
        // dedupe: replace any existing vote from this voter
        const stripped = {
          ...pair,
          votesFor: pair.votesFor.filter((v) => v !== event.senderId),
          votesAgainst: pair.votesAgainst.filter((v) => v !== event.senderId),
        };
        const next: Pair =
          event.side === "FOR"
            ? { ...stripped, votesFor: [...stripped.votesFor, event.senderId] }
            : {
                ...stripped,
                votesAgainst: [...stripped.votesAgainst, event.senderId],
              };
        return replacePair(context.rounds, ri, context.currentPairIndex, next);
      },
    }),

    computeVerdictPoints: assign(({ context }) => {
      const ri = context.currentRoundIndex;
      const pi = context.currentPairIndex;
      const round = context.rounds[ri];
      const pair = round?.pairs[pi];
      if (!pair || !pair.forPlayerId || !pair.againstPlayerId) return {};

      const total = pair.votesFor.length + pair.votesAgainst.length;
      const pot = round.pointPot;
      let forPts: number;
      let againstPts: number;
      if (total === 0) {
        forPts = Math.floor(pot / 2);
        againstPts = pot - forPts;
      } else {
        forPts = Math.round((pair.votesFor.length / total) * pot);
        againstPts = pot - forPts;
      }

      const updatedPair: Pair = {
        ...pair,
        pointsAwardedFor: forPts,
        pointsAwardedAgainst: againstPts,
      };
      const updatedRounds = replacePair(context.rounds, ri, pi, updatedPair);

      const players = { ...context.players };
      const forP = players[pair.forPlayerId];
      const againstP = players[pair.againstPlayerId];
      if (forP)
        players[pair.forPlayerId] = { ...forP, score: forP.score + forPts };
      if (againstP)
        players[pair.againstPlayerId] = {
          ...againstP,
          score: againstP.score + againstPts,
        };

      return { rounds: updatedRounds, players };
    }),

    nextPair: assign({
      currentPairIndex: ({ context }) => context.currentPairIndex + 1,
    }),

    incrementRound: assign({
      currentRoundIndex: ({ context }) => context.currentRoundIndex + 1,
      currentPairIndex: () => 0,
    }),

    setPairingTimer: assign({
      timer: ({ context }) => context.config.pairingDisplaySeconds,
    }),
    setWritingTimer: assign({
      timer: ({ context }) => context.config.writingSeconds,
    }),
    setClaimGenerationTimer: assign({
      timer: ({ context }) => context.config.claimGenerationSeconds,
    }),
    setRevealTimer: assign({
      timer: ({ context }) => context.config.revealSeconds,
    }),
    setPrepTimer: assign({
      timer: ({ context }) => context.config.prepSeconds,
    }),
    setOpeningTimer: assign({
      timer: ({ context }) => context.config.openingSeconds,
    }),
    setCrossExamTimer: assign({
      timer: ({ context }) => context.config.crossExamResponseSeconds,
    }),
    setVerdictTimer: assign({
      timer: ({ context }) => context.config.verdictSeconds,
    }),
    setTransitionTimer: assign({
      timer: ({ context }) => context.config.transitionSeconds,
    }),
    setRoundBreakTimer: assign({
      timer: ({ context }) => context.config.roundBreakSeconds,
    }),
    clearTimer: assign({ timer: () => null }),

    tickTimer: assign({
      timer: ({ context }) =>
        context.timer !== null ? Math.max(0, context.timer - 1) : null,
    }),
  },

  guards: {
    senderIsVIP: ({ context, event }) => {
      if (!("senderId" in event)) return false;
      const p = context.players[event.senderId];
      return p?.isVip ?? false;
    },

    enoughEvenPlayers: ({ context }) => {
      const n = Object.values(context.players).filter(
        (p) => p.isConnected,
      ).length;
      return (
        n >= context.config.minPlayers &&
        n <= context.config.maxPlayers &&
        n % 2 === 0
      );
    },

    allPairsSubmittedClaim: ({ context }) => {
      const round = context.rounds[context.currentRoundIndex];
      if (!round || round.pairs.length === 0) return false;
      return round.pairs.every(
        (p) => p.chosenSubject !== null && p.chosenPredicate !== null,
      );
    },

    allAudienceVoted: ({ context }) => {
      const round = context.rounds[context.currentRoundIndex];
      const pair = round?.pairs[context.currentPairIndex];
      if (!pair) return false;
      const audience = Object.values(context.players).filter(
        (p) =>
          p.isConnected &&
          p.id !== pair.forPlayerId &&
          p.id !== pair.againstPlayerId,
      );
      const voted = pair.votesFor.length + pair.votesAgainst.length;
      return audience.length > 0 && voted >= audience.length;
    },

    hasMorePairsInRound: ({ context }) => {
      const round = context.rounds[context.currentRoundIndex];
      if (!round) return false;
      return context.currentPairIndex < round.pairs.length - 1;
    },

    isFirstRound: ({ context }) => context.currentRoundIndex === 0,
  },
}).createMachine({
  id: "defense",
  initial: "lobby",

  context: {
    roomCode: "",
    config: {
      minPlayers: 4,
      maxPlayers: 10,
      revealSeconds: 5,
      prepSeconds: 15,
      openingSeconds: 60,
      crossExamResponseSeconds: 30,
      verdictSeconds: 20,
      transitionSeconds: 4,
      writingSeconds: 60,
      claimGenerationSeconds: 20,
      pairingDisplaySeconds: 8,
      roundBreakSeconds: 8,
      round1Pot: 1000,
      round2Pot: 2000,
      claimOptionsPerSide: 3,
      maxAuthoredLength: 100,
      minQuestionsBeforeFallback: 2,
    },
    players: {},
    timer: null,
    rounds: [],
    currentRoundIndex: 0,
    currentPairIndex: 0,
    roundContent: emptyRoundContent(),
    claimOffers: { subjectsByPairId: {}, predicatesByPairId: {} },
    audienceQuestionsForCurrentPair: [],
    crossExamAssignments: { q1: null, q2: null },
  },

  on: {
    PLAYER_CONNECTED: { actions: "addPlayer" },
    PLAYER_DISCONNECTED: { actions: "disconnectPlayer" },
  },

  states: {
    lobby: {
      on: {
        START_GAME: {
          target: "tutorial",
          guard: and(["senderIsVIP", "enoughEvenPlayers"]),
        },
      },
    },

    tutorial: {
      on: {
        NEXT_PHASE: { target: "writing", guard: "senderIsVIP" },
      },
    },

    writing: {
      entry: ["assignWriters", "setWritingTimer"],
      on: {
        SUBMIT_AUTHORED_SUBJECT: { actions: "recordAuthoredSubject" },
        SUBMIT_AUTHORED_PREDICATE: { actions: "recordAuthoredPredicate" },
        TIMER_TICK: { actions: "tickTimer" },
        // R1: pairings haven't been computed yet — go through `pairing` to
        // both compute and display them. R2: pairings were already shown via
        // `roundBreak`, so skip straight to claim generation.
        TIMER_END: [
          { target: "pairing", guard: "isFirstRound" },
          { target: "claimGeneration" },
        ],
      },
    },

    pairing: {
      entry: ["computePairings", "setPairingTimer"],
      on: {
        TIMER_TICK: { actions: "tickTimer" },
        TIMER_END: "claimGeneration",
        NEXT_PHASE: { target: "claimGeneration", guard: "senderIsVIP" },
      },
    },

    claimGeneration: {
      entry: [
        "topUpRoundContent",
        "drawClaimOffers",
        "setClaimGenerationTimer",
      ],
      on: {
        SUBMIT_SUBJECT: { actions: "recordSubject" },
        SUBMIT_PREDICATE: { actions: "recordPredicate" },
        TIMER_TICK: { actions: "tickTimer" },
        TIMER_END: "reveal",
      },
      always: { target: "reveal", guard: "allPairsSubmittedClaim" },
    },

    reveal: {
      entry: ["finalizeClaims", "clearAudienceQuestions", "setRevealTimer"],
      on: {
        TIMER_TICK: { actions: "tickTimer" },
        TIMER_END: "prep",
      },
    },

    prep: {
      entry: "setPrepTimer",
      on: {
        TIMER_TICK: { actions: "tickTimer" },
        TIMER_END: "openingFor",
      },
    },

    openingFor: {
      entry: "setOpeningTimer",
      on: {
        SUBMIT_QUESTION: { actions: "recordAudienceQuestion" },
        TIMER_TICK: { actions: "tickTimer" },
        TIMER_END: "openingAgainst",
      },
    },

    openingAgainst: {
      entry: "setOpeningTimer",
      on: {
        SUBMIT_QUESTION: { actions: "recordAudienceQuestion" },
        TIMER_TICK: { actions: "tickTimer" },
        TIMER_END: { target: "crossExamQ1", actions: "setupCrossExam" },
      },
    },

    crossExamQ1: {
      entry: "setCrossExamTimer",
      on: {
        TIMER_TICK: { actions: "tickTimer" },
        TIMER_END: "crossExamQ2",
      },
    },

    crossExamQ2: {
      entry: "setCrossExamTimer",
      on: {
        TIMER_TICK: { actions: "tickTimer" },
        TIMER_END: "verdict",
      },
    },

    verdict: {
      entry: "setVerdictTimer",
      on: {
        SUBMIT_VERDICT: { actions: "recordVerdictVote" },
        TIMER_TICK: { actions: "tickTimer" },
        TIMER_END: "transition",
      },
      always: { target: "transition", guard: "allAudienceVoted" },
    },

    transition: {
      entry: ["computeVerdictPoints", "setTransitionTimer"],
      on: {
        TIMER_TICK: { actions: "tickTimer" },
        TIMER_END: [
          {
            target: "reveal",
            guard: "hasMorePairsInRound",
            actions: "nextPair",
          },
          {
            target: "roundBreak",
            guard: "isFirstRound",
            actions: "incrementRound",
          },
          { target: "finale" },
        ],
      },
    },

    roundBreak: {
      entry: "setRoundBreakTimer",
      on: {
        TIMER_TICK: { actions: "tickTimer" },
        TIMER_END: "writing",
      },
    },

    finale: {
      type: "final",
    },
  },
});
