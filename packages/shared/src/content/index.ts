import { z } from "zod";
import { SubjectSchema, PredicateSchema } from "../types";
import type { Subject, Predicate } from "../types";
import subjectsJson from "./subjects.json";
import predicatesJson from "./predicates.json";
import fallbackQuestionsJson from "./fallbackQuestions.json";

// Parsed at module load — fail fast on malformed content.
export const SUBJECTS: Subject[] = z.array(SubjectSchema).parse(subjectsJson);
export const PREDICATES: Predicate[] = z
  .array(PredicateSchema)
  .parse(predicatesJson);
export const FALLBACK_QUESTIONS: string[] = z
  .array(z.string().min(1).max(140))
  .parse(fallbackQuestionsJson);

// Render: capitalize subject's leading char if not already, pick pluralText
// when subject.isPlural, append a period.
export function renderClaim(subject: Subject, predicate: Predicate): string {
  const verb = subject.isPlural
    ? predicate.pluralText ?? predicate.text
    : predicate.text;
  const first = subject.text.charAt(0);
  const subjectText =
    first === first.toUpperCase()
      ? subject.text
      : first.toUpperCase() + subject.text.slice(1);
  return `${subjectText} ${verb}.`;
}
