import { useState } from 'react';
import { Search, X, SlidersHorizontal, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface FighterSearchProps {
  value: string;
  onChange: (value: string) => void;
  availableRings?: string[];
  selectedRing?: string;
  onSelectRing?: (ring: string) => void;
  medalFilter?: 'GOLD' | 'SILVER' | 'BRONZE' | 'NONE' | null;
  onSelectMedal?: (medal: 'GOLD' | 'SILVER' | 'BRONZE' | 'NONE' | null) => void;
  resultStatus?: string;
  onSelectResultStatus?: (status: string) => void;
}

export function FighterSearch({
  value,
  onChange,
  availableRings = [],
  selectedRing = 'ALL',
  onSelectRing,
  medalFilter = null,
  onSelectMedal,
  resultStatus = 'ALL',
  onSelectResultStatus,
}: FighterSearchProps) {
  const [showFilterModal, setShowFilterModal] = useState(false);

  const hasActiveFilters = (selectedRing && selectedRing !== 'ALL') || medalFilter !== null || (resultStatus && resultStatus !== 'ALL');

  return (
    <div className="relative mb-3 flex items-center gap-2">
      {/* Search Input Container */}
      <div className="relative flex-grow">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search fighter, opponent or bout"
          aria-label="Search fighter, opponent or bout"
          className="h-11 w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-xs font-semibold text-slate-800 shadow-2xs outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-red-500 dark:focus:ring-red-950/45"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 touch-manipulation"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Button (44px square) */}
      <button
        type="button"
        onClick={() => setShowFilterModal(true)}
        aria-label="Open filter options"
        className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition touch-manipulation ${
          hasActiveFilters
            ? 'border-red-500 bg-red-50 text-red-600 dark:border-red-600 dark:bg-red-950/50 dark:text-red-400 font-bold'
            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
        }`}
      >
        <SlidersHorizontal className="h-4.5 w-4.5" />
        {hasActiveFilters && (
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-white dark:ring-slate-950" />
        )}
      </button>

      {/* Filter Modal / Bottom Sheet */}
      <AnimatePresence>
        {showFilterModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 p-0 sm:p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, y: 300 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="w-full max-w-lg rounded-t-[24px] sm:rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4.5 w-4.5 text-red-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Filter Bouts</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFilterModal(false)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {/* Result Status */}
                {onSelectResultStatus && (
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Result Status
                    </label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectResultStatus('ALL')}
                        className={`flex h-10 items-center justify-between rounded-xl border px-3 text-xs font-bold transition ${
                          resultStatus === 'ALL'
                            ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950'
                            : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <span>All</span>
                        {resultStatus === 'ALL' && <Check className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectResultStatus('DONE')}
                        className={`flex h-10 items-center justify-between rounded-xl border px-3 text-xs font-bold transition ${
                          resultStatus === 'DONE'
                            ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950'
                            : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <span>Done</span>
                        {resultStatus === 'DONE' && <Check className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Medal */}
                {onSelectMedal && (
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Medal
                    </label>
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { label: 'All Medals', value: null },
                        { label: '🥇 Gold', value: 'GOLD' },
                        { label: '🥈 Silver', value: 'SILVER' },
                        { label: '🥉 Bronze', value: 'BRONZE' },
                        { label: 'No Medal', value: 'NONE' },
                      ].map((item) => {
                        const isSelected = medalFilter === item.value;
                        return (
                          <button
                            key={String(item.value)}
                            type="button"
                            onClick={() => onSelectMedal(item.value as any)}
                            className={`flex h-10 items-center justify-between rounded-xl border px-3 text-xs font-bold transition ${
                              isSelected
                                ? 'border-amber-500 bg-amber-50 text-amber-900 dark:border-amber-600 dark:bg-amber-950/60 dark:text-amber-200'
                                : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            <span>{item.label}</span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Ring */}
                {availableRings.length > 0 && onSelectRing && (
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Ring
                    </label>
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectRing('ALL')}
                        className={`flex h-10 items-center justify-between rounded-xl border px-3 text-xs font-bold transition ${
                          selectedRing === 'ALL'
                            ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950'
                            : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <span>All Rings</span>
                        {selectedRing === 'ALL' && <Check className="h-3.5 w-3.5" />}
                      </button>
                      {availableRings.map((ring) => {
                        const isSelected = selectedRing === ring;
                        const label = ring.toLowerCase().startsWith('ring') ? ring : `Ring ${ring}`;
                        return (
                          <button
                            key={ring}
                            type="button"
                            onClick={() => onSelectRing(ring)}
                            className={`flex h-10 items-center justify-between rounded-xl border px-3 text-xs font-bold transition ${
                              isSelected
                                ? 'border-red-500 bg-red-50 text-red-900 dark:border-red-600 dark:bg-red-950/60 dark:text-red-200'
                                : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            <span>{label}</span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectMedal) onSelectMedal(null);
                    if (onSelectRing) onSelectRing('ALL');
                    if (onSelectResultStatus) onSelectResultStatus('ALL');
                  }}
                  className="h-10 px-4 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilterModal(false)}
                  className="h-10 px-5 rounded-xl bg-slate-900 text-xs font-extrabold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
