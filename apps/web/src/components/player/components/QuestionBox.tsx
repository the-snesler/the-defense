import { useState } from "react";

interface Props {
  onSubmit: (text: string) => void;
  submittedCount?: number;
}

export default function QuestionBox({ onSubmit, submittedCount }: Props) {
  const [text, setText] = useState("");
  const v = text.trim();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!v) return;
        onSubmit(v);
        setText("");
      }}
      className="space-y-2"
    >
      <div className="ph-section-title">Submit a question</div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Be honest — are you making this up as you go?"
        maxLength={140}
        rows={3}
        className="ph-q-input w-full resize-none outline-none"
      />
      <div className="ph-counter">{text.length} / 140</div>
      <button type="submit" disabled={!v} className="btn-ox">
        File it
      </button>
      {submittedCount !== undefined && submittedCount > 0 && (
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-mute">
          Filed {submittedCount} question{submittedCount === 1 ? "" : "s"}
        </p>
      )}
    </form>
  );
}
