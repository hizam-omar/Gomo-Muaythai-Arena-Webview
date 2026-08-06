import type { Fighter } from '../types';
import type { EditableFighter } from './FighterProfilePage';

interface FighterHeroCardProps {
  fighter: Fighter;
  form: EditableFighter;
  avatar?: string;
  initials: string;
  winRate: number;
  onViewPhoto?: () => void;
}

export function FighterHeroCard({
  fighter,
  form,
  avatar,
  initials,
  winRate,
  onViewPhoto,
}: FighterHeroCardProps) {
  const age = form.age || Number(fighter.age) || 0;
  const weight = form.weightKg || Number(fighter.weightKg) || 0;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 text-slate-900 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-white">
      <div className="flex items-center gap-3.5 sm:gap-4">
        {/* Fighter Image */}
        <div
          className={`group relative h-20 w-20 sm:h-22 sm:w-22 shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 dark:border-slate-800 dark:bg-slate-800 text-lg font-black text-red-700 dark:text-red-400 ${
            avatar ? 'cursor-pointer' : ''
          }`}
          onClick={avatar ? onViewPhoto : undefined}
        >
          {avatar ? (
            <img
              src={avatar}
              alt={`${form.nickname || form.name} profile`}
              className="h-full w-full object-cover transition group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full w-full place-items-center">{initials}</div>
          )}
          {avatar && (
            <span className="absolute inset-x-0 bottom-0 bg-slate-950/75 py-0.5 text-center text-[8px] font-bold uppercase tracking-wider text-white opacity-0 transition group-hover:opacity-100">
              View
            </span>
          )}
        </div>

        {/* Info Column */}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-red-600 dark:text-red-400">
            {form.club || 'Kelab Muaythai Gomo'}
          </p>
          <h1 className="truncate text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
            {form.nickname || form.name}
          </h1>
          <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
            {form.name}
          </p>

          {/* Age & Weight compact metadata */}
          <p className="mt-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            {age > 0 ? `${age} y/o` : 'Athlete'}
            {weight > 0 ? ` · ${weight} kg` : ''}
          </p>

          {/* Record & Win Rate in one compact row */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
            <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-red-700 border border-red-200/60 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900/60">
              {form.wins}W · {form.losses}L · {form.draws}D
            </span>
            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/60">
              {winRate}% Win Rate
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
