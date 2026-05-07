import { useEffect } from "react";

/**
 * Hook to manage game timer countdown
 * Calls onTick every second and onEnd when timer reaches 0
 */
export function useTimer(
  timer: number | null,
  onTick: () => void,
  onEnd: () => void
): void {
  useEffect(() => {
    if (timer !== null) {
      const interval = setInterval(() => {
        onTick();

        if (timer === 0) {
          onEnd();
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timer, onTick, onEnd]);
}
