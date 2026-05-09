interface ConnectionBadgeProps {
  isConnected: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ConnectionBadge({ isConnected, size = 'md' }: ConnectionBadgeProps) {
  const fontSize = { sm: '10px', md: '11px', lg: '12px' }[size];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%', display: 'inline-block', flexShrink: 0,
        background: isConnected ? 'var(--for)' : 'var(--against)',
        boxShadow: isConnected ? '0 0 6px var(--for)' : '0 0 6px var(--against)',
      }} />
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize,
        fontWeight: 500,
        letterSpacing: '0.12em',
        textTransform: 'uppercase' as const,
        color: 'var(--ink-mute)',
      }}>
        {isConnected ? 'Signal Clear' : 'No Signal'}
      </span>
    </div>
  );
}
