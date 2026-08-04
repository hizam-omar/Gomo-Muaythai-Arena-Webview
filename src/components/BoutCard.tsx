import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, ChevronDown, Clock3, Flag, ListOrdered, Medal, Radio, X } from 'lucide-react';
import type { Bout } from '../types';

interface AvatarPreviewData {
  src?: string;
  name: string;
  corner: 'red' | 'blue';
}

function avatarSeed(name: string) {
  return Array.from(name.trim().toUpperCase()).reduce((hash, character) => ((hash << 5) - hash + character.charCodeAt(0)) | 0, 17) >>> 0;
}

function GeneratedFighterAvatar({ name, corner }: { name: string; corner: 'red' | 'blue' }) {
  const seed = avatarSeed(name);
  const skinTones = ['#f2c7a5', '#d9a276', '#b97850', '#8f563b', '#6f402e'];
  const hairColors = ['#171717', '#3f2a1d', '#6b4226', '#1f2937', '#7c2d12'];
  const skin = skinTones[seed % skinTones.length];
  const hair = hairColors[(seed >>> 3) % hairColors.length];
  const hairStyle = (seed >>> 5) % 4;
  const shirt = corner === 'red' ? '#b91c1c' : '#1d4ed8';
  const background = corner === 'red' ? '#fee2e2' : '#dbeafe';
  const accent = corner === 'red' ? '#ef4444' : '#3b82f6';
  const initial = name.trim().match(/[\p{L}\p{N}]/u)?.[0]?.toUpperCase() || '?';

  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" role="img" aria-label={`Generated avatar for ${name}`}>
      <rect width="100" height="100" fill={background} />
      <circle cx="78" cy="20" r="18" fill={accent} opacity="0.18" />
      <circle cx="18" cy="82" r="24" fill={accent} opacity="0.13" />
      <path d="M16 100c2-25 15-37 34-37s32 12 34 37" fill={shirt} />
      <path d="M39 60h22v14c-7 5-15 5-22 0z" fill={skin} />
      <circle cx="29" cy="43" r="5" fill={skin} />
      <circle cx="71" cy="43" r="5" fill={skin} />
      <ellipse cx="50" cy="41" rx="22" ry="27" fill={skin} />
      {hairStyle === 0 && <path d="M28 40c-1-22 12-30 24-30 15 0 23 11 20 31-5-9-9-15-18-19-8 8-16 11-26 12z" fill={hair} />}
      {hairStyle === 1 && <><path d="M29 38c0-19 10-28 22-28 13 0 22 10 21 29-9-3-15-8-20-15-6 7-13 11-23 14z" fill={hair} /><circle cx="50" cy="10" r="8" fill={hair} /></>}
      {hairStyle === 2 && <><path d="M29 35c1-17 10-25 22-25 12 0 20 8 21 25-12-8-29-8-43 0z" fill={hair} /><rect x="28" y="30" width="44" height="7" rx="3.5" fill={accent} /></>}
      {hairStyle === 3 && <path d="M29 38c0-18 9-28 22-28 11 0 19 7 21 22-7-5-13-8-20-12-6 8-13 13-23 18z" fill={hair} />}
      <ellipse cx="42" cy="43" rx="2.2" ry="2.8" fill="#1e293b" />
      <ellipse cx="58" cy="43" rx="2.2" ry="2.8" fill="#1e293b" />
      <path d="M47 53c2 2 4 2 6 0" fill="none" stroke="#9f4f45" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M35 39c4-2 8-2 11 0M54 39c3-2 7-2 11 0" fill="none" stroke={hair} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="50" cy="84" r="10" fill="white" opacity="0.94" />
      <text x="50" y="89" textAnchor="middle" fontSize="15" fontWeight="900" fill={shirt}>{initial}</text>
    </svg>
  );
}

