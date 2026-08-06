import { LiveEventSummary } from './LiveEventSummary';

interface StatusBannerProps {
  eventName: string;
  eventLocation: string;
  eventStartDate: string;
  eventEndDate: string;
  liveCount: number;
  upNextCount?: number;
  waitingCount: number;
  completedCount: number;
  goldCount: number;
  silverCount: number;
  bronzeCount: number;
  isFirebaseConnected: boolean;
  onOpenStandings: () => void;
  onOpenEventInfo: () => void;
  currentFilter: 'ALL' | 'LIVE' | 'UP_NEXT' | 'WAITING' | 'COMPLETED';
  onSelectFilter: (filter: 'ALL' | 'LIVE' | 'UP_NEXT' | 'WAITING' | 'COMPLETED') => void;
  onSyncNow?: () => void;
}

export function StatusBanner({
  eventName,
  eventLocation,
  eventStartDate,
  eventEndDate,
  liveCount,
  upNextCount = 0,
  waitingCount,
  completedCount,
  goldCount,
  silverCount,
  bronzeCount,
  isFirebaseConnected,
  onOpenStandings,
  onOpenEventInfo,
  currentFilter,
  onSelectFilter,
  onSyncNow,
}: StatusBannerProps) {
  const totalBouts = liveCount + waitingCount + completedCount + upNextCount;
  const displayEventName = eventName?.trim() || 'Kejohanan Muaythai Sukan Tempur Kebangsaan 2026';
  const displayLocation = eventLocation?.trim() || 'Arena Axiata, Bukit Jalil';

  return (
    <div className="mb-3 space-y-2.5">
      {/* 1. Compact Event Status Card / Summary */}
      <LiveEventSummary
        eventName={displayEventName}
        eventLocation={displayLocation}
        liveCount={liveCount}
        waitingCount={waitingCount}
        upNextCount={upNextCount}
        completedCount={completedCount}
        isFirebaseConnected={isFirebaseConnected}
        onOpenStandings={onOpenStandings}
        onOpenEventInfo={onOpenEventInfo}
        onSyncNow={onSyncNow}
      />

      {/* 2. Compact Single-Line Segmented Status Filter Bar */}
      {totalBouts > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-5 gap-1 rounded-xl bg-slate-100/70 p-1 dark:bg-slate-800/60">
            {/* ALL */}
            <button
              type="button"
              onClick={() => onSelectFilter('ALL')}
              className={`flex items-center justify-center gap-1 rounded-lg h-10 transition touch-manipulation min-w-[44px] ${
                currentFilter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <span className="text-[11px] font-bold">All</span>
              <span className="text-[10px] opacity-75">({totalBouts})</span>
            </button>

            {/* LIVE */}
            <button
              type="button"
              onClick={() => onSelectFilter('LIVE')}
              className={`flex items-center justify-center gap-1 rounded-lg h-10 transition touch-manipulation min-w-[44px] ${
                currentFilter === 'LIVE'
                  ? 'bg-red-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 font-medium hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-1">
                {liveCount > 0 && <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />}
                <span className="text-[11px] font-bold">Live</span>
              </div>
              <span className="text-[10px] opacity-75">({liveCount})</span>
            </button>

            {/* UP NEXT */}
            <button
              type="button"
              onClick={() => onSelectFilter('UP_NEXT')}
              className={`flex items-center justify-center gap-1 rounded-lg h-10 transition touch-manipulation min-w-[44px] ${
                currentFilter === 'UP_NEXT'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <span className="text-[11px] font-bold">Next</span>
              <span className="text-[10px] opacity-75">({upNextCount})</span>
            </button>

            {/* WAITING */}
            <button
              type="button"
              onClick={() => onSelectFilter('WAITING')}
              className={`flex items-center justify-center gap-1 rounded-lg h-10 transition touch-manipulation min-w-[44px] ${
                currentFilter === 'WAITING'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <span className="text-[11px] font-bold">Wait</span>
              <span className="text-[10px] opacity-75">({waitingCount})</span>
            </button>

            {/* DONE */}
            <button
              type="button"
              onClick={() => onSelectFilter('COMPLETED')}
              className={`flex items-center justify-center gap-1 rounded-lg h-10 transition touch-manipulation min-w-[44px] ${
                currentFilter === 'COMPLETED'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <span className="text-[11px] font-bold">Done</span>
              <span className="text-[10px] opacity-75">({completedCount})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
