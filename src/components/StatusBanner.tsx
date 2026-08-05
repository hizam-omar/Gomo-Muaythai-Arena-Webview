import { useEffect, useState } from 'react';
import { CalendarDays, ChevronDown, Clock3, MapPin, Medal, Trophy } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface StatusBannerProps {
  eventName: string;
  eventLocation: string;
  eventStartDate: string;
  eventEndDate: string;
  liveCount: number;
  waitingCount: number;
  completedCount: number;
  goldCount: number;
  silverCount: number;
  bronzeCount: number;
  isFirebaseConnected: boolean;
  onOpenStandings: () => void;
  currentFilter: 'ALL' | 'LIVE' | 'WAITING' | 'COMPLETED';
  onSelectFilter: (filter: 'ALL' | 'LIVE' | 'WAITING' | 'COMPLETED') => void;
  selectedMedal: 'GOLD' | 'SILVER' | 'BRONZE' | null;
  onSelectMedal: (medal: 'GOLD' | 'SILVER' | 'BRONZE') => void;
}

interface MetricBoxProps {
  value: number;
  label: string;
  className: string;
  onClick?: () => void;
  selected?: boolean;
}

function parseStartDate(dateStr?: string): Date | null {
  if (!dateStr || !dateStr.trim()) return null;
  const str = dateStr.trim();

  if (/^\d+$/.test(str)) {
    const num = Number(str);
    const ms = str.length === 10 ? num * 1000 : num;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  let normalized = str;
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}/.test(normalized)) {
    normalized = normalized.replace(' ', 'T');
  }

  const d = new Date(normalized);
  if (!isNaN(d.getTime())) return d;

  return null;
}

function EventCountdownTimer({ eventStartDate }: { eventStartDate?: string }) {
  const [now, setNow] = useState<number>(() => Date.now());

  const parsedDate = parseStartDate(eventStartDate);

  useEffect(() => {
    if (!parsedDate) return;
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [eventStartDate]);

  if (!eventStartDate || !eventStartDate.trim()) return null;

  if (!parsedDate) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-1.5 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-200">
        <div className="flex min-w-0 items-center gap-1.5 text-xs font-semibold">
          <Clock3 className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="truncate">Est. Start: <span className="font-bold">{eventStartDate}</span></span>
        </div>
        <div className="font-combat shrink-0 rounded-md bg-amber-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white dark:bg-amber-700">
          Scheduled
        </div>
      </div>
    );
  }

  const diff = parsedDate.getTime() - now;
  const isPast = diff <= 0;

  const absDiff = Math.abs(diff);
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((absDiff % (1000 * 60)) / 1000);

  const formattedTimeStr = parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDateStr = parsedDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  const fullFormattedDate = parsedDate.getHours() === 0 && parsedDate.getMinutes() === 0
    ? formattedDateStr
    : `${formattedTimeStr} (${formattedDateStr})`;

  let countdownStr = '';
  if (isPast) {
    countdownStr = 'Event In Progress';
  } else {
    const parts: string[] = [];
    if (days > 0) parts.push(`${days}D`);
    parts.push(`${String(hours).padStart(2, '0')}H`);
    parts.push(`${String(minutes).padStart(2, '0')}M`);
    parts.push(`${String(seconds).padStart(2, '0')}S`);
    countdownStr = `IN ${parts.join(' ')}`;
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-1.5 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-200">
      <div className="flex min-w-0 items-center gap-1.5 text-xs font-semibold">
        <Clock3 className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400 animate-pulse" />
        <span className="truncate">Est. Start: <span className="font-bold">{fullFormattedDate}</span></span>
      </div>
      <div className="font-combat shrink-0 rounded-md bg-amber-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white dark:bg-amber-700">
        {countdownStr}
      </div>
    </div>
  );
}

function MetricBox({ value, label, className, onClick, selected = false }: MetricBoxProps) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className={`font-combat flex min-h-8 flex-col items-center justify-center rounded-lg border px-1 py-1 text-center transition hover:-translate-y-0.5 hover:shadow-md sm:min-h-11 sm:px-2 sm:py-2 ${className} ${selected ? 'ring-2 ring-red-500 ring-offset-1 dark:ring-offset-slate-900 sm:ring-offset-2' : ''}`}
      >
        <p className="text-xs font-black leading-none sm:text-base">{value}</p>
        <p className="mt-0.5 truncate text-[8px] font-extrabold uppercase tracking-wide">{label}</p>
      </button>
    );
  }
  return (
    <div className={`font-combat flex min-h-8 flex-col items-center justify-center rounded-lg border px-1 py-1 text-center sm:min-h-11 sm:px-2 sm:py-2 ${className}`}>
      <p className="text-xs font-black leading-none sm:text-base">{value}</p>
      <p className="mt-0.5 truncate text-[8px] font-extrabold uppercase tracking-wide">{label}</p>
    </div>
  );
}

