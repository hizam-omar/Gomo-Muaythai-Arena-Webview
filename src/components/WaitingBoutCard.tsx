import { useState } from 'react';
import { Clock3 } from 'lucide-react';
import type { Bout } from '../types';
import { Avatar, PhotoPreviewModal } from './FighterAvatar';

interface WaitingBoutCardProps {
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

export function WaitingBoutCard({ bout }: WaitingBoutCardProps) {
  const [previewPhoto, setPreviewPhoto] = useState<{ src?: string; name: string; corner: 'red' | 'blue' } | null>(null);

  const ringLabel = bout.ring ? (bout.ring.toLowerCase().startsWith('ring') ? bout.ring : `Ring ${bout.ring}`) : 'Main Ring';
  const metaInfo = formatBoutMetadata(bout.tournamentRound, bout.weightCategory);

  const waitOrderText = bout.waitOrder && bout.waitOrder > 0
    ? `${bout.waitOrder} bouts waiting`
    : 'Waiting in queue';

  const isRedGomo = bout.gomoCorner === 'RED';
  const isBlueGomo = bout.gomoCorner === 'BLUE';

  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900 sm:shadow-2xs">
      {/* 1. Combined Top Row */}
      <div className="flex min-h-11 items-center justify-between gap-2 border-b border-slate-100 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900 sm:bg-slate-50 sm:px-3.5 sm:dark:bg-slate-950/40">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[12px] font-extrabold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <Clock3 className="h-3 w-3 shrink-0" />
            Waiting
          </span>
          <span className="truncate text-[12px] font-semibold text-slate-500 dark:text-slate-400">
            {waitOrderText}
          </span>
        </div>

        <span className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[12px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {ringLabel}
        </span>
      </div>

      {/* 2. Simplified Metadata Row */}
      <div className="border-b border-slate-100 px-3 py-1.5 text-[12px] font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:px-3.5">
        <span className="font-extrabold text-slate-900 dark:text-white mr-1.5">Bout #{bout.boutNumber}</span>
        {metaInfo && <span className="truncate">{metaInfo}</span>}
      </div>

      {/* 3. Matchup Row */}
      <div className="grid grid-cols-2 items-center gap-2 px-2.5 py-3 sm:grid-cols-[1fr_auto_1fr] sm:gap-3 sm:bg-slate-50/30 sm:px-3.5 sm:dark:bg-slate-900/40">
        {/* Red Fighter Panel */}
        <div className={`order-1 flex min-w-0 items-center gap-2 rounded-lg p-2 sm:order-none sm:gap-2.5 sm:bg-transparent sm:p-0 ${isRedGomo ? 'bg-red-50/70 dark:bg-red-950/20' : ''}`}>
          <div className={isRedGomo ? '' : 'hidden sm:block'}><Avatar src={bout.redAvatar} name={bout.redName} corner="red" onPreview={() => setPreviewPhoto({ src: bout.redAvatar, name: bout.redName, corner: 'red' })} /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="text-[12px] font-black tracking-wider text-red-600 dark:text-red-400">RED</span>
              {isRedGomo && (
                <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[12px] font-black uppercase text-red-600 dark:bg-red-950/60 dark:text-red-400">
                  GOMO
                </span>
              )}
            </div>
            {bout.redProfileUrl ? (
              <a href={bout.redProfileUrl} className="block truncate text-[12px] font-extrabold text-slate-900 underline decoration-red-400/60 underline-offset-2 hover:text-red-600 dark:text-white sm:text-sm">
                {bout.redName}
              </a>
            ) : (
              <h3 className="truncate text-[12px] font-extrabold text-slate-900 dark:text-white sm:text-sm">
                {bout.redName}
              </h3>
            )}
            <p className="hidden truncate text-[12px] font-semibold text-slate-500 dark:text-slate-400 sm:block">
              {formatGymName(bout.redGym)}
            </p>
          </div>
        </div>

        {/* VS Circle */}
        <div className="order-3 col-span-2 mx-auto flex h-7 min-w-12 items-center justify-center rounded-full bg-slate-100 px-2 text-[12px] font-extrabold text-slate-500 shadow-2xs dark:bg-slate-800 dark:text-slate-400 sm:order-none sm:col-span-1 sm:h-7 sm:w-7 sm:min-w-0 sm:px-0 sm:text-[9px]">
          VS
        </div>

        {/* Blue Fighter Panel */}
        <div className={`order-2 flex min-w-0 flex-row-reverse items-center gap-2 rounded-lg p-2 text-right sm:order-none sm:gap-2.5 sm:bg-transparent sm:p-0 ${isBlueGomo ? 'bg-blue-50/70 dark:bg-blue-950/20' : ''}`}>
          <div className={isBlueGomo ? '' : 'hidden sm:block'}><Avatar src={bout.blueAvatar} name={bout.blueName} corner="blue" onPreview={() => setPreviewPhoto({ src: bout.blueAvatar, name: bout.blueName, corner: 'blue' })} /></div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-row-reverse items-center gap-1">
              <span className="text-[12px] font-black tracking-wider text-blue-600 dark:text-blue-400">BLUE</span>
              {isBlueGomo && (
                <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[12px] font-black uppercase text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  GOMO
                </span>
              )}
            </div>
            {bout.blueProfileUrl ? (
              <a href={bout.blueProfileUrl} className="block truncate text-[12px] font-extrabold text-slate-900 underline decoration-blue-400/60 underline-offset-2 hover:text-blue-600 dark:text-white sm:text-sm">
                {bout.blueName}
              </a>
            ) : (
              <h3 className="truncate text-[12px] font-extrabold text-slate-900 dark:text-white sm:text-sm">
                {bout.blueName}
              </h3>
            )}
            <p className="hidden truncate text-[12px] font-semibold text-slate-500 dark:text-slate-400 sm:block">
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
