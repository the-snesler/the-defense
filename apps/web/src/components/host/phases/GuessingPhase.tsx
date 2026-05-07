import type { Player, Round } from "@nofus/shared";
import PhaseProgress from "../components/PhaseProgress";

interface GuessingPhaseProps {
  players: Record<string, Player>;
  currentRound?: Round;
  expertReady: boolean;
}

export default function GuessingPhase({
  players,
  currentRound,
  expertReady,
}: GuessingPhaseProps) {
  if (!currentRound) return null;

  const playerStatus = Object.keys(players).reduce(
    (acc, playerId) => {
      const isExpert = playerId === currentRound.targetPlayerId;
      const hasSubmitted = isExpert
        ? expertReady
        : currentRound.lies[playerId] !== undefined;

      acc[playerId] = hasSubmitted ? "ready" : "waiting";
      return acc;
    },
    {} as Record<string, "waiting" | "ready" | "presenting" | "voted">,
  );

  return (
    <div className="bg-gray-800 text-white rounded-lg p-6 flex flex-col gap-6">
      <div className="text-center">
        <h3 className="text-xl font-medium text-gray-400 uppercase tracking-widest mb-2">
          Topic:
        </h3>
        <h2 className="text-4xl font-black text-white leading-tight">
          {currentRound.article.title}
        </h2>
      </div>

      <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
        <p className="text-center text-gray-300">
          One of you is the expert. Everyone else, write a convincing summary!
        </p>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-500 uppercase mb-4 text-center">
          Submission Status
        </h4>
        <PhaseProgress players={players} playerStatus={playerStatus} />
      </div>
    </div>
  );
}
