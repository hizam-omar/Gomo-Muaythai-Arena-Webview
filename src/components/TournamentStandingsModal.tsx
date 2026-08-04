import { useEffect, useMemo, useState } from 'react';
import { Medal, Star, Trophy, X } from 'lucide-react';
import type { Bout } from '../types';

interface Standing {
  fighterId: string;
  name: string;
  club: string;
  avatar?: string;
  bouts: number;
  wins: number;
  losses: number;
  draws: number;
  medal?: string;
}

function medalPriority(medal?: string) {
  const value = medal?.toUpperCase() || '';
  if (value.includes('GOLD')) return 3;
  if (value.includes('SILVER')) return 2;
  if (value.includes('BRONZE')) return 1;
  return 0;
}

function awardedMedal(cards: Bout[]): string | undefined {
  const explicit = cards.find((card) => card.medal.trim() && card.medal.toUpperCase() !== 'NONE')?.medal;
  if (explicit) return explicit.toUpperCase();

  const medalBout = cards.find((card) => {
    const round = card.tournamentRound.toLowerCase();
    return !round.includes('semi') && (round.includes('final') || round.includes('gold') || round.includes('bronze'));
  });
  if (!medalBout) return undefined;

  const round = medalBout.tournamentRound.toLowerCase();
  if (round.includes('bronze')) return medalBout.result === 'WIN' ? 'BRONZE' : undefined;
  if (round.includes('final') || round.includes('gold')) return medalBout.result === 'WIN' ? 'GOLD' : 'SILVER';
  return undefined;
}

function StandingAvatar({ standing }: { standing: Standing }) {
  const [failed, setFailed] = useState(false);
  const initial = standing.name.trim().match(/[\p{L}\p{N}]/u)?.[0]?.toUpperCase() || '?';
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-red-200 bg-red-50 text-lg font-black text-red-700">
      {standing.avatar && !failed
        ? <img src={standing.avatar} alt={`${standing.name} avatar`} className="h-full w-full object-cover" onError={() => setFailed(true)} />
        : initial}
    </div>
  );
}

export function TournamentStandingsModal({
  eventName,
  bouts,
  onDismiss,
}: {
  eventName: string;
  bouts: Bout[];
  onDismiss: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onDismiss]);

  const standings = useMemo(() => {
    const byFighter = new Map<string, Bout[]>();
    bouts.filter((bout) => bout.status === 'COMPLETED').forEach((bout) => {
      byFighter.set(bout.fighterId, [...(byFighter.get(bout.fighterId) || []), bout]);
    });

    return Array.from(byFighter.entries()).map(([fighterId, cards]): Standing => {
      const latest = [...cards].sort((a, b) => b.timestamp - a.timestamp)[0];
      const gomoIsRed = latest.gomoCorner === 'RED';
      return {
        fighterId,
        name: gomoIsRed ? latest.redName : latest.blueName,
        club: gomoIsRed ? latest.redGym : latest.blueGym,
        avatar: gomoIsRed ? latest.redAvatar : latest.blueAvatar,
        bouts: cards.length,
        wins: cards.filter((card) => card.result === 'WIN').length,
        losses: cards.filter((card) => card.result === 'LOSS').length,
        draws: cards.filter((card) => card.result === 'DRAW').length,
        medal: awardedMedal(cards),
      };
    }).sort((a, b) => b.wins - a.wins || a.losses - b.losses || medalPriority(b.medal) - medalPriority(a.medal));
  }, [bouts]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Tournament standings" onClick={onDismiss}>
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-2xl dark:bg-slate-950" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-center justify-between gap-3 bg-slate-900 px-4 py-3 text-white sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/15">
              <Trophy className="h-5 w-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h2 className="font-combat text-lg font-black uppercase sm:text-xl">Tournament Standings</h2>
              <p className="truncate text-[10px] font-semibold text-slate-300 sm:text-xs">{eventName || 'Current Active Event'}</p>
            </div>
          </div>
          <button type="button" onClick={onDismiss} className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Close tournament standings">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="border-b border-slate-200 bg-white px-4 py-2 text-[10px] font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 sm:px-5">
          Rankings use completed bouts from this active event only.
        </div>

        <div className="overflow-y-auto p-3 sm:p-4">
          {standings.length === 0 ? (
            <div className="py-12 text-center">
              <Trophy className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-3 font-extrabold text-slate-700 dark:text-slate-200">No Completed Bouts</p>
              <p className="mt-1 text-xs text-slate-500">Standings update when fighters complete bouts in this event.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {standings.map((standing, index) => {
                const rank = index + 1;
                const rankStyle = rank === 1
                  ? 'border-amber-300 bg-amber-50 text-amber-600'
                  : rank === 2 ? 'border-slate-300 bg-slate-100 text-slate-500'
                    : rank === 3 ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-slate-200 bg-slate-50 text-slate-600';
                return (
                  <article key={standing.fighterId} className={`flex items-center gap-3 rounded-xl border bg-white p-3 dark:bg-slate-900 ${rank === 1 ? 'border-amber-300 shadow-sm dark:border-amber-700' : 'border-slate-200 dark:border-slate-800'}`}>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-black ${rankStyle}`}>
                      {rank <= 3 ? <Star className="h-4 w-4 fill-current" /> : rank}
                    </div>
                    <StandingAvatar standing={standing} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="font-combat truncate text-base font-black uppercase text-slate-900 dark:text-white">{standing.name}</h3>
                        {standing.medal && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[8px] font-black text-amber-700 ring-1 ring-amber-200">
                            <Medal className="h-3 w-3" /> {standing.medal}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-[10px] text-slate-500">{standing.club}</p>
                      <div className="mt-1.5 flex flex-wrap gap-x-2 text-[9px] font-extrabold uppercase">
                        <span className="text-slate-500">Fights {standing.bouts}</span>
                        <span className="text-emerald-700">{standing.wins} Win</span>
                        <span className="text-red-700">{standing.losses} Loss</span>
                        {standing.draws > 0 && <span className="text-amber-700">{standing.draws} Draw</span>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
