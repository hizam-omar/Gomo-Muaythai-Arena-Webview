import { useEffect, useMemo, useState, type ChangeEvent, type MouseEvent } from 'react';
import { Check, Download, LogOut, Medal, MoreVertical, Pencil, QrCode, Save, Search, Star, Trash2, Trophy, UserPlus, Users, X } from 'lucide-react';
import { deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { SiteHeader } from './SiteHeader';
import { AdminLoginModal } from './AdminLoginModal';
import { editableValues, preparePhoto, ProfileEditor, type EditableFighter } from './FighterProfilePage';
import { endAdminSession, isAdminAuthenticated } from '../lib/admin';
import { fighterProfileUrl, fighterPublicProfileUrl, fighterWeightCategory } from '../lib/fighter-profile';
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
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-3 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-1 flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
        <Icon className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <p className="text-lg font-black text-slate-900 dark:text-white leading-none">
        {value}
      </p>
    </div>
  );
}

function MedalDashboard({ counts, totalFights }: { counts: MedalCounts; totalFights: number }) {
  const total = counts.gold + counts.silver + counts.bronze;
  const goldEnd = total ? (counts.gold / total) * 360 : 0;
  const silverEnd = total ? goldEnd + (counts.silver / total) * 360 : 0;
  const background = total
    ? `conic-gradient(#f59e0b 0deg ${goldEnd}deg, #94a3b8 ${goldEnd}deg ${silverEnd}deg, #c2410c ${silverEnd}deg 360deg)`
    : 'conic-gradient(#e2e8f0 0deg 360deg)';

  return (
    <section className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full" style={{ background }}>
        <div className="grid h-8 w-8 place-items-center rounded-full bg-white text-center dark:bg-slate-900">
          <div>
            <p className="text-xs font-black leading-none">{total}</p>
          </div>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Club Achievement</p>
        <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">Medal Dashboard</h2>
        <div className="mt-1.5 flex flex-wrap gap-1 text-[11px] font-bold">
          <span className="rounded-full bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-amber-800 dark:bg-amber-950/60 dark:border-amber-900/60 dark:text-amber-300">🥇 {counts.gold}</span>
          <span className="rounded-full bg-slate-100 border border-slate-200/80 px-2 py-0.5 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">🥈 {counts.silver}</span>
          <span className="rounded-full bg-orange-50 border border-orange-200/80 px-2 py-0.5 text-orange-800 dark:bg-orange-950/60 dark:border-orange-900/60 dark:text-orange-300">🥉 {counts.bronze}</span>
        </div>
        <p className="mt-1 text-[10px] font-medium text-slate-400">Across {totalFights} recorded fights</p>
      </div>
    </section>
  );
}

function FightRecordDashboard({ wins, losses, draws }: { wins: number; losses: number; draws: number }) {
  const total = wins + losses + draws;
  const winEnd = total ? (wins / total) * 360 : 0;
  const lossEnd = total ? winEnd + (losses / total) * 360 : 0;
  const background = total
    ? `conic-gradient(#10b981 0deg ${winEnd}deg, #f43f5e ${winEnd}deg ${lossEnd}deg, #f59e0b ${lossEnd}deg 360deg)`
    : 'conic-gradient(#e2e8f0 0deg 360deg)';

  return (
    <section className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full" style={{ background }}>
        <div className="grid h-8 w-8 place-items-center rounded-full bg-white text-center dark:bg-slate-900">
          <div>
            <p className="text-xs font-black leading-none">{total}</p>
          </div>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Fight Performance</p>
        <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">W / L / D Dashboard</h2>
        <div className="mt-1.5 flex flex-wrap gap-1 text-[11px] font-bold">
          <span className="rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-900/60 dark:text-emerald-300">W {wins}</span>
          <span className="rounded-full bg-rose-50 border border-rose-200/80 px-2 py-0.5 text-rose-800 dark:bg-rose-950/60 dark:border-rose-900/60 dark:text-rose-300">L {losses}</span>
          <span className="rounded-full bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-amber-800 dark:bg-amber-950/60 dark:border-amber-900/60 dark:text-amber-300">D {draws}</span>
        </div>
        <p className="mt-1 text-[10px] font-medium text-slate-400">Combined fighter records</p>
      </div>
    </section>
  );
}

