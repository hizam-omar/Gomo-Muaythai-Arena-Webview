import { useMemo, useState, type ChangeEvent } from 'react';
import { ArrowLeft, Check, Cloud, Download, LogOut, Medal, Moon, Pencil, RefreshCw, Save, Search, Star, Sun, Trash2, Trophy, UserPlus, Users, X } from 'lucide-react';
import { deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import logo from '../assets/images/gomo_logo_1785735883874.jpg';
import { AdminLoginModal } from './AdminLoginModal';
import { editableValues, preparePhoto, ProfileEditor, type EditableFighter } from './FighterProfilePage';
import { endAdminSession, isAdminAuthenticated } from '../lib/admin';
import { fighterProfileUrl, fighterWeightCategory } from '../lib/fighter-profile';
import { initFirebase } from '../lib/firebase';
import type { FightRecord, Fighter, LiveFightCard } from '../types';

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
  return <div className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900"><Icon className="h-4 w-4 text-red-600" /><p className="mt-1 truncate text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="font-combat mt-0.5 text-lg font-black text-slate-900 dark:text-white">{value}</p></div>;
}

function MedalDashboard({ counts, totalFights }: { counts: MedalCounts; totalFights: number }) {
  const total = counts.gold + counts.silver + counts.bronze;
  const goldEnd = total ? (counts.gold / total) * 360 : 0;
  const silverEnd = total ? goldEnd + (counts.silver / total) * 360 : 0;
  const background = total ? `conic-gradient(#f59e0b 0deg ${goldEnd}deg, #94a3b8 ${goldEnd}deg ${silverEnd}deg, #c2410c ${silverEnd}deg 360deg)` : 'conic-gradient(#e2e8f0 0deg 360deg)';
  return <section className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="relative grid h-20 w-20 shrink-0 place-items-center rounded-full" style={{ background }}><div className="grid h-14 w-14 place-items-center rounded-full bg-white text-center dark:bg-slate-900"><div><p className="text-lg font-black">{total}</p><p className="text-[7px] font-black uppercase text-slate-400">Medals</p></div></div></div><div className="min-w-0 flex-1"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-red-600">Club achievement</p><h2 className="font-combat text-base font-black uppercase">Medal Dashboard</h2><div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-black"><span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">🥇 {counts.gold}</span><span className="rounded-full bg-slate-200 px-2 py-0.5 text-slate-700">🥈 {counts.silver}</span><span className="rounded-full bg-orange-100 px-2 py-0.5 text-orange-800">🥉 {counts.bronze}</span></div><p className="mt-1 text-[9px] font-semibold text-slate-400">Across {totalFights} recorded fights</p></div></section>;
}

function FightRecordDashboard({ wins, losses, draws }: { wins: number; losses: number; draws: number }) {
  const total = wins + losses + draws;
  const winEnd = total ? (wins / total) * 360 : 0;
  const lossEnd = total ? winEnd + (losses / total) * 360 : 0;
  const background = total ? `conic-gradient(#059669 0deg ${winEnd}deg, #e11d48 ${winEnd}deg ${lossEnd}deg, #f59e0b ${lossEnd}deg 360deg)` : 'conic-gradient(#e2e8f0 0deg 360deg)';
  return <section className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="relative grid h-20 w-20 shrink-0 place-items-center rounded-full" style={{ background }}><div className="grid h-14 w-14 place-items-center rounded-full bg-white text-center dark:bg-slate-900"><div><p className="text-lg font-black">{total}</p><p className="text-[7px] font-black uppercase text-slate-400">Fights</p></div></div></div><div className="min-w-0 flex-1"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-red-600">Fight performance</p><h2 className="font-combat text-base font-black uppercase">W / L / D Dashboard</h2><div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-black"><span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">W {wins}</span><span className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-800">L {losses}</span><span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">D {draws}</span></div><p className="mt-1 text-[9px] font-semibold text-slate-400">Combined fighter records</p></div></section>;
}

