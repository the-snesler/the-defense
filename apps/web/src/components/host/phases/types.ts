import type { SnapshotFrom } from "xstate";
import type { gameMachine } from "../../../machines/gameMachine";

export type HostSnapshot = SnapshotFrom<typeof gameMachine>;

export interface HostPhaseProps {
  state: HostSnapshot;
}
