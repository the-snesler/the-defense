interface LoadingStateProps {
  message: string;
  icon?: 'clock' | 'check' | 'hourglass';
}

export default function LoadingState({ message, icon = 'clock' }: LoadingStateProps) {
  const icons = {
    clock: '🕐',
    check: '✓',
    hourglass: '⌛',
  };

  return (
    <div className="bg-gray-800 text-white rounded-lg p-6">
      <div className="text-center py-8">
        {icon && (
          <div className="text-5xl mb-4">{icons[icon]}</div>
        )}
        <p className="text-gray-400">{message}</p>
      </div>
    </div>
  );
}
