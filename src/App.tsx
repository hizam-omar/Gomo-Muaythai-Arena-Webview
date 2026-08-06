import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { collection, onSnapshot } from 'firebase/firestore';
import { AdminFightersPage } from './components/AdminFightersPage';
import { BoutCard } from './components/BoutCard';
import { BoutSectionHeader } from './components/BoutSectionHeader';
import { CollapsedLiveEventBar } from './components/CollapsedLiveEventBar';
import { EmptyBoutsState } from './components/EmptyBoutsState';
import { EventInfoSheet } from './components/EventInfoSheet';
import { FighterProfilePage } from './components/FighterProfilePage';
import { FighterSearch } from './components/FighterSearch';
import { Navbar } from './components/Navbar';
import { PullToRefresh } from './components/PullToRefresh';
import { StatusBanner } from './components/StatusBanner';
import { TournamentStandingsModal } from './components/TournamentStandingsModal';
import { VictoryOverlay } from './components/VictoryOverlay';
import { CompletedBoutsSection } from './components/CompletedBoutsSection';
import { initFirebase } from './lib/firebase';
import { fighterProfileUrl, fighterSlug } from './lib/fighter-profile';
import type { Bout, FightRecord, Fighter, LiveFightCard, RoundScore } from './types';

type FeedFilter = 'ALL' | 'LIVE' | 'UP_NEXT' | 'WAITING' | 'COMPLETED';
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
  const res = result.trim().toUpperCase();
  if (res === 'WIN') return 3;
  if (res === 'DRAW') return 4;
  return 5;
}

function mapRoundScores(card: LiveFightCard, isRed: boolean): RoundScore[] {
  if (Array.isArray(card.rounds) && card.rounds.length > 0) {
    return card.rounds.map((round, idx) => ({
      round: round.round ? String(round.round) : `R${idx + 1}`,
      red: isRed ? String(round.red || '0') : String(round.blue || '0'),
      blue: isRed ? String(round.blue || '0') : String(round.red || '0'),
    }));
  }

  const result: RoundScore[] = [];
  const entries: Array<[string | undefined, string]> = [
    [card.r1Score, 'R1'],
    [card.r2Score, 'R2'],
    [card.r3Score, 'R3'],
    [card.r4Score, 'R4'],
    [card.r5Score, 'R5'],
  ];

  for (const [score, label] of entries) {
    if (!score || !score.includes('-')) continue;
    const parts = score.split('-').map((s) => s.trim());
    if (parts.length === 2) {
      result.push({
        round: label,
        red: isRed ? parts[0] : parts[1],
        blue: isRed ? parts[1] : parts[0],
      });
    }
  }

  return result;
}

function scoreParts(score?: string): [string, string] | null {
  if (!score || !score.includes('-')) return null;
  const parts = score.split('-').map((s) => s.trim());
  if (parts.length !== 2) return null;
  return [parts[0], parts[1]];
}

function usableAvatar(fighter?: Fighter): string | undefined {
  if (!fighter) return undefined;
  const src = fighter.photoUrl || fighter.avatarUrl || fighter.imageUri;
  return src && src.trim() ? src.trim() : undefined;
}

function computeCalculatedStreaks(cards: LiveFightCard[]): Map<string, number> {
  const sorted = [...cards].sort((a, b) => (Number(a.completedAt) || Number(a.timestamp) || 0) - (Number(b.completedAt) || Number(b.timestamp) || 0));
  const map = new Map<string, number>();

  for (const card of sorted) {
    const fid = asId(card.fighterId);
    if (!fid) continue;
    if ((card.status || '').toUpperCase() !== 'COMPLETED') continue;
    if (map.get(fid) === -1) continue;
    const res = (card.result || '').toUpperCase();
    if (res === 'WIN') {
      map.set(fid, (map.get(fid) || 0) + 1);
    } else if (res === 'LOSS' || res === 'DRAW') {
      if (!map.has(fid)) map.set(fid, -1);
    }
  }
  return map;
}

