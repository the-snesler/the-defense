interface ConnectionBadgeProps {
  isConnected: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ConnectionBadge({ isConnected, size = 'md' }: ConnectionBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded ${isConnected ? "bg-green-600" : "bg-red-600"} text-white`}
    >
      {isConnected ? "Connected" : "Connecting..."}
    </div>
  );
}
