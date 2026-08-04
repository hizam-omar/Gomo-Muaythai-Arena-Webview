import logo from '../assets/images/gomo_logo_1785735883874.jpg';
import { Moon, Sun } from 'lucide-react';

interface NavbarProps {
  isFirebaseConnected: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function Navbar({ isFirebaseConnected, theme, onToggleTheme }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-4xl items-center px-4 py-3">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl shadow-md">
          <img src={logo} alt="GOMO Logo" className="h-full w-full object-cover" />
        </div>
        <div className="ml-3 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-combat text-lg font-black uppercase tracking-wide text-slate-900 dark:text-white">GOMO Muaythai Arena</h1>
            <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
              isFirebaseConnected
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : 'border-red-300 bg-red-50 text-red-700'
            }`}>
              {isFirebaseConnected ? 'Firebase Live' : 'Spectator Feed'}
            </span>
          </div>
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">Official Public Live Fighters &amp; Bouts</p>
        </div>
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-300 dark:hover:bg-slate-700"
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}
