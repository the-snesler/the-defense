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
  MessageTypes,
  SERVER_TARGET,
  type HostConnectedPayload,
  type KickPlayerPayload,
  type NetworkMessage,
  type PlayerConnectedPayload,
  type ReactionBurstPayload,
} from "@defense/shared";
import HostLayout from "../components/host/HostLayout";
import HostPhaseRouter from "../components/host/phases";
import ReactionParticles, {
  type ReactionParticlesHandle,
} from "../components/shared/ReactionParticles";

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
  "SUBMIT_AUTHORED_SUBJECT",
  "SUBMIT_AUTHORED_PREDICATE",
  "SUBMIT_SUBJECT",
  "SUBMIT_PREDICATE",
  "SUBMIT_QUESTION",
  "SUBMIT_VERDICT",
]);

const REACTION_RATE_WINDOW_MS = 1000;
const REACTION_RATE_MAX = 3;

const hostTokenKey = (code: string) => `host_token_${code}`;

// sessionStorage (set by the lobby) is per tab; mirror it to localStorage so
// a closed/reopened host tab can resume the same room.
function resolveHostToken(code: string | undefined): string | null {
  if (!code) return null;
  try {
    const token =
      sessionStorage.getItem(hostTokenKey(code)) ??
      localStorage.getItem(hostTokenKey(code));
    if (token) {
      sessionStorage.setItem(hostTokenKey(code), token);
      localStorage.setItem(hostTokenKey(code), token);
    }
    return token;
  } catch {
    return null;
  }
}

type ServerPlayer = { id: string; name: string; isConnected: boolean };

