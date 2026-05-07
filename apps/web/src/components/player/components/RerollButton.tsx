interface RerollButtonProps {
  onReroll: () => void;
  disabled: boolean;
}

export default function RerollButton({ onReroll, disabled }: RerollButtonProps) {
  return (
    <div>
      {!disabled ? (
        <button
          onClick={onReroll}
          className="w-full bg-gray-600 hover:bg-gray-500 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          Reroll (Show 3 Different Articles)
        </button>
      ) : (
        <p className="text-gray-400 text-sm text-center">
          Reroll used
        </p>
      )}
    </div>
  );
}
