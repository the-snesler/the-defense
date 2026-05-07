import { useParams } from "react-router-dom";
import { useState, useRef } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import type {
  DebateSide,
  PlayerViewState,
  Reaction,
  ReactionBurstPayload,
} from "@defense/shared";
import PlayerLayout from "../components/player/PlayerLayout";
import LoadingState from "../components/shared/LoadingState";
import PlayerPhaseRouter, {
  type PlayerPhaseActions,
} from "../components/player/phases";
import ReactionParticles, {
  type ReactionParticlesHandle,
} from "../components/shared/ReactionParticles";

export default function Player() {
  const { code } = useParams<{ code: string }>();

  const [gameState, setGameState] = useState<PlayerViewState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const encryptedHostStateRef = useRef<string | null>(null);
  const particlesRef = useRef<ReactionParticlesHandle | null>(null);

  const existingPlayerName = sessionStorage.getItem(`player_name`);
  const existingPlayerId = sessionStorage.getItem(`player_id_${code}`);
  const existingToken = sessionStorage.getItem(`player_token_${code}`);

  const { isConnected, sendMessage } = useWebSocket({
    roomCode: code!,
    playerName: existingPlayerName!,
    playerId: existingPlayerId || undefined,
    token: existingToken || undefined,
    onMessage: (message) => {
      const payload = message.payload as Record<string, unknown>;

      if (message.type === "ROOM_JOINED") {
        sessionStorage.setItem(`player_id_${code}`, payload.playerId as string);
        sessionStorage.setItem(
          `player_token_${code}`,
          payload.reconnectToken as string,
        );
        // ROOM_JOINED also includes a state snapshot in `state`
        const state = (payload as { state?: PlayerViewState }).state;
        if (state) setGameState(state);
        return;
      }

      if (message.type === "SYNC_STATE") {
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
        roomCode={code!}
        isConnected={isConnected}
        phase={gameState?.phase}
        timer={gameState?.timer}
        error={error}
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
