import { useState } from 'react';
import { ChevronDown, ExternalLink, Flame, ListOrdered, Swords } from 'lucide-react';
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

  const hasScore = String(bout.redPoints ?? '').trim() !== '' || String(bout.bluePoints ?? '').trim() !== '' || bout.rounds.length > 0;
  const redScoreDisplay = String(bout.redPoints ?? '').trim() || '–';
  const blueScoreDisplay = String(bout.bluePoints ?? '').trim() || '–';

  const isRedGomo = bout.gomoCorner === 'RED' || bout.redGym.toLowerCase().includes('gomo');
  const isBlueGomo = bout.gomoCorner === 'BLUE' || bout.blueGym.toLowerCase().includes('gomo');
  const currentRoundNumber = roundText.match(/\d+/)?.[0] || '';

  return (
    <article aria-label={`Live bout ${bout.boutNumber}: ${bout.redName} versus ${bout.blueName}`} className="group/live relative overflow-hidden rounded-2xl border border-red-300 bg-white shadow-sm transition-all duration-300 motion-reduce:transform-none dark:border-red-900 dark:bg-slate-900 sm:border-2 sm:border-red-400 sm:bg-gradient-to-br sm:from-white sm:via-white sm:to-red-50/70 sm:shadow-[0_10px_32px_rgba(220,38,38,0.16)] sm:hover:-translate-y-0.5 sm:hover:border-red-500 sm:hover:shadow-[0_16px_42px_rgba(220,38,38,0.24)] sm:dark:border-red-800 sm:dark:from-slate-900 sm:dark:via-slate-900 sm:dark:to-red-950/30">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(circle_at_20%_0%,rgba(248,113,113,0.16),transparent_38%)] motion-reduce:animate-none sm:block sm:animate-pulse" />
      {/* 1. Combined Top Row: Live status & Neutral Ring Badge */}
      <div className="relative flex min-h-11 items-center justify-between gap-2 border-b border-red-100 bg-white px-3 py-2 text-red-700 dark:border-red-950 dark:bg-slate-900 sm:min-h-12 sm:bg-gradient-to-r sm:from-red-600 sm:to-rose-600 sm:px-3.5 sm:text-white">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-red-600 px-2 py-1 text-[12px] font-black uppercase tracking-wide text-white sm:rounded-full sm:bg-white sm:px-2.5 sm:text-red-700 sm:shadow-sm">
            <span className="relative flex h-2 w-2 shrink-0"><span className="absolute h-full w-full animate-ping rounded-full bg-red-500 opacity-75 motion-reduce:animate-none" /><span className="relative h-2 w-2 rounded-full bg-red-600" /></span>
            Live now
          </span>
          <span aria-live="polite" className="truncate text-[12px] font-extrabold uppercase tracking-wide text-red-700 dark:text-red-300 sm:text-white">{liveStatusText}</span>
        </div>

        <span className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[12px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:rounded-lg sm:border-white/30 sm:bg-white/15 sm:px-2.5 sm:font-black sm:text-white sm:backdrop-blur-sm">
          {ringLabel}
        </span>
      </div>

      {/* 2. Simplified Metadata Row */}
      <div className="relative flex min-h-9 items-center gap-1.5 border-b border-red-100 px-3.5 py-1.5 text-[12px] font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <span className="font-extrabold text-slate-900 dark:text-white mr-1.5">Bout #{bout.boutNumber}</span>
        {metaInfo && <span className="truncate">{metaInfo}</span>}
      </div>

      {/* 3. Redesigned Fighter Matchup Layout */}
      <div className="relative grid grid-cols-2 items-center gap-2 px-2.5 py-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-4 sm:px-4 sm:py-5">
        {/* Red Fighter Panel (Soft Red Tint) */}
        <div className={`order-1 min-w-0 rounded-lg p-2 transition-all duration-300 sm:order-none sm:rounded-xl ${isRedGomo ? 'border border-red-200 bg-red-50/60 dark:border-red-900 dark:bg-red-950/20 sm:scale-[1.03] sm:border-0 sm:bg-gradient-to-r sm:from-red-100 sm:to-amber-50 sm:ring-2 sm:ring-red-300 sm:shadow-[0_8px_24px_rgba(220,38,38,0.18)] sm:dark:from-red-950/70 sm:dark:to-amber-950/20 sm:dark:ring-red-800' : 'opacity-85 sm:opacity-80 sm:hover:opacity-100'}`}>
          <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <div className={`shrink-0 rounded-full ${isRedGomo ? 'ring-2 ring-red-200 dark:ring-red-900 sm:ring-4 sm:shadow-lg' : ''}`}><Avatar src={bout.redAvatar} name={bout.redName} corner="red" onPreview={() => setPreviewPhoto({ src: bout.redAvatar, name: bout.redName, corner: 'red' })} /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="text-[12px] font-black tracking-wider text-red-600 dark:text-red-400">RED</span>
              {isRedGomo && (
                <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[12px] font-black uppercase text-white">
                  <span className="sm:hidden">GOMO</span><span className="hidden sm:inline">Our fighter</span>
                </span>
              )}
            </div>
            {bout.redProfileUrl ? (
              <a href={bout.redProfileUrl} aria-label={`View fighter profile for ${bout.redName}`} className="flex min-h-6 min-w-0 items-center gap-1 text-[13px] font-black text-slate-950 underline decoration-red-400/60 underline-offset-2 hover:text-red-600 dark:text-white sm:text-base">
                <span className="truncate">{bout.redName}</span><ExternalLink className="hidden h-3 w-3 shrink-0 sm:block" />
              </a>
            ) : (
              <h3 className="truncate text-[13px] font-black text-slate-950 dark:text-white sm:text-base">
                {bout.redName}
              </h3>
            )}
            <p className="hidden truncate text-[12px] font-semibold text-slate-500 dark:text-slate-400 sm:block">
              {formatGymName(bout.redGym)}
            </p>
          </div>
          </div>
          {isRedGomo && bout.redProfileUrl && <p className="mt-1.5 hidden text-center text-[12px] font-black uppercase tracking-wide text-red-700 dark:text-red-300 sm:block">Tap to view profile</p>}
        </div>

        {/* Dynamic High-Contrast Score Presentation (No "SCORE" label, bold 20-24px) */}
        <div className="order-3 col-span-2 flex flex-row items-center justify-center gap-2 px-0.5 pt-1 sm:order-none sm:col-span-1 sm:flex-col sm:gap-0 sm:pt-0">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-950 text-white shadow-md dark:bg-white dark:text-slate-950 sm:mb-1.5"><Swords className="h-4 w-4" /></div>
          {hasScore ? (
            <div className="flex items-center justify-center rounded-xl bg-slate-950 px-2.5 py-2 text-white shadow-lg ring-2 ring-white dark:bg-white dark:text-slate-950 dark:ring-slate-800 sm:px-3">
              <div className="font-combat text-xl font-black leading-none tracking-tight">
                <span className="text-red-400">{redScoreDisplay}</span>
                <span className="px-1 text-slate-500">—</span>
                <span className="text-blue-400">{blueScoreDisplay}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <span className="text-[10px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-300">Score pending</span>
            </div>
          )}
        </div>

        {/* Blue Fighter Panel (Soft Blue Tint) */}
        <div className={`order-2 min-w-0 rounded-lg p-2 text-right transition-all duration-300 sm:order-none sm:rounded-xl ${isBlueGomo ? 'border border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/20 sm:scale-[1.03] sm:border-0 sm:bg-gradient-to-l sm:from-blue-100 sm:to-amber-50 sm:ring-2 sm:ring-blue-300 sm:shadow-[0_8px_24px_rgba(37,99,235,0.18)] sm:dark:from-blue-950/70 sm:dark:to-amber-950/20 sm:dark:ring-blue-800' : 'opacity-85 sm:opacity-80 sm:hover:opacity-100'}`}>
          <div className="flex min-w-0 flex-row-reverse items-center gap-2 sm:gap-2.5">
          <div className={`shrink-0 rounded-full ${isBlueGomo ? 'ring-2 ring-blue-200 dark:ring-blue-900 sm:ring-4 sm:shadow-lg' : ''}`}><Avatar src={bout.blueAvatar} name={bout.blueName} corner="blue" onPreview={() => setPreviewPhoto({ src: bout.blueAvatar, name: bout.blueName, corner: 'blue' })} /></div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-row-reverse items-center gap-1">
              <span className="text-[12px] font-black tracking-wider text-blue-600 dark:text-blue-400">BLUE</span>
              {isBlueGomo && (
                <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[12px] font-black uppercase text-white">
                  <span className="sm:hidden">GOMO</span><span className="hidden sm:inline">Our fighter</span>
                </span>
              )}
            </div>
            {bout.blueProfileUrl ? (
              <a href={bout.blueProfileUrl} aria-label={`View fighter profile for ${bout.blueName}`} className="flex min-h-6 min-w-0 flex-row-reverse items-center gap-1 text-[13px] font-black text-slate-950 underline decoration-blue-400/60 underline-offset-2 hover:text-blue-600 dark:text-white sm:text-base">
                <span className="truncate">{bout.blueName}</span><ExternalLink className="hidden h-3 w-3 shrink-0 sm:block" />
              </a>
            ) : (
              <h3 className="truncate text-[13px] font-black text-slate-950 dark:text-white sm:text-base">
                {bout.blueName}
              </h3>
            )}
            <p className="hidden truncate text-[12px] font-semibold text-slate-500 dark:text-slate-400 sm:block">
              {formatGymName(bout.blueGym)}
            </p>
          </div>
          </div>
          {isBlueGomo && bout.blueProfileUrl && <p className="mt-1.5 hidden text-center text-[12px] font-black uppercase tracking-wide text-blue-700 dark:text-blue-300 sm:block">Tap to view profile</p>}
        </div>
      </div>

      {/* Streaks (Clean row if available) */}
      {(bout.redWinStreak || bout.blueWinStreak) ? (
        <div className="relative hidden items-center justify-between px-3.5 pb-2 text-[12px] font-extrabold text-orange-600 dark:text-orange-400 sm:flex">
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
      <div className="relative border-t border-red-100 bg-white/70 px-3.5 py-1.5 dark:border-slate-800 dark:bg-slate-900/60">
        <button
          type="button"
          onClick={() => setScoresExpanded((prev) => !prev)}
          aria-expanded={scoresExpanded}
          className="flex min-h-11 w-full items-center justify-between rounded-lg text-[12px] font-semibold text-slate-500 transition hover:bg-red-50 hover:px-2 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-slate-400 dark:hover:bg-red-950/40"
        >
          <span className="flex items-center gap-1.5 text-[12px] font-black text-slate-600 dark:text-slate-300">
            <ListOrdered className="h-4 w-4" />
            Round scores
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-[12px] font-black text-slate-700 dark:text-slate-300">
              {hasScore ? `${redScoreDisplay} – ${blueScoreDisplay}` : 'Pending'}
            </span>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 motion-reduce:transition-none ${scoresExpanded ? 'rotate-180' : ''}`} />
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
                    <div key={r.round} className={`rounded-lg border p-2 text-center shadow-2xs ${currentRoundNumber && r.round.match(/\d+/)?.[0] === currentRoundNumber ? 'border-red-400 bg-red-50 ring-2 ring-red-100 dark:border-red-700 dark:bg-red-950/40 dark:ring-red-950' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'}`}>
                      <p className={`text-[12px] font-black uppercase ${currentRoundNumber && r.round.match(/\d+/)?.[0] === currentRoundNumber ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`}>{r.round}{currentRoundNumber && r.round.match(/\d+/)?.[0] === currentRoundNumber ? ' · LIVE' : ''}</p>
                      <p className="mt-0.5 text-xs font-black">
                        <span className="text-red-600">{r.red}</span>
                        <span className="px-1 text-slate-300">–</span>
                        <span className="text-blue-600">{r.blue}</span>
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-2 text-center text-[12px] font-semibold text-slate-400">
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
