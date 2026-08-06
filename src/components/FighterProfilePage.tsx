import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import {
  Camera, Check, LockKeyhole, Pencil, Save, ShieldCheck, Swords, Upload, X
} from 'lucide-react';
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { SiteHeader } from './SiteHeader';
import { FighterHeroCard } from './FighterHeroCard';
import { ProfileTabs } from './ProfileTabs';
import { HistoricalBoutsSection } from './HistoricalBoutsSection';
import { fighterSlug, fighterWeightCategory } from '../lib/fighter-profile';
import { initFirebase } from '../lib/firebase';
import { isAdminAuthenticated } from '../lib/admin';
import type { FightRecord, Fighter } from '../types';

interface FighterProfilePageProps {
  fighter?: Fighter;
  fightRecords?: FightRecord[];
  isLoading: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export type EditableFighter = Required<Pick<Fighter,
  'name' | 'nickname' | 'nokp' | 'dob' | 'age' | 'weightKg' | 'heightCm' |
  'wins' | 'losses' | 'draws' | 'club' | 'manager' | 'school' | 'gradeClass' |
  'classTeacher' | 'pkTeacher' | 'parentName' | 'parentPhone' | 'parentEmail' |
  'ifmaLicense' | 'stance' | 'favTechnique' | 'imageUri' | 'videoUrl'>>;

const MASK = '••••••••';

export function editableValues(fighter: Fighter): EditableFighter {
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
    videoUrl: fighter.videoUrl || '',
  };
}

export async function preparePhoto(file: File): Promise<string> {
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

export function publicAvatar(fighter: Partial<Fighter>): string | undefined {
  const value = fighter.imageUri || fighter.photoUrl || fighter.avatarUrl;
  if (!value || /^(content:|file:|\/)/i.test(value)) return undefined;
  if (value.startsWith('data:image') || value.length > 200) return value.startsWith('data:image') ? value : `data:image/jpeg;base64,${value}`;
  return value;
}

function getEmbedVideoUrl(url?: string): { type: 'youtube' | 'tiktok' | 'video' | 'link'; src: string; videoId?: string } | null {
  if (!url) return null;
  const trimmed = url.trim();
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return { type: 'youtube', src: `https://www.youtube.com/embed/${ytMatch[1]}` };
  }
  if (trimmed.includes('youtube.com/embed/')) {
    return { type: 'youtube', src: trimmed };
  }
  const tiktokMatch = trimmed.match(/(?:tiktok\.com\/@[\w.-]+\/video\/(\d+)|vm\.tiktok\.com\/([A-Za-z0-9]+)|tiktok\.com\/v\/(\d+))/i);
  if (tiktokMatch) {
    const videoId = tiktokMatch[1] || tiktokMatch[3];
    if (videoId) {
      return { type: 'tiktok', src: `https://www.tiktok.com/embed/v2/${videoId}`, videoId };
    }
    return { type: 'tiktok', src: trimmed, videoId: tiktokMatch[2] };
  }
  if (/\.(mp4|webm|ogg|mov)$/i.test(trimmed) || trimmed.startsWith('blob:') || trimmed.startsWith('data:video')) {
    return { type: 'video', src: trimmed };
  }
  return { type: 'link', src: trimmed };
}

function Field({ label, value, editing, type = 'text', onChange, options }: {
  label: string; value: string | number; editing: boolean; type?: string;
  onChange?: (value: string) => void; options?: string[];
}) {
  return (
    <div className="grid gap-1 border-b border-slate-100 py-2.5 last:border-b-0 dark:border-slate-800/80 sm:grid-cols-[minmax(145px,0.8fr)_minmax(0,1.2fr)] sm:items-center sm:gap-4">
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
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <header className="border-b border-slate-100 px-4 py-3 dark:border-slate-800/80 sm:px-5">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-600">{eyebrow}</p>
        <h2 className="font-combat mt-0.5 text-base font-black uppercase text-slate-900 dark:text-white">{title}</h2>
      </header>
      <dl className="m-0 px-4 sm:px-5">{children}</dl>
    </section>
  );
}

