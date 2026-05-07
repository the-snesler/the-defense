import ConnectionBadge from "../shared/ConnectionBadge";
import ErrorMessage from "../shared/ErrorMessage";
import { getPhaseName } from "../../lib/formatters";

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
  phase,
  children,
}: PlayerLayoutProps) {
  return (
    <div className="player-stage">
      <div className="mx-auto min-h-screen max-w-md">
        <header className="player-chrome">
          <div className="room-tag">
            <span className="label">Chamber</span>
            <span className="value">{roomCode}</span>
          </div>
          <div className="flex items-center gap-2">
            {isVip && onSkipPhase && (
              <button
                onClick={onSkipPhase}
                title="VIP: skip current phase (debug / presenter)"
                className="btn-brass !px-2 !py-1"
              >
                Skip
              </button>
            )}
            <ConnectionBadge isConnected={isConnected} size="sm" />
          </div>
        </header>

        {error && <ErrorMessage message={error} />}

        <main className="px-4 pb-6 pt-3">
          {phase && (
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-mute">
              {getPhaseName(phase)}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