function Avatar({ src, name, corner, onPreview }: AvatarPreviewData & { onPreview: (src?: string) => void }) {
  const [failed, setFailed] = useState(false);
  const border = corner === 'red' ? 'border-red-700' : 'border-blue-700';
  const background = corner === 'red' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700';

  return (
    <button
      type="button"
      onClick={() => onPreview(src && !failed ? src : undefined)}
      aria-label={`Open larger avatar for ${name}`}
      className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 transition hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 sm:h-14 sm:w-14 ${border} ${background} ${corner === 'red' ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
    >
      {src && !failed ? (
        <img src={src} alt={`${name} avatar`} className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <GeneratedFighterAvatar name={name} corner={corner} />
      )}
    </button>
  );
}

function AvatarPreview({ preview, onDismiss }: { preview: AvatarPreviewData; onDismiss: () => void }) {
  const [failed, setFailed] = useState(false);
  const isRed = preview.corner === 'red';

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 p-5" role="dialog" aria-modal="true" aria-label={`${preview.name} avatar preview`} onClick={onDismiss}>
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-5 text-center shadow-2xl dark:bg-slate-900" onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={onDismiss} aria-label="Close avatar preview" className="absolute right-3 top-3 rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900">
          <X className="h-4 w-4" />
        </button>
        <div className={`mx-auto mt-5 flex aspect-square w-full max-w-[280px] items-center justify-center overflow-hidden rounded-full border-4 ${isRed ? 'border-red-600 bg-red-100 text-red-700' : 'border-blue-600 bg-blue-100 text-blue-700'}`}>
          {preview.src && !failed
            ? <img src={preview.src} alt={`${preview.name} large avatar`} className="h-full w-full object-cover" onError={() => setFailed(true)} />
            : <GeneratedFighterAvatar name={preview.name} corner={preview.corner} />}
        </div>
        <p className={`mt-4 text-[10px] font-black uppercase tracking-[0.18em] ${isRed ? 'text-red-700' : 'text-blue-700'}`}>{isRed ? 'Red Corner' : 'Blue Corner'}</p>
        <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">{preview.name}</h2>
      </div>
    </div>
  );
}

