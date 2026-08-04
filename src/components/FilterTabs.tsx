interface FilterTabsProps {
  currentFilter: string;
  onSelectFilter: (filter: string) => void;
}

const tabs = [
  { id: 'ALL', label: 'All Bouts' },
  { id: 'LIVE', label: 'Live Now' },
  { id: 'WAITING', label: 'Waiting' },
  { id: 'COMPLETED', label: 'Completed' },
];

export function FilterTabs({ currentFilter, onSelectFilter }: FilterTabsProps) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-2 sm:mb-5 sm:flex sm:overflow-x-auto sm:pb-1" aria-label="Filter fighters by bout status">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onSelectFilter(tab.id)}
          aria-pressed={currentFilter === tab.id}
          className={`font-combat min-h-10 rounded-lg px-2 py-2 text-xs font-black uppercase tracking-wide transition sm:shrink-0 sm:px-4 sm:text-sm ${
            currentFilter === tab.id
              ? 'bg-red-600 text-white shadow-md shadow-red-500/20'
              : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
