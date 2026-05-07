import type { HostPhaseProps } from "./types";

export default function TutorialPhase({ state }: HostPhaseProps) {
  const vipName =
    Object.values(state.context.players).find((p) => p.isVip)?.name ?? "VIP";
  return (
    <div className="text-white p-8 space-y-6">
      <h1 className="text-4xl font-bold text-center">How to Play</h1>
      <ol className="space-y-3 text-lg list-decimal list-inside">
        <li>
          You'll be paired up. One of you picks a <b>subject</b>; the other
          picks a <b>predicate</b>.
        </li>
        <li>The two get smashed together into a ridiculous claim.</li>
        <li>
          One debater argues <span className="text-green-400 font-bold">FOR</span>{" "}
          the claim, the other{" "}
          <span className="text-red-400 font-bold">AGAINST</span>. 30 seconds
          each.
        </li>
        <li>
          The audience submits questions during opening statements; the host
          picks two for cross-examination.
        </li>
        <li>The audience votes for the winner. Points scale with vote share.</li>
        <li>Round 2 has new pairings and DOUBLE POINTS.</li>
      </ol>
      <div className="bg-gray-800 rounded p-4 text-center">
        <p className="text-gray-400 text-sm uppercase tracking-wide mb-2">
          Example claim
        </p>
        <p className="text-2xl">"Shrek invented jazz."</p>
      </div>
      <p className="text-center text-gray-400">
        Waiting for {vipName} to advance...
      </p>
    </div>
  );
}
