import { useState, useEffect } from 'react';
import { CheckCircle2, ChevronDown, Medal } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { Bout } from '../types';

interface CompletedBoutCardProps {
  bout: Bout;
  key?: string;
}

function formatGymName(gym: string): string {
  const normalized = (gym || '').toLowerCase().trim();
  if (normalized.includes('kelab muaythai gomo') || normalized.includes('gomo muaythai') || normalized === 'gomo') {
    return 'GOMO';
  }
  return gym || 'Independent';
}

function formatBoutMetadata(roundText: string, categoryText: string): string {
  let cleanRound = (roundText || '').replace(/_/g, ' ').replace(/-/g, ' ').toLowerCase();
  cleanRound = cleanRound.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());

  let cleanCategory = (categoryText || '').replace(/_/g, ' ');
  const weightMatch = cleanCategory.match(/(\d+)\s*(kg|KG)/);
  const weightStr = weightMatch ? `${weightMatch[1]} kg` : '';

  let nameStr = cleanCategory;
  nameStr = nameStr.replace(/\(\d+.*?\)/g, '');
  nameStr = nameStr.replace(/\d+\s*(kg|KG)/g, '');
  nameStr = nameStr.replace(/[()]/g, '');
  nameStr = nameStr.replace(/-/g, ' ');
  nameStr = nameStr.trim();
  nameStr = nameStr.toLowerCase().replace(/\b[a-z]/g, (letter) => letter.toUpperCase());

  const parts = [cleanRound, weightStr, nameStr].filter((p) => p && p.trim() !== '');
  return parts.join(' · ');
}

