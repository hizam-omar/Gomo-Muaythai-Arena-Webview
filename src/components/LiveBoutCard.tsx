import { useState } from 'react';
import { ChevronDown, Flame, ListOrdered } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { Bout } from '../types';
import { Avatar, PhotoPreviewModal } from './FighterAvatar';

interface LiveBoutCardProps {
  bout: Bout;
}

function formatGymName(gym: string): string {
  const normalized = (gym || '').toLowerCase().trim();
  if (normalized.includes('kelab muaythai gomo') || normalized.includes('gomo muaythai') || normalized === 'gomo') {
    return 'GOMO';
  }
  return gym || 'Independent';
}

function formatBoutMetadata(roundText: string, categoryText: string): string {
  let cleanRound = (roundText || '').replace(/_/g, ' ').toLowerCase();
  cleanRound = cleanRound.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());

  let cleanCategory = (categoryText || '').replace(/_/g, ' ');
  const weightMatch = cleanCategory.match(/(\d+)\s*(kg|KG)/);
  const weightStr = weightMatch ? `${weightMatch[1]} kg` : '';

  let nameStr = cleanCategory;
  nameStr = nameStr.replace(/\(\d+.*?\)/g, '');
  nameStr = nameStr.replace(/\d+\s*(kg|KG)/g, '');
  nameStr = nameStr.replace(/[()]/g, '');
  nameStr = nameStr.trim();
  nameStr = nameStr.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());

  const parts = [cleanRound, weightStr, nameStr].filter((p) => p && p.trim() !== '');
  return parts.join(' · ');
}

