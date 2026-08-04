import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { collection, onSnapshot } from 'firebase/firestore';
import { BoutCard } from './components/BoutCard';
import { FilterTabs } from './components/FilterTabs';
import { Navbar } from './components/Navbar';
import { StatusBanner } from './components/StatusBanner';
import { VictoryOverlay } from './components/VictoryOverlay';
import { TournamentStandingsModal } from './components/TournamentStandingsModal';
import { FighterSearch } from './components/FighterSearch';
import { initFirebase } from './lib/firebase';
import type { Bout, Fighter, LiveFightCard, RoundScore } from './types';

type FeedFilter = 'ALL' | 'LIVE' | 'WAITING' | 'COMPLETED';
type Theme = 'light' | 'dark';
type MedalFilter = 'GOLD' | 'SILVER' | 'BRONZE' | null;

let victoryAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    const AudioContextClass = window.AudioContext
      || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    victoryAudioContext ||= new AudioContextClass();
    return victoryAudioContext;
  } catch {
    return null;
  }
}

function unlockVictoryAudio() {
  const context = getAudioContext();
  if (context?.state === 'suspended') void context.resume();
}

function playVictorySound() {
  const context = getAudioContext();
  if (!context) return;
  if (context.state === 'suspended') void context.resume();

  const now = context.currentTime;

  // Synthesized crowd roar: filtered noise with a natural swell and fade.
  const cheerDuration = 3.8;
  const cheerBuffer = context.createBuffer(2, Math.floor(context.sampleRate * cheerDuration), context.sampleRate);
  for (let channel = 0; channel < cheerBuffer.numberOfChannels; channel += 1) {
    const samples = cheerBuffer.getChannelData(channel);
    let smoothed = 0;
    for (let index = 0; index < samples.length; index += 1) {
      smoothed = smoothed * 0.86 + (Math.random() * 2 - 1) * 0.14;
      samples[index] = smoothed;
    }
  }
  const cheerSource = context.createBufferSource();
  const cheerHighPass = context.createBiquadFilter();
  const cheerLowPass = context.createBiquadFilter();
  const cheerGain = context.createGain();
  cheerSource.buffer = cheerBuffer;
  cheerHighPass.type = 'highpass';
  cheerHighPass.frequency.value = 180;
  cheerLowPass.type = 'lowpass';
  cheerLowPass.frequency.setValueAtTime(1800, now);
  cheerLowPass.frequency.exponentialRampToValueAtTime(3800, now + 0.7);
  cheerLowPass.frequency.exponentialRampToValueAtTime(2200, now + cheerDuration);
  cheerGain.gain.setValueAtTime(0.0001, now);
  cheerGain.gain.exponentialRampToValueAtTime(0.38, now + 0.28);
  cheerGain.gain.setValueAtTime(0.3, now + 1.8);
  cheerGain.gain.exponentialRampToValueAtTime(0.0001, now + cheerDuration);
  cheerSource.connect(cheerHighPass).connect(cheerLowPass).connect(cheerGain).connect(context.destination);
  cheerSource.start(now);
  cheerSource.stop(now + cheerDuration);

  // Short bursts give the crowd texture similar to clapping.
  [0.18, 0.34, 0.52, 0.74, 0.98, 1.25, 1.58, 1.92, 2.28].forEach((offset) => {
    const clapDuration = 0.075;
    const clapBuffer = context.createBuffer(1, Math.floor(context.sampleRate * clapDuration), context.sampleRate);
    const samples = clapBuffer.getChannelData(0);
    for (let index = 0; index < samples.length; index += 1) {
      samples[index] = (Math.random() * 2 - 1) * Math.pow(1 - index / samples.length, 3);
    }
    const clap = context.createBufferSource();
    const clapFilter = context.createBiquadFilter();
    const clapGain = context.createGain();
    clap.buffer = clapBuffer;
    clapFilter.type = 'bandpass';
    clapFilter.frequency.value = 1400 + Math.random() * 900;
    clapFilter.Q.value = 0.8;
    clapGain.gain.value = 0.24;
    clap.connect(clapFilter).connect(clapGain).connect(context.destination);
    clap.start(now + offset);
  });

  // Two quick whistles sit above the roar without overpowering the chime.
  [0.45, 1.15].forEach((offset, index) => {
    const whistle = context.createOscillator();
    const whistleGain = context.createGain();
    const start = now + offset;
    whistle.type = 'sine';
    whistle.frequency.setValueAtTime(1650 + index * 190, start);
    whistle.frequency.exponentialRampToValueAtTime(2350 + index * 170, start + 0.45);
    whistleGain.gain.setValueAtTime(0.0001, start);
    whistleGain.gain.exponentialRampToValueAtTime(0.035, start + 0.05);
    whistleGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.52);
    whistle.connect(whistleGain).connect(context.destination);
    whistle.start(start);
    whistle.stop(start + 0.55);
  });

  // Rising victory chord, matching the notification-like Android cue.
  [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = now + index * 0.12;
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.22, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.32);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.34);
  });
}

