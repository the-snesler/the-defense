import { useParams } from "react-router-dom";
import { useState, useRef } from "react";
import { useWebSocket, type TerminalClose } from "../hooks/useWebSocket";
import {
  CloseCodes,
  PLAYER_NAME_MAX_LENGTH,
  type DebateSide,
  type PlayerViewState,
  type Reaction,
  type ReactionBurstPayload,
  type RoomJoinedPayload,
} from "@defense/shared";
import PlayerLayout from "../components/player/PlayerLayout";
import LoadingState from "../components/shared/LoadingState";
import PlayerPhaseRouter, {
  type PlayerPhaseActions,
} from "../components/player/phases";
import ReactionParticles, {
  type ReactionParticlesHandle,
} from "../components/shared/ReactionParticles";

// === Player identity persistence ===
//
// A player's identity for a room is { playerId, token, name }. It is generated
// on the client BEFORE the first connect and sent on every connect attempt, so
// joins are idempotent: refresh, phone sleep, socket drops, or a lost
// ROOM_JOINED all resume the same player instead of creating a new one.
//
// sessionStorage (per tab) is checked first so several tabs in one browser can
// be different players (handy for local testing). localStorage is the fallback
// so closing the tab / iOS discarding it / re-entering the code + same name in
// the lobby still resumes the same player.

interface PlayerIdentity {
  playerId: string;
  token: string;
  name: string;
}

const identityKey = (code: string) => `defense:player:${code.toUpperCase()}`;

function randomId(length: number): string {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += alphabet[b & 63];
  return out;
}

function parseIdentity(raw: string | null): PlayerIdentity | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<PlayerIdentity>;
    if (
      typeof v.playerId === "string" &&
      typeof v.token === "string" &&
      typeof v.name === "string"
    ) {
      return { playerId: v.playerId, token: v.token, name: v.name };
    }
  } catch {
    // ignore
  }
  return null;
}

function safeGet(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {
    // Private mode / quota: identity still lives in memory for this page.
  }
}

function safeRemove(storage: Storage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    // ignore
  }
}

function saveIdentity(code: string, identity: PlayerIdentity): void {
  const raw = JSON.stringify(identity);
  safeSet(sessionStorage, identityKey(code), raw);
  safeSet(localStorage, identityKey(code), raw);
}

function clearIdentity(code: string, playerId: string): void {
  for (const storage of [sessionStorage, localStorage]) {
    const existing = parseIdentity(safeGet(storage, identityKey(code)));
    // Don't wipe another tab's newer identity out of localStorage.
    if (!existing || existing.playerId === playerId) {
      safeRemove(storage, identityKey(code));
    }
  }
  safeRemove(sessionStorage, `player_id_${code}`);
  safeRemove(sessionStorage, `player_token_${code}`);
}

const sameName = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

function resolveIdentity(code: string): PlayerIdentity | null {
  const pendingName = safeGet(sessionStorage, "player_name")?.trim() || null;

  // 1. This tab already joined this room.
  const tabIdentity = parseIdentity(safeGet(sessionStorage, identityKey(code)));
  if (tabIdentity) return tabIdentity;

  // 1b. Legacy per-tab keys from the previous client version.
  const legacyId = safeGet(sessionStorage, `player_id_${code}`);
  const legacyToken = safeGet(sessionStorage, `player_token_${code}`);
  if (legacyId && legacyToken && pendingName) {
    const identity = { playerId: legacyId, token: legacyToken, name: pendingName };
    saveIdentity(code, identity);
    return identity;
  }

  // 2. This device joined this room before (tab closed / discarded, or the
  //    player re-entered the code with the same name).
  const deviceIdentity = parseIdentity(safeGet(localStorage, identityKey(code)));
  if (deviceIdentity && (!pendingName || sameName(pendingName, deviceIdentity.name))) {
    safeSet(sessionStorage, identityKey(code), JSON.stringify(deviceIdentity));
    return deviceIdentity;
  }

  // 3. Fresh join from the lobby.
  if (pendingName) {
    const identity = {
      playerId: randomId(16),
      token: randomId(32),
      name: pendingName.slice(0, PLAYER_NAME_MAX_LENGTH),
    };
    saveIdentity(code, identity);
    return identity;
  }

  return null;
}

function closeMessage(close: TerminalClose): string {
  switch (close.code) {
    case CloseCodes.SUPERSEDED:
      return "You opened this game somewhere else. This screen is no longer connected.";
    case CloseCodes.ROOM_NOT_FOUND:
      return "This room no longer exists.";
    case CloseCodes.KICKED:
      return close.reason === "GAME_IN_PROGRESS"
        ? "This game has already started. Ask the host to start a new room."
        : close.reason === "ROOM_FULL"
          ? "This room is full."
          : "You were removed from the room.";
    case CloseCodes.INVALID_IDENTITY:
    default:
      return "Your session for this room has expired. Rejoin from the home page.";
  }
}

