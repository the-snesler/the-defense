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

export default function Player() {
  const { code } = useParams<{ code: string }>();

  const [gameState, setGameState] = useState<PlayerViewState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const encryptedHostStateRef = useRef<string | null>(null);
  const [, setReactionBursts] = useState<ReactionBurstPayload[]>([]);

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
        setReactionBursts((prev) => [...prev.slice(-50), burst]);
        return;
      }

      if (message.type === "ERROR") {
        setError(payload.message as string);
        return;
      }
    },
  });

  // === Action dispatch helpers (used by phase components in step 6) ===
  const handleStartGame = () =>
    sendMessage({ type: "START_GAME", target: "HOST", payload: {} });
  const handleNextPhase = () =>
    sendMessage({ type: "NEXT_PHASE", target: "HOST", payload: {} });
  const handleSubmitSubject = (subjectId: string) =>
    sendMessage({
      type: "SUBMIT_SUBJECT",
      target: "HOST",
      payload: { subjectId },
    });
  const handleSubmitPredicate = (predicateId: string) =>
    sendMessage({
      type: "SUBMIT_PREDICATE",
      target: "HOST",
      payload: { predicateId },
    });
  const handleSubmitQuestion = (text: string) =>
    sendMessage({
      type: "SUBMIT_QUESTION",
      target: "HOST",
      payload: { text },
    });
  const handleSubmitVerdict = (side: DebateSide) =>
    sendMessage({
      type: "SUBMIT_VERDICT",
      target: "HOST",
      payload: { side },
    });
  const handleSendReaction = (reaction: Reaction) =>
    sendMessage({
      type: "SEND_REACTION",
      target: "HOST",
      payload: { reaction },
    });

  // Suppress unused-handler errors until step 6 wires them up.
  void handleStartGame;
  void handleNextPhase;
  void handleSubmitSubject;
  void handleSubmitPredicate;
  void handleSubmitQuestion;
  void handleSubmitVerdict;
  void handleSendReaction;

  return (
    <PlayerLayout
      roomCode={code!}
      isConnected={isConnected}
      phase={gameState?.phase}
      timer={gameState?.timer}
      error={error}
    >
      {!gameState ? (
        <LoadingState message="Waiting for host..." />
      ) : (
        <div className="text-white p-8 space-y-2">
          <h2 className="text-2xl font-bold">Phase: {gameState.phase}</h2>
          <p className="text-gray-400">Role: {gameState.role}</p>
          <p className="text-gray-400">
            Round: {gameState.currentRoundNumber ?? "—"}
          </p>
          <p className="text-gray-500 text-sm">
            (Player phase components arrive in step 6.)
          </p>
        </div>
      )}
    </PlayerLayout>
  );
}