function launchVictoryConfetti() {
  const colors = ['#ffd700', '#2ecc71', '#e74c3c', '#3498db', '#9b59b6', '#e67e22', '#ecf0f1'];
  confetti({ particleCount: 100, spread: 90, startVelocity: 48, origin: { x: 0.5, y: 0.55 }, colors });
  window.setTimeout(() => {
    confetti({ particleCount: 55, angle: 60, spread: 70, origin: { x: 0, y: 0.65 }, colors });
    confetti({ particleCount: 55, angle: 120, spread: 70, origin: { x: 1, y: 0.65 }, colors });
  }, 220);
}

function asId(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

function parseBoutNumber(value: string): number {
  const digits = value.match(/\d+/)?.[0];
  return digits ? Number(digits) : Number.MAX_SAFE_INTEGER;
}

function completedCategoryPriority(medal: string, result: string): number {
  const value = medal.trim().toUpperCase();
  if (value.includes('GOLD')) return 0;
  if (value.includes('SILVER')) return 1;
  if (value.includes('BRONZE')) return 2;
  if (result.trim().toUpperCase() === 'WIN') return 3;
  if (result.trim().toUpperCase() === 'LOSS') return 4;
  if (result.trim().toUpperCase() === 'DRAW') return 5;
  return 6;
}

function scoreParts(value?: string): [string, string] | null {
  if (!value?.trim()) return null;
  const parts = value.split(/[-/:,]/).map((part) => part.trim());
  return parts.length >= 2 && parts[0] !== '' && parts[1] !== ''
    ? [parts[0], parts[1]]
    : null;
}

function mapRoundScores(data: LiveFightCard, gomoIsRed: boolean): RoundScore[] {
  const values = [data.r1Score, data.r2Score, data.r3Score, data.r4Score, data.r5Score];
  return values.flatMap((value, index) => {
    const parts = scoreParts(value);
    if (!parts) return [];
    return [{
      round: `R${index + 1}`,
      red: gomoIsRed ? parts[0] : parts[1],
      blue: gomoIsRed ? parts[1] : parts[0],
    }];
  });
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
  const rounds = mapRoundScores(data, isRed);
  const totalParts = scoreParts(data.score);
  const calculatedRedTotal = rounds.reduce((total, round) => total + (Number(round.red) || 0), 0);
  const calculatedBlueTotal = rounds.reduce((total, round) => total + (Number(round.blue) || 0), 0);
  const redPoints = totalParts
    ? (isRed ? totalParts[0] : totalParts[1])
    : rounds.length > 0 ? String(calculatedRedTotal) : '';
  const bluePoints = totalParts
    ? (isRed ? totalParts[1] : totalParts[0])
    : rounds.length > 0 ? String(calculatedBlueTotal) : '';

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
    gomoCorner: isRed ? 'RED' : 'BLUE',
    redName: isRed ? fighterName : opponentName,
    redGym: isRed ? fighterClub : opponentClub,
    redAvatar: isRed ? avatar : undefined,
    blueName: isRed ? opponentName : fighterName,
    blueGym: isRed ? opponentClub : fighterClub,
    blueAvatar: isRed ? undefined : avatar,
    result: data.result?.trim().toUpperCase() || '',
    methodOrMedal: data.methodOrMedal?.trim() || '',
    medal: data.medal?.trim() || '',
    rounds,
    redPoints,
    bluePoints,
    timestamp: Number(data.completedAt) || Number(data.timestamp) || 0,
  };
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = window.localStorage.getItem('gomo-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [bridgeBouts, setBridgeBouts] = useState<Bout[]>([]);
  const [rawCards, setRawCards] = useState<Array<LiveFightCard & { docId: string }>>([]);
  const [fighters, setFighters] = useState<Record<string, Fighter>>({});
  const [filter, setFilter] = useState<FeedFilter>('ALL');
  const [fighterSearch, setFighterSearch] = useState('');
  const [medalFilter, setMedalFilter] = useState<MedalFilter>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [victoryBout, setVictoryBout] = useState<Bout | null>(null);
  const [showStandings, setShowStandings] = useState(false);
  const previousBoutStates = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem('gomo-theme', theme);
  }, [theme]);

  useEffect(() => {
    const android = (window as Window & { Android?: { getBoutsJson?: () => string } }).Android;
    const refreshAndroidBridge = () => {
      if (!android?.getBoutsJson) return;
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
              gomoCorner: String(bout.corner).toUpperCase() === 'BLUE' ? 'BLUE' : 'RED',
              eventName: bout.eventName || 'Fight Event',
              eventType: bout.eventType || 'Normal Event',
              tournamentRound: bout.tournamentRound || '',
              ring: bout.ring || '',
              weightCategory: bout.weightCategory || '',
              result: String(bout.result || '').trim().toUpperCase(),
              methodOrMedal: bout.methodOrMedal || '',
              medal: bout.medal || '',
              rounds: Array.isArray(bout.rounds) ? bout.rounds : [],
              redPoints: bout.redPoints === undefined ? '' : String(bout.redPoints),
              bluePoints: bout.bluePoints === undefined ? '' : String(bout.bluePoints),
              timestamp: Number(bout.completedAt) || Number(bout.timestamp) || 0,
            })) as Bout[];
          setBridgeBouts(active);
        }
      } catch (error) {
        console.error('Android bridge load error:', error);
      }
    };
    refreshAndroidBridge();
    const bridgeRefreshTimer = android?.getBoutsJson
      ? window.setInterval(refreshAndroidBridge, 1500)
      : undefined;

    const db = initFirebase();
    if (!db) {
      setIsLoading(false);
      return () => {
        if (bridgeRefreshTimer) window.clearInterval(bridgeRefreshTimer);
      };
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
      if (bridgeRefreshTimer) window.clearInterval(bridgeRefreshTimer);
      unsubscribeFighters();
      unsubscribeCards();
    };
  }, []);

  useEffect(() => {
    const unlock = () => unlockVictoryAudio();
    document.addEventListener('pointerdown', unlock, { once: true });
    return () => document.removeEventListener('pointerdown', unlock);
  }, []);

  const firestoreBouts = useMemo(() => rawCards
    .map((card) => mapCard(card, card.docId, fighters))
    .filter((bout): bout is Bout => bout !== null)
    .sort((a, b) => {
      const priority = { LIVE: 0, WAITING: 1, COMPLETED: 2 } as const;
      const statusOrder = priority[a.status] - priority[b.status];
      if (statusOrder !== 0) return statusOrder;
      if (a.status === 'COMPLETED' && b.status === 'COMPLETED') {
        const categoryOrder = completedCategoryPriority(a.medal, a.result) - completedCategoryPriority(b.medal, b.result);
        if (categoryOrder !== 0) return categoryOrder;
        const latestOrder = b.timestamp - a.timestamp;
        if (latestOrder !== 0) return latestOrder;
      }
      return parseBoutNumber(a.boutNumber) - parseBoutNumber(b.boutNumber)
        || a.boutNumber.localeCompare(b.boutNumber)
        || a.timestamp - b.timestamp;
    }), [rawCards, fighters]);

  const bouts = isFirebaseConnected ? firestoreBouts : bridgeBouts;
  const normalizedSearch = fighterSearch.trim().toLocaleLowerCase();
  const filteredBouts = bouts.filter((bout) => {
    const matchesStatus = filter === 'ALL' || bout.status === filter;
    const matchesFighter = normalizedSearch === '' || [
      bout.redName,
      bout.blueName,
      bout.redGym,
      bout.blueGym,
      bout.eventName,
      bout.boutNumber,
    ].some((value) => value.toLocaleLowerCase().includes(normalizedSearch));
    const matchesMedal = medalFilter === null || bout.medal.toUpperCase().includes(medalFilter);
    return matchesStatus && matchesFighter && matchesMedal;
  });
  const liveCount = bouts.filter((bout) => bout.status === 'LIVE').length;
  const waitingCount = bouts.filter((bout) => bout.status === 'WAITING').length;
  const completedCount = bouts.filter((bout) => bout.status === 'COMPLETED').length;
  const activeEventName = useMemo(() => {
    const eventMarker = rawCards.find((card) => !asId(card.fighterId)
      && (card.eventStatus || '').trim().toUpperCase() !== 'COMPLETED'
      && card.eventName?.trim());
    return eventMarker?.eventName?.trim()
      || bouts.find((bout) => bout.status === 'LIVE')?.eventName
      || bouts.find((bout) => bout.status === 'WAITING')?.eventName
      || bouts[0]?.eventName
      || '';
  }, [rawCards, bouts]);
  const activeEventBouts = useMemo(() => bouts.filter((bout) =>
    activeEventName !== '' && bout.eventName.localeCompare(activeEventName, undefined, { sensitivity: 'accent' }) === 0
  ), [bouts, activeEventName]);
  const medalCounts = useMemo(() => bouts.reduce((counts, bout) => {
    if (bout.status !== 'COMPLETED') return counts;
    const medal = bout.medal.trim().toUpperCase();
    if (medal.includes('GOLD')) counts.gold += 1;
    else if (medal.includes('SILVER')) counts.silver += 1;
    else if (medal.includes('BRONZE')) counts.bronze += 1;
    return counts;
  }, { gold: 0, silver: 0, bronze: 0 }), [bouts]);

  useEffect(() => {
    const previous = previousBoutStates.current;

    // Seed the first received snapshot without replaying historical wins.
    if (previous.size === 0) {
      bouts.forEach((bout) => previous.set(bout.id, `${bout.status}:${bout.result}`));
      return;
    }

    const winner = bouts.find((bout) => {
      const oldState = previous.get(bout.id);
      return oldState !== undefined
        && oldState !== 'COMPLETED:WIN'
        && bout.status === 'COMPLETED'
        && bout.result === 'WIN';
    });

    previous.clear();
    bouts.forEach((bout) => previous.set(bout.id, `${bout.status}:${bout.result}`));

    if (winner) {
      setVictoryBout(winner);
      launchVictoryConfetti();
      playVictorySound();
    }
  }, [bouts]);

  const dismissVictory = useCallback(() => setVictoryBout(null), []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-red-600 selection:text-white dark:bg-slate-950 dark:text-slate-100">
      <Navbar
        isFirebaseConnected={isFirebaseConnected}
        theme={theme}
        onToggleTheme={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}
      />

      <main className="max-w-4xl mx-auto px-4 py-6 flex-grow w-full">
        <StatusBanner
          liveCount={liveCount}
          waitingCount={waitingCount}
          completedCount={completedCount}
          goldCount={medalCounts.gold}
          silverCount={medalCounts.silver}
          bronzeCount={medalCounts.bronze}
          isFirebaseConnected={isFirebaseConnected}
          onOpenStandings={() => setShowStandings(true)}
          selectedMedal={medalFilter}
          onSelectMedal={(medal) => {
            setMedalFilter((current) => current === medal ? null : medal);
            setFilter('COMPLETED');
          }}
        />
        <FighterSearch value={fighterSearch} onChange={setFighterSearch} />
        <FilterTabs currentFilter={filter} onSelectFilter={(value) => {
          setFilter(value as FeedFilter);
          setMedalFilter(null);
        }} />

        <div className="space-y-3" aria-live="polite">
          {isLoading && bouts.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mx-auto mb-3 h-6 w-6 rounded-full border-2 border-slate-200 border-t-red-600 animate-spin" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Loading active fighters…</p>
            </div>
          ) : filteredBouts.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-semibold text-slate-700 mb-1 dark:text-slate-200">
                {normalizedSearch
                  ? `No fighter found for “${fighterSearch.trim()}”`
                  : medalFilter ? `No ${medalFilter.toLowerCase()} medal winners yet`
                    : `No ${filter === 'ALL' ? 'bouts for the active event' : `${filter.toLowerCase()} bouts`}`}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {normalizedSearch ? 'Try another fighter or opponent name.' : 'The list updates automatically when a bout changes in the GOMO app.'}
              </p>
            </div>
          ) : filteredBouts.map((bout) => <BoutCard key={bout.id} bout={bout} />)}
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 px-8 py-6 mt-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto text-center text-xs text-slate-500 font-medium">
          <p>© 2026 GOMO Muaythai Club. Spectator Live Arena &amp; Scoreboard Feed.</p>
        </div>
      </footer>
      {victoryBout && <VictoryOverlay bout={victoryBout} onDismiss={dismissVictory} />}
      {showStandings && (
        <TournamentStandingsModal
          eventName={activeEventName}
          bouts={activeEventBouts}
          onDismiss={() => setShowStandings(false)}
        />
      )}
    </div>
  );
}
