import { Layers } from 'lucide-react';

interface RingFilterProps {
  rings: string[];
  selectedRing: string;
  onSelectRing: (ring: string) => void;
}

export function RingFilter({ rings, selectedRing, onSelectRing }: RingFilterProps) {
  if (rings.length <= 1) return null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      <span className="flex items-center gap-1 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0 pr-1">
        <Layers className="h-3.5 w-3.5 text-slate-400" />
        Ring:
      </span>
      <button
        type="button"
        onClick={() => onSelectRing('ALL')}
        className={`shrink-0 h-7 rounded-lg px-2.5 text-[11px] font-bold transition min-w-[44px] ${
          selectedRing === 'ALL'
            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
            : 'border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
        }`}
      >
        All Rings
      </button>

      {rings.map((ring) => {
        const label = ring.toLowerCase().startsWith('ring') ? ring : `Ring ${ring}`;
        return (
          <button
            key={ring}
            type="button"
            onClick={() => onSelectRing(ring)}
            className={`shrink-0 h-7 rounded-lg px-2.5 text-[11px] font-bold transition min-w-[44px] ${
              selectedRing === ring
                ? 'bg-red-600 text-white shadow-xs'
                : 'border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