export default function Host() {
  const { code } = useParams<{ code: string }>();
  const [hostToken] = useState(() => resolveHostToken(code));

  const [recoveryState, setRecoveryState] = useState<RecoveryState>({ status: "pending" });
  // Mirrors recoveryState synchronously: several players may answer a
  // recovery request in the same tick, and only the first may win.
  const recoveryStatusRef = useRef<RecoveryState["status"] | "decrypting">(
    "pending",
  );
  const recoveryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const updateRecovery = useCallback((next: RecoveryState) => {
    recoveryStatusRef.current = next.status;
    setRecoveryState(next);
  }, []);

  const actorRef = useRef<GameActor | null>(null);
  const [state, setState] = useState<GameSnapshot | null>(null);

  // The relay's view of who is in the room / connected. Kept current even
  // while the actor doesn't exist yet (recovery), so we can reconcile after.
  const serverPlayersRef = useRef<Map<string, ServerPlayer>>(new Map());

  // Rolling timestamps per player for reaction rate-limiting.
  const reactionTimestampsRef = useRef<Map<string, number[]>>(new Map());
  const particlesRef = useRef<ReactionParticlesHandle | null>(null);

  const send = useCallback((event: Parameters<GameActor["send"]>[0]) => {
    if (actorRef.current) actorRef.current.send(event);
  }, []);

  // sendMessage comes from useWebSocket below; helpers reach it via a ref.
  const sendMessageRef = useRef<(m: Omit<NetworkMessage, "senderId">) => boolean>(
    () => false,
  );

  /** Send one player their current view (used when they (re)connect). */
  const syncPlayer = useCallback(
    (playerId: string) => {
      const actor = actorRef.current;
      if (!actor) return;
      const snapshot = actor.getSnapshot();
      if (!snapshot.context.players[playerId]) return;
      const view = machineStateToPlayerViewState(snapshot, playerId);
      const push = (encryptedHostState?: string) =>
        sendMessageRef.current({
          type: "SYNC_STATE",
          target: playerId,
          payload: encryptedHostState ? { ...view, encryptedHostState } : view,
        });
      if (!hostToken) {
        push();
        return;
      }
      encryptState(actor.getPersistedSnapshot(), hostToken)
        .then(push)
        .catch(() => push());
    },
    [hostToken],
  );

  /**
   * Feed a relay-reported connection into the machine. The machine decides
   * whether it is a known player (resume) or a new one (lobby only). A player
   * the machine refuses is kicked from the relay so they get a clear error
   * instead of silently becoming a phantom audience member.
   */
  const handlePlayerConnected = useCallback(
    (playerId: string, playerName: string) => {
      const actor = actorRef.current;
      if (!actor) return;
      actor.send({ type: "PLAYER_CONNECTED", playerId, playerName });
      const snapshot = actor.getSnapshot();
      if (snapshot.context.players[playerId]) {
        // Explicit resync: a reconnecting player must get their current
        // role/view immediately, even if nothing else in the state changed.
        syncPlayer(playerId);
        return;
      }
      const inLobby = snapshot.value === "lobby";
      const code = inLobby ? "ROOM_FULL" : "GAME_IN_PROGRESS";
      console.warn(`Rejecting player ${playerName} (${playerId}): ${code}`);
      serverPlayersRef.current.delete(playerId);
      sendMessageRef.current({
        type: MessageTypes.KICK_PLAYER,
        target: SERVER_TARGET,
        payload: {
          playerId,
          code,
          message: inLobby
            ? "This room is full."
            : "This game has already started.",
        } satisfies KickPlayerPayload,
      });
    },
    [syncPlayer],
  );

  /** Bring the machine's connection flags in line with the relay's roster. */
  const reconcilePlayers = useCallback(() => {
    const actor = actorRef.current;
    if (!actor) return;
    const server = serverPlayersRef.current;
    for (const p of Object.values(actor.getSnapshot().context.players)) {
      if (p.isConnected && !server.get(p.id)?.isConnected) {
        actor.send({ type: "PLAYER_DISCONNECTED", playerId: p.id });
      }
    }
    for (const p of Array.from(server.values())) {
      if (p.isConnected) handlePlayerConnected(p.id, p.name);
    }
  }, [handlePlayerConnected]);

  const initializeActor = useCallback(
    (snapshot?: GameSnapshot) => {
      if (actorRef.current) actorRef.current.stop();
      const actor = createActor(gameMachine, {
        snapshot,
        input: { roomCode: code! },
      });
      actor.subscribe((newState) => setState(newState));
      actor.start();
      actorRef.current = actor;
      setState(actor.getSnapshot());
      console.log("Game actor initialized", actor.getSnapshot());
      reconcilePlayers();
    },
    [code, reconcilePlayers],
  );

  const { isConnected, sendMessage } = useWebSocket({
    roomCode: code!,
    getParams: () => (hostToken ? { role: "host", token: hostToken } : null),
    onTerminalClose: (close) => {
      console.warn("Host connection closed by server", close);
    },
    onMessage: (message) => {
      // === Lifecycle: HOST_CONNECTED triggers recovery decision ===
      if (message.type === "HOST_CONNECTED") {
        const players = (message.payload as HostConnectedPayload).players;
        serverPlayersRef.current = new Map(players.map((p) => [p.id, p]));

        // Host socket reconnected while the game is running: just reconcile
        // (players may have dropped / come back while we were away).
        if (actorRef.current) {
          reconcilePlayers();
          return;
        }
        if (recoveryStatusRef.current !== "pending") return;

        const connected = players.filter((p) => p.isConnected);
        if (connected.length > 0) {
          // Ask every connected player; the first valid answer wins.
          console.log("Requesting state recovery from", connected.length, "players");
          updateRecovery({ status: "requesting" });
          recoveryTimeoutRef.current = setTimeout(() => {
            recoveryTimeoutRef.current = null;
            // If an answer is being decrypted, its outcome decides.
            if (recoveryStatusRef.current !== "requesting") return;
            console.warn("Recovery timeout - starting fresh");
            updateRecovery({ status: "failed" });
            initializeActor();
          }, 5000);
          for (const p of connected) {
            sendMessage({
              type: "REQUEST_STATE_RECOVERY",
              target: p.id,
              payload: {},
            });
          }
        } else {
          console.log("No players connected, starting fresh game");
          updateRecovery({ status: "not_needed" });
          initializeActor();
        }
        return;
      }

      // === Recovery response ===
      if (message.type === "PROVIDE_STATE_RECOVERY") {
        if (!hostToken || recoveryStatusRef.current !== "requesting") return;
        recoveryStatusRef.current = "decrypting";
        const payload = message.payload as { encryptedHostState: string };
        decryptState(payload.encryptedHostState, hostToken)
          .then((recoveredSnapshot: unknown) => {
            if (recoveryTimeoutRef.current) {
              clearTimeout(recoveryTimeoutRef.current);
              recoveryTimeoutRef.current = null;
            }
            console.log("Recovered host state from player", message.senderId);
            const snapshot = recoveredSnapshot as GameSnapshot;
            updateRecovery({ status: "recovered", snapshot });
            initializeActor(snapshot);
          })
          .catch((err: unknown) => {
            // Let another player's answer (or the timeout) decide.
            console.error("Failed to decrypt recovered state:", err);
            recoveryStatusRef.current = "requesting";
            if (recoveryTimeoutRef.current === null) {
              // Timeout already elapsed while we were decrypting.
              updateRecovery({ status: "failed" });
              initializeActor();
            }
          });
        return;
      }

      // === Player lifecycle ===
      if (message.type === "PLAYER_CONNECTED") {
        const payload = message.payload as PlayerConnectedPayload;
        serverPlayersRef.current.set(payload.playerId, {
          id: payload.playerId,
          name: payload.playerName,
          isConnected: true,
        });
        handlePlayerConnected(payload.playerId, payload.playerName);
        return;
      }
      if (message.type === "PLAYER_DISCONNECTED") {
        const payload = message.payload as { playerId: string };
        const known = serverPlayersRef.current.get(payload.playerId);
        if (known) known.isConnected = false;
        send({ type: "PLAYER_DISCONNECTED", playerId: payload.playerId });
        return;
      }

      // Everything below is a player action. Drop anything from a sender the
      // game doesn't know (kicked / phantom / not yet reconciled).
      const senderId = message.senderId;
      const actor = actorRef.current;
      if (!senderId || !actor) return;
      const snapshot = actor.getSnapshot();
      if (!snapshot.context.players[senderId]) return;

      // === VIP skip: translate to TIMER_END for the current state ===
      if (message.type === "SKIP_PHASE") {
        if (!snapshot.context.players[senderId]?.isVip) return;
        send({ type: "TIMER_END" });
        return;
      }

      // === Reactions: rate-limit, then re-broadcast as REACTION_BURST. Never reach the machine. ===
      if (message.type === "SEND_REACTION") {
        // Same rule the player UI uses: audience only, during debate phases.
        // Current-pair debaters can't react to their own debate.
        if (!machineStateToPlayerViewState(snapshot, senderId).canReact) return;
        const payload = message.payload as { reaction?: unknown };
        if (payload?.reaction !== "LAUGH" && payload?.reaction !== "FIRE") return;
        const now = Date.now();
        const timestamps = reactionTimestampsRef.current.get(senderId) ?? [];
        const recent = timestamps.filter((t) => now - t < REACTION_RATE_WINDOW_MS);
        if (recent.length >= REACTION_RATE_MAX) return;
        recent.push(now);
        reactionTimestampsRef.current.set(senderId, recent);
        const burst: ReactionBurstPayload = {
          reaction: payload.reaction,
          fromPlayerId: senderId,
          clientTimestamp: now,
        };
        sendMessage({ type: "REACTION_BURST", target: "ALL", payload: burst });
        // Host also animates locally (server doesn't echo to sender).
        particlesRef.current?.spawn(burst);
        return;
      }

      // === Allowlist: only forward known game-machine events ===
      // (Role gating — e.g. debaters can't question/vote in their own debate —
      // is enforced inside the machine, the single authority.)
      if (MACHINE_EVENT_TYPES.has(message.type)) {
        const payload = message.payload as Record<string, unknown> | undefined;
        send({
          ...payload,
          type: message.type,
          senderId,
        } as unknown as Parameters<typeof send>[0]);
      }
    },
  });
  sendMessageRef.current = sendMessage;

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

  const phaseLabel = state.value.toString();

  return (
    <>
      <HostLayout
        roomCode={code!}
        isConnected={isConnected}
        phase={phaseLabel}
        timer={state.context.timer}
      >
        <HostPhaseRouter state={state} />
      </HostLayout>
      <ReactionParticles ref={particlesRef} />
    </>
  );
}
