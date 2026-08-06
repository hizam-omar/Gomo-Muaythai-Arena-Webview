import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export function avatarSeed(name: string) {
  return Array.from((name || '').trim().toUpperCase()).reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 17) >>> 0;
}

export function GeneratedFighterAvatar({ name, corner }: { name: string; corner: 'red' | 'blue' }) {
  const seed = avatarSeed(name);
  const skinTones = ['#f2c7a5', '#d9a276', '#b97850', '#8f563b', '#6f402e'];
  const hairColors = ['#171717', '#3f2a1d', '#6b4226', '#1f2937', '#7c2d12'];
  const skin = skinTones[seed % skinTones.length];
  const hair = hairColors[(seed >>> 3) % hairColors.length];
  const hairStyle = (seed >>> 5) % 4;
  const shirt = corner === 'red' ? '#b91c1c' : '#1d4ed8';
  const background = corner === 'red' ? '#fee2e2' : '#dbeafe';
  const accent = corner === 'red' ? '#ef4444' : '#3b82f6';
  const initial = (name || '').trim().match(/[\p{L}\p{N}]/u)?.[0]?.toUpperCase() || '?';

  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" role="img" aria-label={`Avatar for ${name}`}>
      <rect width="100" height="100" fill={background} />
      <circle cx="78" cy="20" r="18" fill={accent} opacity="0.18" />
      <circle cx="18" cy="82" r="24" fill={accent} opacity="0.13" />
      <path d="M16 100c2-25 15-37 34-37s32 12 34 37" fill={shirt} />
      <path d="M39 60h22v14c-7 5-15 5-22 0z" fill={skin} />
      <circle cx="29" cy="43" r="5" fill={skin} />
      <circle cx="71" cy="43" r="5" fill={skin} />
      <ellipse cx="50" cy="41" rx="22" ry="27" fill={skin} />
      {hairStyle === 0 && <path d="M28 40c-1-22 12-30 24-30 15 0 23 11 20 31-5-9-9-15-18-19-8 8-16 11-26 12z" fill={hair} />}
      {hairStyle === 1 && <><path d="M29 38c0-19 10-28 22-28 13 0 22 10 21 29-9-3-15-8-20-15-6 7-13 11-23 14z" fill={hair} /><circle cx="50" cy="10" r="8" fill={hair} /></>}
      {hairStyle === 2 && <><path d="M29 35c1-17 10-25 22-25 12 0 20 8 21 25-12-8-29-8-43 0z" fill={hair} /><rect x="28" y="30" width="44" height="7" rx="3.5" fill={accent} /></>}
      {hairStyle === 3 && <path d="M29 38c0-18 9-28 22-28 11 0 19 7 21 22-7-5-13-8-20-12-6 8-13 13-23 18z" fill={hair} />}
      <ellipse cx="42" cy="43" rx="2.2" ry="2.8" fill="#1e293b" />
      <ellipse cx="58" cy="43" rx="2.2" ry="2.8" fill="#1e293b" />
      <path d="M47 53c2 2 4 2 6 0" fill="none" stroke="#9f4f45" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M35 39c4-2 8-2 11 0M54 39c3-2 7-2 11 0" fill="none" stroke={hair} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="50" cy="84" r="10" fill="white" opacity="0.94" />
      <text x="50" y="89" textAnchor="middle" fontSize="15" fontWeight="900" fill={shirt}>{initial}</text>
    </svg>
  );
}

export function Avatar({ src, name, corner, onPreview }: { src?: string; name: string; corner: 'red' | 'blue'; onPreview: () => void }) {
  const [failed, setFailed] = useState(false);
  const border = corner === 'red' ? 'border-red-500/80' : 'border-blue-500/80';
  const bg = corner === 'red' ? 'bg-red-50' : 'bg-blue-50';

  return (
    <button
      type="button"
      onClick={onPreview}
      aria-label={`Preview avatar for ${name}`}
      className={`h-[46px] w-[46px] shrink-0 overflow-hidden rounded-full border-2 ${border} ${bg} shadow-2xs hover:scale-105 active:scale-95 transition cursor-pointer`}
    >
      {src && !failed ? (
        <img src={src} alt={name} className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <GeneratedFighterAvatar name={name} corner={corner} />
      )}
    </button>
  );
}

export function PhotoPreviewModal({ preview, onClose }: { preview: { src?: string; name: string; corner: 'red' | 'blue' } | null; onClose: () => void }) {
  if (!preview) return null;
  return createPortal(
    <div className="fixed inset-0 z-[160] grid place-items-center bg-slate-950/80 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="relative max-w-xs rounded-2xl bg-white p-4 text-center shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} aria-label="Close photo" className="absolute right-2 top-2 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
          <X className="h-4 w-4" />
        </button>
        <div className={`mx-auto h-40 w-40 overflow-hidden rounded-full border-4 ${preview.corner === 'red' ? 'border-red-600 bg-red-100' : 'border-blue-600 bg-blue-100'}`}>
          {preview.src ? <img src={preview.src} alt={preview.name} className="h-full w-full object-cover" /> : <GeneratedFighterAvatar name={preview.name} corner={preview.corner} />}
        </div>
        <h4 className="mt-3 font-combat text-base font-black uppercase text-slate-900 dark:text-white">{preview.name}</h4>
      </div>
    </div>,
    document.body
  );
}
