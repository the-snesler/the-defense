import { useRef } from "react";
import { getPhaseName, formatTimer } from "../../lib/formatters";

interface HostLayoutProps {
  roomCode: string;
  isConnected: boolean;
  phase: string;
  timer: number | null;
  children: React.ReactNode;
}

function TimerBar({ timer, phase }: { timer: number; phase: string }) {
  const maxRef = useRef<number | null>(null);
  const prevPhaseRef = useRef<string>(phase);

  if (phase !== prevPhaseRef.current) {
    maxRef.current = null;
    prevPhaseRef.current = phase;
  }
  if (maxRef.current === null) {
    maxRef.current = timer;
  }

  const max = maxRef.current ?? 1;
  const isUrgent = timer <= 10;
  const animationKey = `${phase}-${max}`;

  return (
    <div className="timer-bar-wrap">
      <span className="timer-bar-label">Time Remaining</span>
      <div className="timer-bar-track">
        <div
          key={animationKey}
          className={`timer-bar-fill ${isUrgent ? "urgent" : ""}`}
          style={{ animationDuration: `${Math.max(1, max)}s` }}
        />
      </div>
      <span className={`timer-bar-value ${isUrgent ? "urgent" : ""}`}>
        {formatTimer(timer)}
      </span>
    </div>
  );
}

export default function HostLayout({
  roomCode,
  isConnected,
  phase,
  timer,
  children,
}: HostLayoutProps) {
  return (
    <div className="stage">
      <div className="stage-vignette" />

      <header className="chrome">
        <div className="chrome-left">
          Chamber&nbsp;<span className="room-code-value">{roomCode}</span>
        </div>
        <div className="chrome-center">{getPhaseName(phase)}</div>
        <div className="chrome-right">
          <span className={`signal-dot ${isConnected ? "" : "disconnected"}`} />
          <span className="signal-label">
            {isConnected ? "Signal Clear" : "No Signal"}
          </span>
        </div>
      </header>

      <main
        style={{ minHeight: "calc(100vh - 72px - 48px)", position: "relative" }}
      >
        {children}
      </main>

      {timer !== null && <TimerBar timer={timer} phase={phase} />}

      <div className="footer-mark">The Defense · thedefense.party</div>
    </div>
  );
}
