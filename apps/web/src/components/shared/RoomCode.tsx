interface RoomCodeProps {
  code: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function RoomCode({ code, size = 'md' }: RoomCodeProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  return (
    <span className={`${sizeClasses[size]} font-bold text-white`}>
      Room: {code}
    </span>
  );
}
