import { Info, Trophy, Activity, RefreshCw } from 'lucide-react';

interface LiveEventSummaryProps {
  eventName: string;
  eventLocation: string;
  liveCount: number;
  waitingCount: number;
  upNextCount: number;
  completedCount: number;
  isFirebaseConnected: boolean;
  onOpenStandings: () => void;
  onOpenEventInfo: () => void;
  onSyncNow?: () => void;
}

export function LiveEventSummary({
  eventName,
  eventLocation,
  liveCount,
  waitingCount,
  upNextCount,
  completedCount,
  isFirebaseConnected,
  onOpenStandings,
  onOpenEventInfo,
  onSyncNow,
}: LiveEventSummaryProps) {
  const displayEventName = eventName?.trim() || 'Kejohanan Muaythai Sukan Tempur Kebangsaan 2026';
  const hasLive = liveCount > 0;

  // Subtitle text according to rules
  let subText = `Event active · ${completedCount} completed bouts`;
  if (hasLive) {
    subText = `${liveCount} ${liveCount === 1 ? 'bout' : 'bouts'} active · ${upNextCount} up next`;
  } else if (upNextCount > 0) {
    subText = 'Next bout is preparing';
  } else {
    subText = 'View completed results below';
  }

  const syncText = isFirebaseConnected ? 'Auto-sync on · Updated just now' : 'Offline · Showing last synced results';

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 transition-all">
      <div className="flex items-start justify-between gap-3">
        {/* Left side: Status & Event Name */}
        <div className="min-w-0 flex-grow">
          {hasLive && (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full shrink-0 bg-red-500 animate-pulse" />
              <h2 className="text-[11px] font-medium text-slate-700 dark:text-slate-300 tracking-normal">
                Event Live
              </h2>
            </div>
          )}

          <h1 className="mt-1 text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
            {displayEventName}
          </h1>

          <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {subText}
          </p>

          {/* Sync status secondary line */}
          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500">
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isFirebaseConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span>{syncText}</span>
            {onSyncNow && (
              <button
                type="button"
                onClick={onSyncNow}
                className="ml-1 inline-flex items-center gap-0.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold transition underline"
              >
                Sync now
              </button>
            )}
          </div>
        </div>

        {/* Right side: Standings & Event Info Buttons (40-44px) */}
        <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
          <button
            type="button"
            onClick={onOpenStandings}
            aria-label="Open tournament standings"
            className="flex h-10 px-3 items-center gap-1.5 rounded-xl border border-amber-200/80 bg-amber-50 text-amber-800 transition hover:bg-amber-100 active:scale-95 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300 touch-manipulation text-xs font-bold shadow-3xs"
          >
            <Trophy className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">Standings</span>
          </button>

          <button
            type="button"
            onClick={onOpenEventInfo}
            aria-label="View event details"
            className="flex h-10 px-3 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 active:scale-95 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 touch-manipulation text-xs font-bold shadow-3xs"
          >
            <Info className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Event Info</span>
          </button>
        </div>
      </div>
    </section>
  );
}
