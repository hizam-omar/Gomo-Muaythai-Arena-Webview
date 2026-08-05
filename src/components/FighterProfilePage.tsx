import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import { ArrowLeft, Camera, Check, LockKeyhole, Moon, Pencil, Save, ShieldCheck, Sun, Upload, X } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import logo from '../assets/images/gomo_logo_1785735883874.jpg';
import { fighterSlug, fighterWeightCategory } from '../lib/fighter-profile';
import { initFirebase } from '../lib/firebase';
import type { Fighter } from '../types';

interface FighterProfilePageProps {
  fighter?: Fighter;
  isLoading: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

type EditableFighter = Required<Pick<Fighter,
  'name' | 'nickname' | 'nokp' | 'dob' | 'age' | 'weightKg' | 'heightCm' |
  'wins' | 'losses' | 'draws' | 'club' | 'manager' | 'school' | 'gradeClass' |
  'classTeacher' | 'pkTeacher' | 'parentName' | 'parentPhone' | 'parentEmail' |
  'ifmaLicense' | 'stance' | 'favTechnique' | 'imageUri'>>;

const MASK = '********';

function editableValues(fighter: Fighter): EditableFighter {
  return {
    name: fighter.name || '', nickname: fighter.nickname || '', nokp: fighter.nokp || '',
    dob: fighter.dob || '', age: Number(fighter.age) || 0, weightKg: Number(fighter.weightKg) || 0,
    heightCm: Number(fighter.heightCm) || 0, wins: Number(fighter.wins) || 0,
    losses: Number(fighter.losses) || 0, draws: Number(fighter.draws) || 0,
    club: fighter.club || '', manager: fighter.manager || '', school: fighter.school || '',
    gradeClass: fighter.gradeClass || '', classTeacher: fighter.classTeacher || '',
    pkTeacher: fighter.pkTeacher || '', parentName: fighter.parentName || '',
    parentPhone: fighter.parentPhone || '', parentEmail: fighter.parentEmail || '',
    ifmaLicense: fighter.ifmaLicense || '', stance: fighter.stance || 'Orthodox',
    favTechnique: fighter.favTechnique || 'Knee Strike', imageUri: fighter.imageUri || fighter.photoUrl || fighter.avatarUrl || '',
  };
}

async function preparePhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.');
  if (file.size > 12 * 1024 * 1024) throw new Error('Photo must be smaller than 12 MB.');

  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Unable to read this photo.'));
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error('Unable to open this photo.'));
    element.src = source;
  });
  const maxSide = 900;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Photo processing is unavailable.');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  let quality = 0.84;
  let result = canvas.toDataURL('image/jpeg', quality);
  while (result.length > 700_000 && quality > 0.42) {
    quality -= 0.1;
    result = canvas.toDataURL('image/jpeg', quality);
  }
  if (result.length > 800_000) throw new Error('This photo is still too large. Try a smaller image.');
  return result;
}

function publicAvatar(fighter: Fighter): string | undefined {
  const value = fighter.imageUri || fighter.photoUrl || fighter.avatarUrl;
  if (!value || /^(content:|file:|\/)/i.test(value)) return undefined;
  if (value.startsWith('data:image') || value.length > 200) return value.startsWith('data:image') ? value : `data:image/jpeg;base64,${value}`;
  return value;
}

function Field({ label, value, editing, type = 'text', onChange, options }: {
  label: string; value: string | number; editing: boolean; type?: string;
  onChange?: (value: string) => void; options?: string[];
}) {
  return (
    <div className="grid gap-1 border-b border-slate-100 py-2.5 last:border-b-0 dark:border-slate-800 sm:grid-cols-[minmax(145px,0.8fr)_minmax(0,1.2fr)] sm:items-center sm:gap-4">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="m-0 min-w-0 text-sm font-bold text-slate-800 dark:text-slate-100">
        {editing && onChange ? options ? (
          <select value={String(value)} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-red-950">
            {options.map((option) => <option key={option}>{option}</option>)}
          </select>
        ) : (
          <input type={type} inputMode={type === 'number' ? 'decimal' : undefined} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-red-950" />
        ) : <span className={String(value) === MASK ? 'font-mono tracking-widest text-slate-400' : ''}>{value || 'Not specified'}</span>}
      </dd>
    </div>
  );
}

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <header className="border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-600">{eyebrow}</p>
        <h2 className="font-combat mt-0.5 text-lg font-black uppercase text-slate-900 dark:text-white">{title}</h2>
      </header>
      <dl className="m-0 px-4 sm:px-5">{children}</dl>
    </section>
  );
}

