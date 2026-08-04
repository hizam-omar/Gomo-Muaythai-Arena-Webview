import { useEffect, useState } from 'react';
import { CalendarDays, ChevronDown, MapPin, Trophy } from 'lucide-react';

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

function MetricBox({ value, label, className, onClick, selected = false }: MetricBoxProps) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className={`font-combat min-h-11 rounded-lg border px-1.5 py-2 text-center transition hover:-translate-y-0.5 hover:shadow-md sm:px-2 ${className} ${selected ? 'ring-2 ring-red-500 ring-offset-1 dark:ring-offset-slate-900 sm:ring-offset-2' : ''}`}
      >
        <p className="text-base font-black leading-none">{value}</p>
        <p className="mt-1 truncate text-[8px] font-extrabold uppercase tracking-wide">{label}</p>
      </button>
    );
  }
  return (
    <div className={`font-combat min-h-11 rounded-lg border px-1.5 py-2 text-center sm:px-2 ${className}`}>
      <p className="text-base font-black leading-none">{value}</p>
      <p className="mt-1 truncate text-[8px] font-extrabold uppercase tracking-wide">{label}</p>
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
  selectedMedal,
  onSelectMedal,
}: StatusBannerProps) {
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const hasBouts = liveCount + waitingCount + completedCount > 0;

  useEffect(() => {
    if (!hasBouts) setSummaryExpanded(false);
  }, [hasBouts]);

  return (
    <section className="mb-3 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:mb-4 sm:p-3">
      <div className="mb-3 flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            {liveCount > 0 && <span className="absolute h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />}
            <span className={`relative h-2.5 w-2.5 rounded-full ${liveCount > 0 ? 'bg-red-600' : 'bg-slate-400'}`} />
          </span>
          <div className="min-w-0">
            <h2 className="font-combat text-sm font-black uppercase leading-tight text-slate-900 dark:text-white sm:text-base">
              Fight Event &amp; Live Bouts{eventName && <span className="text-red-600 dark:text-red-400"> :: {eventName}</span>}
            </h2>
            {eventName && (eventLocation || eventStartDate || eventEndDate) && (
              <div className="mt-1.5 flex flex-col gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 sm:flex-row sm:flex-wrap sm:gap-x-3 sm:text-xs">
                {eventLocation && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3 text-red-600" /> {eventLocation}</span>}
                {(eventStartDate || eventEndDate) && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3 w-3 text-red-600" />
                    {eventStartDate && eventEndDate ? `${eventStartDate} – ${eventEndDate}` : eventStartDate || eventEndDate}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-between gap-1.5 sm:justify-end">
          <span className={`rounded-full px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide ${
            isFirebaseConnected ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
          }`}>
            {isFirebaseConnected ? 'Live Sync' : 'WebView Feed'}
          </span>
          {hasBouts && (
            <div className="group relative">
              <button
                type="button"
                onClick={onOpenStandings}
                aria-label="Open tournament standings"
                title="Tournament Standings"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-amber-400 transition hover:bg-red-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              >
                <Trophy className="h-3.5 w-3.5" />
              </button>
              <span role="tooltip" className="pointer-events-none absolute right-0 top-full z-20 mt-1.5 whitespace-nowrap rounded-md bg-slate-950 px-2 py-1 text-[9px] font-bold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                Tournament Standings
              </span>
            </div>
          )}
        </div>
      </div>

      {hasBouts && (
        <button
          type="button"
          onClick={() => setSummaryExpanded((expanded) => !expanded)}
          aria-expanded={summaryExpanded}
          className="font-combat flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <span>Bout Summary</span>
          <span className="flex items-center gap-2">
            <span className="normal-case tracking-normal text-slate-400">{liveCount} live · {waitingCount} waiting · {completedCount} done</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${summaryExpanded ? 'rotate-180' : ''}`} />
          </span>
        </button>
      )}

      {hasBouts && summaryExpanded && (
        <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
          <MetricBox value={liveCount} label="Live" className="border-red-200 bg-red-50 text-red-700" />
          <MetricBox value={waitingCount} label="Waiting" className="border-slate-200 bg-slate-50 text-slate-700" />
          <MetricBox value={completedCount} label="Completed" className="border-emerald-200 bg-emerald-50 text-emerald-700" />
          <MetricBox value={goldCount} label="🥇 Gold" className="border-amber-300 bg-amber-50 text-amber-700" selected={selectedMedal === 'GOLD'} onClick={() => onSelectMedal('GOLD')} />
          <MetricBox value={silverCount} label="🥈 Silver" className="border-slate-300 bg-slate-100 text-slate-600" selected={selectedMedal === 'SILVER'} onClick={() => onSelectMedal('SILVER')} />
          <MetricBox value={bronzeCount} label="🥉 Bronze" className="border-orange-300 bg-orange-50 text-orange-700" selected={selectedMedal === 'BRONZE'} onClick={() => onSelectMedal('BRONZE')} />
        </div>
      )}
    </section>
  );
}
