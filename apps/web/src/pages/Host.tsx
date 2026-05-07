import { useParams } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import { createActor, type SnapshotFrom, type Actor } from "xstate";
import { gameMachine } from "../machines/gameMachine";
import { useWebSocket } from "../hooks/useWebSocket";
import { useTimer } from "../hooks/useTimer";
import { machineStateToPlayerViewState } from "../lib/api";
import {
  encryptState,
  decryptState,
  type ReactionBurstPayload,
} from "@defense/shared";
import HostLayout from "../components/host/HostLayout";

type GameActor = Actor<typeof gameMachine>;
type GameSnapshot = SnapshotFrom<typeof gameMachine>;

type RecoveryState =
  | { status: "pending" }
  | { status: "not_needed" }
  | { status: "requesting" }
  | { status: "recovered"; snapshot: GameSnapshot }
  | { status: "failed" };

// Only these message types are forwarded to the state machine.
// Everything else (REACTION_BURST, recovery, lifecycle) is handled out-of-band.
const MACHINE_EVENT_TYPES = new Set<string>([
  "START_GAME",
  "NEXT_PHASE",
  "SUBMIT_SUBJECT",
  "SUBMIT_PREDICATE",
  "SUBMIT_QUESTION",
  "SUBMIT_VERDICT",
]);

const REACTION_RATE_WINDOW_MS = 1000;
const REACTION_RATE_MAX = 3;

