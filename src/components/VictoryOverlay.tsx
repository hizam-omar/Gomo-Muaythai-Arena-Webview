import { useEffect } from 'react';
import { Medal, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import type { Bout } from '../types';

interface VictoryOverlayProps {
  bout: Bout;
  onDismiss: () => void;
}

export function VictoryOverlay({ bout, onDismiss }: VictoryOverlayProps) {
  const gomoIsRed = bout.gomoCorner === 'RED';
  const fighterName = gomoIsRed ? bout.redName : bout.blueName;
  const opponentName = gomoIsRed ? bout.blueName : bout.redName;

  useEffect(() => {
    const timeout = window.setTimeout(onDismiss, 4500);
    return () => window.clearTimeout(timeout);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label={`${fighterName} victory celebration`}
      onClick={onDismiss}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 14, stiffness: 150 }}
        className="w-full max-w-sm rounded-2xl bg-white p-4 text-center shadow-2xl dark:bg-slate-900 sm:rounded-3xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-50 sm:mb-4 sm:h-20 sm:w-20">
          <Trophy className="h-10 w-10 text-amber-500" />
        </div>
        <p className="font-combat text-lg font-black tracking-[0.16em] text-amber-500">VICTORY UNLOCKED!</p>
        <p className="mt-1 text-sm text-slate-500">Fight completed successfully</p>

        <div className="my-4 border-y border-slate-100 py-4 sm:my-5 sm:py-5">
          <h2 className="font-combat break-words text-2xl font-black text-emerald-700 sm:text-3xl">{fighterName.toUpperCase()}</h2>
          <p className="my-1 text-[10px] font-extrabold tracking-[0.18em] text-slate-400">DEFEATED</p>
          <p className="text-lg font-extrabold text-slate-800 dark:text-white">{opponentName.toUpperCase()}</p>
        </div>

        <div className="rounded-xl bg-red-50 p-3 dark:bg-red-950/60">
          <p className="font-extrabold text-red-700">{bout.eventName}</p>
          <p className="mt-1 text-xs font-semibold text-slate-600">
            {bout.methodOrMedal ? `via ${bout.methodOrMedal}` : 'Win'}
          </p>
          {bout.medal && bout.medal.toUpperCase() !== 'NONE' && (
            <p className="mt-2 inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-700">
              <Medal className="h-4 w-4" /> {bout.medal.toUpperCase()} MEDAL
            </p>
          )}
        </div>

        <p className="mt-4 text-[10px] text-slate-400">Tap outside or wait to continue</p>
      </motion.div>
    </div>
  );
}
