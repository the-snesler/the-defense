import RoomCode from "../shared/RoomCode";
import ConnectionBadge from "../shared/ConnectionBadge";
import ErrorMessage from "../shared/ErrorMessage";

interface PlayerLayoutProps {
  roomCode: string;
  isConnected: boolean;
  phase?: string;
  timer?: number | null;
  error?: string | null;
  children: React.ReactNode;
}

export default function PlayerLayout({
  roomCode,
  isConnected,
  error,
  children
}: PlayerLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <RoomCode code={roomCode} size="md" />
          <ConnectionBadge isConnected={isConnected} size="sm" />
        </div>

        {/* Error Display */}
        {error && <ErrorMessage message={error} />}

        {/* Phase Content */}
        <div className="bg-gray-800 rounded-lg p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
