import type { Player } from "@nofus/shared";

interface PlayerCardProps {
  player: Player;
  variant?: 'default' | 'success' | 'waiting' | 'presenting';
  showScore?: boolean;
  children?: React.ReactNode;
}

export default function PlayerCard({
  player,
  variant = 'default',
  showScore = false,
  children
}: PlayerCardProps) {
  const variantClasses = {
    default: 'border-gray-600 bg-gray-700/50',
    success: 'border-green-500 bg-green-900/20',
    waiting: 'border-gray-600 bg-gray-700/50',
    presenting: 'border-blue-500 bg-blue-900/20',
  };

  return (
    <div className={`p-4 rounded border-2 ${variantClasses[variant]}`}>
      <div className="font-semibold text-white">{player.name}</div>
      {showScore && (
        <div className="text-sm text-gray-300 mt-1">
          Score: {player.score}
        </div>
      )}
      {children}
    </div>
  );
}
