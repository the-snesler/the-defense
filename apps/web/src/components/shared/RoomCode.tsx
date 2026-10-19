interface RoomCodeProps {
  code: string;
  size?: 'sm' | 'md' | 'lg';
}

// 'lg' is sized for host/TV screens, where late joiners read it from across a room.
export default function RoomCode({ code, size = 'md' }: RoomCodeProps) {
  const labelSize = { sm: '11px', md: '13px', lg: '20px' }[size];
  const codeSize = { sm: '14px', md: '18px', lg: '40px' }[size];

  return (
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: labelSize, letterSpacing: '0.1em', color: 'var(--ink-dim)', textTransform: 'uppercase' as const }}>
      Room{' '}
      <span style={{ fontSize: codeSize, fontWeight: 700, color: 'var(--brass-soft)', letterSpacing: '0.18em' }}>
        {code}
      </span>
    </span>
  );
}
