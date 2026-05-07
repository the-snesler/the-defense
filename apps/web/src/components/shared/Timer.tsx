import { formatTimer } from "../../lib/formatters";

interface TimerProps {
  seconds: number | null;
  size?: 'sm' | 'md' | 'lg';
}

export default function Timer({ seconds, size = 'md' }: TimerProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className={`${sizeClasses[size]} font-mono font-bold text-white`}>
      {formatTimer(seconds)}
    </div>
  );
}
