import type { HostPhaseProps } from "./types";
import { CrossExamScreen } from "./CrossExamQ1Phase";

export default function CrossExamQ2Phase({ state }: HostPhaseProps) {
  return <CrossExamScreen state={state} which="q2" />;
}