function mapCard(
  data: LiveFightCard,
  docId: string,
  fighters: Record<string, Fighter>,
  calculatedStreaks?: Map<string, number>
): Bout | null {
  const fighterId = asId(data.fighterId);
  const rawStatus = (data.status || '').trim().toUpperCase();

  if (!fighterId || !['LIVE', 'UPCOMING', 'WAITING', 'COMPLETED', 'FINISHED'].includes(rawStatus)) return null;
  if ((data.eventStatus || '').trim().toUpperCase() === 'COMPLETED') return null;

  const fighter = fighters[fighterId] || {};
  const profileUrl = fighter.nickname || fighter.name ? fighterProfileUrl(fighter) : undefined;
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

  const fighterCalcStreak = calculatedStreaks?.get(fighterId);
  const fighterExplicitStreak = fighter.winStreak ?? fighter.streak ?? (fighterCalcStreak && fighterCalcStreak > 0 ? fighterCalcStreak : undefined);

  const opponentFighter = Object.values(fighters).find((f) => {
    const fname = (f.nickname || f.name || '').trim().toLowerCase();
    return fname && fname === opponentName.toLowerCase();
  });
  const opponentProfileUrl = opponentFighter ? fighterProfileUrl(opponentFighter) : undefined;
  const oppCalcStreak = opponentFighter?.id ? calculatedStreaks?.get(asId(opponentFighter.id)) : undefined;
  const opponentExplicitStreak = opponentFighter
    ? (opponentFighter.winStreak ?? opponentFighter.streak ?? (oppCalcStreak && oppCalcStreak > 0 ? oppCalcStreak : undefined))
    : undefined;

  const rawRedStreak = data.redWinStreak ?? (isRed ? (data.winStreak ?? data.streak ?? fighterExplicitStreak) : opponentExplicitStreak);
  const rawBlueStreak = data.blueWinStreak ?? (!isRed ? (data.winStreak ?? data.streak ?? fighterExplicitStreak) : opponentExplicitStreak);

  const redWinStreak = typeof rawRedStreak === 'number' && rawRedStreak > 0 ? rawRedStreak : undefined;
  const blueWinStreak = typeof rawBlueStreak === 'number' && rawBlueStreak > 0 ? rawBlueStreak : undefined;

  return {
    id: asId(data.id) || docId,
    fighterId,
    boutNumber: data.boutNumber?.trim() || asId(data.id) || docId,
    eventName: data.eventName?.trim() || 'Fight Event',
    startDate: data.startDate?.trim() || '',
    endDate: data.endDate?.trim() || '',
    location: data.location?.trim() || '',
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
    redProfileUrl: isRed ? profileUrl : opponentProfileUrl,
    blueName: isRed ? opponentName : fighterName,
    blueGym: isRed ? opponentClub : fighterClub,
    blueAvatar: isRed ? undefined : avatar,
    blueProfileUrl: isRed ? opponentProfileUrl : profileUrl,
    result: data.result?.trim().toUpperCase() || '',
    methodOrMedal: data.methodOrMedal?.trim() || '',
    medal: data.medal?.trim() || '',
    rounds,
    redPoints,
    bluePoints,
    redWinStreak,
    blueWinStreak,
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
  const [fightRecords, setFightRecords] = useState<FightRecord[]>([]);
  const [fighters, setFighters] = useState<Record<string, Fighter>>({});
  const [filter, setFilter] = useState<FeedFilter>('ALL');
  const [selectedRing, setSelectedRing] = useState<string>('ALL');
  const [fighterSearch, setFighterSearch] = useState('');
  const [medalFilter, setMedalFilter] = useState<MedalFilter>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [victoryBout, setVictoryBout] = useState<Bout | null>(null);
  const [showStandings, setShowStandings] = useState(false);
  const [showEventInfoSheet, setShowEventInfoSheet] = useState(false);
  const [isStickyBarVisible, setIsStickyBarVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('gomo-live-notifications-enabled') === 'true';
  });
  const [hasSetDefaultFilter, setHasSetDefaultFilter] = useState(false);
  const previousBoutStates = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem('gomo-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => {
      setIsStickyBarVisible(window.scrollY > 220);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
              startDate: String(bout.startDate || '').trim(),
              endDate: String(bout.endDate || '').trim(),
              location: String(bout.location || '').trim(),
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
        const fighter = { ...data, firestoreDocId: document.id };
        next[id] = fighter;
        next[document.id] = fighter;
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

    const unsubscribeFightRecords = onSnapshot(collection(db, 'fight_records'), (snapshot) => {
      setFightRecords(snapshot.docs.map((document) => ({ id: document.id, ...(document.data() as FightRecord) })));
    }, (error) => {
      console.error('Fight records listener error:', error);
    });

    return () => {
      if (bridgeRefreshTimer) window.clearInterval(bridgeRefreshTimer);
      unsubscribeFighters();
      unsubscribeCards();
      unsubscribeFightRecords();
    };
  }, []);

  useEffect(() => {
    const unlock = () => unlockVictoryAudio();
    document.addEventListener('pointerdown', unlock, { once: true });
    return () => document.removeEventListener('pointerdown', unlock);
  }, []);

  const firestoreBouts = useMemo(() => {
    const streaks = computeCalculatedStreaks(rawCards);
    return rawCards
      .map((card) => mapCard(card, card.docId, fighters, streaks))
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
      });
  }, [rawCards, fighters]);

  const sourceBouts = isFirebaseConnected ? firestoreBouts : bridgeBouts;
  const activeEventName = useMemo(() => {
    if (isFirebaseConnected) {
      const activeEventMarker = rawCards.find((card) => !asId(card.fighterId)
        && (card.eventStatus || '').trim().toUpperCase() === 'ACTIVE'
        && card.eventName?.trim());
      const activeEventBout = rawCards.find((card) => asId(card.fighterId)
        && (card.eventStatus || '').trim().toUpperCase() === 'ACTIVE'
        && card.eventName?.trim());
      return activeEventMarker?.eventName?.trim() || activeEventBout?.eventName?.trim() || '';
    }

    return bridgeBouts.find((bout) => bout.status === 'LIVE')?.eventName
      || bridgeBouts.find((bout) => bout.status === 'WAITING')?.eventName
      || bridgeBouts[0]?.eventName
      || '';
  }, [isFirebaseConnected, rawCards, bridgeBouts]);

  const bouts = useMemo(() => {
    const rawList = sourceBouts.filter((bout) => activeEventName !== ''
      && bout.eventName.localeCompare(activeEventName, undefined, { sensitivity: 'accent' }) === 0);

    const waitingCounter: Record<string, number> = {};

    return rawList.map((bout) => {
      if (bout.status === 'WAITING') {
        const rKey = bout.ring || 'default';
        const order = (waitingCounter[rKey] || 0) + 1;
        waitingCounter[rKey] = order;
        return {
          ...bout,
          waitOrder: order,
          isUpNext: order === 1,
        };
      }
      return bout;
    });
  }, [sourceBouts, activeEventName]);

  // Automatically default filter to LIVE if any bouts are actively live or up next, otherwise COMPLETED
  useEffect(() => {
    if (!isLoading && !hasSetDefaultFilter && bouts.length > 0) {
      const hasLiveOrNext = bouts.some((b) => b.status === 'LIVE' || b.isUpNext);
      if (hasLiveOrNext) {
        setFilter('LIVE');
      } else {
        setFilter('COMPLETED');
      }
      setHasSetDefaultFilter(true);
    }
  }, [isLoading, bouts, hasSetDefaultFilter]);

  const activeEventDetails = useMemo(() => {
    const activeCard = rawCards.find((card) => card.eventName?.trim() === activeEventName
      && (card.eventStatus || '').trim().toUpperCase() === 'ACTIVE');
    const activeBout = bouts[0];
    return {
      location: activeCard?.location?.trim() || activeBout?.location || '',
      startDate: activeCard?.startDate?.trim() || activeBout?.startDate || '',
      endDate: activeCard?.endDate?.trim() || activeBout?.endDate || '',
    };
  }, [rawCards, activeEventName, bouts]);

  const availableRings = useMemo(() => {
    return Array.from(new Set(bouts.map((b) => b.ring).filter((r) => Boolean(r && r.trim()))));
  }, [bouts]);

  const normalizedSearch = fighterSearch.trim().toLocaleLowerCase();
  const filteredBouts = bouts.filter((bout) => {
    const matchesRing = selectedRing === 'ALL' || bout.ring === selectedRing;

    let matchesStatus = true;
    if (filter === 'LIVE') matchesStatus = bout.status === 'LIVE';
    else if (filter === 'UP_NEXT') matchesStatus = Boolean(bout.isUpNext);
    else if (filter === 'WAITING') matchesStatus = bout.status === 'WAITING' && !bout.isUpNext;
    else if (filter === 'COMPLETED') matchesStatus = bout.status === 'COMPLETED';

    const matchesFighter = normalizedSearch === '' || [
      bout.redName,
      bout.blueName,
      bout.redGym,
      bout.blueGym,
      bout.eventName,
      bout.boutNumber,
    ].some((value) => value.toLocaleLowerCase().includes(normalizedSearch));

    const matchesMedal = medalFilter === null || bout.medal.toUpperCase().includes(medalFilter);

    return matchesRing && matchesStatus && matchesFighter && matchesMedal;
  });

  const liveCount = bouts.filter((bout) => bout.status === 'LIVE').length;
  const upNextCount = bouts.filter((bout) => bout.isUpNext).length;
  const waitingCount = bouts.filter((bout) => bout.status === 'WAITING' && !bout.isUpNext).length;
  const completedCount = bouts.filter((bout) => bout.status === 'COMPLETED').length;

  const medalCounts = useMemo(() => bouts.reduce((counts, bout) => {
    if (bout.status !== 'COMPLETED') return counts;
    const medal = bout.medal.trim().toUpperCase();
    if (medal.includes('GOLD')) counts.gold += 1;
    else if (medal.includes('SILVER')) counts.silver += 1;
    else if (medal.includes('BRONZE')) counts.bronze += 1;
    return counts;
  }, { gold: 0, silver: 0, bronze: 0 }), [bouts]);

  useEffect(() => {
    document.title = activeEventName
      ? `GOMO Muaythai Arena :: ${activeEventName}`
      : 'GOMO Muaythai Arena';
    if (!activeEventName) setShowStandings(false);
  }, [activeEventName]);

  useEffect(() => {
    const previous = previousBoutStates.current;
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

    const newlyLiveBout = bouts.find((bout) => {
      const oldState = previous.get(bout.id);
      if (oldState !== undefined) {
        const [oldStatus] = oldState.split(':');
        return oldStatus !== 'LIVE' && bout.status === 'LIVE';
      }
      return false;
    });

    previous.clear();
    bouts.forEach((bout) => previous.set(bout.id, `${bout.status}:${bout.result}`));

    if (winner) {
      setVictoryBout(winner);
      launchVictoryConfetti();
      playVictorySound();
    }

    if (newlyLiveBout) {
      const enabled = localStorage.getItem('gomo-live-notifications-enabled') === 'true';
      if (enabled && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Live Fight Started! 🥊', {
          body: `${newlyLiveBout.redName} vs ${newlyLiveBout.blueName} is now LIVE in ${newlyLiveBout.ring || 'the ring'}!`,
        });
      }
    }
  }, [bouts]);

  const dismissVictory = useCallback(() => setVictoryBout(null), []);

  const handleManualRefresh = useCallback(async () => {
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
              gomoCorner: String(bout.corner).toUpperCase() === 'BLUE' ? 'BLUE' : 'RED',
              eventName: bout.eventName || 'Fight Event',
              startDate: String(bout.startDate || '').trim(),
              endDate: String(bout.endDate || '').trim(),
              location: String(bout.location || '').trim(),
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
        console.error('Android bridge refresh error:', error);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 650));
  }, []);

  const requestedProfileSlug = decodeURIComponent(window.location.pathname.replace(/^\/+|\/+$/g, ''));
  const requestedFighter = requestedProfileSlug
    ? Object.values(fighters).find((fighter) => fighterSlug(fighter) === requestedProfileSlug)
    : undefined;

  if (requestedProfileSlug === 'fighters') {
    return <AdminFightersPage fighters={fighters} fightRecords={fightRecords} liveCards={rawCards} isLoading={isLoading} isConnected={isFirebaseConnected} theme={theme} onToggleTheme={() => setTheme((current) => current === 'light' ? 'dark' : 'light')} />;
  }

  if (requestedProfileSlug) {
    return (
      <FighterProfilePage
        fighter={requestedFighter}
        fightRecords={fightRecords}
        isLoading={isLoading}
        theme={theme}
        onToggleTheme={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}
      />
    );
  }

  // Section grouping arrays for ALL view mode
  const liveList = filteredBouts.filter((b) => b.status === 'LIVE');
  const upNextList = filteredBouts.filter((b) => b.isUpNext);
  const waitingList = filteredBouts.filter((b) => b.status === 'WAITING' && !b.isUpNext);
  const completedList = filteredBouts.filter((b) => b.status === 'COMPLETED');

  const showSectionedAllView = filter === 'ALL' && normalizedSearch === '' && medalFilter === null;

  const completedBoutsForSection = useMemo(() => {
    return bouts.filter((bout) => {
      if (bout.status !== 'COMPLETED') return false;

      // respect ring filter
      const matchesRing = selectedRing === 'ALL' || bout.ring === selectedRing;

      // respect search filter
      const matchesFighter = normalizedSearch === '' || [
        bout.redName,
        bout.blueName,
        bout.redGym,
        bout.blueGym,
        bout.eventName,
        bout.boutNumber,
      ].some((value) => value.toLocaleLowerCase().includes(normalizedSearch));

      return matchesRing && matchesFighter;
    });
  }, [bouts, selectedRing, normalizedSearch]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-red-600 selection:text-white dark:bg-slate-950 dark:text-slate-100">
      <Navbar
        theme={theme}
        onToggleTheme={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}
      />

      <CollapsedLiveEventBar
        isVisible={isStickyBarVisible}
        liveCount={liveCount}
        location={activeEventDetails.location}
        onOpenStandings={() => setShowStandings(true)}
        onOpenEventInfo={() => setShowEventInfoSheet(true)}
        onScrollToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />

      <main className="mx-auto w-full max-w-4xl flex-grow px-2 py-2.5 sm:px-4 sm:py-6">
        <PullToRefresh onRefresh={handleManualRefresh}>
          {Boolean(activeEventName && bouts.length > 0) && (
            <StatusBanner
              eventName={activeEventName}
              eventLocation={activeEventDetails.location}
              eventStartDate={activeEventDetails.startDate}
              eventEndDate={activeEventDetails.endDate}
              liveCount={liveCount}
              upNextCount={upNextCount}
              waitingCount={waitingCount}
              completedCount={completedCount}
              goldCount={medalCounts.gold}
              silverCount={medalCounts.silver}
              bronzeCount={medalCounts.bronze}
              isFirebaseConnected={isFirebaseConnected}
              onOpenStandings={() => setShowStandings(true)}
              onOpenEventInfo={() => setShowEventInfoSheet(true)}
              currentFilter={filter}
              onSelectFilter={(value) => {
                setFilter(value);
              }}
              onSyncNow={handleManualRefresh}
            />
          )}



          <div className="space-y-3" aria-live="polite">
            {isLoading && bouts.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="mx-auto mb-3 h-6 w-6 rounded-full border-2 border-slate-200 border-t-red-600 animate-spin" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Loading live bouts feed…</p>
              </div>
            ) : filter === 'LIVE' && liveCount === 0 ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-6 text-center shadow-xs dark:border-amber-950 dark:bg-amber-950/40">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-600 animate-ping" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">No bout is live right now</h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
                  The next bout is preparing to enter the ring shortly. View upcoming bouts or all schedule items.
                </p>
                <button
                  type="button"
                  onClick={() => setFilter('UP_NEXT')}
                  className="mt-3.5 inline-flex h-9 items-center justify-center rounded-xl bg-amber-500 px-4 text-xs font-extrabold text-amber-950 shadow-xs hover:bg-amber-400 transition"
                >
                  View Up Next Bouts ({upNextCount})
                </button>
              </div>
            ) : filteredBouts.length === 0 ? (
              <EmptyBoutsState
                activeEventName={activeEventName}
                filter={filter === 'UP_NEXT' ? 'WAITING' : filter}
                fighterSearch={fighterSearch}
                medalFilter={medalFilter}
              />
            ) : showSectionedAllView ? (
              <div className="space-y-4">
                {liveList.length > 0 && (
                  <section>
                    <BoutSectionHeader type="LIVE" count={liveList.length} />
                    <div className="mt-2 space-y-2.5">
                      {liveList.map((bout) => <BoutCard key={bout.id} bout={bout} />)}
                    </div>
                  </section>
                )}

                {upNextList.length > 0 && (
                  <section>
                    <BoutSectionHeader type="UP_NEXT" count={upNextList.length} />
                    <div className="mt-2 space-y-2.5">
                      {upNextList.map((bout) => <BoutCard key={bout.id} bout={bout} />)}
                    </div>
                  </section>
                )}

                {waitingList.length > 0 && (
                  <section>
                    <BoutSectionHeader type="WAITING" count={waitingList.length} />
                    <div className="mt-2 space-y-2.5">
                      {waitingList.map((bout) => <BoutCard key={bout.id} bout={bout} />)}
                    </div>
                  </section>
                )}

                {completedBoutsForSection.length > 0 && (
                  <section>
                    <CompletedBoutsSection
                      bouts={completedBoutsForSection}
                      isEventFullyCompleted={liveCount === 0 && waitingCount === 0}
                      availableRings={availableRings}
                      globalMedalFilter={medalFilter}
                    />
                  </section>
                )}
              </div>
            ) : filter === 'COMPLETED' ? (
              <CompletedBoutsSection
                bouts={completedBoutsForSection}
                isEventFullyCompleted={liveCount === 0 && waitingCount === 0}
                availableRings={availableRings}
                globalMedalFilter={medalFilter}
              />
            ) : (
              <div className="space-y-2.5">
                {filter !== 'ALL' && (
                  <BoutSectionHeader
                    type={filter === 'UP_NEXT' ? 'UP_NEXT' : filter}
                    count={filteredBouts.length}
                  />
                )}
                {filteredBouts.map((bout) => <BoutCard key={bout.id} bout={bout} />)}
              </div>
            )}
          </div>
        </PullToRefresh>
      </main>

      <footer className="mt-6 border-t border-slate-200 bg-white px-4 py-5 dark:border-slate-800 dark:bg-slate-900 sm:mt-8 sm:px-8 sm:py-6">
        <div className="max-w-4xl mx-auto text-center text-xs text-slate-500 font-medium">
          <p>© 2026 GOMO Muaythai Club. Spectator Live Arena &amp; Scoreboard Feed.</p>
        </div>
      </footer>

      {victoryBout && <VictoryOverlay bout={victoryBout} onDismiss={dismissVictory} />}

      {showStandings && (
        <TournamentStandingsModal
          eventName={activeEventName}
          bouts={bouts}
          onDismiss={() => setShowStandings(false)}
        />
      )}

      <EventInfoSheet
        isOpen={showEventInfoSheet}
        onClose={() => setShowEventInfoSheet(false)}
        eventName={activeEventName}
        eventLocation={activeEventDetails.location}
        eventStartDate={activeEventDetails.startDate}
        eventEndDate={activeEventDetails.endDate}
        liveCount={liveCount}
        waitingCount={waitingCount + upNextCount}
        completedCount={completedCount}
        activeRings={availableRings}
        isFirebaseConnected={isFirebaseConnected}
        onOpenStandings={() => setShowStandings(true)}
        notificationsEnabled={notificationsEnabled}
        onToggleNotifications={(enabled) => {
          setNotificationsEnabled(enabled);
          localStorage.setItem('gomo-live-notifications-enabled', enabled ? 'true' : 'false');
        }}
      />
    </div>
  );
}