function QrModal({ fighter, onDismiss }: { fighter: Fighter; onDismiss: () => void }) {
  const publicProfileUrl = fighterPublicProfileUrl(fighter);
  const name = fighter.nickname || fighter.name || 'GOMO Fighter';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(publicProfileUrl)}`;
  return (
    <div className="fixed inset-0 z-[170] grid place-items-center bg-slate-950/80 p-4 backdrop-blur-xs" role="dialog" aria-modal="true" onClick={onDismiss}>
      <div className="w-full max-w-xs rounded-[14px] bg-white p-4 text-center shadow-xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300"><QrCode className="h-4 w-4" /></div>
          <button type="button" onClick={onDismiss} aria-label="Close QR" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button>
        </div>
        <h2 className="mt-2 font-combat text-sm font-black uppercase text-slate-900 dark:text-white">{name}</h2>
        <p className="text-[10px] font-medium text-slate-500">Scan QR to open public fighter profile</p>
        <div className="my-3 grid place-items-center rounded-[10px] border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
          <img src={qrUrl} alt={`QR Code for ${name}`} className="h-40 w-40 rounded-md object-contain" />
        </div>
        <a href={publicProfileUrl} target="_blank" rel="noreferrer" className="block truncate rounded-[8px] bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold text-blue-600 hover:underline dark:bg-slate-800">{publicProfileUrl}</a>
        <button type="button" onClick={() => {
          fetch(qrUrl).then(res => res.blob()).then(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `${name.toLowerCase().replace(/\s+/g, '-')}-qr.png`;
            a.click(); URL.revokeObjectURL(url);
          }).catch(() => { window.open(qrUrl, '_blank'); });
        }} className="mt-2.5 w-full h-8 rounded-[8px] bg-red-600 text-xs font-bold text-white shadow-xs hover:bg-red-700">Download QR Code</button>
      </div>
    </div>
  );
}

function FighterActionMenu({ onShowQr, onEdit, onDelete, onOpenChange }: { onShowQr: () => void; onEdit: () => void; onDelete: () => void; onOpenChange?: (open: boolean) => void }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = () => {
      setOpen(false);
      onOpenChange?.(false);
    };
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [open, onOpenChange]);

  const handleToggle = (e: MouseEvent) => {
    e.stopPropagation();
    const next = !open;
    setOpen(next);
    onOpenChange?.(next);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Fighter actions"
        title="More actions"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-8 z-50 w-36 rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-800 dark:bg-slate-900"
        >
          <button
            type="button"
            onClick={() => { setOpen(false); onOpenChange?.(false); onShowQr(); }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <QrCode className="h-3.5 w-3.5 text-slate-500" />
            <span>View QR</span>
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); onOpenChange?.(false); onEdit(); }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Pencil className="h-3.5 w-3.5 text-blue-600" />
            <span>Edit Profile</span>
          </button>
          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
          <button
            type="button"
            onClick={() => { setOpen(false); onOpenChange?.(false); onDelete(); }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-600" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}

function FighterRosterCard({ fighter, medals, isLive, selected, selectionMode, onSelect, onStar, onDelete, onShowQr, onEdit }: {
  fighter: Fighter; medals: MedalCounts; isLive: boolean; selected: boolean; selectionMode: boolean;
  onSelect: () => void; onStar: () => void; onDelete: () => void; onShowQr: () => void; onEdit: () => void; key?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const photo = avatarUrl(fighter);
  const rawNickname = (fighter.nickname || fighter.name || 'GOMO').replaceAll('#', '').trim();
  const displayNickname = rawNickname;
  const fullName = (fighter.name || '').trim();
  const fights = Number(fighter.wins || 0) + Number(fighter.losses || 0) + Number(fighter.draws || 0);
  const winRate = fights ? Math.floor((Number(fighter.wins || 0) / fights) * 100) : 0;
  const profileUrl = fighterProfileUrl(fighter);

  return (
    <article className={`relative rounded-2xl border bg-white p-3.5 shadow-xs transition hover:shadow-md dark:bg-slate-900 ${
      menuOpen ? 'z-30' : 'z-0'
    } ${
      selected ? 'border-red-600 ring-2 ring-red-500/20' : 'border-slate-200/80 dark:border-slate-800'
    }`}>
      {/* Row 1: Left avatar, Center Info, Right Star & Action Menu */}
      <div className="flex items-start gap-3">
        {selectionMode && (
          <span
            onClick={onSelect}
            className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded border cursor-pointer ${
              selected ? 'border-red-600 bg-red-600 text-white' : 'border-slate-300 dark:border-slate-700'
            }`}
          >
            {selected && <Check className="h-3 w-3" />}
          </span>
        )}

        {/* Fighter Avatar */}
        <div
          onClick={selectionMode ? onSelect : () => window.location.assign(profileUrl)}
          className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-xs font-black text-slate-700 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          {photo ? (
            <img src={photo} alt="" className="h-full w-full object-cover" />
          ) : (
            rawNickname.split(/\s+/).map((part) => part[0]).join('').slice(0, 2)
          )}
        </div>

        {/* Center Main Info */}
        <div
          onClick={selectionMode ? onSelect : () => window.location.assign(profileUrl)}
          className="min-w-0 flex-1 cursor-pointer"
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
              {displayNickname}
            </h3>
            {isLive && (
              <span className="animate-pulse rounded-full bg-red-600 px-1.5 py-0.5 text-[8px] font-black text-white">
                ● LIVE
              </span>
            )}
            <span className="rounded-full bg-slate-100 border border-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
              {fighter.age || 0}yo
            </span>
          </div>

          {fullName && (
            <p className="truncate text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {fullName}{fighter.school || fighter.club ? ' · ' : ''}{fighter.school ? `🎓 ${fighter.school}` : (fighter.club || 'Kelab Muaythai Gomo')}
            </p>
          )}
        </div>

        {/* Right Actions: Star + Overflow Menu */}
        {!selectionMode && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onStar(); }}
              aria-label="Star fighter"
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
                fighter.isStarred ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'
              }`}
            >
              <Star className={`h-4 w-4 ${fighter.isStarred ? 'fill-current' : ''}`} />
            </button>
            <FighterActionMenu onShowQr={onShowQr} onEdit={onEdit} onDelete={onDelete} onOpenChange={setMenuOpen} />
          </div>
        )}
      </div>

      {/* Row 2: Stats Chips & Specs */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs font-bold">
        <span className="rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 dark:bg-emerald-950/60 dark:border-emerald-900/60 dark:text-emerald-300">
          {fighter.wins || 0}W
        </span>
        <span className="rounded-md bg-rose-50 text-rose-700 border border-rose-200/80 px-2 py-0.5 dark:bg-rose-950/60 dark:border-rose-900/60 dark:text-rose-300">
          {fighter.losses || 0}L
        </span>
        <span className="rounded-md bg-amber-50 text-amber-700 border border-amber-200/80 px-2 py-0.5 dark:bg-amber-950/60 dark:border-amber-900/60 dark:text-amber-300">
          {fighter.draws || 0}D
        </span>

        <span className="text-red-600 dark:text-red-400 font-extrabold ml-0.5">
          {winRate}% Win
        </span>

        <span className="text-slate-300 dark:text-slate-700">·</span>

        <span className="text-slate-600 dark:text-slate-400 font-medium">
          {Number(fighter.weightKg || 0)}kg{fighter.heightCm ? ` · ${fighter.heightCm}cm` : ''}
        </span>
      </div>

      {/* Row 3: Medals in a subtle compact row */}
      {(medals.gold > 0 || medals.silver > 0 || medals.bronze > 0) && (
        <div className="mt-2 flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs font-bold text-slate-600 dark:text-slate-300">
          <span className="text-[10px] font-extrabold uppercase text-slate-400">Medals:</span>
          {medals.gold > 0 && <span className="inline-flex items-center gap-0.5">🥇 {medals.gold}</span>}
          {medals.silver > 0 && <span className="inline-flex items-center gap-0.5">🥈 {medals.silver}</span>}
          {medals.bronze > 0 && <span className="inline-flex items-center gap-0.5">🥉 {medals.bronze}</span>}
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
    <div className="fixed inset-0 z-[160] overflow-y-auto bg-slate-950/80 p-2 sm:p-5 backdrop-blur-xs" role="dialog" aria-modal="true" aria-labelledby="fighter-editor-title">
      <div className="mx-auto min-h-full w-full max-w-3xl rounded-[14px] bg-slate-50 shadow-2xl dark:bg-slate-950">
        <header className="sticky top-0 z-20 flex h-12 items-center gap-2.5 rounded-t-[14px] border-b border-slate-200 bg-white/95 px-3.5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
            {fighter ? <Pencil className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="fighter-editor-title" className="font-combat truncate text-xs font-black uppercase text-slate-900 dark:text-white">
              {fighter ? `Edit ${fighter.nickname || fighter.name}` : 'Add New Fighter'}
            </h2>
            <p className="text-[10px] font-bold text-red-600 dark:text-red-400">GOMO Fighter Roster · Admin</p>
          </div>
          <button type="button" onClick={onDismiss} aria-label="Close fighter form" className="flex h-7 w-7 items-center justify-center rounded-[8px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="space-y-3 p-3 sm:p-4">
          <ProfileEditor form={form} onText={setText} onNumber={setNumber} onPhoto={uploadPhoto} photoError={photoError} photoBusy={photoBusy} />
          {error && <p role="alert" className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">{error}</p>}
          <div className="sticky bottom-3 flex h-11 items-center justify-end gap-2 rounded-[10px] border border-slate-200 bg-white/95 px-3 shadow-lg backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Cancel"
              title="Cancel"
              className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              type="button"
              data-testid="admin-save-fighter"
              onClick={save}
              disabled={saving || photoBusy}
              aria-label="Save fighter"
              title="Save fighter"
              className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-red-600 text-white shadow-xs hover:bg-red-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteFighterModal({ fighter, onDismiss, onConfirm }: { fighter: Fighter; onDismiss: () => void; onConfirm: () => Promise<void> }) {
  const [confirmName, setConfirmName] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const targetName = (fighter.nickname || fighter.name || 'Fighter').trim();

  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === 'Escape' && onDismiss();
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [onDismiss]);

  const handleDelete = async () => {
    if (confirmName.trim().toLowerCase() !== targetName.toLowerCase()) {
      setError(`Confirmation name must match "${targetName}".`);
      return;
    }
    setDeleting(true);
    setError('');
    try {
      await onConfirm();
      onDismiss();
    } catch (err) {
      console.error('Delete fighter error:', err);
      setError('Failed to delete fighter. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[170] grid place-items-center bg-slate-950/75 p-4 backdrop-blur-xs" role="dialog" aria-modal="true" aria-labelledby="delete-fighter-title" onClick={onDismiss}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
            <Trash2 className="h-5 w-5" />
          </div>
          <button type="button" onClick={onDismiss} aria-label="Close delete modal" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>
        <h2 id="delete-fighter-title" className="mt-4 text-xl font-black text-slate-900 dark:text-white">Delete Fighter</h2>
        <p className="mt-1 text-sm text-slate-500">
          To delete fighter <strong className="font-bold text-slate-900 dark:text-white">"{targetName}"</strong>, please type their name or nickname to confirm.
        </p>
        <label className="mt-4 block text-[11px] font-black uppercase tracking-wide text-slate-500" htmlFor="delete-confirm-input">
          Type name to confirm
        </label>
        <div className="relative mt-1">
          <Trash2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="delete-confirm-input"
            data-testid="delete-confirm-input"
            autoFocus
            type="text"
            value={confirmName}
            placeholder={targetName}
            onChange={(event) => { setConfirmName(event.target.value); setError(''); }}
            onKeyDown={(event) => event.key === 'Enter' && handleDelete()}
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm font-bold outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-red-950"
          />
        </div>
        {error && <p role="alert" className="mt-2 text-xs font-bold text-red-600">{error}</p>}
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="w-1/2 rounded-xl border border-slate-300 bg-white py-3 text-sm font-black text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="confirm-delete-button"
            onClick={handleDelete}
            disabled={deleting}
            className="w-1/2 rounded-xl bg-red-600 py-3 text-sm font-black text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
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
  const [qrFighter, setQrFighter] = useState<Fighter | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Fighter | null>(null);

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
  const exportSelected = () => {
    const rows = allFighters.filter((fighter) => selected.size === 0 || selected.has(fighter.firestoreDocId || String(fighter.id)));
    const csv = [['Name', 'Nickname', 'Age', 'Weight (kg)', 'Height (cm)', 'Wins', 'Losses', 'Draws', 'School', 'Club'], ...rows.map((fighter) => [fighter.name, fighter.nickname, fighter.age, fighter.weightKg, fighter.heightCm, fighter.wins, fighter.losses, fighter.draws, fighter.school, fighter.club])].map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const anchor = document.createElement('a'); anchor.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); anchor.download = 'gomo-fighters.csv'; anchor.click(); URL.revokeObjectURL(anchor.href);
  };

  if (!authenticated) return <AdminLoginModal onDismiss={() => window.location.assign('/')} onSuccess={() => setAuthenticated(true)} />;
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <SiteHeader
        title="Kelab Muaythai Gomo"
        subtitle="Official Club Roster · Admin"
        backHref="/"
        backLabel="Back to arena"
        theme={theme}
        onToggleTheme={onToggleTheme}
        primaryAction={{
          icon: <LogOut className="h-4 w-4" />,
          onClick: () => { endAdminSession(); window.location.assign('/'); },
          label: 'Log out admin',
          title: 'Log out admin',
        }}
      />

      <main className="mx-auto max-w-4xl space-y-4 px-4 py-4 sm:px-6 sm:py-6">
        {/* Modernized Stats Cards Grid */}
        <div className="flex gap-2.5 sm:gap-3">
          <StatCard label="Fighters" value={allFighters.length} icon="fighters" />
          <StatCard label="Total Wins" value={totals.wins} icon="wins" />
          <StatCard label="Win Rate" value={`${totals.fights ? Math.floor((totals.wins / totals.fights) * 100) : 0}%`} icon="rate" />
        </div>

        {/* Dashboard Cards Grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          <MedalDashboard counts={medalTotals} totalFights={totals.fights} />
          <FightRecordDashboard wins={totals.wins} losses={totals.losses} draws={totals.draws} />
        </div>

        {/* Roster Controls: Title, Search, and Add Fighter */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Fighter Roster</h2>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{visible.length} fighters listed</p>
            </div>
            <button
              type="button"
              data-testid="add-new-fighter"
              onClick={() => setEditor('new')}
              aria-label="Add Fighter"
              title="Add Fighter"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-xs transition hover:bg-red-700"
            >
              <UserPlus className="h-4 w-4" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search fighter name, nickname, category, or school..."
              className="w-full rounded-xl border border-slate-200/80 bg-white py-2.5 pl-10 pr-9 text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:ring-red-950/50"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Fighter Roster Cards List */}
        {isLoading && allFighters.length === 0 ? (
          <div className="grid place-items-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-red-600" />
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            No fighters found matching your search.
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((fighter) => {
              const id = fighter.firestoreDocId || String(fighter.id);
              const recordId = String(fighter.id || id);
              return (
                <FighterRosterCard
                  key={id}
                  fighter={fighter}
                  medals={medalsByFighter.get(recordId) || { gold: 0, silver: 0, bronze: 0 }}
                  isLive={liveIds.has(recordId)}
                  selected={selected.has(id)}
                  selectionMode={selectionMode}
                  onSelect={() => setSelected((current) => {
                    const next = new Set(current);
                    if (next.has(id)) next.delete(id); else next.add(id);
                    return next;
                  })}
                  onStar={() => void toggleStar(fighter)}
                  onDelete={() => setDeleteTarget(fighter)}
                  onShowQr={() => setQrFighter(fighter)}
                  onEdit={() => setEditor(fighter)}
                />
              );
            })}
          </div>
        )}
      </main>

      {selectionMode && (
        <div className="fixed inset-x-0 bottom-0 z-40 p-2">
          <div className="mx-auto flex max-w-4xl items-center gap-2.5 rounded-[12px] border border-red-200 bg-white p-2.5 shadow-xl dark:border-red-900 dark:bg-slate-900">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black uppercase text-red-600 dark:text-red-400">{selected.size ? `${selected.size} fighters selected` : 'Export all roster'}</p>
              <p className="text-[9px] text-slate-500">Export CSV fighter profiles</p>
            </div>
            <button type="button" onClick={() => setSelected(new Set(visible.map((fighter) => fighter.firestoreDocId || String(fighter.id))))} className="h-8 rounded-[8px] border border-slate-300 bg-slate-100 px-2.5 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Select All
            </button>
            <button type="button" onClick={exportSelected} className="inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-red-600 px-3 text-xs font-bold text-white shadow-xs hover:bg-red-700">
              <Download className="h-3.5 w-3.5" /> Export ({selected.size || allFighters.length})
            </button>
          </div>
        </div>
      )}
      {editor && <FighterEditorModal fighter={editor === 'new' ? undefined : editor} onDismiss={() => setEditor(null)} />}
      {qrFighter && <QrModal fighter={qrFighter} onDismiss={() => setQrFighter(null)} />}
      {deleteTarget && (
        <DeleteFighterModal
          fighter={deleteTarget}
          onDismiss={() => setDeleteTarget(null)}
          onConfirm={async () => {
            if (!deleteTarget.firestoreDocId) return;
            const db = initFirebase(); if (!db) return;
            await deleteDoc(doc(db, 'fighters', deleteTarget.firestoreDocId));
          }}
        />
      )}
    </div>
  );
}
