import { User, Swords } from 'lucide-react';

interface ProfileTabsProps {
  activeTab: 'profile' | 'history';
  onSelectTab: (tab: 'profile' | 'history') => void;
  boutsCount: number;
}

export function ProfileTabs({ activeTab, onSelectTab, boutsCount }: ProfileTabsProps) {
  return (
    <div
      className="sticky top-[64px] z-30 bg-slate-50/95 py-1.5 backdrop-blur-md dark:bg-slate-950/95"
      data-testid="fighter-profile-tabs"
    >
      <div className="flex h-11 rounded-xl border border-slate-200/80 bg-slate-100/90 p-1 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => onSelectTab('profile')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg text-xs sm:text-[13px] font-semibold transition ${
            activeTab === 'profile'
              ? 'bg-white text-slate-900 shadow-xs font-bold dark:bg-slate-800 dark:text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <User className="h-4 w-4" />
          <span>Profile</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('history')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg text-xs sm:text-[13px] font-semibold transition ${
            activeTab === 'history'
              ? 'bg-red-50 text-red-700 font-bold border border-red-200/60 shadow-xs dark:bg-red-950/80 dark:text-red-300 dark:border-red-900/60'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Swords className="h-4 w-4" />
          <span>Fight History</span>
          <span
            className={`rounded-full px-1.5 py-0.2 font-sans text-[10px] font-extrabold ${
              activeTab === 'history'
                ? 'bg-red-600 text-white'
                : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {boutsCount}
          </span>
        </button>
      </div>
    </div>
  );
}
