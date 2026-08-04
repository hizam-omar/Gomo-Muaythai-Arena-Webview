import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Bout } from './types';
import { Navbar } from './components/Navbar';
import { StatusBanner } from './components/StatusBanner';
import { FilterTabs } from './components/FilterTabs';
import { BoutCard } from './components/BoutCard';
import { initFirebase } from './lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

const DEFAULT_BOUTS: Bout[] = [];

export default function App() {
  const [bouts, setBouts] = useState<Bout[]>(DEFAULT_BOUTS);
  const [filter, setFilter] = useState<string>('ALL');
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);

  const [rawBouts, setRawBouts] = useState<any[]>([]);
  const [fightersMap, setFightersMap] = useState<Record<string, any>>({});

  // Check for Android bridge or Firebase on mount
  useEffect(() => {
    // Check Android Interface
    if (typeof (window as any).Android !== 'undefined') {
      try {
        const jsonStr = (window as any).Android.getBoutsJson();
        if (jsonStr) {
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setBouts(parsed);
          }
        }
      } catch (e) {
        console.error("Android bridge load error:", e);
      }
    }

    // Check Firebase
    const db = initFirebase();
    if (db) {
      setIsFirebaseConnected(true);
      try {
        const unFighters = onSnapshot(query(collection(db, 'fighters')), (snapshot) => {
          const fMap: Record<string, any> = {};
          snapshot.forEach(doc => {
            fMap[doc.id] = doc.data();
          });
          setFightersMap(fMap);
        });

        const unBouts = onSnapshot(query(collection(db, 'live_fight_cards')), (snapshot) => {
          const rBouts: any[] = [];
          snapshot.forEach((doc) => {
            rBouts.push({ id: doc.id, ...doc.data() });
          });
          setRawBouts(rBouts);
        }, (error) => {
          console.error("Firestore snapshot error:", error);
        });
        return () => { unFighters(); unBouts(); };
      } catch (e) {
        console.error("Firebase listener error:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseConnected || rawBouts.length === 0) return;

    const mappedBouts: Bout[] = rawBouts.map(data => {
      const mainFighterId = String(data.fighterId || '');
      const mainFighter = fightersMap[mainFighterId] || {};
      
      const isMainRed = data.corner === 'RED';
      const isMainBlue = data.corner === 'BLUE';

      // Fallback if corner is not set
      const redFighterName = isMainRed ? (mainFighter.name || 'Red Fighter') : (data.opponentName || 'Red Fighter');
      const redFighterGym = isMainRed ? (mainFighter.club || 'GOMO Club') : (data.opponentClub || 'Opponent Club');
      const redAvatar = isMainRed ? (mainFighter.photoUrl || mainFighter.avatarUrl || '') : '';
      
      const blueFighterName = isMainBlue ? (mainFighter.name || 'Blue Fighter') : (data.opponentName || 'Blue Fighter');
      const blueFighterGym = isMainBlue ? (mainFighter.club || 'GOMO Club') : (data.opponentClub || 'Opponent Club');
      const blueAvatar = isMainBlue ? (mainFighter.photoUrl || mainFighter.avatarUrl || '') : '';

      return {
        id: data.id,
        boutNumber: data.boutNumber || `Bout #${data.id}`,
        roundName: data.tournamentRound ? `${data.tournamentRound} (${data.weightCategory || ''})` : 'Muaythai Match',
        status: data.status || 'LIVE',
        redName: redFighterName,
        redGym: redFighterGym,
        redPoints: parseInt(data.r1Score || '0', 10),
        redAvatar: redAvatar,
        blueName: blueFighterName,
        blueGym: blueFighterGym,
        bluePoints: parseInt(data.r2Score || '0', 10),
        blueAvatar: blueAvatar,
        isWinnerRed: (isMainRed && data.result === 'WIN') || (isMainBlue && data.result === 'LOSS'),
        isWinnerBlue: (isMainBlue && data.result === 'WIN') || (isMainRed && data.result === 'LOSS'),
      } as Bout;
    });

    // Check for new winners to trigger confetti
    mappedBouts.forEach(rb => {
      const prev = bouts.find(b => b.id === rb.id);
      if (prev && (!prev.isWinnerRed && !prev.isWinnerBlue) && (rb.isWinnerRed || rb.isWinnerBlue)) {
        triggerConfetti();
      }
    });

    setBouts(mappedBouts);
  }, [rawBouts, fightersMap, isFirebaseConnected]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.4 },
      colors: ['#ef4444', '#f59e0b', '#1e293b', '#3b82f6']
    });
  };

  const filteredBouts = bouts.filter(b => filter === 'ALL' || b.status === filter);
  const activeBoutsCount = bouts.filter(b => b.status === 'LIVE').length;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900 font-sans selection:bg-red-600 selection:text-white">
      {/* Header */}
      <Navbar 
        isFirebaseConnected={isFirebaseConnected}
      />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 flex-grow w-full">
        <StatusBanner 
          activeCount={activeBoutsCount}
          isFirebaseConnected={isFirebaseConnected}
        />

        <FilterTabs 
          currentFilter={filter}
          onSelectFilter={setFilter}
        />

        {/* Bouts Feed */}
        <div className="space-y-4">
          {filteredBouts.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-slate-500 text-xs border border-slate-200 shadow-sm">
              <p className="text-sm font-semibold text-slate-700 mb-1">No active bouts found for "{filter}"</p>
              <p className="text-slate-500">Fights managed via the GOMO Muaythai app will appear here automatically.</p>
            </div>
          ) : (
            filteredBouts.map(bout => (
              <BoutCard key={bout.id} bout={bout} />
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 px-8 py-6 mt-8">
        <div className="max-w-4xl mx-auto text-center text-xs text-slate-500 font-medium">
          <p>© 2026 GOMO Muaythai Club. Spectator Live Arena & Scoreboard Feed.</p>
        </div>
      </footer>

    </div>
  );
}
