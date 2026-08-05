import { useMemo, useState } from 'react';
import { ArrowLeft, Check, ChevronDown, Cloud, Download, LogOut, Medal, Moon, Pencil, RefreshCw, Search, Share2, Star, Sun, Trophy, Users, X } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import logo from '../assets/images/gomo_logo_1785735883874.jpg';
import { AdminLoginModal } from './AdminLoginModal';
import { endAdminSession, isAdminAuthenticated } from '../lib/admin';
import { fighterProfileUrl, fighterWeightCategory } from '../lib/fighter-profile';
import { initFirebase } from '../lib/firebase';
import type { FightRecord, Fighter, LiveFightCard } from '../types';

type AgeFilter = 'ALL' | 'JUNIOR' | 'YOUTH' | 'STARRED';
type MedalCounts = { gold: number; silver: number; bronze: number };

function avatarUrl(fighter: Fighter): string | undefined {
  const value = fighter.imageUri || fighter.photoUrl || fighter.avatarUrl;
  if (!value || /^(content:|file:|\/)/i.test(value)) return undefined;
  if (value.startsWith('data:image') || value.length > 200) return value.startsWith('data:image') ? value : `data:image/jpeg;base64,${value}`;
  return value;
}

function uniqueFighters(fighters: Record<string, Fighter>): Fighter[] {
  const seen = new Set<string>();
  return Object.values(fighters).filter((fighter) => {
    const key = fighter.firestoreDocId || String(fighter.id || `${fighter.nickname}-${fighter.name}`);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function medalType(value = ''): keyof MedalCounts | null {
  const medal = value.toUpperCase();
  if (medal.includes('GOLD') || medal.includes('EMAS')) return 'gold';
  if (medal.includes('SILVER') || medal.includes('PERAK')) return 'silver';
  if (medal.includes('BRONZE') || medal.includes('GANGSA')) return 'bronze';
  return null;
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: 'fighters' | 'wins' | 'rate' }) {
  const Icon = icon === 'fighters' ? Users : icon === 'wins' ? Trophy : Medal;
  return <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4"><Icon className="h-4 w-4 text-red-600" /><p className="mt-2 truncate text-[9px] font-black uppercase tracking-wider text-slate-400 sm:text-[10px]">{label}</p><p className="font-combat mt-0.5 text-xl font-black text-slate-900 dark:text-white sm:text-2xl">{value}</p></div>;
}

function MedalDashboard({ counts, totalFights }: { counts: MedalCounts; totalFights: number }) {
  const total = counts.gold + counts.silver + counts.bronze;
  const goldEnd = total ? (counts.gold / total) * 360 : 0;
  const silverEnd = total ? goldEnd + (counts.silver / total) * 360 : 0;
  const background = total ? `conic-gradient(#f59e0b 0deg ${goldEnd}deg, #94a3b8 ${goldEnd}deg ${silverEnd}deg, #c2410c ${silverEnd}deg 360deg)` : 'conic-gradient(#e2e8f0 0deg 360deg)';
  return <section className="flex items-center gap-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full" style={{ background }}><div className="grid h-16 w-16 place-items-center rounded-full bg-white text-center dark:bg-slate-900"><div><p className="text-xl font-black">{total}</p><p className="text-[8px] font-black uppercase text-slate-400">Medals</p></div></div></div><div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-600">Club achievement</p><h2 className="font-combat text-lg font-black uppercase">Medal Dashboard</h2><div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black"><span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">🥇 {counts.gold}</span><span className="rounded-full bg-slate-200 px-2.5 py-1 text-slate-700">🥈 {counts.silver}</span><span className="rounded-full bg-orange-100 px-2.5 py-1 text-orange-800">🥉 {counts.bronze}</span></div><p className="mt-2 text-[10px] font-semibold text-slate-400">Across {totalFights} recorded fights</p></div></section>;
}

function FighterRosterCard({ fighter, medals, isLive, expanded, selected, selectionMode, onExpand, onSelect, onStar }: {
  fighter: Fighter; medals: MedalCounts; isLive: boolean; expanded: boolean; selected: boolean; selectionMode: boolean;
  onExpand: () => void; onSelect: () => void; onStar: () => void; key?: string;
}) {
  const photo = avatarUrl(fighter);
  const name = fighter.nickname || fighter.name || 'GOMO Fighter';
  const fights = Number(fighter.wins || 0) + Number(fighter.losses || 0) + Number(fighter.draws || 0);
  const winRate = fights ? Math.floor((Number(fighter.wins || 0) / fights) * 100) : 0;
  const updated = Number(fighter.updatedAt || fighter.createdAt);
  const profileUrl = fighterProfileUrl(fighter);
  const share = async () => {
    const url = new URL(profileUrl, window.location.origin).toString();
    if (navigator.share) await navigator.share({ title: name, url });
    else await navigator.clipboard.writeText(url);
  };
  return (
    <article className={`relative overflow-hidden rounded-2xl border bg-white shadow-sm transition dark:bg-slate-900 ${selected ? 'border-red-600 ring-2 ring-red-100 dark:ring-red-950' : 'border-slate-200 dark:border-slate-800'}`}>
      <div className="flex cursor-pointer items-center gap-3 p-4 pr-12" onClick={selectionMode ? onSelect : () => window.location.assign(profileUrl)}>
        {selectionMode && <span className={`grid h-5 w-5 shrink-0 place-items-center rounded border ${selected ? 'border-red-600 bg-red-600 text-white' : 'border-slate-300'}`}>{selected && <Check className="h-3 w-3" />}</span>}
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-red-600 bg-red-100 text-sm font-black text-red-700">{photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2)}</div>
        <div className="min-w-0 flex-1"><p className="text-[9px] font-black uppercase tracking-wider text-red-600">Kelab Muaythai Gomo</p><div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-1.5"><h3 className="font-combat truncate text-base font-black uppercase">{name}</h3>{isLive && <span className="animate-pulse rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-black text-white">● LIVE</span>}<span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[9px] font-black text-red-700 dark:bg-red-950 dark:text-red-300">{fighter.age || 0} yo</span></div><p className="truncate text-xs text-slate-500">{fighter.name || name}</p>{fighter.school && <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-400">🎓 {fighter.school}</p>}<div className="mt-1.5 flex flex-wrap gap-1 text-[9px] font-black">{medals.gold > 0 && <span>🥇{medals.gold}</span>}{medals.silver > 0 && <span>🥈{medals.silver}</span>}{medals.bronze > 0 && <span>🥉{medals.bronze}</span>}</div></div>
      </div>
      {!selectionMode && <button type="button" onClick={onStar} aria-label="Star fighter" className={`absolute right-3 top-3 rounded-lg p-2 ${fighter.isStarred ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'}`}><Star className={`h-5 w-5 ${fighter.isStarred ? 'fill-current' : ''}`} /></button>}
      {!selectionMode && <button type="button" onClick={onExpand} className="flex w-full items-center justify-center gap-1 border-t border-slate-100 py-2 text-[11px] font-black text-red-600 dark:border-slate-800">{expanded ? 'See less' : 'See more'}<ChevronDown className={`h-4 w-4 transition ${expanded ? 'rotate-180' : ''}`} /></button>}
      {expanded && !selectionMode && <div className="border-t border-slate-100 p-4 dark:border-slate-800"><div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-100 p-3 dark:bg-slate-950"><div className="flex gap-1 text-[10px] font-black text-white"><span className="rounded bg-emerald-600 px-2 py-1">{fighter.wins || 0} W</span><span className="rounded bg-rose-600 px-2 py-1">{fighter.losses || 0} L</span><span className="rounded bg-amber-500 px-2 py-1">{fighter.draws || 0} D</span><span className="px-1 py-1 text-red-600">{winRate}% Win</span></div><span className="text-[11px] font-black">{Number(fighter.weightKg || 0)} kg · {fighter.heightCm || 0} cm</span></div><div className="mt-3 flex flex-wrap items-center gap-2"><button type="button" onClick={share} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"><Share2 className="h-4 w-4" /> Share</button><a href={`${profileUrl}?edit=1`} className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-black text-white"><Pencil className="h-3.5 w-3.5" /> Edit profile</a><span className="ml-auto text-[9px] font-semibold text-slate-400">Last Updated: {updated ? new Date(updated).toLocaleString('en-MY') : 'N/A'}</span></div></div>}
    </article>
  );
}

export function AdminFightersPage({ fighters, fightRecords, liveCards, isLoading, isConnected, theme, onToggleTheme }: {
  fighters: Record<string, Fighter>; fightRecords: FightRecord[]; liveCards: Array<LiveFightCard & { docId: string }>;
  isLoading: boolean; isConnected: boolean; theme: 'light' | 'dark'; onToggleTheme: () => void;
}) {
  const [authenticated, setAuthenticated] = useState(isAdminAuthenticated());
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<AgeFilter>('ALL');
  const [expandedId, setExpandedId] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allFighters = useMemo(() => uniqueFighters(fighters), [fighters]);
  const medalsByFighter = useMemo(() => {
    const result = new Map<string, MedalCounts>();
    const linkedRecordIds = new Set(fightRecords.flatMap((record) => record.id === undefined ? [] : [String(record.id)]));
    const add = (fighterId: unknown, medal: string | undefined) => {
      const id = String(fighterId ?? ''); const type = medalType(medal); if (!id || !type) return;
      const counts = result.get(id) || { gold: 0, silver: 0, bronze: 0 }; counts[type] += 1; result.set(id, counts);
    };
    fightRecords.forEach((record) => add(record.fighterId, record.medal));
    liveCards.filter((card) => card.linkedFightRecordId === null || card.linkedFightRecordId === undefined || !linkedRecordIds.has(String(card.linkedFightRecordId))).forEach((card) => add(card.fighterId, card.medal));
    return result;
  }, [fightRecords, liveCards]);
  const liveIds = useMemo(() => new Set(liveCards.filter((card) => card.status?.toUpperCase() === 'LIVE').map((card) => String(card.fighterId))), [liveCards]);
  const normalized = query.trim().toLowerCase();
  const visible = useMemo(() => allFighters.filter((fighter) => {
    const age = Number(fighter.age || 0);
    const matchesFilter = filter === 'ALL' || (filter === 'JUNIOR' && age <= 12) || (filter === 'YOUTH' && age >= 13 && age <= 17) || (filter === 'STARRED' && fighter.isStarred);
    const matchesSearch = !normalized || [fighter.name, fighter.nickname, fighter.school, fighter.club, fighterWeightCategory(Number(fighter.weightKg || 0))].some((value) => String(value || '').toLowerCase().includes(normalized));
    return matchesFilter && matchesSearch;
  }).sort((a, b) => {
    const aId = String(a.id || a.firestoreDocId); const bId = String(b.id || b.firestoreDocId);
    const live = Number(liveIds.has(bId)) - Number(liveIds.has(aId)); if (live) return live;
    const aMedals = medalsByFighter.get(aId) || { gold: 0, silver: 0, bronze: 0 }; const bMedals = medalsByFighter.get(bId) || { gold: 0, silver: 0, bronze: 0 };
    return bMedals.gold - aMedals.gold || bMedals.silver - aMedals.silver || bMedals.bronze - aMedals.bronze || Number(b.wins || 0) - Number(a.wins || 0) || Number(Boolean(b.isStarred)) - Number(Boolean(a.isStarred)) || String(a.name).localeCompare(String(b.name));
  }), [allFighters, filter, normalized, liveIds, medalsByFighter]);
  const totals = allFighters.reduce((acc, fighter) => ({ wins: acc.wins + Number(fighter.wins || 0), fights: acc.fights + Number(fighter.wins || 0) + Number(fighter.losses || 0) + Number(fighter.draws || 0) }), { wins: 0, fights: 0 });
  const medalTotals = [...medalsByFighter.values()].reduce((acc, counts) => ({ gold: acc.gold + counts.gold, silver: acc.silver + counts.silver, bronze: acc.bronze + counts.bronze }), { gold: 0, silver: 0, bronze: 0 });

  const toggleStar = async (fighter: Fighter) => {
    if (!fighter.firestoreDocId) return; const db = initFirebase(); if (!db) return;
    await updateDoc(doc(db, 'fighters', fighter.firestoreDocId), { isStarred: !fighter.isStarred, updatedAt: Date.now() });
  };
  const exportSelected = () => {
    const rows = allFighters.filter((fighter) => selected.size === 0 || selected.has(fighter.firestoreDocId || String(fighter.id)));
    const csv = [['Name', 'Nickname', 'Age', 'Weight (kg)', 'Height (cm)', 'Wins', 'Losses', 'Draws', 'School', 'Club'], ...rows.map((fighter) => [fighter.name, fighter.nickname, fighter.age, fighter.weightKg, fighter.heightCm, fighter.wins, fighter.losses, fighter.draws, fighter.school, fighter.club])].map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const anchor = document.createElement('a'); anchor.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); anchor.download = 'gomo-fighters.csv'; anchor.click(); URL.revokeObjectURL(anchor.href);
  };

  if (!authenticated) return <AdminLoginModal onDismiss={() => window.location.assign('/')} onSuccess={() => setAuthenticated(true)} />;
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/95"><div className="mx-auto flex max-w-4xl items-center gap-2 px-3 py-2 sm:px-4"><a href="/" aria-label="Back to arena" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><ArrowLeft className="h-5 w-5" /></a><img src={logo} alt="GOMO Logo" className="h-9 w-9 rounded-lg object-cover" /><div className="min-w-0 flex-1"><h1 className="font-combat truncate text-sm font-black uppercase sm:text-base">Kelab Muaythai Gomo</h1><p className="text-[10px] font-bold text-red-600">Official Club Roster · Admin</p></div><button type="button" onClick={onToggleTheme} aria-label="Toggle theme" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-300">{theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}</button><button type="button" onClick={() => { endAdminSession(); window.location.assign('/'); }} aria-label="Log out admin" title="Log out admin" className="grid h-9 w-9 place-items-center rounded-lg bg-red-600 text-white"><LogOut className="h-4 w-4" /></button></div></header>
      <main className="mx-auto max-w-4xl space-y-3 px-3 py-4 sm:px-4 sm:py-6">
        <button type="button" onClick={() => window.location.reload()} className="flex w-full items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-left text-[11px] font-bold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"><Cloud className="h-4 w-4" /><span className="flex-1">{isConnected ? 'Live cloud database connected' : 'Connecting to cloud database…'}</span><span className="text-[9px] font-black uppercase">Tap to refresh</span><RefreshCw className="h-3.5 w-3.5" /></button>
        <div className="flex gap-2"><StatCard label="Fighters" value={allFighters.length} icon="fighters" /><StatCard label="Total Wins" value={totals.wins} icon="wins" /><StatCard label="Win Rate" value={`${totals.fights ? Math.floor((totals.wins / totals.fights) * 100) : 0}%`} icon="rate" /></div>
        <MedalDashboard counts={medalTotals} totalFights={totals.fights} />
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-3"><Search className="h-5 w-5 text-red-600" /><div className="min-w-0 flex-1"><p className="text-[9px] font-black uppercase tracking-wider text-red-600">{query ? 'Searching for' : 'Search fighter database'}</p><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Enter name, nickname, school, or weight class…" className="mt-0.5 w-full bg-transparent text-xs font-semibold outline-none placeholder:text-slate-400" /></div>{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><X className="h-4 w-4 text-slate-400" /></button>}</div></div>
        <div className="flex gap-2 overflow-x-auto pb-1">{([['ALL', 'All Fighters'], ['JUNIOR', 'Junior (≤12yo)'], ['YOUTH', 'Youth (13–17yo)'], ['STARRED', '⭐ Favorites']] as const).map(([value, label]) => <button type="button" key={value} onClick={() => setFilter(value)} className={`shrink-0 rounded-full border px-3 py-2 text-xs font-bold ${filter === value ? 'border-red-600 bg-red-600 text-white' : 'border-slate-300 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}>{label}</button>)}</div>
        <div className="flex items-center justify-between gap-2"><p className="text-xs font-black uppercase text-slate-500">{visible.length} fighters</p><button type="button" onClick={() => { setSelectionMode((value) => !value); setSelected(new Set()); }} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700"><Download className="h-3.5 w-3.5" />{selectionMode ? 'Cancel selection' : 'Export / Multi-select'}</button></div>
        {isLoading && allFighters.length === 0 ? <div className="grid place-items-center py-16"><div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-red-600" /></div> : visible.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-900">No fighters found</div> : <div className="space-y-3">{visible.map((fighter) => { const id = fighter.firestoreDocId || String(fighter.id); const recordId = String(fighter.id || id); return <FighterRosterCard key={id} fighter={fighter} medals={medalsByFighter.get(recordId) || { gold: 0, silver: 0, bronze: 0 }} isLive={liveIds.has(recordId)} expanded={expandedId === id} selected={selected.has(id)} selectionMode={selectionMode} onExpand={() => setExpandedId((current) => current === id ? '' : id)} onSelect={() => setSelected((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; })} onStar={() => void toggleStar(fighter)} />; })}</div>}
      </main>
      {selectionMode && <div className="fixed inset-x-0 bottom-0 z-40 p-3"><div className="mx-auto flex max-w-4xl items-center gap-3 rounded-2xl border border-red-200 bg-white p-3 shadow-2xl dark:border-red-900 dark:bg-slate-900"><div className="min-w-0 flex-1"><p className="text-xs font-black uppercase text-red-600">{selected.size ? `${selected.size} selected` : 'Export all'}</p><p className="text-[10px] text-slate-400">CSV fighter profiles</p></div><button type="button" onClick={() => setSelected(new Set(visible.map((fighter) => fighter.firestoreDocId || String(fighter.id))))} className="rounded-lg px-3 py-2 text-xs font-bold">Select all</button><button type="button" onClick={exportSelected} className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-3 text-xs font-black text-white"><Download className="h-4 w-4" /> Export ({selected.size || allFighters.length})</button></div></div>}
    </div>
  );
}
