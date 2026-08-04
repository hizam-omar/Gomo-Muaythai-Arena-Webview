import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { BoutCard } from './components/BoutCard';
import { FilterTabs } from './components/FilterTabs';
import { Navbar } from './components/Navbar';
import { StatusBanner } from './components/StatusBanner';
import { initFirebase } from './lib/firebase';
import type { Bout, Fighter, LiveFightCard } from './types';

type FeedFilter = 'ALL' | 'LIVE' | 'WAITING' | 'COMPLETED';

function asId(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

function parseBoutNumber(value: string): number {
  const digits = value.match(/\d+/)?.[0];
  return digits ? Number(digits) : Number.MAX_SAFE_INTEGER;
}

function usableAvatar(fighter: Fighter): string | undefined {
  const avatar = fighter.imageUri || fighter.photoUrl || fighter.avatarUrl;
  if (!avatar) return undefined;

  // Local Android content/file paths cannot be read by a remotely hosted page.
  // Newer app photos are data URLs and work in both Android and the web.
  if (/^(content:|file:|\/)/i.test(avatar)) return undefined;
  if (avatar.startsWith('data:image') || avatar.length > 200) {
    return avatar.startsWith('data:image') ? avatar : `data:image/jpeg;base64,${avatar}`;
  }
  return avatar;
}

function mapCard(data: LiveFightCard, docId: string, fighters: Record<string, Fighter>): Bout | null {
  const fighterId = asId(data.fighterId);
  const rawStatus = (data.status || '').trim().toUpperCase();

  // Keep completed bouts visible while their event remains active. They are
  // removed only after the whole event's eventStatus becomes Completed.
  if (!fighterId || !['LIVE', 'UPCOMING', 'WAITING', 'COMPLETED', 'FINISHED'].includes(rawStatus)) return null;
  if ((data.eventStatus || '').trim().toUpperCase() === 'COMPLETED') return null;

  const fighter = fighters[fighterId] || {};
  const fighterName = fighter.nickname?.trim() || fighter.name?.trim() || 'GOMO Fighter';
  const fighterClub = fighter.club?.trim() || 'Kelab Muaythai Gomo';
  const opponentName = data.opponentName?.trim() || 'Opponent';
  const opponentClub = data.opponentClub?.trim() || 'Opponent Club';
  const isRed = !data.corner || data.corner.toUpperCase() === 'RED';
  const avatar = usableAvatar(fighter);

  return {
    id: asId(data.id) || docId,
    fighterId,
    boutNumber: data.boutNumber?.trim() || asId(data.id) || docId,
    eventName: data.eventName?.trim() || 'Fight Event',
    eventType: data.eventType?.trim() || 'Normal Event',
    tournamentRound: data.tournamentRound?.trim() || '',
    ring: data.ring?.trim() || '',
    weightCategory: data.weightCategory?.trim() || '',
    status: rawStatus === 'LIVE'
      ? 'LIVE'
      : ['COMPLETED', 'FINISHED'].includes(rawStatus) ? 'COMPLETED' : 'WAITING',
    redName: isRed ? fighterName : opponentName,
    redGym: isRed ? fighterClub : opponentClub,
    redAvatar: isRed ? avatar : undefined,
    blueName: isRed ? opponentName : fighterName,
    blueGym: isRed ? opponentClub : fighterClub,
    blueAvatar: isRed ? undefined : avatar,
    timestamp: Number(data.timestamp) || 0,
  };
}

export default function App() {
  const [bridgeBouts, setBridgeBouts] = useState<Bout[]>([]);
  const [rawCards, setRawCards] = useState<Array<LiveFightCard & { docId: string }>>([]);
  const [fighters, setFighters] = useState<Record<string, Fighter>>({});
  const [filter, setFilter] = useState<FeedFilter>('ALL');
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const android = (window as Window & { Android?: { getBoutsJson?: () => string } }).Android;
    if (android?.getBoutsJson) {
      try {
        const parsed = JSON.parse(android.getBoutsJson());
        if (Array.isArray(parsed)) {
          const active = parsed
            .filter((bout) => ['LIVE', 'UPCOMING', 'WAITING', 'COMPLETED', 'FINISHED'].includes(String(bout.status).toUpperCase()))
            .map((bout) => ({
              ...bout,
              id: asId(bout.id),
              fighterId: asId(bout.fighterId),
              status: String(bout.status).toUpperCase() === 'LIVE'
                ? 'LIVE'
                : ['COMPLETED', 'FINISHED'].includes(String(bout.status).toUpperCase()) ? 'COMPLETED' : 'WAITING',
              eventName: bout.eventName || 'Fight Event',
              eventType: bout.eventType || 'Normal Event',
              tournamentRound: bout.tournamentRound || '',
              ring: bout.ring || '',
              weightCategory: bout.weightCategory || '',
              timestamp: Number(bout.timestamp) || 0,
            })) as Bout[];
          setBridgeBouts(active);
        }
      } catch (error) {
        console.error('Android bridge load error:', error);
      }
    }

    const db = initFirebase();
    if (!db) {
      setIsLoading(false);
      return;
    }

    let fightersReady = false;
    let cardsReady = false;
    const markReady = () => {
      if (fightersReady && cardsReady) {
        setIsFirebaseConnected(true);
        setIsLoading(false);
      }
    };

    const unsubscribeFighters = onSnapshot(collection(db, 'fighters'), (snapshot) => {
      const next: Record<string, Fighter> = {};
      snapshot.forEach((document) => {
        const data = document.data() as Fighter;
        const id = asId(data.id) || document.id;
        next[id] = data;
        next[document.id] = data;
      });
      fightersReady = true;
      setFighters(next);
      markReady();
    }, (error) => {
      console.error('Fighters listener error:', error);
      setIsLoading(false);
    });

    const unsubscribeCards = onSnapshot(collection(db, 'live_fight_cards'), (snapshot) => {
      setRawCards(snapshot.docs.map((document) => ({
        docId: document.id,
        ...(document.data() as LiveFightCard),
      })));
      cardsReady = true;
      markReady();
    }, (error) => {
      console.error('Live bouts listener error:', error);
      setIsLoading(false);
    });

    return () => {
      unsubscribeFighters();
      unsubscribeCards();
    };
  }, []);

  const firestoreBouts = useMemo(() => rawCards
    .map((card) => mapCard(card, card.docId, fighters))
    .filter((bout): bout is Bout => bout !== null)
    .sort((a, b) => {
      const priority = { LIVE: 0, WAITING: 1, COMPLETED: 2 } as const;
      const statusOrder = priority[a.status] - priority[b.status];
      if (statusOrder !== 0) return statusOrder;
      return parseBoutNumber(a.boutNumber) - parseBoutNumber(b.boutNumber)
        || a.boutNumber.localeCompare(b.boutNumber)
        || a.timestamp - b.timestamp;
    }), [rawCards, fighters]);

  const bouts = isFirebaseConnected ? firestoreBouts : bridgeBouts;
  const filteredBouts = bouts.filter((bout) => filter === 'ALL' || bout.status === filter);
  const liveCount = bouts.filter((bout) => bout.status === 'LIVE').length;
  const waitingCount = bouts.filter((bout) => bout.status === 'WAITING').length;
  const completedCount = bouts.filter((bout) => bout.status === 'COMPLETED').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-red-600 selection:text-white">
      <Navbar isFirebaseConnected={isFirebaseConnected} />

      <main className="max-w-4xl mx-auto px-4 py-6 flex-grow w-full">
        <StatusBanner
          liveCount={liveCount}
          waitingCount={waitingCount}
          completedCount={completedCount}
          isFirebaseConnected={isFirebaseConnected}
        />
        <FilterTabs currentFilter={filter} onSelectFilter={(value) => setFilter(value as FeedFilter)} />

        <div className="space-y-3" aria-live="polite">
          {isLoading && bouts.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-slate-200 shadow-sm">
              <div className="mx-auto mb-3 h-6 w-6 rounded-full border-2 border-slate-200 border-t-red-600 animate-spin" />
              <p className="text-sm font-semibold text-slate-700">Loading active fighters…</p>
            </div>
          ) : filteredBouts.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-slate-200 shadow-sm">
              <p className="text-sm font-semibold text-slate-700 mb-1">No {filter === 'ALL' ? 'bouts for the active event' : `${filter.toLowerCase()} bouts`}</p>
              <p className="text-xs text-slate-500">The list updates automatically when a bout changes in the GOMO app.</p>
            </div>
          ) : filteredBouts.map((bout) => <BoutCard key={bout.id} bout={bout} />)}
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 px-8 py-6 mt-8">
        <div className="max-w-4xl mx-auto text-center text-xs text-slate-500 font-medium">
          <p>© 2026 GOMO Muaythai Club. Spectator Live Arena &amp; Scoreboard Feed.</p>
        </div>
      </footer>
    </div>
  );
}
