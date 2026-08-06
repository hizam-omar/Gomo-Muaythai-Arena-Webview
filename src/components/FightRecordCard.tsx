import { useMemo } from 'react';
import type { FightRecord } from '../types';

interface FightRecordCardProps {
  bouts: FightRecord[];
  isLoading: boolean;
}

export function FightRecordCard({ bouts, isLoading }: FightRecordCardProps) {
  const stats = useMemo(() => {
    let wins = 0;
    let losses = 0;
    let draws = 0;
    let gold = 0;
    let silver = 0;
    let bronze = 0;

    bouts.forEach((b) => {
      const res = (b.result || '').trim().toUpperCase();
      const med = (b.medal || '').trim().toUpperCase();

      if (res === 'WIN' || res.includes('WIN')) wins += 1;
      else if (res === 'LOSS' || res.includes('LOSS')) losses += 1;
      else if (res === 'DRAW' || res.includes('DRAW')) draws += 1;

      if (med.includes('GOLD') || med.includes('EMAS')) gold += 1;
      else if (med.includes('SILVER') || med.includes('PERAK')) silver += 1;
      else if (med.includes('BRONZE') || med.includes('GANGSA')) bronze += 1;
    });

    const total = bouts.length;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
    const totalMedals = gold + silver + bronze;

    return { total, wins, losses, draws, gold, silver, bronze, totalMedals, winRate };
  }, [bouts]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
        <div className="animate-pulse space-y-3">
          <div className="flex justify-between">
            <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </div>
    );
  }

  const winPercent = stats.total > 0 ? (stats.wins / stats.total) * 100 : 0;
  const lossPercent = stats.total > 0 ? (stats.losses / stats.total) * 100 : 0;
  const drawPercent = stats.total > 0 ? (stats.draws / stats.total) * 100 : 0;

  return (
    <div
      className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 text-slate-900 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-white"
      data-testid="fighter-record-summary-card"
    >
      {/* Header: Title & Win Rate Highlight */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight">
            Fight Record
          </h2>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {stats.total} {stats.total === 1 ? 'recorded bout' : 'recorded bouts'}
          </p>
        </div>
        <div className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/60">
          <span>{stats.winRate}% win rate</span>
        </div>
      </div>

      {/* Three Equal Stat Cells */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/60 p-2 dark:border-emerald-900/40 dark:bg-emerald-950/30">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Wins
          </p>
          <p className="mt-0.5 text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-300 leading-none">
            {stats.wins}
          </p>
        </div>
        <div className="rounded-xl border border-rose-200/60 bg-rose-50/60 p-2 dark:border-rose-900/40 dark:bg-rose-950/30">
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
            Losses
          </p>
          <p className="mt-0.5 text-base sm:text-lg font-black text-rose-700 dark:text-rose-300 leading-none">
            {stats.losses}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200/60 bg-amber-50/60 p-2 dark:border-amber-900/40 dark:bg-amber-950/30">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
            Draws
          </p>
          <p className="mt-0.5 text-base sm:text-lg font-black text-amber-700 dark:text-amber-300 leading-none">
            {stats.draws}
          </p>
        </div>
      </div>

      {/* Outcome Distribution Bar */}
      {stats.total > 0 && (
        <div className="mt-3 space-y-1.5">
          <div
            tabIndex={0}
            role="img"
            aria-label={`Bout outcomes: ${stats.wins} wins (${Math.round(winPercent)}%), ${stats.losses} losses (${Math.round(lossPercent)}%), ${stats.draws} draws (${Math.round(drawPercent)}%)`}
            className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
          >
            {stats.wins > 0 && (
              <div
                style={{ width: `${winPercent}%` }}
                className="bg-emerald-500 transition-all duration-300"
                title={`Wins: ${stats.wins}`}
              />
            )}
            {stats.losses > 0 && (
              <div
                style={{ width: `${lossPercent}%` }}
                className="bg-rose-500 transition-all duration-300"
                title={`Losses: ${stats.losses}`}
              />
            )}
            {stats.draws > 0 && (
              <div
                style={{ width: `${drawPercent}%` }}
                className="bg-amber-500 transition-all duration-300"
                title={`Draws: ${stats.draws}`}
              />
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400 px-0.5">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {stats.wins} Wins
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              {stats.losses} Losses
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {stats.draws} {stats.draws === 1 ? 'Draw' : 'Draws'}
            </span>
          </div>
        </div>
      )}

      {/* Achievements / Medal Summary */}
      {stats.totalMedals > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-2.5 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
              Achievements <span className="text-slate-400 font-medium">· {stats.totalMedals} medals</span>
            </p>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {stats.gold > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40">
                🥇 {stats.gold} Gold
              </span>
            )}
            {stats.silver > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                🥈 {stats.silver} Silver
              </span>
            )}
            {stats.bronze > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-0.5 text-[11px] font-bold text-orange-800 border border-orange-200/80 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900/40">
                🥉 {stats.bronze} Bronze
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
