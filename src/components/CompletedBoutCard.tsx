import { useState } from 'react';
import { CheckCircle2, ChevronDown, ExternalLink, Medal, Trophy } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { Bout } from '../types';
import { Avatar, PhotoPreviewModal } from './FighterAvatar';

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
  const [previewPhoto, setPreviewPhoto] = useState<{ src?: string; name: string; corner: 'red' | 'blue' } | null>(null);

  const ringLabel = bout.ring ? (bout.ring.toLowerCase().startsWith('ring') ? bout.ring : `Ring ${bout.ring}`) : 'Main Ring';
  const metaInfo = formatBoutMetadata(bout.tournamentRound, bout.weightCategory);

  const result = bout.result.trim().toUpperCase();
  const medal = bout.medal.trim().toUpperCase();
  const hasMedal = medal !== '' && medal !== 'NONE';
  const isGold = medal.includes('GOLD');
  const isSilver = medal.includes('SILVER');
  const isBronze = medal.includes('BRONZE');
  const isRedGomo = bout.gomoCorner === 'RED';
  const isBlueGomo = bout.gomoCorner === 'BLUE';
  const gomoWon = result === 'WIN';
  const gomoLost = result === 'LOSS';

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

  const outcomeLabel = isUnderReview ? 'Under review' : isGold ? 'Gold medal' : isSilver ? 'Silver medal' : isBronze ? 'Bronze medal' : gomoWon ? 'Win' : gomoLost ? 'Loss' : result || 'Completed';
  const outcomeStyle = isGold
    ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
    : isSilver
      ? 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
      : isBronze
        ? 'border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-300'
        : gomoWon
          ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
          : gomoLost
            ? 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300'
            : 'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200';
  const gomoResultLabel = gomoWon ? 'Win' : gomoLost ? 'Loss' : result === 'DRAW' ? 'Draw' : 'Result';
  const gomoPanelStyle = isGold
    ? 'border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20 sm:bg-gradient-to-br sm:from-amber-50 sm:to-yellow-100/70 sm:dark:from-amber-950/50 sm:dark:to-slate-900'
    : isSilver
      ? 'border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/60 sm:bg-gradient-to-br sm:from-slate-50 sm:to-slate-200/70 sm:dark:from-slate-800 sm:dark:to-slate-900'
      : isBronze
        ? 'border-orange-300 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20 sm:bg-gradient-to-br sm:from-orange-50 sm:to-orange-100/70 sm:dark:from-orange-950/40 sm:dark:to-slate-900'
        : gomoWon
          ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20 sm:bg-gradient-to-br sm:from-emerald-50 sm:to-green-100/70 sm:dark:from-emerald-950/40 sm:dark:to-slate-900'
          : gomoLost
            ? 'border-rose-200 bg-rose-50/70 dark:border-rose-900 dark:bg-rose-950/20'
            : 'border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-800/60';

  const finalScoreText = (bout.redPoints !== '' || bout.bluePoints !== '')
    ? `${bout.redPoints || '0'} – ${bout.bluePoints || '0'}`
    : '';

  const cleanMethod = (bout.methodOrMedal || 'Official Result')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());

  const methodLabel = cleanMethod.includes('Points') ? 'Points decision' : `Method · ${cleanMethod}`;

  return (
    <article className={`relative overflow-hidden rounded-[16px] border bg-white/80 p-3 shadow-sm transition-all dark:bg-slate-900/70 sm:p-3.5 ${isGold ? 'border-amber-300/80' : gomoWon ? 'border-emerald-200' : gomoLost ? 'border-rose-200' : 'border-slate-200/80'} dark:border-slate-800`}>
      {/* 1. Status & Medal Top Row */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[12px] font-extrabold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            Done
          </span>
          <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[12px] font-black uppercase ${outcomeStyle}`}>
            {hasMedal ? <Medal className="h-3.5 w-3.5" /> : gomoWon ? <Trophy className="h-3.5 w-3.5" /> : null}
            {outcomeLabel}
          </span>
        </div>

        <span className="rounded-md border border-slate-200/60 bg-slate-100/50 px-1.5 py-0.5 text-[12px] font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
          {ringLabel}
        </span>
      </div>

      {/* 2. Metadata Area */}
      <div className="pt-2 pb-1.5 text-[12px] font-semibold text-slate-400 dark:text-slate-500">
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
          <div className={`min-w-0 rounded-lg border p-2 sm:rounded-xl ${isRedGomo ? `${gomoPanelStyle} sm:shadow-sm` : isRedWinner ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20' : 'border-transparent opacity-70'}`}>
            <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:gap-2">
              <div className={`${isRedGomo ? 'rounded-full ring-2 ring-red-200 dark:ring-red-900 sm:ring-red-300 sm:shadow-sm sm:dark:ring-red-800' : 'hidden sm:block'}`}><Avatar src={bout.redAvatar} name={bout.redName} corner="red" onPreview={() => setPreviewPhoto({ src: bout.redAvatar, name: bout.redName, corner: 'red' })} /></div>
              <div className="min-w-0 w-full">
                <div className="flex flex-wrap items-center gap-1"><span className="text-[12px] font-black text-red-600">RED</span>{isRedGomo && <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[12px] font-black text-white dark:bg-white dark:text-slate-900">GOMO</span>}{isRedWinner && <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 text-[12px] font-black text-white"><span className="sm:hidden">WIN</span><span className="hidden sm:inline">WINNER</span></span>}</div>
                {bout.redProfileUrl ? <a href={bout.redProfileUrl} aria-label={`View fighter profile for ${bout.redName}`} className="flex min-h-6 items-center gap-1 text-[12px] font-black leading-tight text-slate-950 underline decoration-red-300 underline-offset-2 dark:text-white sm:text-sm"><span className="truncate">{bout.redName}</span>{isRedGomo && <ExternalLink className="h-3 w-3 shrink-0" />}</a> : <h3 className="truncate text-[12px] font-black leading-tight text-slate-950 dark:text-white sm:text-sm">{bout.redName}</h3>}
                <span className="block truncate text-[12px] font-semibold text-slate-500 dark:text-slate-400">{formatGymName(bout.redGym)}</span>
                {isRedGomo && <span className={`mt-1 hidden max-w-full justify-center whitespace-normal rounded-md border px-1.5 py-0.5 text-center text-[12px] font-black uppercase leading-tight sm:inline-flex ${outcomeStyle}`}>GOMO · {hasMedal ? `${outcomeLabel} · ${gomoResultLabel}` : gomoResultLabel}</span>}
              </div>
            </div>
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
          <div className={`min-w-0 rounded-lg border p-2 text-right sm:rounded-xl ${isBlueGomo ? `${gomoPanelStyle} sm:shadow-sm` : isBlueWinner ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20' : 'border-transparent opacity-70'}`}>
            <div className="flex flex-col items-end gap-1.5 sm:flex-row-reverse sm:items-center sm:gap-2">
              <div className={`${isBlueGomo ? 'rounded-full ring-2 ring-blue-200 dark:ring-blue-900 sm:ring-blue-300 sm:shadow-sm sm:dark:ring-blue-800' : 'hidden sm:block'}`}><Avatar src={bout.blueAvatar} name={bout.blueName} corner="blue" onPreview={() => setPreviewPhoto({ src: bout.blueAvatar, name: bout.blueName, corner: 'blue' })} /></div>
              <div className="min-w-0 w-full">
                <div className="flex flex-wrap items-center justify-end gap-1">{isBlueWinner && <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 text-[12px] font-black text-white"><span className="sm:hidden">WIN</span><span className="hidden sm:inline">WINNER</span></span>}{isBlueGomo && <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[12px] font-black text-white dark:bg-white dark:text-slate-900">GOMO</span>}<span className="text-[12px] font-black text-blue-600">BLUE</span></div>
                {bout.blueProfileUrl ? <a href={bout.blueProfileUrl} aria-label={`View fighter profile for ${bout.blueName}`} className="flex min-h-6 flex-row-reverse items-center gap-1 text-[12px] font-black leading-tight text-slate-950 underline decoration-blue-300 underline-offset-2 dark:text-white sm:text-sm"><span className="truncate">{bout.blueName}</span>{isBlueGomo && <ExternalLink className="h-3 w-3 shrink-0" />}</a> : <h3 className="truncate text-[12px] font-black leading-tight text-slate-950 dark:text-white sm:text-sm">{bout.blueName}</h3>}
                <span className="block truncate text-[12px] font-semibold text-slate-500 dark:text-slate-400">{formatGymName(bout.blueGym)}</span>
                {isBlueGomo && <span className={`mt-1 hidden max-w-full justify-center whitespace-normal rounded-md border px-1.5 py-0.5 text-center text-[12px] font-black uppercase leading-tight sm:inline-flex ${outcomeStyle}`}>GOMO · {hasMedal ? `${outcomeLabel} · ${gomoResultLabel}` : gomoResultLabel}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Footer Actions Row */}
      <div className="flex justify-between items-center border-t border-slate-100/50 dark:border-slate-800/60 pt-1.5 mt-1">
        <span className="text-[12px] font-bold text-slate-400 dark:text-slate-500">
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
      <PhotoPreviewModal preview={previewPhoto} onClose={() => setPreviewPhoto(null)} />
    </article>
  );
}
