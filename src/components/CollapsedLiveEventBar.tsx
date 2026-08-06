import { Info, Radio, Trophy } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface CollapsedLiveEventBarProps {
  isVisible: boolean;
  liveCount: number;
  location: string;
  onOpenStandings: () => void;
  onOpenEventInfo: () => void;
  onScrollToTop: () => void;
}

export function CollapsedLiveEventBar({
  isVisible,
  liveCount,
  location,
  onOpenStandings,
  onOpenEventInfo,
  onScrollToTop,
}: CollapsedLiveEventBarProps) {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="sticky top-[64px] z-40 mb-3 flex h-12 w-full items-center justify-between gap-2 border-b border-red-200/80 bg-white/95 px-3 shadow-xs backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 sm:px-4"
      >
        {/* Left Side: Live indicator + Event status */}
        <button
          type="button"
          onClick={onScrollToTop}
          className="flex items-center gap-2 text-left hover:opacity-80 transition min-w-0"
          aria-label="Scroll to top of fight card"
        >
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative h-2.5 w-2.5 rounded-full bg-red-600" />
          </span>
          <span className="truncate text-xs font-black uppercase text-slate-900 dark:text-white">
            Live · {liveCount} {liveCount === 1 ? 'bout' : 'bouts'}
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
          <span className="hidden sm:inline truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
            {location || 'Arena Axiata'}
          </span>
        </button>

        {/* Right Side: Quick Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onOpenStandings}
            aria-label="Tournament standings"
            title="Tournament standings"
            className="flex h-8 items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 text-[11px] font-extrabold text-amber-950 shadow-xs transition hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
          >
            <Trophy className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="hidden xs:inline">Standings</span>
          </button>

          <button
            type="button"
            onClick={onOpenEventInfo}
            aria-label="Event information"
            title="Event information"
            className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 px-2.5 text-[11px] font-bold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Info className="h-3 w-3 text-slate-500 dark:text-slate-400 shrink-0" />
            <span className="hidden xs:inline">Info</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
