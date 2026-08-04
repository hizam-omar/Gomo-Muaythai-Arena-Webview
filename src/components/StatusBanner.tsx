interface StatusBannerProps {
  liveCount: number;
  waitingCount: number;
  completedCount: number;
  isFirebaseConnected: boolean;
}

export function StatusBanner({ liveCount, waitingCount, completedCount, isFirebaseConnected }: StatusBannerProps) {
  return (
    <section className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className={`relative flex h-3 w-3 ${liveCount > 0 ? '' : 'opacity-60'}`}>
            {liveCount > 0 && <span className="absolute h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />}
            <span className={`relative h-3 w-3 rounded-full ${liveCount > 0 ? 'bg-red-600' : 'bg-slate-400'}`} />
          </span>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">Fight Event &amp; Live Bouts</h2>
            <p className="text-xs text-slate-500">
              {isFirebaseConnected ? 'Real-time fighter status from GOMO Muaythai.' : 'Spectator feed using the available WebView data.'}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-red-50 px-3 py-2 text-center ring-1 ring-red-100">
            <p className="text-lg font-black leading-none text-red-600">{liveCount}</p>
            <p className="mt-1 text-[9px] font-extrabold uppercase tracking-wider text-red-700">Live</p>
          </div>
          <div className="rounded-lg bg-slate-100 px-3 py-2 text-center ring-1 ring-slate-200">
            <p className="text-lg font-black leading-none text-slate-700">{waitingCount}</p>
            <p className="mt-1 text-[9px] font-extrabold uppercase tracking-wider text-slate-600">Waiting</p>
          </div>
          <div className="rounded-lg bg-emerald-50 px-3 py-2 text-center ring-1 ring-emerald-100">
            <p className="text-lg font-black leading-none text-emerald-700">{completedCount}</p>
            <p className="mt-1 text-[9px] font-extrabold uppercase tracking-wider text-emerald-700">Completed</p>
          </div>
        </div>
      </div>
    </section>
  );
}
