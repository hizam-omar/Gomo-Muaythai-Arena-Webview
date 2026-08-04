import { useState } from 'react';
import { CheckCircle2, ChevronDown, Clock3, Flag, ListOrdered, Medal, Radio } from 'lucide-react';
import type { Bout } from '../types';

function Avatar({ src, name, corner }: { src?: string; name: string; corner: 'red' | 'blue' }) {
  const [failed, setFailed] = useState(false);
  const border = corner === 'red' ? 'border-red-700' : 'border-blue-700';
  const background = corner === 'red' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700';
  const initial = name.trim().match(/[\p{L}\p{N}]/u)?.[0]?.toUpperCase() || '?';

  return (
    <div className={`h-12 w-12 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-full border-2 ${border} ${background} flex items-center justify-center`}>
      {src && !failed ? (
        <img src={src} alt={`${name} avatar`} className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <span className="text-xl font-black" aria-label={`${name} initial`}>{initial}</span>
      )}
    </div>
  );
}

export function BoutCard({ bout }: { bout: Bout; key?: string }) {
  const [scoresExpanded, setScoresExpanded] = useState(false);
  const isLive = bout.status === 'LIVE';
  const isCompleted = bout.status === 'COMPLETED';
  const ring = bout.ring ? (bout.ring.toLowerCase().startsWith('ring') ? bout.ring : `Ring ${bout.ring}`) : '';
  const meta = [bout.tournamentRound, ring, bout.weightCategory].filter(Boolean);
  const medal = bout.medal.trim().toUpperCase();
  const hasMedal = isCompleted && medal !== '' && medal !== 'NONE';
  const medalStyle = medal.includes('GOLD')
    ? 'border-amber-300 bg-amber-50 text-amber-700'
    : medal.includes('SILVER')
      ? 'border-slate-300 bg-slate-100 text-slate-700'
      : 'border-orange-300 bg-orange-50 text-orange-700';
  const hasScores = bout.rounds.length > 0 || bout.redPoints !== '' || bout.bluePoints !== '';
  const result = bout.result.trim().toUpperCase();
  const hasResult = isCompleted && ['WIN', 'LOSS', 'DRAW'].includes(result);
  const resultStyle = result === 'WIN'
    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
    : result === 'LOSS'
      ? 'border-red-300 bg-red-50 text-red-700'
      : 'border-amber-300 bg-amber-50 text-amber-700';

  return (
    <article className={`overflow-hidden rounded-xl border shadow-sm ${isLive ? 'border-red-500 bg-gradient-to-br from-red-50 via-white to-red-50 ring-2 ring-red-100 shadow-red-200/60' : isCompleted ? 'border-emerald-200 bg-white' : 'border-slate-200 bg-white'}`}>
      <div className={`flex items-start justify-between gap-3 border-b px-4 py-3 ${isLive ? 'border-red-200 bg-red-100/60' : 'border-slate-100'}`}>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-extrabold text-slate-900">{bout.eventName}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-slate-500">
            <span className="text-slate-800">Bout #{bout.boutNumber}</span>
            {meta.map((item) => <span key={item}>• {item}</span>)}
          </div>
        </div>
        <span className={`shrink-0 rounded-md px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-white ${isLive ? 'bg-red-600' : isCompleted ? 'bg-emerald-600' : 'bg-slate-500'}`}>
          <span className="flex items-center gap-1.5">
            {isLive ? <Radio className="h-3 w-3 animate-pulse" /> : isCompleted ? <CheckCircle2 className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}
            {isLive ? 'LIVE NOW' : isCompleted ? 'COMPLETED' : 'WAITING'}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-4 sm:gap-5 sm:px-5">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Avatar src={bout.redAvatar} name={bout.redName} corner="red" />
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold tracking-wider text-red-700">RED</p>
            <h3 className="truncate text-xs font-extrabold text-slate-900 sm:text-sm">{bout.redName}</h3>
            <p className="truncate text-[10px] text-slate-500 sm:text-xs">{bout.redGym}</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-black italic text-red-600 sm:text-sm">VS</span>
          {isLive && <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />}
        </div>

        <div className="flex min-w-0 flex-row-reverse items-center gap-2 text-right sm:gap-3">
          <Avatar src={bout.blueAvatar} name={bout.blueName} corner="blue" />
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold tracking-wider text-blue-700">BLUE</p>
            <h3 className="truncate text-xs font-extrabold text-slate-900 sm:text-sm">{bout.blueName}</h3>
            <p className="truncate text-[10px] text-slate-500 sm:text-xs">{bout.blueGym}</p>
          </div>
        </div>
      </div>

      {hasScores && bout.status !== 'WAITING' && (
        <div className={`mx-3 mb-3 overflow-hidden rounded-lg border sm:mx-5 ${isLive ? 'border-red-200 bg-white/90' : 'border-slate-200 bg-slate-50'}`}>
          <button
            type="button"
            onClick={() => setScoresExpanded((expanded) => !expanded)}
            aria-expanded={scoresExpanded}
            className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-slate-50/80"
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
                    <div key={round.round} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-center shadow-sm">
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

      {(hasResult || hasMedal) && (
        <div className="flex flex-wrap justify-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-2.5">
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
        </div>
      )}
    </article>
  );
}
