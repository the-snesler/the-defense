import { z } from "zod";
import type { Subject, Predicate } from "../types";
import subjectsJson from "./subjects.json";
import predicatesJson from "./predicates.json";
import fallbackQuestionsJson from "./fallbackQuestions.json";

// Parsed at module load — fail fast on malformed content. Both content lists
// are flat string arrays now; the state machine wraps them into Subject /
// Predicate objects (with `authorId: "SYSTEM"`, `isFallback: true`) when it
// needs to top up a thin player-authored pool.
export const FALLBACK_SUBJECT_TEXTS: string[] = z
  .array(z.string().min(1))
  .parse(subjectsJson);
export const FALLBACK_PREDICATE_TEXTS: string[] = z
  .array(z.string().min(1))
  .parse(predicatesJson);
export const FALLBACK_QUESTIONS: string[] = z
  .array(z.string().min(1).max(140))
  .parse(fallbackQuestionsJson);

// Render: capitalize the subject's leading char if it isn't already, append a
// period. Player-authored content makes plural-aware verb conjugation
// untenable, so we accept that "the dads invented jazz" reads slightly off —
// per design, occasional grammar weirdness is part of the joke.
export function renderClaim(subject: Subject, predicate: Predicate): string {
  const subjectText = subject.text.trim();
  const predicateText = predicate.text.trim();
  const first = subjectText.charAt(0);
  const head =
    first === first.toUpperCase()
      ? subjectText
      : first.toUpperCase() + subjectText.slice(1);
  return `${head} ${predicateText}.`;
}
