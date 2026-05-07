/**
 * Utility functions for formatting game data
 */

/**
 * Format timer seconds as MM:SS
 */
export function formatTimer(seconds: number | null): string {
  if (seconds === null) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Get human-readable phase name from phase string
 */
export function getPhaseName(phase: string): string {
  const phaseNames: Record<string, string> = {
    // Machine state values (host)
    lobby: "Lobby",
    tutorial: "Tutorial",
    pairing: "Pairings",
    claimGeneration: "Building Claims",
    reveal: "Reveal",
    prep: "Prep",
    openingFor: "Opening · FOR",
    openingAgainst: "Opening · AGAINST",
    crossExamQ1: "Cross-Exam · Q1",
    crossExamQ2: "Cross-Exam · Q2",
    verdict: "Verdict",
    transition: "Scoring",
    roundBreak: "Round 2",
    finale: "Final Scores",
    // GamePhase enum values (player view)
    LOBBY: "Lobby",
    TUTORIAL: "Tutorial",
    PAIRING: "Pairings",
    CLAIM_GENERATION: "Building Claims",
    REVEAL: "Reveal",
    PREP: "Prep",
    OPENING_FOR: "Opening · FOR",
    OPENING_AGAINST: "Opening · AGAINST",
    CROSS_EXAM_Q1: "Cross-Exam · Q1",
    CROSS_EXAM_Q2: "Cross-Exam · Q2",
    VERDICT: "Verdict",
    TRANSITION: "Scoring",
    ROUND_BREAK: "Round 2",
    FINALE: "Final Scores",
  };
  return phaseNames[phase] || phase;
}
