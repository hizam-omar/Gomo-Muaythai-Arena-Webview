import { useEffect, useState } from 'react';
import { KeyRound, ShieldCheck, X } from 'lucide-react';
import { ADMIN_PASSWORD, startAdminSession } from '../lib/admin';

export function AdminLoginModal({ onDismiss, onSuccess }: { onDismiss: () => void; onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === 'Escape' && onDismiss();
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [onDismiss]);

  const login = () => {
    if (password !== ADMIN_PASSWORD) {
      setError('Incorrect admin password.');
      return;
    }
    startAdminSession();
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-[150] grid place-items-center bg-slate-950/75 p-4" role="dialog" aria-modal="true" aria-labelledby="admin-login-title" onClick={onDismiss}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between"><div className="grid h-11 w-11 place-items-center rounded-xl bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"><ShieldCheck className="h-5 w-5" /></div><button type="button" onClick={onDismiss} aria-label="Close admin login" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button></div>
        <h2 id="admin-login-title" className="mt-4 text-xl font-black text-slate-900 dark:text-white">GOMO Admin Login</h2>
        <p className="mt-1 text-sm text-slate-500">Enter the club administrator password to manage fighters.</p>
        <label className="mt-4 block text-[11px] font-black uppercase tracking-wide text-slate-500" htmlFor="admin-password">Admin password</label>
        <div className="relative mt-1"><KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input id="admin-password" data-testid="admin-password-input" autoFocus type="password" value={password} onChange={(event) => { setPassword(event.target.value); setError(''); }} onKeyDown={(event) => event.key === 'Enter' && login()} className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm font-bold outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-red-950" /></div>
        {error && <p role="alert" className="mt-2 text-xs font-bold text-red-600">{error}</p>}
        <button type="button" data-testid="admin-login-button" onClick={login} className="mt-4 w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white hover:bg-red-700">Login to fighter roster</button>
      </div>
    </div>
  );
}
