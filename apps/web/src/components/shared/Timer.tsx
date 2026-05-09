import { useRef } from "react";
import { formatTimer } from "../../lib/formatters";

interface TimerProps {
  seconds: number | null;
  size?: "sm" | "md" | "lg";
  maxSeconds?: number;
}

export default function Timer({
  seconds,
  size = "md",
  maxSeconds,
}: TimerProps) {
  const maxRef = useRef<number | null>(maxSeconds ?? null);
  if (seconds !== null && maxRef.current === null) {
    maxRef.current = seconds;
  }
  if (seconds === null) {
    maxRef.current = null;
  }

  const max = maxSeconds ?? maxRef.current ?? 1;
  const isUrgent = seconds !== null && seconds <= 10;

  if (size === "sm") {
    return (
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          color: "var(--brass-soft)",
          letterSpacing: "0.1em",
        }}
      >
        {formatTimer(seconds)}
      </span>
    );
  }

  if (size === "md") {
    return (
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 14,
          fontWeight: 700,
          color: isUrgent ? "var(--ox-glow)" : "var(--brass)",
          letterSpacing: "0.15em",
        }}
      >
        {formatTimer(seconds)}
      </span>
    );
  }

  return (
    <div className="timer-bar-wrap">
      <span className="timer-bar-label">Time Remaining</span>
      <div className="timer-bar-track">
        <div
          className={`timer-bar-fill ${isUrgent ? "urgent" : ""}`}
          style={{ animationDuration: `${Math.max(1, max)}s` }}
        />
      </div>
      <span className={`timer-bar-value ${isUrgent ? "urgent" : ""}`}>
        {formatTimer(seconds)}
      </span>
    </div>
  );
}
