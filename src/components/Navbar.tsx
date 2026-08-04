import logo from '../assets/images/gomo_logo_1785735883874.jpg';

interface NavbarProps {
  isFirebaseConnected: boolean;
}

export function Navbar({ isFirebaseConnected }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-md">
      <div className="mx-auto flex max-w-4xl items-center px-4 py-3">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl shadow-md">
          <img src={logo} alt="GOMO Logo" className="h-full w-full object-cover" />
        </div>
        <div className="ml-3 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-base font-bold text-slate-900">GOMO Muaythai Arena</h1>
            <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
              isFirebaseConnected
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : 'border-red-300 bg-red-50 text-red-700'
            }`}>
              {isFirebaseConnected ? 'Firebase Live' : 'Spectator Feed'}
            </span>
          </div>
          <p className="truncate text-[11px] text-slate-500">Official Public Live Fighters &amp; Bouts</p>
        </div>
      </div>
    </header>
  );
}
