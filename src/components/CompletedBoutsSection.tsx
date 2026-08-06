import { useState, useEffect } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { CompletedBoutCard } from './CompletedBoutCard';
import type { Bout } from '../types';

interface CompletedBoutsSectionProps {
  bouts: Bout[];
  isEventFullyCompleted: boolean;
  availableRings: string[];
  globalMedalFilter?: 'GOLD' | 'SILVER' | 'BRONZE' | null;
}

type SortOption = 'latest' | 'oldest' | 'boutNumber' | 'ring';
type MedalFilterOption = 'all' | 'gold' | 'silver' | 'bronze' | 'none';

const SORT_LABELS: Record<SortOption, string> = {
  latest: 'Latest first',
  oldest: 'Oldest first',
  boutNumber: 'Bout number',
  ring: 'Ring',
};

export function CompletedBoutsSection({ bouts, isEventFullyCompleted, availableRings, globalMedalFilter }: CompletedBoutsSectionProps) {
  // Read initial states from sessionStorage to preserve during current session
  const [sortOption, setSortOption] = useState<SortOption>(() => {
    return (sessionStorage.getItem('gomo-completed-sort') as SortOption) || 'latest';
  });
  const [medalFilter, setMedalFilter] = useState<MedalFilterOption>(() => {
    if (globalMedalFilter) {
      return globalMedalFilter.toLowerCase() as MedalFilterOption;
    }
    return (sessionStorage.getItem('gomo-completed-medal-filter') as MedalFilterOption) || 'all';
  });
  const [ringFilter, setRingFilter] = useState<string>(() => {
    return sessionStorage.getItem('gomo-completed-ring-filter') || 'all';
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Sync internal state if global filter changes
  useEffect(() => {
    if (globalMedalFilter) {
      setMedalFilter(globalMedalFilter.toLowerCase() as MedalFilterOption);
    }
  }, [globalMedalFilter]);

  // Sync to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('gomo-completed-sort', sortOption);
  }, [sortOption]);

  useEffect(() => {
    sessionStorage.setItem('gomo-completed-medal-filter', medalFilter);
  }, [medalFilter]);

  useEffect(() => {
    sessionStorage.setItem('gomo-completed-ring-filter', ringFilter);
  }, [ringFilter]);

  // Handle outside click to close dropdown
  useEffect(() => {
    if (!showSortDropdown) return;
    const handleOutsideClick = () => setShowSortDropdown(false);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [showSortDropdown]);

  // Filter completed bouts
  const filteredBouts = bouts.filter((bout) => {
    // Medal filter
    const medal = bout.medal.trim().toUpperCase();
    if (medalFilter !== 'all') {
      if (medalFilter === 'none' && (medal !== '' && medal !== 'NONE')) return false;
      if (medalFilter === 'gold' && !medal.includes('GOLD')) return false;
      if (medalFilter === 'silver' && !medal.includes('SILVER')) return false;
      if (medalFilter === 'bronze' && !medal.includes('BRONZE')) return false;
    }

    // Ring filter
    if (ringFilter !== 'all') {
      if (bout.ring !== ringFilter) return false;
    }

    return true;
  });

  // Sort completed bouts
  const sortedBouts = [...filteredBouts].sort((a, b) => {
    if (sortOption === 'latest') {
      // Missing dates or timestamps at the bottom
      const tA = a.timestamp || 0;
      const tB = b.timestamp || 0;
      if (tA === 0 && tB !== 0) return 1;
      if (tB === 0 && tA !== 0) return -1;
      return tB - tA;
    }
    if (sortOption === 'oldest') {
      const tA = a.timestamp || 0;
      const tB = b.timestamp || 0;
      if (tA === 0 && tB !== 0) return 1;
      if (tB === 0 && tA !== 0) return -1;
      return tA - tB;
    }
    if (sortOption === 'boutNumber') {
      const numA = parseInt(a.boutNumber, 10) || 0;
      const numB = parseInt(b.boutNumber, 10) || 0;
      return numA - numB;
    }
    if (sortOption === 'ring') {
      return (a.ring || '').localeCompare(b.ring || '');
    }
    return 0;
  });

  // Handle collapsing behavior: Show latest 3 completed cards by default during an active event
  const showCollapseButton = !isEventFullyCompleted && sortedBouts.length > 3;
  const visibleBouts = showCollapseButton && !isExpanded ? sortedBouts.slice(0, 3) : sortedBouts;

  return (
    <div className="space-y-3.5">
      {/* Section Header with Title and Sort control */}
      <div className="flex items-center justify-between py-1.5 text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            Completed
          </h3>
          <span className="text-xs text-slate-300 dark:text-slate-700 font-bold">·</span>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {bouts.length} {bouts.length === 1 ? 'bout' : 'bouts'}
          </span>
        </div>

        {/* Compact Sort dropdown button */}
        <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-700 shadow-3xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition touch-manipulation min-w-[44px]"
            aria-label="Sort completed bouts"
            aria-haspopup="listbox"
            aria-expanded={showSortDropdown}
          >
            <span>{SORT_LABELS[sortOption]}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          </button>

          {showSortDropdown && (
            <div className="absolute right-0 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-900 z-50">
              <div role="listbox" aria-label="Sort options" className="space-y-0.5">
                {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="option"
                    aria-selected={sortOption === option}
                    onClick={() => {
                      setSortOption(option);
                      setShowSortDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-[12px] font-semibold rounded-lg transition ${
                      sortOption === option
                        ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    {SORT_LABELS[option]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>



      {/* Completed Bouts List */}
      <div className="space-y-2.5">
        {visibleBouts.length > 0 ? (
          visibleBouts.map((bout) => (
            <CompletedBoutCard key={bout.id} bout={bout} />
          ))
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 text-center dark:border-slate-800 dark:bg-slate-900/40">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              No completed bouts found with the current filters.
            </p>
          </div>
        )}
      </div>

      {/* Expand / Collapse Toggle Button */}
      {showCollapseButton && (
        <div className="pt-1.5 flex justify-center">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-700 shadow-3xs hover:bg-slate-50 active:scale-98 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition touch-manipulation w-full sm:w-auto"
          >
            <span>
              {isExpanded
                ? 'Show fewer completed bouts'
                : `View all ${sortedBouts.length} completed bouts`}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