export function StatusBanner({
  eventName,
  eventLocation,
  eventStartDate,
  eventEndDate,
  liveCount,
  waitingCount,
  completedCount,
  goldCount,
  silverCount,
  bronzeCount,
  isFirebaseConnected,
  onOpenStandings,
  currentFilter,
  onSelectFilter,
  selectedMedal,
  onSelectMedal,
}: StatusBannerProps) {
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const totalBouts = liveCount + waitingCount + completedCount;
  const hasBouts = totalBouts > 0;

  useEffect(() => {
    if (!hasBouts) setSummaryExpanded(false);
  }, [hasBouts]);

  return (
    <section className="mb-2.5 rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:mb-4 sm:p-3.5">
      {/* Top Bar: Live Status Dot, Category, Live Sync Badge & Standings Button */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="relative flex h-2 w-2 shrink-0">
              {liveCount > 0 && <span className="absolute h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />}
              <span className={`relative h-2 w-2 rounded-full ${liveCount > 0 ? 'bg-red-600' : 'bg-slate-400'}`} />
            </span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Fight Event
            </span>
            <span className={`rounded-full px-1.5 py-0.2 text-[8px] font-extrabold uppercase tracking-wide ${
              isFirebaseConnected ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {isFirebaseConnected ? 'Live Sync' : 'WebView Feed'}
            </span>
          </div>

          <h2 className="font-combat text-xs font-black uppercase leading-snug text-slate-900 dark:text-white sm:text-base">
            {eventName ? (
              <>
                Fight Card &amp; Live Bouts <span className="text-red-600 dark:text-red-400">:: {eventName}</span>
              </>
            ) : (
              'Fight Card & Live Bouts'
            )}
          </h2>

          {/* Location & Date directly displayed */}
          {eventName && (eventLocation || eventStartDate || eventEndDate) && (
            <div className="mt-1 flex flex-row flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 sm:text-xs">
              {eventLocation && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0 text-red-600" /> {eventLocation}
                </span>
              )}
              {(eventStartDate || eventEndDate) && (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3 w-3 shrink-0 text-red-600" />
                  {eventStartDate && eventEndDate ? `${eventStartDate} – ${eventEndDate}` : eventStartDate || eventEndDate}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Standings Trophy Button */}
        {hasBouts && (
          <button
            type="button"
            onClick={onOpenStandings}
            aria-label="Open tournament standings"
            title="Tournament Standings"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-amber-400 shadow-xs transition hover:bg-red-700 hover:text-white dark:bg-slate-800 dark:hover:bg-red-700"
          >
            <Trophy className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Show countdown timer ONLY if no bouts exist for the event */}
      {!hasBouts && (
        <div className="mt-2.5">
          <EventCountdownTimer eventStartDate={eventStartDate} />
        </div>
      )}

      {/* Segmented Filter Control */}
      {hasBouts && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="font-combat text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Bout Summary ({totalBouts})
            </span>
            {(goldCount > 0 || silverCount > 0 || bronzeCount > 0) && (
              <button
                type="button"
                onClick={() => setSummaryExpanded((exp) => !exp)}
                aria-expanded={summaryExpanded}
                aria-label="Toggle Medal Filters"
                title="Toggle Medal Filters"
                className="flex items-center gap-0.5 rounded-md p-0.5 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
              >
                <Medal className="h-3.5 w-3.5 text-amber-500" />
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${summaryExpanded ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 gap-1 rounded-lg bg-slate-100/90 p-1 dark:bg-slate-800/90">
            <button
              type="button"
              onClick={() => onSelectFilter('ALL')}
              className={`font-combat flex flex-col items-center justify-center rounded-md py-1 transition ${
                currentFilter === 'ALL' && !selectedMedal
                  ? 'bg-red-600 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-bold'
              }`}
            >
              <span className="text-[10px] sm:text-xs">ALL</span>
              <span className="text-[8px] opacity-80">{totalBouts}</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectFilter('LIVE')}
              className={`font-combat flex flex-col items-center justify-center rounded-md py-1 transition ${
                currentFilter === 'LIVE'
                  ? 'bg-red-600 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-bold'
              }`}
            >
              <span className="text-[10px] sm:text-xs">LIVE</span>
              <span className="text-[8px] opacity-80">{liveCount}</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectFilter('WAITING')}
              className={`font-combat flex flex-col items-center justify-center rounded-md py-1 transition ${
                currentFilter === 'WAITING'
                  ? 'bg-red-600 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-bold'
              }`}
            >
              <span className="text-[10px] sm:text-xs">WAIT</span>
              <span className="text-[8px] opacity-80">{waitingCount}</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectFilter('COMPLETED')}
              className={`font-combat flex flex-col items-center justify-center rounded-md py-1 transition ${
                currentFilter === 'COMPLETED' && !selectedMedal
                  ? 'bg-red-600 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-bold'
              }`}
            >
              <span className="text-[10px] sm:text-xs">DONE</span>
              <span className="text-[8px] opacity-80">{completedCount}</span>
            </button>
          </div>

          <AnimatePresence initial={false}>
            {summaryExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="mt-2 overflow-hidden"
              >
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <MetricBox value={goldCount} label="🥇 Gold" className="border-amber-300 bg-amber-50/80 text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300" selected={selectedMedal === 'GOLD'} onClick={() => onSelectMedal('GOLD')} />
                  <MetricBox value={silverCount} label="🥈 Silver" className="border-slate-300 bg-slate-100/80 text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300" selected={selectedMedal === 'SILVER'} onClick={() => onSelectMedal('SILVER')} />
                  <MetricBox value={bronzeCount} label="🥉 Bronze" className="border-orange-300 bg-orange-50/80 text-orange-700 dark:border-orange-800 dark:bg-orange-950/60 dark:text-orange-300" selected={selectedMedal === 'BRONZE'} onClick={() => onSelectMedal('BRONZE')} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
