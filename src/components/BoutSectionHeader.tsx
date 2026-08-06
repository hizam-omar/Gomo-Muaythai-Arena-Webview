interface BoutSectionHeaderProps {
  type: 'LIVE' | 'UP_NEXT' | 'WAITING' | 'COMPLETED';
  count: number;
}

export function BoutSectionHeader({ type, count }: BoutSectionHeaderProps) {
  if (count === 0) return null;

  let title = '';
  let colorClass = '';
  let dot = null;

  switch (type) {
    case 'LIVE':
      title = 'Live Now';
      colorClass = 'text-slate-900 dark:text-white';
      dot = (
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative h-2 w-2 rounded-full bg-red-600 dark:bg-red-500" />
        </span>
      );
      break;
    case 'UP_NEXT':
      title = 'Up Next';
      colorClass = 'text-slate-900 dark:text-white';
      dot = <span className="h-2 w-2 rounded-full bg-amber-500" />;
      break;
    case 'WAITING':
      title = 'Waiting';
      colorClass = 'text-slate-900 dark:text-white';
      dot = <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-600" />;
      break;
    case 'COMPLETED':
      title = 'Completed';
      colorClass = 'text-slate-900 dark:text-white';
      dot = <span className="h-2 w-2 rounded-full bg-emerald-500" />;
      break;
  }

  return (
    <div className="flex items-center justify-between py-2 text-slate-900 dark:text-white">
      <div className="flex items-center gap-2">
        {dot}
        <h3 className={`text-sm font-bold tracking-tight ${colorClass}`}>
          {title}
        </h3>
        <span className="text-xs text-slate-300 dark:text-slate-700 font-bold">•</span>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {count} {count === 1 ? 'bout' : 'bouts'}
        </span>
      </div>
    </div>
  );
}
