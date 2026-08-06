import { useEffect, useState } from 'react';
import { CalendarDays, Clock3, Info, MapPin, Radio, ShieldCheck, Trophy, X, Bell, BellOff } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface EventInfoSheetProps {
  isOpen: boolean;
  onClose: () => void;
  eventName: string;
  eventLocation: string;
  eventStartDate: string;
  eventEndDate: string;
  liveCount: number;
  waitingCount: number;
  completedCount: number;
  activeRings: string[];
  isFirebaseConnected: boolean;
  onOpenStandings: () => void;
  notificationsEnabled: boolean;
  onToggleNotifications: (enabled: boolean) => void;
}

export function EventInfoSheet({
  isOpen,
  onClose,
  eventName,
  eventLocation,
  eventStartDate,
  eventEndDate,
  liveCount,
  waitingCount,
  completedCount,
  activeRings,
  isFirebaseConnected,
  onOpenStandings,
  notificationsEnabled,
  onToggleNotifications,
}: EventInfoSheetProps) {
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('');
  const [permissionState, setPermissionState] = useState<string>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionState(Notification.permission);
    } else {
      setPermissionState('unsupported');
    }
  }, []);

  const handleToggleClick = async () => {
    if (!('Notification' in window)) {
      return;
    }
    if (Notification.permission === 'denied') {
      return;
    }
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);
      if (permission === 'granted') {
        onToggleNotifications(true);
      } else {
        onToggleNotifications(false);
      }
      return;
    }
    onToggleNotifications(!notificationsEnabled);
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLastSyncedTime(now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const displayEventName = eventName?.trim() || 'Kejohanan Muaythai Sukan Tempur Kebangsaan 2026';
  const displayLocation = eventLocation?.trim() || 'Arena Axiata, Bukit Jalil';
  const displayDateRange = (eventStartDate?.trim() && eventEndDate?.trim())
    ? `${eventStartDate.trim()} – ${eventEndDate.trim()}`
    : (eventStartDate?.trim() || eventEndDate?.trim() || '3–6 September 2026');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[140] flex items-end justify-center bg-slate-950/75 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Event Details">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          />

          {/* Sheet Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="relative z-10 w-full max-w-lg rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:rounded-3xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab Handle */}
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700 sm:hidden" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400">
                  <Info className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400">Event Overview</p>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">Official Event Details</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close event info"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              {/* Event Name */}
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Tournament Title</span>
                <p className="mt-0.5 text-base font-extrabold text-slate-900 dark:text-white">{displayEventName}</p>
              </div>

              {/* Status & Sync */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-red-100 bg-red-50/80 p-3 dark:border-red-900/50 dark:bg-red-950/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400 flex items-center gap-1.5">
                    <Radio className="h-3.5 w-3.5 animate-pulse text-red-600" />
                    Status
                  </span>
                  <p className="mt-1 text-xs font-black text-slate-900 dark:text-white">
                    {liveCount > 0 ? 'EVENT LIVE' : 'EVENT ACTIVE'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Day 1 · Session 1</p>
                </div>

                <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    {isFirebaseConnected ? 'Live Sync' : 'WebView Feed'}
                  </span>
                  <p className="mt-1 text-xs font-black text-slate-900 dark:text-white">
                    {isFirebaseConnected ? 'Firestore Connected' : 'Android Bridge'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Last sync: {lastSyncedTime}</p>
                </div>
              </div>

              {/* Venue & Date */}
              <div className="space-y-2.5 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-red-600 shrink-0" />
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Venue</span>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">{displayLocation}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t border-slate-200/60 pt-2.5 dark:border-slate-800">
                  <CalendarDays className="h-4 w-4 text-red-600 shrink-0" />
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date Range</span>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">{displayDateRange}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t border-slate-200/60 pt-2.5 dark:border-slate-800">
                  <Clock3 className="h-4 w-4 text-red-600 shrink-0" />
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daily Session</span>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">Starts at 8:00 AM Daily</span>
                  </div>
                </div>
              </div>

              {/* Active Rings */}
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Active Competition Rings</span>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {activeRings.length > 0 ? (
                    activeRings.map((ring) => (
                      <span key={ring} className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-extrabold text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                        {ring.toLowerCase().startsWith('ring') ? ring : `Ring ${ring}`}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400">
                      Ring A (Main Ring)
                    </span>
                  )}
                </div>
              </div>

              {/* Bouts Stats Breakdown */}
              <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">Bout Breakdown</span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-red-50 p-2 dark:bg-red-950/60">
                    <p className="text-base font-black text-red-600">{liveCount}</p>
                    <p className="text-[9px] font-bold uppercase text-red-800 dark:text-red-300">Live Bouts</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-950/60">
                    <p className="text-base font-black text-amber-600">{waitingCount}</p>
                    <p className="text-[9px] font-bold uppercase text-amber-800 dark:text-amber-300">Upcoming</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-950/60">
                    <p className="text-base font-black text-emerald-600">{completedCount}</p>
                    <p className="text-[9px] font-bold uppercase text-emerald-800 dark:text-emerald-300">Completed</p>
                  </div>
                </div>
              </div>

              {/* Live Fight Alerts Toggle */}
              <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
                      {notificationsEnabled && permissionState === 'granted' ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                    </span>
                    <div>
                      <span className="block text-xs font-extrabold text-slate-800 dark:text-slate-200">
                        Live Fight Alerts
                      </span>
                      <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        {permissionState === 'denied' 
                          ? 'Blocked by browser settings' 
                          : 'Notify when fights go live'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleClick}
                    disabled={permissionState === 'denied' || permissionState === 'unsupported'}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 touch-manipulation ${
                      notificationsEnabled && permissionState === 'granted'
                        ? 'bg-amber-500'
                        : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                    role="switch"
                    aria-checked={notificationsEnabled && permissionState === 'granted'}
                    aria-label="Toggle live fight notifications"
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        notificationsEnabled && permissionState === 'granted' ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenStandings();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-xs font-extrabold text-amber-950 hover:bg-amber-400 shadow-xs transition"
                >
                  <Trophy className="h-4 w-4" />
                  <span>View Tournament Standings</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
