import { useMemo, useState } from 'react';
import { Search, ArrowUpDown, Check, X, History, Trophy } from 'lucide-react';
import type { FightRecord, Fighter } from '../types';
import { FightRecordCard } from './FightRecordCard';
import { HistoricalBoutCard, parseBoutTimestamp } from './HistoricalBoutCard';

interface HistoricalBoutsSectionProps {
  fighter: Fighter;
  fightRecords: FightRecord[];
  isLoading: boolean;
  fullPage?: boolean;
}

export type SortOrder = 'newest' | 'oldest' | 'event' | 'result';

export function HistoricalBoutsSection({
  fighter,
  fightRecords,
  isLoading,
}: HistoricalBoutsSectionProps) {
  const [filter, setFilter] = useState<'ALL' | 'WINS' | 'LOSSES' | 'DRAWS' | 'MEDALS'>('ALL');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Filter bouts belonging to this fighter
  const boutsForFighter = useMemo(() => {
    if (!fighter) return [];
    const fidStr = fighter.id !== undefined && fighter.id !== null ? String(fighter.id) : '';
    const docIdStr = fighter.firestoreDocId ? String(fighter.firestoreDocId) : '';
    const nameStr = (fighter.name || '').trim().toLowerCase();
    const nicknameStr = (fighter.nickname || '').trim().toLowerCase();

    return fightRecords.filter((rec) => {
      const recFighterId =
        rec.fighterId !== undefined && rec.fighterId !== null ? String(rec.fighterId) : '';

      if (recFighterId && (recFighterId === fidStr || recFighterId === docIdStr)) {
        return true;
      }

      const red = (rec.redName || '').trim().toLowerCase();
      const blue = (rec.blueName || '').trim().toLowerCase();
      const opp = (rec.opponentName || '').trim().toLowerCase();

      if (nameStr && (red === nameStr || blue === nameStr || opp === nameStr)) return true;
      if (nicknameStr && (red === nicknameStr || blue === nicknameStr || opp === nicknameStr)) return true;

      return false;
    });
  }, [fighter, fightRecords]);

  // Count totals for filter chips
  const counts = useMemo(() => {
    let wins = 0;
    let losses = 0;
    let draws = 0;
    let medals = 0;

    boutsForFighter.forEach((b) => {
      const res = (b.result || '').trim().toUpperCase();
      const med = (b.medal || '').trim().toUpperCase();
      if (res === 'WIN' || res.includes('WIN')) wins += 1;
      else if (res === 'LOSS' || res.includes('LOSS')) losses += 1;
      else if (res === 'DRAW' || res.includes('DRAW')) draws += 1;
      if (med && med !== 'NONE' && med !== 'N/A') medals += 1;
    });

    return { total: boutsForFighter.length, wins, losses, draws, medals };
  }, [boutsForFighter]);

  // Apply Search, Filter & Sort
  const filteredAndSortedBouts = useMemo(() => {
    // 1. Filter
    const result = boutsForFighter.filter((b) => {
      const res = (b.result || '').trim().toUpperCase();
      const med = (b.medal || '').trim().toUpperCase();

      if (filter === 'WINS' && !(res === 'WIN' || res.includes('WIN'))) return false;
      if (filter === 'LOSSES' && !(res === 'LOSS' || res.includes('LOSS'))) return false;
      if (filter === 'DRAWS' && !(res === 'DRAW' || res.includes('DRAW'))) return false;
      if (filter === 'MEDALS' && !(med && med !== 'NONE' && med !== 'N/A')) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const textToSearch = [
          b.eventName,
          b.opponentName,
          b.opponentClub,
          b.redName,
          b.blueName,
          b.location,
          b.weightCategory,
          b.tournamentRound,
          b.boutNumber ? `bout ${b.boutNumber}` : '',
          b.result,
          b.method,
          b.methodOrMedal,
          b.medal,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!textToSearch.includes(q)) return false;
      }

      return true;
    });

    // 2. Sort
    return result.sort((a, b) => {
      if (sortOrder === 'event') {
        const eventA = (a.eventName || '').toLowerCase();
        const eventB = (b.eventName || '').toLowerCase();
        return eventA.localeCompare(eventB);
      }

      if (sortOrder === 'result') {
        const resA = (a.result || '').toUpperCase();
        const resB = (b.result || '').toUpperCase();
        return resA.localeCompare(resB);
      }

      const timeA = parseBoutTimestamp(a);
      const timeB = parseBoutTimestamp(b);

      if (timeA !== timeB && timeA > 0 && timeB > 0) {
        return sortOrder === 'oldest' ? timeA - timeB : timeB - timeA;
      }

      // Secondary sort: Bout number or ID
      const numA = Number(String(a.boutNumber || '').replace(/\D/g, '')) || 0;
      const numB = Number(String(b.boutNumber || '').replace(/\D/g, '')) || 0;
      if (numA !== numB && numA > 0 && numB > 0) {
        return sortOrder === 'oldest' ? numA - numB : numB - numA;
      }

      return sortOrder === 'oldest'
        ? String(a.id || '').localeCompare(String(b.id || ''))
        : String(b.id || '').localeCompare(String(a.id || ''));
    });
  }, [boutsForFighter, filter, search, sortOrder]);

  return (
    <div className="space-y-3.5">
      {/* Summary Card */}
      <FightRecordCard bouts={boutsForFighter} isLoading={isLoading} />

      {/* Main Bout History Section */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 text-slate-900 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-white">
        {/* Header: Title & Sort Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight truncate">
              Bout History
            </h2>
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 font-sans text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {filteredAndSortedBouts.length === counts.total
                ? `${counts.total} bouts`
                : `${filteredAndSortedBouts.length} of ${counts.total} bouts`}
            </span>
          </div>

          {/* Sort Button */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowSortMenu(!showSortMenu)}
              aria-label="Sort fight history"
              title="Sort fight history"
              className={`flex h-9 min-w-[36px] items-center justify-center gap-1 rounded-xl border border-slate-200/80 bg-slate-50 px-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 ${
                sortOrder !== 'newest' ? 'border-red-300 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' : ''
              }`}
            >
              <ArrowUpDown className="h-4 w-4" />
              <span className="hidden sm:inline">
                {sortOrder === 'newest'
                  ? 'Newest'
                  : sortOrder === 'oldest'
                  ? 'Oldest'
                  : sortOrder === 'event'
                  ? 'Event'
                  : 'Result'}
              </span>
            </button>

            {/* Sort Dropdown Menu */}
            {showSortMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSortMenu(false)}
                />
                <div className="absolute right-0 top-11 z-50 w-48 rounded-xl border border-slate-200/90 bg-white p-1.5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                  <p className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Sort Fight History
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSortOrder('newest');
                      setShowSortMenu(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
                      sortOrder === 'newest'
                        ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 font-bold'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>Newest first</span>
                    {sortOrder === 'newest' && <Check className="h-4 w-4 text-red-600" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSortOrder('oldest');
                      setShowSortMenu(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
                      sortOrder === 'oldest'
                        ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 font-bold'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>Oldest first</span>
                    {sortOrder === 'oldest' && <Check className="h-4 w-4 text-red-600" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSortOrder('event');
                      setShowSortMenu(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
                      sortOrder === 'event'
                        ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 font-bold'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>Event name A–Z</span>
                    {sortOrder === 'event' && <Check className="h-4 w-4 text-red-600" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSortOrder('result');
                      setShowSortMenu(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
                      sortOrder === 'result'
                        ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 font-bold'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>Result type</span>
                    {sortOrder === 'result' && <Check className="h-4 w-4 text-red-600" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search event, opponent or location"
            className="w-full rounded-xl border border-slate-200/80 bg-slate-50 pl-9 pr-8 py-2 text-xs font-medium text-slate-900 outline-none transition focus:border-red-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-red-600"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Scrollable Filter Chips (Includes Draws!) */}
        {counts.total > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`shrink-0 rounded-lg px-2.5 py-1 transition ${
                filter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              All ({counts.total})
            </button>
            {counts.wins > 0 && (
              <button
                type="button"
                onClick={() => setFilter('WINS')}
                className={`shrink-0 rounded-lg px-2.5 py-1 transition ${
                  filter === 'WINS'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/60'
                }`}
              >
                Wins ({counts.wins})
              </button>
            )}
            {counts.losses > 0 && (
              <button
                type="button"
                onClick={() => setFilter('LOSSES')}
                className={`shrink-0 rounded-lg px-2.5 py-1 transition ${
                  filter === 'LOSSES'
                    ? 'bg-rose-600 text-white font-bold'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/60'
                }`}
              >
                Losses ({counts.losses})
              </button>
            )}
            {counts.draws > 0 && (
              <button
                type="button"
                onClick={() => setFilter('DRAWS')}
                className={`shrink-0 rounded-lg px-2.5 py-1 transition ${
                  filter === 'DRAWS'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60'
                }`}
              >
                Draws ({counts.draws})
              </button>
            )}
            {counts.medals > 0 && (
              <button
                type="button"
                onClick={() => setFilter('MEDALS')}
                className={`shrink-0 rounded-lg px-2.5 py-1 transition ${
                  filter === 'MEDALS'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60'
                }`}
              >
                Medals ({counts.medals})
              </button>
            )}
          </div>
        )}

        {/* Bout Cards List */}
        <div className="mt-3">
          {isLoading ? (
            <div className="space-y-3 py-2">
              <div className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              <div className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            </div>
          ) : filteredAndSortedBouts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center dark:border-slate-800 dark:bg-slate-950/40">
              <Trophy className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                {counts.total === 0
                  ? 'No bouts recorded yet.'
                  : search
                  ? `No bouts match "${search}".`
                  : `No bouts found for filter "${filter.toLowerCase()}".`}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {counts.total === 0
                  ? 'Fight records will appear here when added.'
                  : 'Try changing your search or filters.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3" data-testid="fighter-bout-history-list">
              {filteredAndSortedBouts.map((bout, idx) => (
                <HistoricalBoutCard
                  key={bout.id ? String(bout.id) : `record-${idx}`}
                  bout={bout}
                  fighter={fighter}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
