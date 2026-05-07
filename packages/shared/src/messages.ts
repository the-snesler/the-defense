import { z } from "zod";
import {
  PlayerViewStateSchema,
  RoomConfigSchema,
  DebateSideSchema,
  ReactionSchema,
} from "./types";
import { ROOM_CODE_LENGTH } from ".";

// === Base envelope ===
export const NetworkMessageSchema = z.object({
  type: z.string(),
  payload: z.unknown(),
  target: z.string().optional(), // "HOST", "ALL", or specific playerId
  senderId: z.string().optional(), // Injected by server
});
export type NetworkMessage = z.infer<typeof NetworkMessageSchema>;

// === Client -> Server ===

export const JoinRoomPayloadSchema = z.object({
  roomCode: z.string().length(ROOM_CODE_LENGTH),
  playerName: z.string().min(1).max(20),
  avatarId: z.number().min(0).max(9),
});
export type JoinRoomPayload = z.infer<typeof JoinRoomPayloadSchema>;

export const ReconnectPayloadSchema = z.object({
  roomCode: z.string().length(ROOM_CODE_LENGTH),
  playerId: z.string(),
  token: z.string(),
});
export type ReconnectPayload = z.infer<typeof ReconnectPayloadSchema>;

export const CreateRoomPayloadSchema = z.object({
  config: RoomConfigSchema.partial(),
});
export type CreateRoomPayload = z.infer<typeof CreateRoomPayloadSchema>;

// === Server -> Client ===

export const RoomCreatedPayloadSchema = z.object({
  roomCode: z.string(),
  hostToken: z.string(),
});
export type RoomCreatedPayload = z.infer<typeof RoomCreatedPayloadSchema>;

export const RoomJoinedPayloadSchema = z.object({
  playerId: z.string(),
  reconnectToken: z.string(),
  state: PlayerViewStateSchema,
});
export type RoomJoinedPayload = z.infer<typeof RoomJoinedPayloadSchema>;

export const ErrorPayloadSchema = z.object({
  code: z.string(),
  message: z.string(),
});
export type ErrorPayload = z.infer<typeof ErrorPayloadSchema>;

export const PlayerConnectedPayloadSchema = z.object({
  playerId: z.string(),
  playerName: z.string(),
  avatarId: z.number(),
});
export type PlayerConnectedPayload = z.infer<
  typeof PlayerConnectedPayloadSchema
>;

export const HostConnectedPayloadSchema = z.object({
  players: z.array(z.object({ id: z.string(), name: z.string() })),
});
export type HostConnectedPayload = z.infer<typeof HostConnectedPayloadSchema>;

export const PlayerDisconnectedPayloadSchema = z.object({
  playerId: z.string(),
});
export type PlayerDisconnectedPayload = z.infer<
  typeof PlayerDisconnectedPayloadSchema
>;

// === Player -> Host (Relayed) ===

export const StartGamePayloadSchema = z.object({});
export type StartGamePayload = z.infer<typeof StartGamePayloadSchema>;

export const NextPhasePayloadSchema = z.object({});
export type NextPhasePayload = z.infer<typeof NextPhasePayloadSchema>;

// VIP-only debug/presenter affordance: tells the host to fire TIMER_END on
// the current state, immediately advancing the machine. Host enforces the
// VIP check before forwarding to the actor.
export const SkipPhasePayloadSchema = z.object({});
export type SkipPhasePayload = z.infer<typeof SkipPhasePayloadSchema>;

export const SubmitSubjectPayloadSchema = z.object({
  subjectId: z.string(),
});
export type SubmitSubjectPayload = z.infer<typeof SubmitSubjectPayloadSchema>;

export const SubmitPredicatePayloadSchema = z.object({
  predicateId: z.string(),
});
export type SubmitPredicatePayload = z.infer<
  typeof SubmitPredicatePayloadSchema
>;

// === WRITING phase: open-ended player submissions ===

export const SubmitAuthoredSubjectPayloadSchema = z.object({
  text: z.string().min(1).max(100),
});
export type SubmitAuthoredSubjectPayload = z.infer<
  typeof SubmitAuthoredSubjectPayloadSchema
