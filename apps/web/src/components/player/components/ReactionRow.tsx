import type { Reaction } from "@defense/shared";

interface Props {
  onReact: (r: Reaction) => void;
}

export default function ReactionRow({ onReact }: Props) {
  return (
    <div className="mt-4">
      <div className="ph-section-title">Or react</div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onReact("LAUGH")}
          className="btn-reaction"
          aria-label="Laugh"
        >
          <span className="emoji">😂</span>
          <span className="lbl">LOL</span>
        </button>
        <button
          onClick={() => onReact("FIRE")}
          className="btn-reaction"
          aria-label="Fire"
        >
          <span className="emoji">🔥</span>
          <span className="lbl">Heat</span>
        </button>
      </div>
    </div>
  );
}
