import type { Reaction } from "@defense/shared";

interface Props {
  onReact: (r: Reaction) => void;
}

export default function ReactionRow({ onReact }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      <button
        onClick={() => onReact("LAUGH")}
        className="bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 rounded px-4 py-3 text-3xl"
        aria-label="Laugh"
      >
        😂
      </button>
      <button
        onClick={() => onReact("FIRE")}
        className="bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded px-4 py-3 text-3xl"
        aria-label="Fire"
      >
        🔥
      </button>
    </div>
  );
}
