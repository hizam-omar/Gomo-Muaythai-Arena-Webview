import React from 'react';

interface FilterTabsProps {
  currentFilter: string;
  onSelectFilter: (filter: string) => void;
}

export const FilterTabs: React.FC<FilterTabsProps> = ({ currentFilter, onSelectFilter }) => {
  const tabs = [
    { id: 'ALL', label: 'All Bouts' },
    { id: 'LIVE', label: 'LIVE' },
    { id: 'UPCOMING', label: 'UPCOMING' },
    { id: 'COMPLETED', label: 'COMPLETED' }
  ];

  return (
    <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onSelectFilter(tab.id)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase transition shadow-sm ${
            currentFilter === tab.id
              ? 'bg-red-600 text-white shadow-red-500/20 shadow-md'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
