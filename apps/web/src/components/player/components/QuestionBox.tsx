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
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Submit a question (≤140 chars)"
        maxLength={140}
        className="w-full bg-gray-700 rounded px-3 py-2 text-white placeholder-gray-400"
      />
      <button
        type="submit"
        disabled={!v}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded px-4 py-2 font-semibold"
      >
        Send Question
      </button>
      {submittedCount !== undefined && submittedCount > 0 && (
        <p className="text-xs text-gray-500">
          You've submitted {submittedCount} question{submittedCount === 1 ? "" : "s"}
        </p>
      )}
    </form>
  );
}
