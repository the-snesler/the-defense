import type { PlayerPhaseProps } from "./types";

export default function TutorialPhase({ view, actions }: PlayerPhaseProps) {
  const me = view.players[view.playerId];
  const isVip = me?.isVip ?? false;
  return (
    <div className="space-y-4 text-white">
      <h2 className="text-2xl font-bold text-center">How to Play</h2>
      <ul className="space-y-2 text-sm list-disc list-inside text-gray-300">
        <li>Pick a subject or predicate to build a ridiculous claim.</li>
        <li>You'll argue FOR or AGAINST. 30 seconds each.</li>
        <li>
          <span className="text-green-400 font-semibold">FOR</span> = defend the
          indefensible.
        </li>
        <li>
          <span className="text-red-400 font-semibold">AGAINST</span> = poke
          holes; let FOR fill them with something worse.
        </li>
        <li>Audience submits questions and votes the winner.</li>
        <li>Round 2 doubles the points.</li>
      </ul>
      {isVip ? (
        <button
          onClick={actions.nextPhase}
          className="w-full bg-blue-600 hover:bg-blue-700 rounded px-4 py-3 font-bold"
        >
          Continue
        </button>
      ) : (
        <p className="text-gray-400 text-sm text-center">
          Waiting for VIP to continue...
        </p>
      )}
    </div>
  );
}
