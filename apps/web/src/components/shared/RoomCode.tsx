interface RoomCodeProps {
  code: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function RoomCode({ code, size = 'md' }: RoomCodeProps) {
  const labelSize = { sm: '10px', md: '11px', lg: '12px' }[size];
  const codeSize = { sm: '12px', md: '14px', lg: '16px' }[size];

  return (
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: labelSize, letterSpacing: '0.1em', color: 'var(--ink-mute)', textTransform: 'uppercase' as const }}>
      Chamber{' '}
      <span style={{ fontSize: codeSize, fontWeight: 700, color: 'var(--brass)', letterSpacing: '0.22em' }}>
        {code}
      </span>
    </span>
  );
}
