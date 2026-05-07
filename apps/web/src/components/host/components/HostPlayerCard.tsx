import type { Player } from "@nofus/shared";
import PlayerCard from "../../shared/PlayerCard";

interface HostPlayerCardProps {
  player: Player;
  status: 'waiting' | 'ready' | 'presenting' | 'voted';
  additionalInfo?: string;
}

export default function HostPlayerCard({
  player,
  status,
  additionalInfo
}: HostPlayerCardProps) {
  const variantMap = {
    waiting: 'waiting' as const,
    ready: 'success' as const,
    presenting: 'presenting' as const,
    voted: 'success' as const,
  };

  const statusText = {
    waiting: 'Choosing...',
    ready: '✓ Selected',
    presenting: 'Presenting',
    voted: '✓ Voted',
  };

  return (
    <PlayerCard player={player} variant={variantMap[status]}>
      <div className="text-sm mt-1">
        {status === 'ready' || status === 'voted' ? (
          <span className="text-green-400">{statusText[status]}</span>
        ) : status === 'presenting' ? (
          <span className="text-blue-400">{statusText[status]}</span>
        ) : (
          <span className="text-gray-400">{statusText[status]}</span>
        )}
      </div>
      {additionalInfo && (
        <div className="text-xs text-gray-400 mt-1">{additionalInfo}</div>
      )}
    </PlayerCard>
  );
}