>;

export const SubmitAuthoredPredicatePayloadSchema = z.object({
  text: z.string().min(1).max(100),
});
export type SubmitAuthoredPredicatePayload = z.infer<
  typeof SubmitAuthoredPredicatePayloadSchema
>;

export const SubmitQuestionPayloadSchema = z.object({
  text: z.string().min(1).max(140),
});
export type SubmitQuestionPayload = z.infer<typeof SubmitQuestionPayloadSchema>;

export const SubmitVerdictPayloadSchema = z.object({
  side: DebateSideSchema,
});
export type SubmitVerdictPayload = z.infer<typeof SubmitVerdictPayloadSchema>;

// Fire-and-forget; not part of GameState. Host re-broadcasts as REACTION_BURST.
export const SendReactionPayloadSchema = z.object({
  reaction: ReactionSchema,
});
export type SendReactionPayload = z.infer<typeof SendReactionPayloadSchema>;

// === Host -> Player (Relayed) ===

export const SyncStatePayloadSchema = PlayerViewStateSchema.extend({
  encryptedHostState: z.string().optional(),
});
export type SyncStatePayload = z.infer<typeof SyncStatePayloadSchema>;

export const SetVipPayloadSchema = z.object({
  isVip: z.boolean(),
});
export type SetVipPayload = z.infer<typeof SetVipPayloadSchema>;

// === Host -> All (Relayed) ===

export const ReactionBurstPayloadSchema = z.object({
  reaction: ReactionSchema,
  fromPlayerId: z.string(),
  clientTimestamp: z.number(),
});
export type ReactionBurstPayload = z.infer<typeof ReactionBurstPayloadSchema>;

// === Recovery ===

export const RequestStateRecoveryPayloadSchema = z.object({});
export type RequestStateRecoveryPayload = z.infer<
  typeof RequestStateRecoveryPayloadSchema
>;

export const ProvideStateRecoveryPayloadSchema = z.object({
  encryptedHostState: z.string(),
});
export type ProvideStateRecoveryPayload = z.infer<
  typeof ProvideStateRecoveryPayloadSchema
>;

// === Message Type Constants ===

export const MessageTypes = {
  // Client -> Server
  CREATE_ROOM: "CREATE_ROOM",
  JOIN_ROOM: "JOIN_ROOM",
  RECONNECT: "RECONNECT",

  // Server -> Client
  ROOM_CREATED: "ROOM_CREATED",
  ROOM_JOINED: "ROOM_JOINED",
  ERROR: "ERROR",
  PLAYER_CONNECTED: "PLAYER_CONNECTED",
  HOST_CONNECTED: "HOST_CONNECTED",
  PLAYER_DISCONNECTED: "PLAYER_DISCONNECTED",

  // Player -> Host
  START_GAME: "START_GAME",
  NEXT_PHASE: "NEXT_PHASE",
  SKIP_PHASE: "SKIP_PHASE",
  SUBMIT_AUTHORED_SUBJECT: "SUBMIT_AUTHORED_SUBJECT",
  SUBMIT_AUTHORED_PREDICATE: "SUBMIT_AUTHORED_PREDICATE",
  SUBMIT_SUBJECT: "SUBMIT_SUBJECT",
  SUBMIT_PREDICATE: "SUBMIT_PREDICATE",
  SUBMIT_QUESTION: "SUBMIT_QUESTION",
  SUBMIT_VERDICT: "SUBMIT_VERDICT",
  SEND_REACTION: "SEND_REACTION",

  // Host -> Player
  SYNC_STATE: "SYNC_STATE",
  SET_VIP: "SET_VIP",

  // Host -> All
  REACTION_BURST: "REACTION_BURST",

  // Recovery
  REQUEST_STATE_RECOVERY: "REQUEST_STATE_RECOVERY",
  PROVIDE_STATE_RECOVERY: "PROVIDE_STATE_RECOVERY",
} as const;

export type MessageType = (typeof MessageTypes)[keyof typeof MessageTypes];
