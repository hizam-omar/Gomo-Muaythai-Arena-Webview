import { Trophy } from 'lucide-react';

interface StatusBannerProps {
  eventName: string;
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
        className={`font-combat rounded-lg border px-2 py-2 text-center transition hover:-translate-y-0.5 hover:shadow-md ${className} ${selected ? 'ring-2 ring-red-500 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
      >
        <p className="text-base font-black leading-none">{value}</p>
        <p className="mt-1 truncate text-[8px] font-extrabold uppercase tracking-wide">{label}</p>
      </button>
    );
  }
  return (
    <div className={`font-combat rounded-lg border px-2 py-2 text-center ${className}`}>
      <p className="text-base font-black leading-none">{value}</p>
      <p className="mt-1 truncate text-[8px] font-extrabold uppercase tracking-wide">{label}</p>
    </div>
  );
}

export function StatusBanner({
  eventName,
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
  return (
    <section className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            {liveCount > 0 && <span className="absolute h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />}
            <span className={`relative h-2.5 w-2.5 rounded-full ${liveCount > 0 ? 'bg-red-600' : 'bg-slate-400'}`} />
          </span>
          <h2 className="font-combat text-sm font-black uppercase leading-tight text-slate-900 dark:text-white sm:text-base">
            Fight Event &amp; Live Bouts{eventName && <span className="text-red-600 dark:text-red-400"> :: {eventName}</span>}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className={`hidden rounded-full px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide sm:inline ${
            isFirebaseConnected ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
          }`}>
            {isFirebaseConnected ? 'Live Sync' : 'WebView Feed'}
          </span>
          <button
            type="button"
            onClick={onOpenStandings}
            disabled={!eventName}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-wide text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
          >
            <Trophy className="h-3.5 w-3.5 text-amber-400" /> Standings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
        <MetricBox value={liveCount} label="Live" className="border-red-200 bg-red-50 text-red-700" />
        <MetricBox value={waitingCount} label="Waiting" className="border-slate-200 bg-slate-50 text-slate-700" />
        <MetricBox value={completedCount} label="Completed" className="border-emerald-200 bg-emerald-50 text-emerald-700" />
        <MetricBox value={goldCount} label="🥇 Gold" className="border-amber-300 bg-amber-50 text-amber-700" selected={selectedMedal === 'GOLD'} onClick={() => onSelectMedal('GOLD')} />
        <MetricBox value={silverCount} label="🥈 Silver" className="border-slate-300 bg-slate-100 text-slate-600" selected={selectedMedal === 'SILVER'} onClick={() => onSelectMedal('SILVER')} />
        <MetricBox value={bronzeCount} label="🥉 Bronze" className="border-orange-300 bg-orange-50 text-orange-700" selected={selectedMedal === 'BRONZE'} onClick={() => onSelectMedal('BRONZE')} />
      </div>
    </section>
  );
}
