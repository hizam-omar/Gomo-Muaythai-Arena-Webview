import { Trophy } from 'lucide-react';

interface StatusBannerProps {
  liveCount: number;
  waitingCount: number;
  completedCount: number;
  goldCount: number;
  silverCount: number;
  bronzeCount: number;
  isFirebaseConnected: boolean;
  onOpenStandings: () => void;
}

interface MetricBoxProps {
  value: number;
  label: string;
  className: string;
}

function MetricBox({ value, label, className }: MetricBoxProps) {
  return (
    <div className={`rounded-lg border px-2 py-2 text-center ${className}`}>
      <p className="text-base font-black leading-none">{value}</p>
      <p className="mt-1 truncate text-[8px] font-extrabold uppercase tracking-wide">{label}</p>
    </div>
  );
}

export function StatusBanner({
  liveCount,
  waitingCount,
  completedCount,
  goldCount,
  silverCount,
  bronzeCount,
  isFirebaseConnected,
  onOpenStandings,
}: StatusBannerProps) {
  return (
    <section className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            {liveCount > 0 && <span className="absolute h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />}
            <span className={`relative h-2.5 w-2.5 rounded-full ${liveCount > 0 ? 'bg-red-600' : 'bg-slate-400'}`} />
          </span>
          <h2 className="truncate text-sm font-extrabold text-slate-900">Fight Event &amp; Live Bouts</h2>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className={`hidden rounded-full px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide sm:inline ${
            isFirebaseConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {isFirebaseConnected ? 'Live Sync' : 'WebView Feed'}
          </span>
          <button type="button" onClick={onOpenStandings} className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-wide text-white hover:bg-red-700">
            <Trophy className="h-3.5 w-3.5 text-amber-400" /> Standings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
        <MetricBox value={liveCount} label="Live" className="border-red-200 bg-red-50 text-red-700" />
        <MetricBox value={waitingCount} label="Waiting" className="border-slate-200 bg-slate-50 text-slate-700" />
        <MetricBox value={completedCount} label="Completed" className="border-emerald-200 bg-emerald-50 text-emerald-700" />
        <MetricBox value={goldCount} label="🥇 Gold" className="border-amber-300 bg-amber-50 text-amber-700" />
        <MetricBox value={silverCount} label="🥈 Silver" className="border-slate-300 bg-slate-100 text-slate-600" />
        <MetricBox value={bronzeCount} label="🥉 Bronze" className="border-orange-300 bg-orange-50 text-orange-700" />
      </div>
    </section>
  );
}