export default function Player() {
  const { code: rawCode } = useParams<{ code: string }>();
  const code = (rawCode ?? "").toUpperCase();

  const [gameState, setGameState] = useState<PlayerViewState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const encryptedHostStateRef = useRef<string | null>(null);
  const particlesRef = useRef<ReactionParticlesHandle | null>(null);

  // Resolved once per page load; read through a ref by getParams so every
  // reconnect uses the same (and latest confirmed) identity.
  const identityRef = useRef<PlayerIdentity | null | undefined>(undefined);
  if (identityRef.current === undefined) {
    identityRef.current = code ? resolveIdentity(code) : null;
  }
  const [missingIdentity] = useState(() => !identityRef.current);

  const { isConnected, sendMessage } = useWebSocket({
    roomCode: code,
    getParams: () => {
      const identity = identityRef.current;
      if (!identity) return null;
      return {
        role: "player",
        playerId: identity.playerId,
        token: identity.token,
        name: identity.name,
      };
    },
    onTerminalClose: (close) => {
      const identity = identityRef.current;
      // A superseded tab keeps its identity (the other tab is using it).
      if (identity && close.code !== CloseCodes.SUPERSEDED) {
        clearIdentity(code, identity.playerId);
      }
      setError(closeMessage(close));
    },
    onMessage: (message) => {
      const payload = message.payload as Record<string, unknown>;

      if (message.type === "ROOM_JOINED") {
        const joined = payload as unknown as RoomJoinedPayload;
        const current = identityRef.current;
        const identity: PlayerIdentity = {
          playerId: joined.playerId,
          token: joined.reconnectToken,
          name: current?.name ?? "",
        };
        identityRef.current = identity;
        saveIdentity(code, identity);
        setError(null);
        if (joined.state) setGameState(joined.state);
        return;
      }

      if (message.type === "SYNC_STATE") {
        if (message.senderId !== "HOST") return;
        const statePayload = payload as unknown as PlayerViewState & {
          encryptedHostState?: string;
        };
        setGameState(statePayload);
        if (statePayload.encryptedHostState) {
          encryptedHostStateRef.current = statePayload.encryptedHostState;
        }
        return;
      }

      if (message.type === "REQUEST_STATE_RECOVERY") {
        if (encryptedHostStateRef.current) {
          console.log("Providing state recovery to host");
          sendMessage({
            type: "PROVIDE_STATE_RECOVERY",
            target: "HOST",
            payload: { encryptedHostState: encryptedHostStateRef.current },
          });
        }
        return;
      }

      if (message.type === "REACTION_BURST") {
        const burst = payload as unknown as ReactionBurstPayload;
        particlesRef.current?.spawn(burst);
        return;
      }

      if (message.type === "ERROR") {
        setError(payload.message as string);
        return;
      }
    },
  });

  const actions: PlayerPhaseActions = {
    startGame: () =>
      sendMessage({ type: "START_GAME", target: "HOST", payload: {} }),
    nextPhase: () =>
      sendMessage({ type: "NEXT_PHASE", target: "HOST", payload: {} }),
    skipPhase: () =>
      sendMessage({ type: "SKIP_PHASE", target: "HOST", payload: {} }),
    submitAuthoredSubject: (text: string) =>
      sendMessage({
        type: "SUBMIT_AUTHORED_SUBJECT",
        target: "HOST",
        payload: { text },
      }),
    submitAuthoredPredicate: (text: string) =>
      sendMessage({
        type: "SUBMIT_AUTHORED_PREDICATE",
        target: "HOST",
        payload: { text },
      }),
    submitSubject: (subjectId: string) =>
      sendMessage({
        type: "SUBMIT_SUBJECT",
        target: "HOST",
        payload: { subjectId },
      }),
    submitPredicate: (predicateId: string) =>
      sendMessage({
        type: "SUBMIT_PREDICATE",
        target: "HOST",
        payload: { predicateId },
      }),
    submitQuestion: (text: string) =>
      sendMessage({
        type: "SUBMIT_QUESTION",
        target: "HOST",
        payload: { text },
      }),
    submitVerdict: (side: DebateSide) =>
      sendMessage({
        type: "SUBMIT_VERDICT",
        target: "HOST",
        payload: { side },
      }),
    sendReaction: (reaction: Reaction) =>
      sendMessage({
        type: "SEND_REACTION",
        target: "HOST",
        payload: { reaction },
      }),
  };

  const isVip =
    gameState?.players[gameState.playerId]?.isVip ?? false;

  return (
    <>
      <PlayerLayout
        roomCode={code}
        isConnected={isConnected}
        phase={gameState?.phase}
        timer={gameState?.timer}
        error={
          missingIdentity
            ? "Enter your name on the home page to join this room."
            : error
        }
        isVip={isVip}
        onSkipPhase={actions.skipPhase}
      >
        {!gameState ? (
          <LoadingState message="Waiting for host..." />
        ) : (
          <PlayerPhaseRouter view={gameState} actions={actions} />
        )}
      </PlayerLayout>
      <ReactionParticles ref={particlesRef} />
    </>
  );
}
