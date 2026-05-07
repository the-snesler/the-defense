interface PlayerGridProps {
  children: React.ReactNode;
  columns?: number;
}

export default function PlayerGrid({ children, columns = 3 }: PlayerGridProps) {
  const gridClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  }[columns] || 'grid-cols-2 md:grid-cols-3';

  return (
    <div className={`grid ${gridClasses} gap-4`}>
      {children}
    </div>
  );
}