const WEIGHT_CLASSES = [
  { name: 'Atomweight', range: '≤25 kg', target: 25 },
  { name: 'Mini Flyweight', range: '26–30 kg', target: 30 },
  { name: 'Strawweight', range: '31–35 kg', target: 35 },
  { name: 'Flyweight', range: '36–42 kg', target: 42 },
  { name: 'Bantamweight', range: '43–50 kg', target: 48 },
  { name: 'Featherweight', range: '51–57 kg', target: 54 },
  { name: 'Lightweight', range: '58–65 kg', target: 60 },
  { name: 'Welterweight', range: '66–71 kg', target: 67 },
  { name: 'Middleweight', range: '>71 kg', target: 75 },
];

function EditInput({ label, value, onChange, type = 'text', required = false, placeholder }: {
  label: string; value: string | number; onChange: (value: string) => void;
  type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">{label}{required && <span className="text-red-600"> *</span>}</span>
      <input
        type={type}
        inputMode={type === 'number' ? 'decimal' : type === 'tel' ? 'tel' : undefined}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-transparent px-3.5 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-600 focus:ring-2 focus:ring-red-100 dark:border-slate-700 dark:text-white dark:focus:ring-red-950"
      />
    </label>
  );
}

function EditSection({ number, title, optional, children }: { number: number; title: string; optional?: boolean; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-red-600 text-xs font-black text-white">{number}</span>
        <h2 className="font-combat text-base font-black uppercase text-red-700 dark:text-red-400 sm:text-lg">{title}{optional && <span className="ml-1 text-xs font-bold normal-case text-slate-400">(Optional)</span>}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function ChipGroup({ label, values, selected, onSelect }: { label: string; values: string[]; selected: string; onSelect: (value: string) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-bold text-slate-600 dark:text-slate-300">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => <button key={value} type="button" aria-pressed={selected === value} onClick={() => onSelect(value)} className={`rounded-full border px-3 py-2 text-xs font-bold transition ${selected === value ? 'border-red-600 bg-red-600 text-white shadow-sm' : 'border-slate-300 bg-white text-slate-600 hover:border-red-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300'}`}>{value}</button>)}
      </div>
    </fieldset>
  );
}

function ProfileEditor({ form, onText, onNumber, onPhoto, photoError, photoBusy }: {
  form: EditableFighter;
  onText: (key: keyof EditableFighter) => (value: string) => void;
  onNumber: (key: keyof EditableFighter) => (value: string) => void;
  onPhoto: (event: ChangeEvent<HTMLInputElement>) => void;
  photoError: string;
  photoBusy: boolean;
}) {
  const photo = publicAvatar({ imageUri: form.imageUri });
  const currentCategory = fighterWeightCategory(form.weightKg).split(' (')[0];
  return (
    <div className="space-y-4" data-testid="fighter-edit-form">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <div className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-950">
            {photo ? <img src={photo} alt="New fighter preview" className="h-full w-full object-cover" /> : <Camera className="h-9 w-9" />}
          </div>
          <div className="w-full flex-1 text-center sm:text-left">
            <p className="text-sm font-black text-slate-900 dark:text-white">Fighter Profile Photo</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">Choose a clear portrait. It will be resized for the public fighter card.</p>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
              <Upload className="h-4 w-4" /> {photoBusy ? 'Preparing photo…' : photo ? 'Update Fighter Photo' : 'Upload Fighter Photo'}
              <input data-testid="fighter-photo-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhoto} disabled={photoBusy} className="sr-only" />
            </label>
            {photoError && <p role="alert" className="mt-2 text-xs font-bold text-red-600">{photoError}</p>}
          </div>
        </div>
      </section>

      <EditSection number={1} title="Fighter Identity">
        <EditInput label="Full Name" value={form.name} onChange={onText('name')} required />
        <EditInput label="Nickname (e.g., HARRAZ GOMO)" value={form.nickname} onChange={onText('nickname')} required />
        <EditInput label="No KP / MyKad Number" value={form.nokp} onChange={onText('nokp')} />
        <EditInput label="IFMA License Number" value={form.ifmaLicense} onChange={onText('ifmaLicense')} />
        <EditInput label="Date of Birth (DD/MM/YYYY)" value={form.dob} onChange={onText('dob')} placeholder="DD/MM/YYYY e.g., 08/10/2008" required />
        <div className="grid gap-3 sm:grid-cols-3"><EditInput label="Age" type="number" value={form.age} onChange={onNumber('age')} /><EditInput label="Weight (kg)" type="number" value={form.weightKg} onChange={onNumber('weightKg')} required /><EditInput label="Height (cm)" type="number" value={form.heightCm} onChange={onNumber('heightCm')} /></div>
        <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-950">
          <div className="mb-2 flex items-center justify-between gap-3"><span className="text-xs font-black text-red-700 dark:text-red-400">Weight Class / Category</span><span className="text-[11px] font-black text-slate-500">{fighterWeightCategory(form.weightKg)}</span></div>
          <div className="flex gap-2 overflow-x-auto pb-1">{WEIGHT_CLASSES.map((weightClass) => <button type="button" key={weightClass.name} onClick={() => onNumber('weightKg')(String(weightClass.target))} className={`shrink-0 rounded-full border px-3 py-2 text-[11px] font-bold ${currentCategory === weightClass.name ? 'border-red-600 bg-red-600 text-white' : 'border-slate-300 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}>{weightClass.name} ({weightClass.range})</button>)}</div>
        </div>
      </EditSection>

      <EditSection number={2} title="Fight Record & Specs">
        <div className="grid grid-cols-3 gap-3"><EditInput label="Wins" type="number" value={form.wins} onChange={onNumber('wins')} /><EditInput label="Losses" type="number" value={form.losses} onChange={onNumber('losses')} /><EditInput label="Draws" type="number" value={form.draws} onChange={onNumber('draws')} /></div>
        <ChipGroup label="Stance" values={['Orthodox', 'Southpaw', 'Switch']} selected={form.stance} onSelect={onText('stance')} />
        <ChipGroup label="Favorite Technique" values={['Knee Strike', 'Middle Kick', 'Teep Kick', 'Elbow', 'Low Kick', 'Clinch']} selected={form.favTechnique} onSelect={onText('favTechnique')} />
      </EditSection>

      <EditSection number={3} title="School & Contact Info">
        <EditInput label="School" value={form.school} onChange={onText('school')} /><EditInput label="Form / Class" value={form.gradeClass} onChange={onText('gradeClass')} /><EditInput label="Class Teacher" value={form.classTeacher} onChange={onText('classTeacher')} /><EditInput label="Senior Assistant (Academic)" value={form.pkTeacher} onChange={onText('pkTeacher')} /><EditInput label="Club / Gym Name" value={form.club} onChange={onText('club')} /><EditInput label="Manager Contact" value={form.manager} onChange={onText('manager')} />
      </EditSection>

      <EditSection number={4} title="Parent / Guardian Info" optional>
        <EditInput label="Parent / Guardian Name" value={form.parentName} onChange={onText('parentName')} /><EditInput label="Parent H/P No. (Phone)" type="tel" value={form.parentPhone} onChange={onText('parentPhone')} /><EditInput label="Parent Email" type="email" value={form.parentEmail} onChange={onText('parentEmail')} />
      </EditSection>
    </div>
  );
}

export function FighterProfilePage({ fighter, isLoading, theme, onToggleTheme }: FighterProfilePageProps) {
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditableFighter | null>(fighter ? editableValues(fighter) : null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [photoError, setPhotoError] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);

  useEffect(() => {
    if (fighter && !editing) setForm(editableValues(fighter));
  }, [fighter, editing]);

  useEffect(() => {
    document.title = fighter
      ? `${fighter.nickname || fighter.name || 'Fighter'} :: GOMO Muaythai`
      : 'Fighter Profile :: GOMO Muaythai';
  }, [fighter]);

  const avatar = editing && form ? publicAvatar({ imageUri: form.imageUri }) : fighter ? publicAvatar(fighter) : undefined;
  const initials = (fighter?.nickname || fighter?.name || 'GOMO').split(/\s+/).map((part) => part[0]).join('').slice(0, 2);
  const totalFights = (form?.wins || 0) + (form?.losses || 0) + (form?.draws || 0);
  const winRate = totalFights ? Math.floor(((form?.wins || 0) / totalFights) * 100) : 0;
  const updatedLabel = useMemo(() => {
    const timestamp = Number(fighter?.updatedAt || fighter?.createdAt);
    return timestamp ? new Intl.DateTimeFormat('en-MY', { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp) : 'N/A';
  }, [fighter?.updatedAt, fighter?.createdAt]);

  const setText = (key: keyof EditableFighter) => (value: string) => setForm((current) => current ? { ...current, [key]: value } : current);
  const setNumber = (key: keyof EditableFighter) => (value: string) => setForm((current) => current ? { ...current, [key]: Number(value) || 0 } : current);

  const uploadPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setPhotoBusy(true);
    setPhotoError('');
    try {
      const imageUri = await preparePhoto(file);
      setForm((current) => current ? { ...current, imageUri } : current);
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : 'Unable to prepare this photo.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const unlock = () => {
    const expected = (fighter?.nokp || '').replace(/\D/g, '').slice(-6);
    if (!/^\d{6}$/.test(pin)) return setUnlockError('Enter exactly 6 digits.');
    if (!expected || pin !== expected) return setUnlockError('The MyKad digits do not match this fighter.');
    setUnlockOpen(false);
    setPin('');
    setUnlockError('');
    setForm(editableValues(fighter!));
    setEditing(true);
  };

  const save = async () => {
    if (!fighter?.firestoreDocId || !form) return;
    const db = initFirebase();
    if (!db) return setSaveState('error');
    setSaveState('saving');
    try {
      await updateDoc(doc(db, 'fighters', fighter.firestoreDocId), { ...form, updatedAt: Date.now() });
      const nextSlug = fighterSlug({ ...fighter, name: form.name, nickname: form.nickname });
      window.history.replaceState(null, '', `/${nextSlug}`);
      setSaveState('saved');
      setEditing(false);
      window.setTimeout(() => setSaveState('idle'), 2500);
    } catch (error) {
      console.error('Fighter profile save error:', error);
      setSaveState('error');
    }
  };

  if (isLoading) return <div className="grid min-h-screen place-items-center bg-slate-50 dark:bg-slate-950"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-red-600" /></div>;
  if (!fighter || !form) return <div className="grid min-h-screen place-items-center bg-slate-50 px-5 text-center dark:bg-slate-950"><div><p className="text-sm font-black uppercase tracking-widest text-red-600">GOMO Fighter</p><h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">Profile not found</h1><a href="/" className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white dark:bg-white dark:text-slate-900">Back to arena</a></div></div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-3 py-2 sm:px-4">
          <a href="/" aria-label="Back to GOMO Arena" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><ArrowLeft className="h-5 w-5" /></a>
          <img src={logo} alt="GOMO Logo" className="h-9 w-9 rounded-xl object-cover" />
          <div className="min-w-0 flex-1"><p className="font-combat truncate text-sm font-black uppercase">GOMO Fighter Profile</p><p className="text-[10px] font-semibold text-slate-500">Official public fighter information</p></div>
          <button type="button" onClick={onToggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-300 dark:hover:bg-slate-700">{theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}</button>
          {!editing && <button type="button" data-testid="profile-admin-button" onClick={() => setUnlockOpen(true)} aria-label="Edit fighter profile" title="Edit fighter profile" className="grid h-9 w-9 place-items-center rounded-lg bg-red-600 text-white shadow hover:bg-red-700"><ShieldCheck className="h-4 w-4" /></button>}
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 px-3 py-4 sm:px-4 sm:py-6">
        <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-5 text-white shadow-xl sm:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.42),transparent_45%)]" />
          <div className="relative flex items-center gap-4 sm:gap-6"><div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-red-500 bg-slate-800 text-2xl font-black sm:h-32 sm:w-32">{avatar ? <img src={avatar} alt={`${form.nickname || form.name} profile`} className="h-full w-full object-cover" /> : initials}</div><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-400">Kelab Muaythai Gomo</p><h1 className="font-combat mt-1 text-2xl font-black uppercase leading-none sm:text-4xl">{form.nickname || form.name}</h1><p className="mt-2 text-sm font-semibold text-slate-300">{form.name}</p><div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase"><span className="rounded-full bg-red-600 px-3 py-1">{form.stance}</span><span className="rounded-full bg-white/10 px-3 py-1">{fighterWeightCategory(form.weightKg)}</span><span className="rounded-full bg-white/10 px-3 py-1">{form.wins}W · {form.losses}L · {form.draws}D</span></div></div></div>
        </section>

        {editing && <div className="sticky top-[57px] z-30 flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 shadow dark:border-amber-800 dark:bg-amber-950"><div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-100"><Pencil className="h-4 w-4" /> Profile editing unlocked</div><div className="flex gap-2"><button type="button" onClick={() => { setEditing(false); setForm(editableValues(fighter)); setSaveState('idle'); }} className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold dark:border-amber-700">Cancel</button><button type="button" data-testid="save-profile-button" onClick={save} disabled={saveState === 'saving'} className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-black text-white disabled:opacity-60"><Save className="h-3.5 w-3.5" />{saveState === 'saving' ? 'Saving…' : 'Save profile'}</button></div></div>}
        {saveState === 'saved' && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800"><Check className="h-4 w-4" /> Profile saved successfully.</div>}
        {saveState === 'error' && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">Unable to save. Check the Firebase connection and Firestore permissions.</div>}

        {editing ? (
          <ProfileEditor form={form} onText={setText} onNumber={setNumber} onPhoto={uploadPhoto} photoError={photoError} photoBusy={photoBusy} />
        ) : (
          <>
            <Section eyebrow="Fighter profile" title="Personal & Physical Specs"><Field label="Full Name" value={form.name} editing={false} /><Field label="Nickname" value={form.nickname} editing={false} /><Field label="MyKad / NO KP" value={MASK} editing={false} /><Field label="IFMA License" value={form.ifmaLicense} editing={false} /><Field label="Date of Birth" value={MASK} editing={false} /><Field label="Age" value={form.age} editing={false} /><Field label="Weight" value={`${form.weightKg} kg (${fighterWeightCategory(form.weightKg)})`} editing={false} /><Field label="Height" value={`${form.heightCm} cm`} editing={false} /><Field label="Fighting Stance" value={form.stance} editing={false} /><Field label="Favorite Strike" value={form.favTechnique} editing={false} /><Field label="Fight Record (W/L/D)" value={`${form.wins}W - ${form.losses}L - ${form.draws}D`} editing={false} /><Field label="Record Win Rate" value={`${winRate}%`} editing={false} /></Section>
            <Section eyebrow="Academic info" title="School & Academic Specs"><Field label="School" value={form.school} editing={false} /><Field label="Form / Class" value={form.gradeClass} editing={false} /><Field label="Class Teacher" value={form.classTeacher} editing={false} /><Field label="Senior Assistant (Academic)" value={form.pkTeacher} editing={false} /></Section>
            <Section eyebrow="Parent / guardian info" title="Parent & Emergency Contact"><Field label="Parent Name" value={form.parentName} editing={false} /><Field label="Parent H/P No." value={MASK} editing={false} /><Field label="Parent Email" value={MASK} editing={false} /></Section>
            <Section eyebrow="Official club" title="Club & Management"><Field label="Club" value={form.club} editing={false} /><Field label="Manager" value={form.manager} editing={false} /></Section>
          </>
        )}
        <p className="pb-5 text-center text-[11px] font-semibold text-slate-400">Last updated: {updatedLabel}</p>
      </main>

      {unlockOpen && <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/75 p-4" role="dialog" aria-modal="true" aria-labelledby="unlock-title" onClick={() => setUnlockOpen(false)}><div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div className="grid h-11 w-11 place-items-center rounded-xl bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"><LockKeyhole className="h-5 w-5" /></div><button type="button" onClick={() => setUnlockOpen(false)} aria-label="Close unlock dialog" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button></div><h2 id="unlock-title" className="mt-4 text-xl font-black">Unlock profile editing</h2><p className="mt-1 text-sm text-slate-500">Enter the last 6 digits of this fighter’s MyKad number.</p><label className="mt-4 block text-[11px] font-black uppercase tracking-wide text-slate-500" htmlFor="mykad-pin">Last 6 MyKad digits</label><input id="mykad-pin" data-testid="mykad-pin-input" autoFocus inputMode="numeric" maxLength={6} value={pin} onChange={(event) => { setPin(event.target.value.replace(/\D/g, '').slice(0, 6)); setUnlockError(''); }} onKeyDown={(event) => { if (event.key === 'Enter') unlock(); }} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center font-mono text-2xl font-black tracking-[0.35em] outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-red-950" placeholder="••••••" />{unlockError && <p role="alert" className="mt-2 text-xs font-bold text-red-600">{unlockError}</p>}<button type="button" data-testid="unlock-profile-button" onClick={unlock} className="mt-4 w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white hover:bg-red-700">Verify & edit profile</button></div></div>}
    </div>
  );
}