function EditInput({ label, value, onChange, type = 'text', required = false, placeholder, uppercase }: {
  label: string; value: string | number; onChange: (value: string) => void;
  type?: string; required?: boolean; placeholder?: string; uppercase?: boolean;
}) {
  const shouldUppercase = uppercase ?? type === 'text';
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-300">{label}{required && <span className="text-red-600"> *</span>}</span>
      <input
        type={type}
        inputMode={type === 'number' ? 'decimal' : type === 'tel' ? 'tel' : undefined}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(shouldUppercase ? event.target.value.toLocaleUpperCase() : event.target.value)}
        className={`h-9 w-full rounded-[10px] border border-slate-300 bg-white/50 px-3 text-[13px] font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-950/50 dark:text-white dark:focus:bg-slate-950 ${shouldUppercase ? 'uppercase' : ''}`}
      />
    </label>
  );
}

function dobToDateInput(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return '';
  return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
}

function dateInputToDob(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
}

function formatMyKad(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 12);
  if (digits.length <= 6) return digits;
  if (digits.length <= 8) return `${digits.slice(0, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
}

function dobFromMyKad(nokp: string): string {
  const digits = nokp.replace(/\D/g, '');
  if (digits.length < 6) return '';
  const yy = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const dd = digits.slice(4, 6);
  const yearNum = parseInt(yy, 10);
  const fullYear = yearNum >= 0 && yearNum <= 40 ? 2000 + yearNum : 1900 + yearNum;
  const m = parseInt(mm, 10);
  const d = parseInt(dd, 10);
  if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
    return `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${fullYear}`;
  }
  return '';
}

function ageFromDob(dob: string): number {
  const match = dob.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return 0;
  const d = parseInt(match[1], 10);
  const m = parseInt(match[2], 10) - 1;
  const y = parseInt(match[3], 10);
  const birthDate = new Date(y, m, d);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const mDiff = today.getMonth() - birthDate.getMonth();
  if (mDiff < 0 || (mDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

function formatPhone(value: string): string {
  const hasPlus = value.startsWith('+');
  const digits = value.replace(/\D/g, '');
  if (hasPlus) return `+${digits}`;
  if (digits.startsWith('60') && digits.length > 2) {
    const sub = digits.slice(2);
    if (sub.length <= 2) return `+60 ${sub}`;
    if (sub.length <= 5) return `+60 ${sub.slice(0, 2)}-${sub.slice(2)}`;
    return `+60 ${sub.slice(0, 2)}-${sub.slice(2, 5)} ${sub.slice(5, 9)}`;
  }
  if (digits.startsWith('0')) {
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}${digits.length > 7 ? ' ' + digits.slice(7, 11) : ''}`;
  }
  return value;
}

