import type { HostPhaseProps } from "./types";
import { OpeningStatementScreen } from "./OpeningForPhase";

export default function OpeningAgainstPhase({ state }: HostPhaseProps) {
  return <OpeningStatementScreen state={state} side="AGAINST" />;
}
