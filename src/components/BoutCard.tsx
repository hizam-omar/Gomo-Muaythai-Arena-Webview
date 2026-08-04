import { useState } from 'react';
import { CheckCircle2, Clock3, Medal, Radio, UserRound } from 'lucide-react';
import type { Bout } from '../types';

function Avatar({ src, name, corner }: { src?: string; name: string; corner: 'red' | 'blue' }) {
  const [failed, setFailed] = useState(false);
  const border = corner === 'red' ? 'border-red-700' : 'border-blue-700';
  const background = corner === 'red' ? 'bg-red-50 text-red-300' : 'bg-blue-50 text-blue-300';

  return (
    <div className={`h-12 w-12 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-full border-2 ${border} ${background} flex items-center justify-center`}>
      {src && !failed ? (
        <img src={src} alt={`${name} avatar`} className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : <UserRound className="h-7 w-7" aria-hidden="true" />}
    </div>
  );
}

export function BoutCard({ bout }: { bout: Bout; key?: string }) {
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

  return (
    <article className={`overflow-hidden rounded-xl bg-white border shadow-sm ${isLive ? 'border-red-400 ring-1 ring-red-100' : isCompleted ? 'border-emerald-200' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
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

      {hasMedal && (
        <div className="flex justify-center border-t border-slate-100 bg-slate-50 px-4 py-2.5">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black tracking-wide ${medalStyle}`}>
            <Medal className="h-3.5 w-3.5" /> {medal} MEDAL
          </span>
        </div>
      )}
    </article>
  );
}
