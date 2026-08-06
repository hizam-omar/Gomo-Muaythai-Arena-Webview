import React from 'react';
import { Calendar, MapPin, Trophy, XCircle, MinusCircle, Award } from 'lucide-react';
import type { FightRecord, Fighter } from '../types';

interface HistoricalBoutCardProps {
  key?: string;
  bout: FightRecord;
  fighter: Fighter;
}

export function parseBoutTimestamp(bout: FightRecord): number {
  if (typeof bout.completedAt === 'number' && bout.completedAt > 0) return bout.completedAt;
  if (typeof bout.timestamp === 'number' && bout.timestamp > 0) return bout.timestamp;
  if (bout.completedAt && !isNaN(Number(bout.completedAt))) return Number(bout.completedAt);
  if (bout.timestamp && !isNaN(Number(bout.timestamp))) return Number(bout.timestamp);

  const dateStr = bout.date || bout.startDate;
  if (dateStr) {
    const parsed = Date.parse(dateStr);
    if (!isNaN(parsed)) return parsed;

    const dmyMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
      const d = parseInt(dmyMatch[1], 10);
      const m = parseInt(dmyMatch[2], 10) - 1;
      const y = parseInt(dmyMatch[3], 10);
      return new Date(y, m, d).getTime();
    }
  }

  return 0;
}

export function formatBoutDate(bout: FightRecord): string {
  const ts = parseBoutTimestamp(bout);
  if (ts > 0) {
    try {
      return new Intl.DateTimeFormat('en-MY', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(ts));
    } catch {
      // Fallback
    }
  }
  return bout.date || bout.startDate || '';
}

export function HistoricalBoutCard({ bout, fighter }: HistoricalBoutCardProps) {
  const fighterName = fighter.nickname?.trim() || fighter.name?.trim() || '';
  const isRedCorner =
    bout.gomoCorner?.toUpperCase() === 'RED' ||
    bout.corner?.toUpperCase() === 'RED' ||
    (bout.redName && fighterName && bout.redName.toLowerCase().includes(fighterName.toLowerCase()));
  const cornerLabel = bout.corner || bout.gomoCorner || (isRedCorner ? 'RED' : 'BLUE');

  const rawResult = (bout.result || '').trim().toUpperCase();
  const medal = (bout.medal || '').trim().toUpperCase();

  let resultBadge = null;
  if (rawResult === 'WIN' || rawResult.includes('WIN')) {
    resultBadge = (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-900/60">
        <Trophy className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> Win
      </span>
    );
  } else if (rawResult === 'LOSS' || rawResult.includes('LOSS')) {
    resultBadge = (
      <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200/70 dark:border-rose-900/60">
        <XCircle className="h-3 w-3 text-rose-600 dark:text-rose-400" /> Loss
      </span>
    );
  } else if (rawResult === 'DRAW' || rawResult.includes('DRAW')) {
    resultBadge = (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200/70 dark:border-amber-900/60">
        <MinusCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" /> Draw
      </span>
    );
  } else if (rawResult) {
    resultBadge = (
      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
        {rawResult}
      </span>
    );
  }

  let medalBadge = null;
  if (medal.includes('GOLD') || medal.includes('EMAS')) {
    medalBadge = (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/60">
        🥇 Gold
      </span>
    );
  } else if (medal.includes('SILVER') || medal.includes('PERAK')) {
    medalBadge = (
      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
        🥈 Silver
      </span>
    );
  } else if (medal.includes('BRONZE') || medal.includes('GANGSA')) {
    medalBadge = (
      <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-0.5 text-[11px] font-bold text-orange-800 border border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-900/60">
        🥉 Bronze
      </span>
    );
  }

  const opponent =
    bout.opponentName || (isRedCorner ? bout.blueName : bout.redName) || 'Opponent';
  const opponentClub =
    bout.opponentClub || (isRedCorner ? bout.blueGym : bout.redGym) || '';
  const dateStr = formatBoutDate(bout);
  const method = bout.methodOrMedal || bout.method || '';
  const score =
    bout.score ||
    (bout.redPoints && bout.bluePoints ? `${bout.redPoints} - ${bout.bluePoints}` : '');

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3.5 transition-all hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-slate-700">
      {/* Top Row: Badges & Date */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5 dark:border-slate-800/80">
        <div className="flex flex-wrap items-center gap-1.5">
          {resultBadge}
          {medalBadge}
          {bout.boutNumber && (
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              Bout #{bout.boutNumber}
            </span>
          )}
        </div>
        {dateStr && (
          <div className="flex items-center gap-1 shrink-0 text-[11px] font-medium text-slate-400 dark:text-slate-400">
            <Calendar className="h-3 w-3" />
            <span>{dateStr}</span>
          </div>
        )}
      </div>

      {/* Main Content Grid: Event & Opponent */}
      <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Event</p>
          <p className="text-xs sm:text-[13px] font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-snug">
            {bout.eventName || 'Muaythai Tournament'}
          </p>
          {bout.location && (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
              <span className="truncate">{bout.location}</span>
            </p>
          )}
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Opponent</p>
          <p className="text-xs sm:text-[13px] font-extrabold text-slate-900 dark:text-white truncate">
            vs. {opponent}
          </p>
          {opponentClub && (
            <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
              {opponentClub}
            </p>
          )}
        </div>
      </div>

      {/* Footer Row: Details & Score */}
      {(bout.weightCategory || bout.tournamentRound || method || score || cornerLabel) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2 text-[10px] font-semibold dark:border-slate-800/80">
          {cornerLabel && (
            <span
              className={`rounded-md px-1.5 py-0.5 font-bold ${
                cornerLabel.toUpperCase() === 'RED'
                  ? 'bg-red-50 text-red-700 dark:bg-red-950/80 dark:text-red-300'
                  : 'bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300'
              }`}
            >
              {cornerLabel.toUpperCase()} Corner
            </span>
          )}
          {bout.weightCategory && (
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {bout.weightCategory}
            </span>
          )}
          {bout.tournamentRound && (
            <span className="rounded-md bg-red-50 px-1.5 py-0.5 font-bold text-red-700 dark:bg-red-950/80 dark:text-red-300">
              {bout.tournamentRound}
            </span>
          )}
          {method && (
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {method}
            </span>
          )}
          {score && (
            <span className="ml-auto font-mono text-[11px] font-extrabold text-slate-800 dark:text-slate-200">
              Score: {score}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