function FighterRosterCard({ fighter, medals, isLive, selected, selectionMode, onSelect, onStar, onEdit, onDelete }: {
  fighter: Fighter; medals: MedalCounts; isLive: boolean; selected: boolean; selectionMode: boolean;
  onSelect: () => void; onStar: () => void; onEdit: () => void; onDelete: () => void; key?: string;
}) {
  const photo = avatarUrl(fighter);
  const name = fighter.nickname || fighter.name || 'GOMO Fighter';
  const fights = Number(fighter.wins || 0) + Number(fighter.losses || 0) + Number(fighter.draws || 0);
  const winRate = fights ? Math.floor((Number(fighter.wins || 0) / fights) * 100) : 0;
  const profileUrl = fighterProfileUrl(fighter);
  return (
    <article className={`relative overflow-hidden rounded-xl border bg-white shadow-sm transition dark:bg-slate-900 ${selected ? 'border-red-600 ring-2 ring-red-100 dark:ring-red-950' : 'border-slate-200 dark:border-slate-800'}`}>
      <div className="flex items-center gap-2.5 p-2.5 pr-24 cursor-pointer" onClick={selectionMode ? onSelect : () => window.location.assign(profileUrl)}>
        {selectionMode && <span className={`grid h-5 w-5 shrink-0 place-items-center rounded border ${selected ? 'border-red-600 bg-red-600 text-white' : 'border-slate-300'}`}>{selected && <Check className="h-3 w-3" />}</span>}
        <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-red-600 bg-red-100 text-xs font-black text-red-700">{photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2)}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-combat truncate text-sm font-black uppercase">{name}</h3>
            {isLive && <span className="animate-pulse rounded-full bg-red-600 px-1.5 py-0.5 text-[8px] font-black text-white">● LIVE</span>}
            <span className="rounded bg-red-50 px-1.5 py-0.5 text-[9px] font-black text-red-700 dark:bg-red-950 dark:text-red-300">{fighter.age || 0}yo</span>
          </div>
          <p className="truncate text-[11px] text-slate-500">{fighter.name || name} {fighter.school ? `· 🎓 ${fighter.school}` : ''}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-black">
            <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-white">{fighter.wins || 0}W</span>
            <span className="rounded bg-rose-600 px-1.5 py-0.5 text-white">{fighter.losses || 0}L</span>
            <span className="rounded bg-amber-500 px-1.5 py-0.5 text-white">{fighter.draws || 0}D</span>
            <span className="text-red-600 font-bold">{winRate}% Win</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-600 dark:text-slate-300">{Number(fighter.weightKg || 0)}kg · {fighter.heightCm || 0}cm</span>
            {(medals.gold > 0 || medals.silver > 0 || medals.bronze > 0) && (
              <>
                <span className="text-slate-400">·</span>
                <span className="flex gap-1">
                  {medals.gold > 0 && <span>🥇{medals.gold}</span>}
                  {medals.silver > 0 && <span>🥈{medals.silver}</span>}
                  {medals.bronze > 0 && <span>🥉{medals.bronze}</span>}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      {!selectionMode && (
        <div className="absolute right-2 top-2 flex items-center gap-0.5">
          <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(); }} aria-label={`Edit ${name}`} title="Edit fighter" className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950"><Pencil className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }} aria-label={`Delete ${name}`} title="Delete fighter" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"><Trash2 className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onStar(); }} aria-label="Star fighter" className={`rounded-lg p-1.5 ${fighter.isStarred ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'}`}><Star className={`h-4 w-4 ${fighter.isStarred ? 'fill-current' : ''}`} /></button>
        </div>
      )}
    </article>
  );
}