function EditSection({ number, title, optional, children }: { number: number; title: string; optional?: boolean; children: ReactNode }) {
  return (
    <section className="rounded-[12px] border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white">{number}</span>
        <h2 className="font-combat text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400">{title}{optional && <span className="ml-1 text-[10px] font-semibold normal-case text-slate-400">(Optional)</span>}</h2>
      </div>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

export function ProfileEditor({ form, onText, onNumber, onPhoto, photoError, photoBusy }: {
  form: EditableFighter;
  onText: (key: keyof EditableFighter) => (value: string) => void;
  onNumber: (key: keyof EditableFighter) => (value: string) => void;
  onPhoto: (event: ChangeEvent<HTMLInputElement>) => void;
  photoError: string;
  photoBusy: boolean;
}) {
  const photo = publicAvatar({ imageUri: form.imageUri });
  const handleNoKpChange = (value: string) => {
    const formatted = formatMyKad(value);
    onText('nokp')(formatted);
    const extractedDob = dobFromMyKad(formatted);
    if (extractedDob) {
      onText('dob')(extractedDob);
      const calcAge = ageFromDob(extractedDob);
      if (calcAge > 0) {
        onNumber('age')(String(calcAge));
      }
    }
  };
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    onText('parentPhone')(formatted);
  };
  return (
    <div className="space-y-3" data-testid="fighter-edit-form">
      <section className="rounded-[12px] border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-[10px] border-2 border-dashed border-slate-300 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-950">
            {photo ? <img src={photo} alt="New fighter preview" className="h-full w-full object-cover" /> : <Camera className="h-7 w-7" />}
          </div>
          <div className="w-full flex-1 text-center sm:text-left">
            <p className="text-xs font-extrabold text-slate-900 dark:text-white">Fighter Profile Photo</p>
            <p className="mt-0.5 text-[11px] leading-tight text-slate-500">Choose a clear portrait. It will be resized for the public fighter card.</p>
            <label className="mt-2.5 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[10px] bg-slate-100 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
              <Upload className="h-3.5 w-3.5" /> {photoBusy ? 'Preparing photo…' : photo ? 'Update Photo' : 'Upload Photo'}
              <input data-testid="fighter-photo-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhoto} disabled={photoBusy} className="sr-only" />
            </label>
            {photoError && <p role="alert" className="mt-1.5 text-[11px] font-bold text-red-600">{photoError}</p>}
          </div>
        </div>
      </section>

      <EditSection number={1} title="Fighter Identity">
        <EditInput label="Full Name" value={form.name} onChange={onText('name')} required />
        <EditInput label="Nickname (e.g., HARRAZ GOMO)" value={form.nickname} onChange={onText('nickname')} required />
        <EditInput label="No KP / MyKad Number" value={form.nokp} onChange={handleNoKpChange} placeholder="130425-14-1155" uppercase={false} />
        <EditInput label="IFMA License Number" value={form.ifmaLicense} onChange={onText('ifmaLicense')} />
        <EditInput label="Date of Birth" type="date" value={dobToDateInput(form.dob)} onChange={(val) => {
          const dobStr = dateInputToDob(val);
          onText('dob')(dobStr);
          const calcAge = ageFromDob(dobStr);
          if (calcAge >= 0) {
            onNumber('age')(String(calcAge));
          }
        }} />
        <EditInput label="Age" type="number" value={form.age} onChange={onNumber('age')} />
      </EditSection>

      <EditSection number={2} title="Physical Specs & Stance">
        <EditInput label="Weight (kg)" type="number" value={form.weightKg} onChange={onNumber('weightKg')} />
        <EditInput label="Height (cm)" type="number" value={form.heightCm} onChange={onNumber('heightCm')} />
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-300">Stance</span>
          <select value={form.stance} onChange={(e) => onText('stance')(e.target.value)} className="h-9 w-full rounded-[10px] border border-slate-300 bg-white px-3 text-[13px] font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white">
            <option value="Orthodox">Orthodox</option>
            <option value="Southpaw">Southpaw</option>
            <option value="Switch">Switch</option>
          </select>
        </label>
        <EditInput label="Favorite Technique" value={form.favTechnique} onChange={onText('favTechnique')} />
      </EditSection>

      <EditSection number={3} title="Official Fight Record">
        <EditInput label="Wins" type="number" value={form.wins} onChange={onNumber('wins')} />
        <EditInput label="Losses" type="number" value={form.losses} onChange={onNumber('losses')} />
        <EditInput label="Draws" type="number" value={form.draws} onChange={onNumber('draws')} />
      </EditSection>

      <EditSection number={4} title="Academic Information" optional>
        <EditInput label="School Name" value={form.school} onChange={onText('school')} uppercase={false} />
        <EditInput label="Form / Class" value={form.gradeClass} onChange={onText('gradeClass')} />
        <EditInput label="Class Teacher" value={form.classTeacher} onChange={onText('classTeacher')} uppercase={false} />
        <EditInput label="Senior Assistant Teacher" value={form.pkTeacher} onChange={onText('pkTeacher')} uppercase={false} />
      </EditSection>

      <EditSection number={5} title="Parent & Emergency Contact" optional>
        <EditInput label="Parent / Guardian Name" value={form.parentName} onChange={onText('parentName')} uppercase={false} />
        <EditInput label="Parent Phone Number" type="tel" value={form.parentPhone} onChange={handlePhoneChange} placeholder="012-345 6789" uppercase={false} />
        <EditInput label="Parent Email Address" type="email" value={form.parentEmail} onChange={onText('parentEmail')} uppercase={false} />
      </EditSection>

      <EditSection number={6} title="Club & Highlights" optional>
        <EditInput label="Club Name" value={form.club} onChange={onText('club')} />
        <EditInput label="Manager" value={form.manager} onChange={onText('manager')} uppercase={false} />
        <EditInput label="Highlight Video URL (YouTube, TikTok, MP4)" value={form.videoUrl} onChange={onText('videoUrl')} uppercase={false} />
      </EditSection>
    </div>
  );
}

export function FighterProfilePage({ fighter, fightRecords: initialFightRecords = [], isLoading, theme, onToggleTheme }: FighterProfilePageProps) {
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [editing, setEditing] = useState(() => isAdminAuthenticated() && new URLSearchParams(window.location.search).get('edit') === '1');
  const [form, setForm] = useState<EditableFighter | null>(fighter ? editableValues(fighter) : null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [photoError, setPhotoError] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);
  const [firestoreRecords, setFirestoreRecords] = useState<FightRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'history'>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') === 'history' ? 'history' : 'profile';
  });
  const adminMode = isAdminAuthenticated();

  useEffect(() => {
    const db = initFirebase();
    if (!db) {
      setRecordsLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, 'fight_records'),
      (snapshot) => {
        const records = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...(docItem.data() as FightRecord),
        }));
        setFirestoreRecords(records);
        setRecordsLoading(false);
      },
      (error) => {
        console.error('Fight records snapshot error in profile:', error);
        setRecordsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const combinedFightRecords = useMemo(() => {
    const map = new Map<string, FightRecord>();
    initialFightRecords.forEach((r) => {
      const id = r.id !== undefined ? String(r.id) : JSON.stringify(r);
      map.set(id, r);
    });
    firestoreRecords.forEach((r) => {
      const id = r.id !== undefined ? String(r.id) : JSON.stringify(r);
      map.set(id, r);
    });
    return Array.from(map.values());
  }, [initialFightRecords, firestoreRecords]);

  const boutsCountForFighter = useMemo(() => {
    if (!fighter) return 0;
    const fidStr = fighter.id !== undefined && fighter.id !== null ? String(fighter.id) : '';
    const docIdStr = fighter.firestoreDocId ? String(fighter.firestoreDocId) : '';
    const nameStr = (fighter.name || '').trim().toLowerCase();
    const nicknameStr = (fighter.nickname || '').trim().toLowerCase();

    return combinedFightRecords.filter((rec) => {
      const recFighterId = rec.fighterId !== undefined && rec.fighterId !== null ? String(rec.fighterId) : '';
      if (recFighterId && (recFighterId === fidStr || recFighterId === docIdStr)) return true;

      const red = (rec.redName || '').trim().toLowerCase();
      const blue = (rec.blueName || '').trim().toLowerCase();
      const opp = (rec.opponentName || '').trim().toLowerCase();

      if (nameStr && (red === nameStr || blue === nameStr || opp === nameStr)) return true;
      if (nicknameStr && (red === nicknameStr || blue === nicknameStr || opp === nicknameStr)) return true;

      return false;
    }).length;
  }, [fighter, combinedFightRecords]);

  useEffect(() => {
    if (fighter && (!editing || form === null)) setForm(editableValues(fighter));
  }, [fighter, editing]);

  useEffect(() => {
    document.title = fighter
      ? `${fighter.nickname || fighter.name || 'Fighter'} :: GOMO Muaythai`
      : 'Fighter Profile :: GOMO Muaythai';
  }, [fighter]);

  useEffect(() => {
    if (!photoPreviewOpen) return;
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setPhotoPreviewOpen(false);
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [photoPreviewOpen]);

  const avatar = editing && form ? publicAvatar({ imageUri: form.imageUri }) : fighter ? publicAvatar(fighter) : undefined;
  const initials = (fighter?.nickname || fighter?.name || 'GOMO').split(/\s+/).map((part) => part[0]).join('').slice(0, 2);
  const totalFights = (form?.wins || 0) + (form?.losses || 0) + (form?.draws || 0);
  const winRate = totalFights ? Math.floor(((form?.wins || 0) / totalFights) * 100) : 0;
  const myKadValue = fighter?.nokp?.trim() || '';
  const myKadDigits = myKadValue.replace(/\D/g, '');
  const usesMyKadKey = myKadValue !== '';
  const nicknameKey = fighter ? fighterSlug(fighter) : '';
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
    if (usesMyKadKey) {
      if (myKadDigits.length < 6) return setUnlockError('This fighter’s MyKad record does not contain six digits. Please ask an administrator to correct it.');
      if (!/^\d{6}$/.test(pin)) return setUnlockError('Enter exactly the last 6 digits of the MyKad number. Nickname login is disabled for this fighter.');
      if (pin !== myKadDigits.slice(-6)) return setUnlockError('Incorrect MyKad key. Enter the last 6 digits only; the nickname key is not accepted.');
    } else {
      if (!pin.trim()) return setUnlockError(`Enter the nickname key shown in the profile link: ${nicknameKey}`);
      if (pin.trim().toLowerCase() !== nicknameKey) return setUnlockError(`Incorrect nickname key. Enter “${nicknameKey}” exactly.`);
    }
    setUnlockOpen(false);
    setPin('');
    setUnlockError('');
    setForm(editableValues(fighter!));
    setEditing(true);
  };

  const requestEdit = () => {
    if (adminMode) {
      setForm(editableValues(fighter!));
      setEditing(true);
      return;
    }
    setUnlockOpen(true);
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
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-red-600 selection:text-white dark:bg-slate-950 dark:text-slate-100 font-sans">
      <SiteHeader
        title="Fighter Profile"
        subtitle={adminMode ? 'Administrator Access · Full Information' : 'Official Public Fighter Information'}
        backHref={adminMode ? '/fighters' : '/'}
        backLabel={adminMode ? 'Back to fighter roster' : 'Back to GOMO Arena'}
        theme={theme}
        onToggleTheme={onToggleTheme}
        primaryAction={!editing ? {
          icon: adminMode ? <Pencil className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />,
          onClick: requestEdit,
          label: adminMode ? 'Edit profile as admin' : 'Unlock profile editing',
          title: adminMode ? 'Edit profile as admin' : 'Unlock profile editing',
          testId: 'profile-admin-button',
        } : undefined}
      />

      <main className="mx-auto max-w-4xl space-y-3.5 px-3 py-3 sm:px-4 sm:py-5">
        {/* Compact Fighter Hero */}
        <FighterHeroCard
          fighter={fighter}
          form={form}
          avatar={avatar}
          initials={initials}
          winRate={winRate}
          onViewPhoto={() => avatar && setPhotoPreviewOpen(true)}
        />

        {/* Compact Segmented Control Tabs */}
        {!editing && (
          <ProfileTabs
            activeTab={activeTab}
            onSelectTab={(tab) => {
              setActiveTab(tab);
              const url = new URL(window.location.href);
              if (tab === 'history') {
                url.searchParams.set('tab', 'history');
              } else {
                url.searchParams.delete('tab');
              }
              window.history.replaceState(null, '', url.pathname + url.search);
            }}
            boutsCount={boutsCountForFighter}
          />
        )}

        {/* Editing Status Banner */}
        {editing && (
          <div className="sticky top-[64px] z-30 flex h-11 items-center justify-between gap-2.5 rounded-xl border border-amber-300/80 bg-amber-50/95 px-3 shadow-xs backdrop-blur-md dark:border-amber-800/80 dark:bg-amber-950/95">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
              <Pencil className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Editing Unlocked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => { setEditing(false); setForm(editableValues(fighter)); setSaveState('idle'); }}
                aria-label="Cancel"
                title="Cancel"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-300/90 bg-white text-slate-700 hover:bg-amber-100/60 dark:border-amber-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                type="button"
                data-testid="save-profile-button"
                onClick={save}
                disabled={saveState === 'saving'}
                aria-label="Save"
                title="Save"
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600 text-white shadow-xs transition hover:bg-red-700 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        {saveState === 'saved' && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800"><Check className="h-4 w-4" /> Profile saved successfully.</div>}
        {saveState === 'error' && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">Unable to save. Check the Firebase connection and Firestore permissions.</div>}

        {/* Main Content View (Editing | History | Profile Specs) */}
        {editing ? (
          <ProfileEditor form={form} onText={setText} onNumber={setNumber} onPhoto={uploadPhoto} photoError={photoError} photoBusy={photoBusy} />
        ) : activeTab === 'history' ? (
          <HistoricalBoutsSection fighter={fighter} fightRecords={combinedFightRecords} isLoading={recordsLoading} fullPage={true} />
        ) : (
          <div className="space-y-3.5">
            <Section eyebrow="Fighter Profile" title="Personal & Physical Specs">
              <Field label="Full Name" value={form.name} editing={false} />
              <Field label="Nickname" value={form.nickname} editing={false} />
              <Field label="MyKad / NO KP" value={adminMode ? form.nokp : MASK} editing={false} />
              <Field label="IFMA License" value={form.ifmaLicense} editing={false} />
              <Field label="Date of Birth" value={adminMode ? form.dob : MASK} editing={false} />
              <Field label="Age" value={form.age > 0 ? `${form.age} years old` : 'Not specified'} editing={false} />
              <Field label="Weight" value={form.weightKg > 0 ? `${form.weightKg} kg (${fighterWeightCategory(form.weightKg)})` : 'Not specified'} editing={false} />
              <Field label="Height" value={form.heightCm > 0 ? `${form.heightCm} cm` : 'Not specified'} editing={false} />
              <Field label="Stance" value={form.stance} editing={false} />
              <Field label="Fav. Technique" value={form.favTechnique} editing={false} />
              <Field label="Fight Record" value={`${form.wins}W - ${form.losses}L - ${form.draws}D`} editing={false} />
              <Field label="Win Rate" value={`${winRate}%`} editing={false} />
            </Section>
            
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400">
                  <Swords className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Historical Fight Records ({boutsCountForFighter} {boutsCountForFighter === 1 ? 'Bout' : 'Bouts'})
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Switch to the Fight History tab to inspect detailed bout records, win-loss distribution, and medal achievements.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('history');
                  const url = new URL(window.location.href);
                  url.searchParams.set('tab', 'history');
                  window.history.replaceState(null, '', url.pathname + url.search);
                }}
                className="shrink-0 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-extrabold text-white transition hover:bg-red-700 shadow-xs"
              >
                View Fight History ↗
              </button>
            </div>

            <Section eyebrow="Academic Specs" title="School & Academic Info">
              <Field label="School" value={form.school} editing={false} />
              <Field label="Form / Class" value={form.gradeClass} editing={false} />
              <Field label="Class Teacher" value={form.classTeacher} editing={false} />
              <Field label="Senior Assistant (Academic)" value={form.pkTeacher} editing={false} />
            </Section>

            <Section eyebrow="Emergency Contact" title="Parent & Guardian Info">
              <Field label="Parent Name" value={form.parentName} editing={false} />
              <Field label="Parent H/P No." value={adminMode ? form.parentPhone : MASK} editing={false} />
              <Field label="Parent Email" value={adminMode ? form.parentEmail : MASK} editing={false} />
            </Section>

            <Section eyebrow="Management" title="Club Information">
              <Field label="Club" value={form.club} editing={false} />
              <Field label="Manager" value={form.manager} editing={false} />
            </Section>

            {form.videoUrl && (() => {
              const embed = getEmbedVideoUrl(form.videoUrl);
              if (!embed) return null;
              return (
                <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <header className="border-b border-slate-100 px-4 py-3 dark:border-slate-800/80 sm:px-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-600">Fighter Highlight</p>
                    <h2 className="font-combat mt-0.5 text-base font-black uppercase text-slate-900 dark:text-white">Match & Training Footage</h2>
                  </header>
                  <div className="p-4 sm:p-5">
                    {embed.type === 'youtube' && (
                      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-950">
                        <iframe src={embed.src} title={`${form.nickname || form.name} highlight video`} className="absolute inset-0 h-full w-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                      </div>
                    )}
                    {embed.type === 'tiktok' && (
                      <div className="space-y-3">
                        {embed.videoId ? (
                          <div className="relative aspect-[9/16] max-h-[500px] w-full overflow-hidden rounded-xl bg-slate-950 mx-auto max-w-[320px]">
                            <iframe src={embed.src} title={`${form.nickname || form.name} TikTok video`} className="absolute inset-0 h-full w-full border-0" allow="encrypted-media" allowFullScreen />
                          </div>
                        ) : null}
                        <div className="text-center">
                          <a href={form.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-black text-white hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700">
                            Watch TikTok Video ↗
                          </a>
                        </div>
                      </div>
                    )}
                    {embed.type === 'video' && (
                      <video src={embed.src} controls className="w-full rounded-xl bg-slate-950 object-cover" />
                    )}
                    {embed.type === 'link' && (
                      <a href={embed.src} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white hover:bg-red-700">
                        Watch Highlight Video ↗
                      </a>
                    )}
                  </div>
                </section>
              );
            })()}
          </div>
        )}
        <p className="pb-5 text-center text-[11px] font-semibold text-slate-400">Last updated: {updatedLabel}</p>
      </main>

      {/* Photo Preview Modal */}
      {photoPreviewOpen && avatar && (
        <div className="fixed inset-0 z-[170] grid place-items-center bg-slate-950/90 p-4" role="dialog" aria-modal="true" aria-label={`${form.nickname || form.name} photo preview`} onClick={() => setPhotoPreviewOpen(false)}>
          <div className="relative max-h-[92vh] max-w-3xl" onClick={(event) => event.stopPropagation()}>
            <img src={avatar} alt={`${form.nickname || form.name} full-size profile`} className="max-h-[88vh] max-w-full rounded-2xl object-contain shadow-2xl" />
            <button type="button" onClick={() => setPhotoPreviewOpen(false)} aria-label="Close photo preview" className="absolute right-2 top-2 grid h-10 w-10 place-items-center rounded-full bg-slate-950/75 text-white backdrop-blur hover:bg-slate-950">
              <X className="h-5 w-5" />
            </button>
            <p className="absolute inset-x-0 bottom-2 text-center">
              <span className="rounded-full bg-slate-950/75 px-3 py-1.5 text-xs font-black uppercase text-white backdrop-blur">{form.nickname || form.name}</span>
            </p>
          </div>
        </div>
      )}

      {/* Profile Unlock Modal */}
      {unlockOpen && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/75 p-4" role="dialog" aria-modal="true" aria-labelledby="unlock-title" onClick={() => setUnlockOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <button type="button" onClick={() => setUnlockOpen(false)} aria-label="Close unlock dialog" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            <h2 id="unlock-title" className="mt-4 text-xl font-black">Unlock profile editing</h2>
            <div className={`mt-3 rounded-xl border px-3 py-2.5 text-xs font-semibold leading-relaxed ${usesMyKadKey ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200' : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200'}`}>
              {usesMyKadKey ? <>This fighter has a MyKad on record. Enter its <strong>last 6 digits</strong>. Nickname login is disabled.</> : <>This fighter has no MyKad on record. Use the nickname key from the profile link: <strong className="font-mono">{nicknameKey}</strong>.</>}
            </div>
            <label className="mt-4 block text-[11px] font-black uppercase tracking-wide text-slate-500" htmlFor="profile-key">
              {usesMyKadKey ? 'Last 6 MyKad digits' : 'Nickname key'}
            </label>
            <input
              id="profile-key"
              data-testid="profile-key-input"
              autoFocus
              inputMode={usesMyKadKey ? 'numeric' : 'text'}
              autoCapitalize="none"
              autoCorrect="off"
              maxLength={usesMyKadKey ? 6 : 80}
              value={pin}
              onChange={(event) => {
                const value = usesMyKadKey ? event.target.value.replace(/\D/g, '').slice(0, 6) : event.target.value.toLowerCase().replace(/\s+/g, '-');
                setPin(value);
                setUnlockError('');
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') unlock();
              }}
              className={`mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center font-mono font-black outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-red-950 ${
                usesMyKadKey ? 'text-2xl tracking-[0.35em]' : 'text-base tracking-wide'
              }`}
              placeholder={usesMyKadKey ? '••••••' : nicknameKey}
            />
            {unlockError && <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 dark:bg-red-950 dark:text-red-300">{unlockError}</p>}
            <button
              type="button"
              data-testid="unlock-profile-button"
              onClick={unlock}
              className="mt-4 w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white hover:bg-red-700 shadow-xs"
            >
              Verify & edit profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
