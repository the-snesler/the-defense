import RoomCode from "../shared/RoomCode";
import ConnectionBadge from "../shared/ConnectionBadge";
import ErrorMessage from "../shared/ErrorMessage";

interface PlayerLayoutProps {
  roomCode: string;
  isConnected: boolean;
  phase?: string;
  timer?: number | null;
  error?: string | null;
  isVip?: boolean;
  onSkipPhase?: () => void;
  children: React.ReactNode;
}

export default function PlayerLayout({
  roomCode,
  isConnected,
  error,
  isVip,
  onSkipPhase,
  children,
}: PlayerLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <RoomCode code={roomCode} size="md" />
          <div className="flex items-center gap-2">
            {isVip && onSkipPhase && (
              <button
                onClick={onSkipPhase}
                title="VIP: skip current phase (debug / presenter)"
                className="px-2 py-1 text-xs uppercase tracking-wide bg-yellow-900/40 hover:bg-yellow-900/60 border border-yellow-500/40 text-yellow-200 rounded"
              >
                Skip
              </button>
            )}
            <ConnectionBadge isConnected={isConnected} size="sm" />
          </div>
        </div>

        {/* Error Display */}
        {error && <ErrorMessage message={error} />}

        {/* Phase Content */}
        <div className="bg-gray-800 rounded-lg p-6">{children}</div>
      </div>
    </div>
  );
}
