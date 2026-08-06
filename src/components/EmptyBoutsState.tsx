import { useEffect, useState } from 'react';

interface EmptyBoutsStateProps {
  activeEventName?: string;
  filter?: 'ALL' | 'LIVE' | 'WAITING' | 'COMPLETED';
  fighterSearch?: string;
  medalFilter?: 'GOLD' | 'SILVER' | 'BRONZE' | null;
}

function BoxingGloveIcon({ className = 'h-7 w-7 text-red-600 dark:text-red-400' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 11V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v5c0 3.3 2.7 6 6 6s6-2.7 6-6z" />
      <path d="M6 10H4a2 2 0 0 0-2 2v2a3 3 0 0 0 3 3h1" />
      <path d="M9 17v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4" />
      <line x1="9" y1="19" x2="15" y2="19" />
    </svg>
  );
}

export function EmptyBoutsState({
  activeEventName,
  filter = 'ALL',
  fighterSearch = '',
  medalFilter = null,
}: EmptyBoutsStateProps) {
  const [syncTime, setSyncTime] = useState<string>('');

  useEffect(() => {
    const formatTime = () => {
      const now = new Date();
      return now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };
    setSyncTime(formatTime());
    const interval = setInterval(() => {
      setSyncTime(formatTime());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  let heading = 'No bouts scheduled yet';
  let supportingText = 'Fight matchups will appear here automatically when they are published in the GOMO app.';

  if (fighterSearch.trim()) {
    heading = `No fighter found for “${fighterSearch.trim()}”`;
    supportingText = 'Try searching with another fighter or opponent name.';
  } else if (medalFilter) {
    heading = `No ${medalFilter.toLowerCase()} medal winners yet`;
    supportingText = 'Bouts awarded with this medal will appear here automatically.';
  } else if (filter !== 'ALL') {
    heading = `No ${filter.toLowerCase()} bouts scheduled yet`;
    supportingText = 'Fight matchups will appear here automatically when status changes in the GOMO app.';
  } else if (!activeEventName) {
    heading = 'No active event';
    supportingText = 'Bouts and tournament standings will appear when an event status changes to Active.';
  }

  return (
    <div className="rounded-[18px] border border-slate-200/80 bg-white p-6 sm:p-8 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
        <BoxingGloveIcon />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
        {heading}
      </h3>
      <p className="max-w-md mx-auto text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
        {supportingText}
      </p>
      {syncTime && (
        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
          Last synced: {syncTime}
        </p>
      )}
    </div>
  );
}
