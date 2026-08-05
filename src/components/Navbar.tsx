import logo from '../assets/images/gomo_logo_1785735883874.jpg';
import { Moon, ShieldCheck, Sun } from 'lucide-react';
import { useState } from 'react';
import { AdminLoginModal } from './AdminLoginModal';
import { isAdminAuthenticated } from '../lib/admin';

interface NavbarProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function Navbar({ theme, onToggleTheme }: NavbarProps) {
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const openAdmin = () => {
    if (isAdminAuthenticated()) window.location.assign('/fighters');
    else setShowAdminLogin(true);
  };

  return (
    <><header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-4xl items-center px-2.5 py-1.5 sm:px-4 sm:py-3">
        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg sm:h-10 sm:w-10 sm:rounded-xl">
          <img src={logo} alt="GOMO Logo" className="h-full w-full object-cover" />
        </div>
        <div className="ml-2 min-w-0 flex-1 sm:ml-3">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <h1 className="font-combat text-xs font-black uppercase leading-tight tracking-wide text-slate-900 dark:text-white sm:text-lg">GOMO Muaythai Arena</h1>
          </div>
          <p className="hidden truncate text-[11px] text-slate-500 dark:text-slate-400 sm:block">Official Public Live Fighters &amp; Bouts</p>
        </div>
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-300 dark:hover:bg-slate-700 sm:h-9 sm:w-9 sm:rounded-xl"
        >
          {theme === 'light' ? <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
        </button>
        <button type="button" data-testid="arena-admin-button" onClick={openAdmin} aria-label="Open fighter administration" title="Fighter administration" className="ml-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm transition hover:bg-red-700 sm:h-9 sm:w-9 sm:rounded-xl"><ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></button>
      </div>
    </header>{showAdminLogin && <AdminLoginModal onDismiss={() => setShowAdminLogin(false)} onSuccess={() => window.location.assign('/fighters')} />}</>
  );
}