export function CompletedBoutCard({ bout }: CompletedBoutCardProps) {
  const [expanded, setExpanded] = useState(false);

  const ringLabel = bout.ring ? (bout.ring.toLowerCase().startsWith('ring') ? bout.ring : `Ring ${bout.ring}`) : 'Main Ring';
  const metaInfo = formatBoutMetadata(bout.tournamentRound, bout.weightCategory);

  const result = bout.result.trim().toUpperCase();
  const medal = bout.medal.trim().toUpperCase();
  const hasMedal = medal !== '' && medal !== 'NONE';

  // Determine winner based on GOMO corner and result
  let isRedWinner = false;
  let isBlueWinner = false;

  if (result === 'WIN') {
    if (bout.gomoCorner === 'RED') {
      isRedWinner = true;
    } else {
      isBlueWinner = true;
    }
  } else if (result === 'LOSS') {
    if (bout.gomoCorner === 'RED') {
      isBlueWinner = true;
    } else {
      isRedWinner = true;
    }
  } else {
    // Fallback 1: methodOrMedal contains red/blue (including local translations like 'merah' or 'biru')
    const methodLower = bout.methodOrMedal.toLowerCase();
    if (methodLower.includes('red') || methodLower.includes('merah')) {
      isRedWinner = true;
    } else if (methodLower.includes('blue') || methodLower.includes('biru')) {
      isBlueWinner = true;
    } else {
      // Fallback 2: Points comparison
      const rp = Number(bout.redPoints);
      const bp = Number(bout.bluePoints);
      if (!isNaN(rp) && !isNaN(bp) && rp !== bp) {
        if (rp > bp) {
          isRedWinner = true;
        } else {
          isBlueWinner = true;
        }
      }
    }
  }

  // Handle special cases and review/inconsistency state
  const methodLower = bout.methodOrMedal.toLowerCase();
  let isUnderReview = methodLower.includes('review') || result === 'REVIEW' || result === 'UNDER_REVIEW';

  let hasConflict = false;
  const rp = Number(bout.redPoints);
  const bp = Number(bout.bluePoints);
  if (!isNaN(rp) && !isNaN(bp) && rp !== bp) {
    if ((rp > bp && isBlueWinner) || (bp > rp && isRedWinner)) {
      if (methodLower.includes('point') || methodLower.includes('decision') || methodLower.includes('pts')) {
        hasConflict = true;
        isUnderReview = true;
      }
    }
  }

  if (isUnderReview) {
    isRedWinner = false;
    isBlueWinner = false;
    if (hasConflict) {
      console.warn(`Conflict detected on Bout #${bout.boutNumber}: Red pts ${rp}, Blue pts ${bp}, but winner state indicates otherwise.`);
    }
  }

  const finalScoreText = (bout.redPoints !== '' || bout.bluePoints !== '')
    ? `${bout.redPoints || '0'} – ${bout.bluePoints || '0'}`
    : '';

  const cleanMethod = (bout.methodOrMedal || 'Official Result')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());

  const methodLabel = cleanMethod.includes('Points') ? 'Points decision' : `Method · ${cleanMethod}`;

  return (
    <article className="relative overflow-hidden rounded-[16px] border border-slate-200/80 bg-white/70 p-3.5 dark:border-slate-800 dark:bg-slate-900/60 transition-all shadow-none">
      {/* 1. Status & Medal Top Row */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            Done
          </span>
          {hasMedal && (
            <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
              medal.includes('GOLD') ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' :
              medal.includes('SILVER') ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300' :
              'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400'
            }`}>
              {medal.includes('GOLD') ? '🥇' : medal.includes('SILVER') ? '🥈' : '🥉'}
              <span className="ml-0.5">{medal.toLowerCase().replace(/^\b\w/g, c => c.toUpperCase())}</span>
            </span>
          )}
        </div>

        <span className="rounded-md border border-slate-200/60 bg-slate-100/50 px-1.5 py-0.5 text-[11px] font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
          {ringLabel}
        </span>
      </div>

      {/* 2. Metadata Area */}
      <div className="pt-2 pb-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
        <span className="font-extrabold text-slate-800 dark:text-slate-300 mr-1.5">Bout #{bout.boutNumber}</span>
        {metaInfo && <span className="truncate">{metaInfo}</span>}
      </div>

      {/* 3. Symmetrical Flatter Result Row */}
      <div className="py-2.5" role="group" aria-label={`Bout ${bout.boutNumber} result`}>
        {/* Screen Reader accessible full final score text */}
        {finalScoreText && (
          <span className="sr-only">
            Final score: Red {bout.redPoints || '0'}, Blue {bout.bluePoints || '0'}
          </span>
        )}

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          {/* Red Corner Fighter */}
          <div className={`min-w-0 pr-1 ${isRedWinner ? 'font-bold' : ''}`}>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="h-1.5 w-1.5 rounded-full bg-red-600 dark:bg-red-500 shrink-0" aria-hidden="true" />
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                {bout.redName}
              </span>
              {isRedWinner && (
                <span className="inline-flex items-center gap-0.5 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 px-1 py-0.2 text-[8px] font-bold">
                  Winner
                </span>
              )}
            </div>
            <span className="block mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
              {formatGymName(bout.redGym)}
            </span>
          </div>

          {/* Centered Score */}
          <div className="flex flex-col items-center justify-center px-1" aria-hidden="true">
            {finalScoreText ? (
              <div className="rounded-lg bg-slate-100/80 dark:bg-slate-800/80 px-2 py-0.5 text-center min-w-[54px]">
                <span className="font-combat text-xs font-black text-slate-800 dark:text-slate-200 tracking-wider leading-none">
                  {finalScoreText}
                </span>
              </div>
            ) : (
              <span className="text-[10px] font-bold text-slate-400">FT</span>
            )}
          </div>

          {/* Blue Corner Fighter */}
          <div className={`min-w-0 pl-1 text-right ${isBlueWinner ? 'font-bold' : ''}`}>
            <div className="flex items-center justify-end gap-1.5 flex-wrap">
              {isBlueWinner && (
                <span className="inline-flex items-center gap-0.5 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 px-1 py-0.2 text-[8px] font-bold">
                  Winner
                </span>
              )}
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                {bout.blueName}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-500 shrink-0" aria-hidden="true" />
            </div>
            <span className="block mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
              {formatGymName(bout.blueGym)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Footer Actions Row */}
      <div className="flex justify-between items-center border-t border-slate-100/50 dark:border-slate-800/60 pt-1.5 mt-1">
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
          {isUnderReview ? 'Result under review' : methodLabel}
        </span>
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          aria-expanded={expanded}
          className="inline-flex h-11 items-center gap-1 px-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition touch-manipulation"
          aria-label={expanded ? 'Hide scorecard details' : 'View scorecard details'}
        >
          <span>View scorecard</span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Expandable round list */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-100/50 dark:border-slate-800/60 mt-1.5 pt-2 bg-white dark:bg-slate-900"
          >
            {bout.rounds.length > 0 ? (
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                {bout.rounds.map((r) => (
                  <div key={r.round} className="rounded-lg border border-slate-200/60 bg-slate-50/50 p-1.5 text-center dark:border-slate-800/60 dark:bg-slate-950/40">
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase">{r.round}</p>
                    <p className="mt-0.5 text-xs font-black">
                      <span className="text-red-600">{r.red}</span>
                      <span className="px-1 text-slate-300 dark:text-slate-700">–</span>
                      <span className="text-blue-600">{r.blue}</span>
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-[11px] font-semibold text-slate-400 py-1">
                Final score: <span className="font-bold text-slate-700 dark:text-slate-200">{finalScoreText || 'Decision'}</span>
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