export function BoutCard({ bout }: { bout: Bout; key?: string }) {
  const [scoresExpanded, setScoresExpanded] = useState(false);
  const [completedExpanded, setCompletedExpanded] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<AvatarPreviewData | null>(null);
  const isLive = bout.status === 'LIVE';
  const isCompleted = bout.status === 'COMPLETED';
  const ring = bout.ring ? (bout.ring.toLowerCase().startsWith('ring') ? bout.ring : `Ring ${bout.ring}`) : '';
  const meta = [bout.tournamentRound, ring, bout.weightCategory].filter(Boolean);
  const medal = bout.medal.trim().toUpperCase();
  const hasMedal = isCompleted && medal !== '' && medal !== 'NONE';
  const medalStyle = medal.includes('GOLD')
    ? 'border-amber-500 bg-amber-400 text-amber-950 shadow-sm shadow-amber-300/50'
    : medal.includes('SILVER')
      ? 'border-slate-400 bg-slate-300 text-slate-900 shadow-sm shadow-slate-300/60'
      : 'border-orange-500 bg-orange-500 text-white shadow-sm shadow-orange-300/50';
  const hasScores = bout.rounds.length > 0 || bout.redPoints !== '' || bout.bluePoints !== '';
  const result = bout.result.trim().toUpperCase();
  const hasResult = isCompleted && ['WIN', 'LOSS', 'DRAW'].includes(result);
  const resultStyle = result === 'WIN'
    ? 'border-emerald-700 bg-emerald-600 text-white shadow-sm shadow-emerald-300/50'
    : result === 'LOSS'
      ? 'border-rose-700 bg-rose-600 text-white shadow-sm shadow-rose-300/50'
      : 'border-amber-600 bg-amber-500 text-slate-950 shadow-sm shadow-amber-300/50';
  const completedCardStyle = medal.includes('GOLD')
    ? 'border-amber-400 bg-gradient-to-br from-amber-50 via-white to-yellow-100 shadow-amber-200/60 dark:from-amber-950 dark:via-slate-900 dark:to-amber-950 dark:shadow-none'
    : medal.includes('SILVER')
      ? 'border-slate-400 bg-gradient-to-br from-slate-100 via-white to-slate-200 shadow-slate-200/70 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 dark:shadow-none'
      : medal.includes('BRONZE')
        ? 'border-orange-400 bg-gradient-to-br from-orange-50 via-white to-orange-100 shadow-orange-200/60 dark:from-orange-950 dark:via-slate-900 dark:to-orange-950 dark:shadow-none'
        : result === 'WIN'
          ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 via-white to-emerald-100 shadow-emerald-200/60 dark:from-emerald-950 dark:via-slate-900 dark:to-emerald-950 dark:shadow-none'
          : result === 'LOSS'
            ? 'border-rose-300 bg-gradient-to-br from-rose-50 via-white to-rose-100 shadow-rose-200/50 dark:from-rose-950 dark:via-slate-900 dark:to-rose-950 dark:shadow-none'
            : 'border-amber-300 bg-gradient-to-br from-amber-50 via-white to-amber-100 dark:from-amber-950 dark:via-slate-900 dark:to-amber-950';
  const completedHeaderStyle = medal.includes('GOLD')
    ? 'border-amber-200 bg-amber-100/80 dark:border-amber-800 dark:bg-amber-950/80'
    : medal.includes('SILVER')
      ? 'border-slate-300 bg-slate-200/80 dark:border-slate-700 dark:bg-slate-800/90'
      : medal.includes('BRONZE')
        ? 'border-orange-200 bg-orange-100/80 dark:border-orange-800 dark:bg-orange-950/80'
        : result === 'WIN' ? 'border-emerald-200 bg-emerald-100/70 dark:border-emerald-800 dark:bg-emerald-950/80'
          : result === 'LOSS' ? 'border-rose-200 bg-rose-100/70 dark:border-rose-800 dark:bg-rose-950/80' : 'border-amber-200 bg-amber-100/70 dark:border-amber-800 dark:bg-amber-950/80';

  return (
    <article className={`overflow-hidden rounded-xl border shadow-sm ${isLive ? 'border-red-500 bg-gradient-to-br from-red-50 via-white to-red-50 ring-2 ring-red-100 shadow-red-200/60 dark:from-red-950 dark:via-slate-900 dark:to-red-950 dark:ring-red-950 dark:shadow-none' : isCompleted ? completedCardStyle : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}>
      <div className={`flex items-start justify-between gap-3 border-b px-4 py-3 ${isLive ? 'border-red-200 bg-red-100/60' : isCompleted ? completedHeaderStyle : 'border-slate-100'}`}>
        <div className="min-w-0">
          <h2 className="font-combat truncate text-base font-black uppercase text-slate-900 dark:text-white">Bout #{bout.boutNumber}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-slate-500">
            {(!isCompleted || completedExpanded) && meta.map((item) => <span key={item}>• {item}</span>)}
          </div>
        </div>
        <span className={`font-combat shrink-0 rounded-md px-2.5 py-1 text-xs font-black tracking-wide text-white ${isLive ? 'bg-red-600' : isCompleted ? 'bg-emerald-600' : 'bg-slate-500'}`}>
          <span className="flex items-center gap-1.5">
            {isLive ? <Radio className="h-3 w-3 animate-pulse" /> : isCompleted ? <CheckCircle2 className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}
            {isLive ? 'LIVE NOW' : isCompleted ? 'COMPLETED' : 'WAITING'}
          </span>
        </span>
      </div>

      <div className={`grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 px-3 sm:gap-4 sm:px-5 ${isCompleted && !completedExpanded ? 'py-2.5' : 'py-3 sm:py-4'}`}>
        <div className={`flex min-w-0 items-center gap-2 rounded-xl border border-red-200 bg-red-50/90 dark:border-red-900 dark:bg-red-950/60 sm:gap-3 ${isCompleted && !completedExpanded ? 'p-1.5 sm:p-2' : 'p-2 sm:p-3'}`}>
          <Avatar src={bout.redAvatar} name={bout.redName} corner="red" onPreview={(src) => setAvatarPreview({ src, name: bout.redName, corner: 'red' })} />
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold tracking-wider text-red-700">RED</p>
            <h3 className="font-combat truncate text-sm font-black uppercase text-slate-900 dark:text-white sm:text-base">{bout.redName}</h3>
            {(!isCompleted || completedExpanded) && <p className="truncate text-[10px] text-slate-500 dark:text-slate-400 sm:text-xs">{bout.redGym}</p>}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-1">
          <span className="text-xs font-black italic text-red-600 sm:text-sm">VS</span>
          {isLive && <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />}
        </div>

        <div className={`flex min-w-0 flex-row-reverse items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/90 text-right dark:border-blue-900 dark:bg-blue-950/60 sm:gap-3 ${isCompleted && !completedExpanded ? 'p-1.5 sm:p-2' : 'p-2 sm:p-3'}`}>
          <Avatar src={bout.blueAvatar} name={bout.blueName} corner="blue" onPreview={(src) => setAvatarPreview({ src, name: bout.blueName, corner: 'blue' })} />
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold tracking-wider text-blue-700">BLUE</p>
            <h3 className="font-combat truncate text-sm font-black uppercase text-slate-900 dark:text-white sm:text-base">{bout.blueName}</h3>
            {(!isCompleted || completedExpanded) && <p className="truncate text-[10px] text-slate-500 dark:text-slate-400 sm:text-xs">{bout.blueGym}</p>}
          </div>
        </div>
      </div>

      {isCompleted && completedExpanded && bout.methodOrMedal && (
        <div className="mx-3 mb-3 rounded-lg border border-slate-200 bg-white/75 px-3 py-2 text-center text-[10px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 sm:mx-5">
          Result method: <span className="font-black text-slate-900 dark:text-white">{bout.methodOrMedal}</span>
        </div>
      )}

      {hasScores && bout.status !== 'WAITING' && (!isCompleted || completedExpanded) && (
        <div className={`mx-3 mb-3 overflow-hidden rounded-lg border sm:mx-5 ${isLive ? 'border-red-200 bg-white/90 dark:border-red-900 dark:bg-slate-900/90' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'}`}>
          <button
            type="button"
            onClick={() => setScoresExpanded((expanded) => !expanded)}
            aria-expanded={scoresExpanded}
            className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-slate-50/80 dark:hover:bg-slate-700/60"
          >
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-600">
              <ListOrdered className="h-3.5 w-3.5 text-red-600" /> Round Points
            </span>
            <span className="flex items-center gap-2">
              {(bout.redPoints !== '' || bout.bluePoints !== '') && (
                <span className="rounded-md bg-slate-900 px-2 py-1 text-[10px] font-black text-white">
                  Total <span className="text-red-300">{bout.redPoints || '–'}</span>
                  <span className="px-1 text-slate-400">–</span>
                  <span className="text-blue-300">{bout.bluePoints || '–'}</span>
                </span>
              )}
              <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${scoresExpanded ? 'rotate-180' : ''}`} />
            </span>
          </button>
          {scoresExpanded && (
            <div className="border-t border-slate-200 px-3 py-3">
              {bout.rounds.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                  {bout.rounds.map((round) => (
                    <div key={round.round} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
                      <p className="text-[9px] font-black text-slate-400">{round.round}</p>
                      <p className="mt-0.5 text-xs font-black">
                        <span className="text-red-600">{round.red}</span>
                        <span className="px-1 text-slate-300">–</span>
                        <span className="text-blue-600">{round.blue}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-2 flex justify-center gap-3 text-[8px] font-extrabold uppercase tracking-wider">
                <span className="text-red-600">Red</span>
                <span className="text-blue-600">Blue</span>
              </div>
            </div>
          )}
        </div>
      )}

      {(hasResult || hasMedal || isCompleted) && (
        <div className="flex flex-wrap justify-center gap-2 border-t border-white/70 bg-white/65 px-4 py-3 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/70">
          {hasResult && (
            <span className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-[10px] font-black tracking-wide ${resultStyle}`}>
              <Flag className="h-3.5 w-3.5" /> GOMO {result}
            </span>
          )}
          {hasMedal && (
            <span className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-[10px] font-black tracking-wide ${medalStyle}`}>
              <Medal className="h-3.5 w-3.5" /> {medal} MEDAL
            </span>
          )}
          {isCompleted && (
            <button
              type="button"
              onClick={() => setCompletedExpanded((expanded) => !expanded)}
              aria-expanded={completedExpanded}
              className="font-combat inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {completedExpanded ? 'Hide Details' : 'Show Details'}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${completedExpanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      )}
      {avatarPreview && createPortal(
        <AvatarPreview preview={avatarPreview} onDismiss={() => setAvatarPreview(null)} />,
        document.body,
      )}
    </article>
  );
}