function FighterEditorModal({ fighter, onDismiss }: { fighter?: Fighter; onDismiss: () => void }) {
  const [form, setForm] = useState<EditableFighter>(() => editableValues(fighter || {
    club: 'KELAB MUAYTHAI GOMO', manager: 'ABBAS ZAKARIA (+60 19-250 1847)',
    stance: 'Orthodox', favTechnique: 'Knee Strike',
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);
  const setText = (key: keyof EditableFighter) => (value: string) => setForm((current) => ({ ...current, [key]: value }));
  const setNumber = (key: keyof EditableFighter) => (value: string) => setForm((current) => ({ ...current, [key]: Number(value) || 0 }));
  const uploadPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    setPhotoBusy(true); setPhotoError('');
    try { const imageUri = await preparePhoto(file); setForm((current) => ({ ...current, imageUri })); }
    catch (photoIssue) { setPhotoError(photoIssue instanceof Error ? photoIssue.message : 'Unable to prepare this photo.'); }
    finally { setPhotoBusy(false); }
  };
  const save = async () => {
    if (!form.name.trim() && !form.nickname.trim()) { setError('Enter the fighter name or nickname.'); return; }
    const db = initFirebase(); if (!db) { setError('Firebase is not connected.'); return; }
    setSaving(true); setError('');
    try {
      const now = Date.now();
      if (fighter?.firestoreDocId) {
        await updateDoc(doc(db, 'fighters', fighter.firestoreDocId), { ...form, updatedAt: now });
      } else {
        const id = now;
        await setDoc(doc(db, 'fighters', String(id)), { ...form, id, isStarred: false, createdAt: now, updatedAt: now });
      }
      onDismiss();
    } catch (saveIssue) {
      console.error('Admin fighter save error:', saveIssue);
      setError('Unable to save this fighter. Check Firestore permissions.');
      setSaving(false);
    }
  };
  return (
    <div className="fixed inset-0 z-[160] overflow-y-auto bg-slate-950/80 p-2 sm:p-5" role="dialog" aria-modal="true" aria-labelledby="fighter-editor-title">
      <div className="mx-auto min-h-full w-full max-w-3xl rounded-xl bg-slate-50 shadow-2xl dark:bg-slate-950">
        <header className="sticky top-0 z-20 flex items-center gap-3 rounded-t-xl border-b border-slate-200 bg-white/95 px-4 py-2.5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95"><div className="grid h-8 w-8 place-items-center rounded-lg bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">{fighter ? <Pencil className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}</div><div className="min-w-0 flex-1"><h2 id="fighter-editor-title" className="font-combat text-sm font-black uppercase">{fighter ? `Edit ${fighter.nickname || fighter.name}` : 'Add New Fighter'}</h2><p className="text-[10px] font-bold text-red-600">GOMO fighter database</p></div><button type="button" onClick={onDismiss} aria-label="Close fighter form" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button></header>
        <div className="space-y-3 p-3 sm:p-4"><ProfileEditor form={form} onText={setText} onNumber={setNumber} onPhoto={uploadPhoto} photoError={photoError} photoBusy={photoBusy} />{error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">{error}</p>}<div className="sticky bottom-3 flex items-center justify-end gap-2 rounded-xl border border-slate-200 bg-white/95 p-2.5 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/95"><button type="button" onClick={onDismiss} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700">Cancel</button><button type="button" data-testid="admin-save-fighter" onClick={save} disabled={saving || photoBusy} className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50"><Save className="h-3.5 w-3.5" />{saving ? 'Saving…' : fighter ? 'Save Fighter' : 'Add Fighter'}</button></div></div>
      </div>
    </div>
  );
}

export function AdminFightersPage({ fighters, fightRecords, liveCards, isLoading, isConnected, theme, onToggleTheme }: {
  fighters: Record<string, Fighter>; fightRecords: FightRecord[]; liveCards: Array<LiveFightCard & { docId: string }>;
  isLoading: boolean; isConnected: boolean; theme: 'light' | 'dark'; onToggleTheme: () => void;
}) {
  const [authenticated, setAuthenticated] = useState(isAdminAuthenticated());
  const [query, setQuery] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editor, setEditor] = useState<Fighter | 'new' | null>(null);

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
    const matchesSearch = !normalized || [fighter.name, fighter.nickname, fighter.school, fighter.club, fighterWeightCategory(Number(fighter.weightKg || 0))].some((value) => String(value || '').toLowerCase().includes(normalized));
    return matchesSearch;
  }).sort((a, b) => {
    const aId = String(a.id || a.firestoreDocId); const bId = String(b.id || b.firestoreDocId);
    const live = Number(liveIds.has(bId)) - Number(liveIds.has(aId)); if (live) return live;
    const aMedals = medalsByFighter.get(aId) || { gold: 0, silver: 0, bronze: 0 }; const bMedals = medalsByFighter.get(bId) || { gold: 0, silver: 0, bronze: 0 };
    return bMedals.gold - aMedals.gold || bMedals.silver - aMedals.silver || bMedals.bronze - aMedals.bronze || Number(b.wins || 0) - Number(a.wins || 0) || Number(Boolean(b.isStarred)) - Number(Boolean(a.isStarred)) || String(a.name).localeCompare(String(b.name));
  }), [allFighters, normalized, liveIds, medalsByFighter]);
  const totals = allFighters.reduce((acc, fighter) => {
    const wins = Number(fighter.wins || 0); const losses = Number(fighter.losses || 0); const draws = Number(fighter.draws || 0);
    return { wins: acc.wins + wins, losses: acc.losses + losses, draws: acc.draws + draws, fights: acc.fights + wins + losses + draws };
  }, { wins: 0, losses: 0, draws: 0, fights: 0 });
  const medalTotals = [...medalsByFighter.values()].reduce((acc, counts) => ({ gold: acc.gold + counts.gold, silver: acc.silver + counts.silver, bronze: acc.bronze + counts.bronze }), { gold: 0, silver: 0, bronze: 0 });

  const toggleStar = async (fighter: Fighter) => {
    if (!fighter.firestoreDocId) return; const db = initFirebase(); if (!db) return;
    await updateDoc(doc(db, 'fighters', fighter.firestoreDocId), { isStarred: !fighter.isStarred, updatedAt: Date.now() });
  };
  const deleteFighter = async (fighter: Fighter) => {
    if (!fighter.firestoreDocId) return;
    const targetName = fighter.nickname || fighter.name || '';
    const promptInput = window.prompt(`To delete fighter "${targetName}", please type their nickname or name to confirm:`);
    if (promptInput === null) return;
    if (promptInput.trim().toLowerCase() !== targetName.trim().toLowerCase()) {
      alert('Confirmation name / nickname did not match. Deletion cancelled.');
      return;
    }
    const db = initFirebase(); if (!db) return;
    try {
      await deleteDoc(doc(db, 'fighters', fighter.firestoreDocId));
    } catch (err) {
      console.error('Delete fighter error:', err);
      alert('Failed to delete fighter.');
    }
  };
  const exportSelected = () => {
    const rows = allFighters.filter((fighter) => selected.size === 0 || selected.has(fighter.firestoreDocId || String(fighter.id)));
    const csv = [['Name', 'Nickname', 'Age', 'Weight (kg)', 'Height (cm)', 'Wins', 'Losses', 'Draws', 'School', 'Club'], ...rows.map((fighter) => [fighter.name, fighter.nickname, fighter.age, fighter.weightKg, fighter.heightCm, fighter.wins, fighter.losses, fighter.draws, fighter.school, fighter.club])].map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const anchor = document.createElement('a'); anchor.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); anchor.download = 'gomo-fighters.csv'; anchor.click(); URL.revokeObjectURL(anchor.href);
  };

  if (!authenticated) return <AdminLoginModal onDismiss={() => window.location.assign('/')} onSuccess={() => setAuthenticated(true)} />;
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/95"><div className="mx-auto flex max-w-4xl items-center gap-2 px-3 py-1.5 sm:px-4"><a href="/" aria-label="Back to arena" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><ArrowLeft className="h-4 w-4" /></a><img src={logo} alt="GOMO Logo" className="h-8 w-8 rounded-lg object-cover" /><div className="min-w-0 flex-1"><h1 className="font-combat truncate text-xs font-black uppercase sm:text-sm">Kelab Muaythai Gomo</h1><p className="text-[9px] font-bold text-red-600">Official Club Roster · Admin</p></div><button type="button" onClick={onToggleTheme} aria-label="Toggle theme" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-300">{theme === 'light' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}</button><button type="button" onClick={() => { endAdminSession(); window.location.assign('/'); }} aria-label="Log out admin" title="Log out admin" className="grid h-8 w-8 place-items-center rounded-lg bg-red-600 text-white"><LogOut className="h-3.5 w-3.5" /></button></div></header>
      <main className="mx-auto max-w-4xl space-y-2.5 px-3 py-3 sm:px-4 sm:py-4">
        <button type="button" onClick={() => window.location.reload()} className="flex w-full items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5 text-left text-[11px] font-bold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"><Cloud className="h-3.5 w-3.5" /><span className="flex-1">{isConnected ? 'Live cloud database connected' : 'Connecting to cloud database…'}</span><span className="text-[9px] font-black uppercase">Tap to refresh</span><RefreshCw className="h-3 w-3" /></button>
        <div className="flex gap-2"><StatCard label="Fighters" value={allFighters.length} icon="fighters" /><StatCard label="Total Wins" value={totals.wins} icon="wins" /><StatCard label="Win Rate" value={`${totals.fights ? Math.floor((totals.wins / totals.fights) * 100) : 0}%`} icon="rate" /></div>
        <div className="grid gap-2.5 md:grid-cols-2"><MedalDashboard counts={medalTotals} totalFights={totals.fights} /><FightRecordDashboard wins={totals.wins} losses={totals.losses} draws={totals.draws} /></div>
        <button type="button" data-testid="add-new-fighter" onClick={() => setEditor('new')} className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-red-700"><UserPlus className="h-3.5 w-3.5" /> + Add New Fighter</button>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-2.5"><Search className="h-4 w-4 text-red-600" /><div className="min-w-0 flex-1"><p className="text-[8px] font-black uppercase tracking-wider text-red-600">{query ? 'Searching for' : 'Search fighter database'}</p><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Enter name, nickname, school, or weight class…" className="mt-0.5 w-full bg-transparent text-xs font-semibold outline-none placeholder:text-slate-400" /></div>{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><X className="h-3.5 w-3.5 text-slate-400" /></button>}</div></div>
        <div className="flex items-center justify-between gap-2"><p className="text-[11px] font-black uppercase text-slate-500">{visible.length} fighters</p><button type="button" onClick={() => { setSelectionMode((value) => !value); setSelected(new Set()); }} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold dark:border-slate-700"><Download className="h-3 w-3" />{selectionMode ? 'Cancel selection' : 'Export / Multi-select'}</button></div>
        {isLoading && allFighters.length === 0 ? <div className="grid place-items-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-red-600" /></div> : visible.length === 0 ? <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-900">No fighters found</div> : <div className="space-y-2">{visible.map((fighter) => { const id = fighter.firestoreDocId || String(fighter.id); const recordId = String(fighter.id || id); return <FighterRosterCard key={id} fighter={fighter} medals={medalsByFighter.get(recordId) || { gold: 0, silver: 0, bronze: 0 }} isLive={liveIds.has(recordId)} selected={selected.has(id)} selectionMode={selectionMode} onSelect={() => setSelected((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; })} onStar={() => void toggleStar(fighter)} onEdit={() => setEditor(fighter)} onDelete={() => void deleteFighter(fighter)} />; })}</div>}
      </main>
      {selectionMode && <div className="fixed inset-x-0 bottom-0 z-40 p-2"><div className="mx-auto flex max-w-4xl items-center gap-2.5 rounded-xl border border-red-200 bg-white p-2.5 shadow-2xl dark:border-red-900 dark:bg-slate-900"><div className="min-w-0 flex-1"><p className="text-[11px] font-black uppercase text-red-600">{selected.size ? `${selected.size} selected` : 'Export all'}</p><p className="text-[9px] text-slate-400">CSV fighter profiles</p></div><button type="button" onClick={() => setSelected(new Set(visible.map((fighter) => fighter.firestoreDocId || String(fighter.id))))} className="rounded-lg px-2.5 py-1.5 text-xs font-bold">Select all</button><button type="button" onClick={exportSelected} className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-black text-white"><Download className="h-3.5 w-3.5" /> Export ({selected.size || allFighters.length})</button></div></div>}
      {editor && <FighterEditorModal fighter={editor === 'new' ? undefined : editor} onDismiss={() => setEditor(null)} />}
    </div>
  );
}