export default function Host() {
  const { code } = useParams<{ code: string }>();
  const hostToken = sessionStorage.getItem(`host_token_${code}`);

  const [recoveryState, setRecoveryState] = useState<RecoveryState>({ status: "pending" });
  const recoveryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const actorRef = useRef<GameActor | null>(null);
  const [state, setState] = useState<GameSnapshot | null>(null);

  // Rolling timestamps per player for reaction rate-limiting.
  const reactionTimestampsRef = useRef<Map<string, number[]>>(new Map());
  // Recent reaction bursts (consumed by ReactionParticles in step 6).
  const [, setReactionBursts] = useState<ReactionBurstPayload[]>([]);

  const initializeActor = useCallback((snapshot?: GameSnapshot) => {
    if (actorRef.current) actorRef.current.stop();
    const actor = createActor(gameMachine, { snapshot });
    actor.subscribe((newState) => setState(newState));
    actor.start();
    actorRef.current = actor;
    setState(actor.getSnapshot());
    console.log("Game actor initialized", actor.getSnapshot());
  }, []);

  const send = useCallback((event: Parameters<GameActor["send"]>[0]) => {
    if (actorRef.current) actorRef.current.send(event);
  }, []);

  const { isConnected, sendMessage } = useWebSocket({
    roomCode: code!,
    token: hostToken!,
    onMessage: (message) => {
      // === Lifecycle: HOST_CONNECTED triggers recovery decision ===
      if (message.type === "HOST_CONNECTED") {
        const players = (message.payload as { players: { id: string; name: string }[] }).players;
        if (players.length > 0 && recoveryState.status === "pending") {
          const randomPlayer = players[Math.floor(Math.random() * players.length)];
          console.log("Requesting state recovery from player", randomPlayer.id);
          setRecoveryState({ status: "requesting" });
          recoveryTimeoutRef.current = setTimeout(() => {
            console.warn("Recovery timeout - starting fresh");
            setRecoveryState({ status: "failed" });
            initializeActor();
          }, 5000);
          sendMessage({
            type: "REQUEST_STATE_RECOVERY",
            target: randomPlayer.id,
            payload: {},
          });
        } else if (recoveryState.status === "pending") {
          console.log("No players connected, starting fresh game");
          setRecoveryState({ status: "not_needed" });
          initializeActor();
        }
        return;
      }

      // === Recovery response ===
      if (
        message.type === "PROVIDE_STATE_RECOVERY" &&
        hostToken &&
        recoveryState.status === "requesting"
      ) {
        if (recoveryTimeoutRef.current) {
          clearTimeout(recoveryTimeoutRef.current);
          recoveryTimeoutRef.current = null;
        }
        const payload = message.payload as { encryptedHostState: string };
        decryptState(payload.encryptedHostState, hostToken)
          .then((recoveredSnapshot: unknown) => {
            console.log("Recovered host state from player", message.senderId);
            const snapshot = recoveredSnapshot as GameSnapshot;
            setRecoveryState({ status: "recovered", snapshot });
            initializeActor(snapshot);
          })
          .catch((err: unknown) => {
            console.error("Failed to decrypt recovered state:", err);
            setRecoveryState({ status: "failed" });
            initializeActor();
          });
        return;
      }

      // === Reactions: rate-limit, then re-broadcast as REACTION_BURST. Never reach the machine. ===
      if (message.type === "SEND_REACTION") {
        const senderId = message.senderId;
        if (!senderId) return;
        const now = Date.now();
        const timestamps = reactionTimestampsRef.current.get(senderId) ?? [];
        const recent = timestamps.filter((t) => now - t < REACTION_RATE_WINDOW_MS);
        if (recent.length >= REACTION_RATE_MAX) return;
        recent.push(now);
        reactionTimestampsRef.current.set(senderId, recent);
        const payload = message.payload as { reaction: "LAUGH" | "FIRE" };
        const burst: ReactionBurstPayload = {
          reaction: payload.reaction,
          fromPlayerId: senderId,
          clientTimestamp: now,
        };
        sendMessage({ type: "REACTION_BURST", target: "ALL", payload: burst });
        // Host also animates locally (server doesn't echo to sender).
        setReactionBursts((prev) => [...prev.slice(-50), burst]);
        return;
      }

      // === Player lifecycle goes to the machine ===
      if (
        message.type === "PLAYER_CONNECTED" ||
        message.type === "PLAYER_DISCONNECTED"
      ) {
        if (actorRef.current) {
          const payload = message.payload as Record<string, unknown> | undefined;
          send({
            type: message.type,
            ...payload,
            senderId: message.senderId,
          } as unknown as Parameters<typeof send>[0]);
        }
        return;
      }

      // === Allowlist: only forward known game-machine events ===
      if (actorRef.current && MACHINE_EVENT_TYPES.has(message.type)) {
        const payload = message.payload as Record<string, unknown> | undefined;
        send({
          type: message.type,
          ...payload,
          senderId: message.senderId,
        } as unknown as Parameters<typeof send>[0]);
      }
    },
  });

  useTimer(
    state?.context?.timer ?? null,
    () => send({ type: "TIMER_TICK" }),
    () => send({ type: "TIMER_END" }),
  );

  // Sync state to all players on every change.
  useEffect(() => {
    if (
      isConnected &&
      hostToken &&
      state &&
      actorRef.current &&
      state.status !== "stopped"
    ) {
      const persistedSnapshot = actorRef.current.getPersistedSnapshot();
      encryptState(persistedSnapshot, hostToken)
        .then((encryptedHostState) => {
          for (const target of Object.keys(state.context.players)) {
            const payload = {
              ...machineStateToPlayerViewState(state, target),
              encryptedHostState,
            };
            sendMessage({ type: "SYNC_STATE", target, payload });
          }
        })
        .catch((err: unknown) => {
          console.error("Failed to encrypt state:", err);
          for (const target of Object.keys(state.context.players)) {
            const payload = machineStateToPlayerViewState(state, target);
            sendMessage({ type: "SYNC_STATE", target, payload });
          }
        });
    }
  }, [state, isConnected, sendMessage, hostToken]);

  if (!hostToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Host Session</h1>
          <p className="text-gray-400">Please create a new room from the lobby.</p>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">
            {recoveryState.status === "pending" && "Connecting..."}
            {recoveryState.status === "requesting" && "Recovering game state..."}
            {recoveryState.status === "failed" && "Recovery failed, starting fresh..."}
          </h1>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Phase-specific UI lands in step 6 (per-phase host components + ReactionParticles).
  const phaseLabel = state.value.toString();
  const playerCount = Object.keys(state.context.players).length;

  return (
    <HostLayout
      roomCode={code!}
      isConnected={isConnected}
      phase={phaseLabel}
      timer={state.context.timer}
    >
      <div className="text-white p-8 space-y-2">
        <h2 className="text-3xl font-bold">Phase: {phaseLabel}</h2>
        <p className="text-gray-400">Players: {playerCount}</p>
        <p className="text-gray-400">Round: {state.context.currentRoundIndex + 1} / 2</p>
        <p className="text-gray-400">
          Pair: {state.context.currentPairIndex + 1}
        </p>
        <p className="text-gray-500 text-sm">
          (Host phase components arrive in step 6.)
        </p>
      </div>
    </HostLayout>
  );
}
