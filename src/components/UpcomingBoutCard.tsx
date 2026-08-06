import { useState } from 'react';
import { Clock3, Flame } from 'lucide-react';
import type { Bout } from '../types';
import { Avatar, PhotoPreviewModal } from './FighterAvatar';

interface UpcomingBoutCardProps {
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

export function UpcomingBoutCard({ bout }: UpcomingBoutCardProps) {
  const [previewPhoto, setPreviewPhoto] = useState<{ src?: string; name: string; corner: 'red' | 'blue' } | null>(null);

  const ringLabel = bout.ring ? (bout.ring.toLowerCase().startsWith('ring') ? bout.ring : `Ring ${bout.ring}`) : 'Main Ring';
  const metaInfo = formatBoutMetadata(bout.tournamentRound, bout.weightCategory);

  const waitOrderText = bout.waitOrder && bout.waitOrder > 0
    ? `${bout.waitOrder} ${bout.waitOrder === 1 ? 'bout' : 'bouts'} before start`
    : 'Preparing to enter ring';

  const estTimeText = bout.estimatedMinutes ? `Est. ${bout.estimatedMinutes} min` : '';

  const isRedGomo = bout.gomoCorner === 'RED' || bout.redGym.toLowerCase().includes('gomo');
  const isBlueGomo = bout.gomoCorner === 'BLUE' || bout.blueGym.toLowerCase().includes('gomo');

  return (
    <article className="relative overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-2xs dark:border-amber-950 dark:bg-slate-900 transition-all">
      {/* 1. Combined Top Row: Status & Neutral Ring Badge */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-amber-50/40 dark:bg-amber-950/20 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 text-[10px] font-extrabold uppercase">
            <Flame className="h-3 w-3 fill-amber-500 text-amber-500 shrink-0" />
            Up Next
          </span>
          <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300">
            {waitOrderText}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {estTimeText && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400">
              <Clock3 className="h-3.5 w-3.5" />
              {estTimeText}
            </span>
          )}
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
            {ringLabel}
          </span>
        </div>
      </div>

      {/* 2. Simplified Metadata Row */}
      <div className="px-3.5 py-1.5 border-b border-slate-50 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
        <span className="font-extrabold text-slate-900 dark:text-white mr-1.5">Bout #{bout.boutNumber}</span>
        {metaInfo && <span className="truncate">{metaInfo}</span>}
      </div>

      {/* 3. Matchup Row */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-3.5 py-3 bg-slate-50/30 dark:bg-slate-900/40">
        {/* Red Fighter Panel */}
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

        {/* VS Circle */}
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[9px] font-extrabold text-slate-500 dark:bg-slate-800 dark:text-slate-400 shadow-2xs">
          VS
        </div>

        {/* Blue Fighter Panel */}
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

      {/* Photo Preview Modal */}
      <PhotoPreviewModal preview={previewPhoto} onClose={() => setPreviewPhoto(null)} />
    </article>
  );
}