export function LiveBoutCard({ bout }: LiveBoutCardProps) {
  const [scoresExpanded, setScoresExpanded] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<{ src?: string; name: string; corner: 'red' | 'blue' } | null>(null);

  const ringLabel = bout.ring ? (bout.ring.toLowerCase().startsWith('ring') ? bout.ring : `Ring ${bout.ring}`) : 'Main Ring';
  const metaInfo = formatBoutMetadata(bout.tournamentRound, bout.weightCategory);

  // Compact Live round & timer label derivation
  const roundText = bout.currentRound || (bout.rounds.length > 0 ? `Round ${bout.rounds.length}` : 'Round 1');
  const timerText = bout.roundTimer || '';
  const liveStatusText = timerText ? `${roundText} · ${timerText}` : roundText;

  const hasScore = bout.redPoints !== '' || bout.bluePoints !== '' || bout.rounds.length > 0;
  const redScoreDisplay = bout.redPoints || '0';
  const blueScoreDisplay = bout.bluePoints || '0';

  const isRedGomo = bout.gomoCorner === 'RED' || bout.redGym.toLowerCase().includes('gomo');
  const isBlueGomo = bout.gomoCorner === 'BLUE' || bout.blueGym.toLowerCase().includes('gomo');

  return (
    <article className="relative overflow-hidden rounded-2xl border border-red-200 bg-white shadow-2xs dark:border-red-950 dark:bg-slate-900 transition-all">
      {/* 1. Combined Top Row: Live status & Neutral Ring Badge */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-red-50/50 dark:bg-red-950/20 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative h-2 w-2 rounded-full bg-red-600 dark:bg-red-500" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wide text-red-600 dark:text-red-400">
            {liveStatusText}
          </span>
        </div>

        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
          {ringLabel}
        </span>
      </div>

      {/* 2. Simplified Metadata Row */}
      <div className="px-3.5 py-1.5 border-b border-slate-50 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
        <span className="font-extrabold text-slate-900 dark:text-white mr-1.5">Bout #{bout.boutNumber}</span>
        {metaInfo && <span className="truncate">{metaInfo}</span>}
      </div>

      {/* 3. Redesigned Fighter Matchup Layout */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-3.5 py-3">
        {/* Red Fighter Panel (Soft Red Tint) */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar src={bout.redAvatar} name={bout.redName} corner="red" onPreview={() => setPreviewPhoto({ src: bout.redAvatar, name: bout.redName, corner: 'red' })} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-black tracking-wider text-red-600 dark:text-red-400">RED</span>
              {isRedGomo && (
                <span className="rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 px-1.5 py-0.2 text-[8px] font-black uppercase">
                  GOMO
                </span>
              )}
            </div>
            {bout.redProfileUrl ? (
              <a href={bout.redProfileUrl} className="block truncate text-xs sm:text-sm font-extrabold text-slate-900 underline decoration-red-400/60 underline-offset-2 hover:text-red-600 dark:text-white">
                {bout.redName}
              </a>
            ) : (
              <h3 className="truncate text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                {bout.redName}
              </h3>
            )}
            <p className="truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {formatGymName(bout.redGym)}
            </p>
          </div>
        </div>

        {/* Dynamic High-Contrast Score Presentation (No "SCORE" label, bold 20-24px) */}
        <div className="flex flex-col items-center justify-center px-1">
          {hasScore ? (
            <div className="flex items-center justify-center rounded-xl bg-slate-950 dark:bg-slate-900 px-3 py-1.5 text-white shadow-2xs">
              <div className="font-combat text-xl font-black leading-none tracking-tight">
                <span className="text-red-400">{redScoreDisplay}</span>
                <span className="px-1 text-slate-500">—</span>
                <span className="text-blue-400">{blueScoreDisplay}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-center dark:border-slate-800 dark:bg-slate-800/60">
              <span className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400 dark:text-slate-500">Score pending</span>
            </div>
          )}
        </div>

        {/* Blue Fighter Panel (Soft Blue Tint) */}
        <div className="flex flex-row-reverse items-center gap-2.5 min-w-0 text-right">
          <Avatar src={bout.blueAvatar} name={bout.blueName} corner="blue" onPreview={() => setPreviewPhoto({ src: bout.blueAvatar, name: bout.blueName, corner: 'blue' })} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-row-reverse items-center gap-1">
              <span className="text-[10px] font-black tracking-wider text-blue-600 dark:text-blue-400">BLUE</span>
              {isBlueGomo && (
                <span className="rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 px-1.5 py-0.2 text-[8px] font-black uppercase">
                  GOMO
                </span>
              )}
            </div>
            {bout.blueProfileUrl ? (
              <a href={bout.blueProfileUrl} className="block truncate text-xs sm:text-sm font-extrabold text-slate-900 underline decoration-blue-400/60 underline-offset-2 hover:text-blue-600 dark:text-white">
                {bout.blueName}
              </a>
            ) : (
              <h3 className="truncate text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                {bout.blueName}
              </h3>
            )}
            <p className="truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {formatGymName(bout.blueGym)}
            </p>
          </div>
        </div>
      </div>

      {/* Streaks (Clean row if available) */}
      {(bout.redWinStreak || bout.blueWinStreak) ? (
        <div className="flex items-center justify-between px-3.5 pb-2 text-[9px] font-extrabold text-orange-600 dark:text-orange-400">
          <div>
            {bout.redWinStreak && bout.redWinStreak > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Flame className="h-3 w-3 fill-orange-500 text-orange-500" />
                <span>{bout.redWinStreak}W streak</span>
              </span>
            ) : null}
          </div>
          <div>
            {bout.blueWinStreak && bout.blueWinStreak > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Flame className="h-3 w-3 fill-orange-500 text-orange-500" />
                <span>{bout.blueWinStreak}W streak</span>
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* 4. Compact Round Scores Row (collapsed by default) */}
      <div className="border-t border-slate-100 bg-white/50 px-3.5 py-1.5 dark:border-slate-800 dark:bg-slate-900/40">
        <button
          type="button"
          onClick={() => setScoresExpanded((prev) => !prev)}
          aria-expanded={scoresExpanded}
          className="flex w-full items-center justify-between text-xs font-semibold text-slate-500 hover:text-red-600 dark:text-slate-400 transition min-h-[28px]"
        >
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <ListOrdered className="h-3 w-3" />
            Round scores
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              {redScoreDisplay} – {blueScoreDisplay}
            </span>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${scoresExpanded ? 'rotate-180' : ''}`} />
          </span>
        </button>

        <AnimatePresence initial={false}>
          {scoresExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-1.5 overflow-hidden border-t border-slate-100 pt-1.5 dark:border-slate-800"
            >
              {bout.rounds.length > 0 ? (
                <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                  {bout.rounds.map((r) => (
                    <div key={r.round} className="rounded-lg border border-slate-200 bg-white p-1.5 text-center shadow-2xs dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-[9px] font-black text-slate-400 uppercase">{r.round}</p>
                      <p className="mt-0.5 text-xs font-black">
                        <span className="text-red-600">{r.red}</span>
                        <span className="px-1 text-slate-300">–</span>
                        <span className="text-blue-600">{r.blue}</span>
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-[11px] font-semibold text-slate-400 py-1">
                  Official round points will display here as judges submit scores.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Photo Preview Modal */}
      <PhotoPreviewModal preview={previewPhoto} onClose={() => setPreviewPhoto(null)} />
    </article>
  );
}
