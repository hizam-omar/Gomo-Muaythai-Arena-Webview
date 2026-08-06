import { useCallback, useEffect, useRef, useState, type ReactNode, type TouchEvent as ReactTouchEvent } from 'react';
import { ArrowDown, Check, RefreshCw, Sparkles } from 'lucide-react';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  disabled?: boolean;
}

export function PullToRefresh({ children, onRefresh, disabled = false }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [justRefreshed, setJustRefreshed] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const hasVibratedRef = useRef(false);

  const THRESHOLD = 65;
  const MAX_PULL = 100;

  const triggerRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPullDistance(THRESHOLD);

    try {
      await onRefresh();
      const now = new Date();
      setLastSyncedTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setJustRefreshed(true);
      setTimeout(() => setJustRefreshed(false), 2000);
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 300);
    }
  }, [onRefresh, THRESHOLD]);

  const handleTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (disabled || isRefreshing) return;
    if (window.scrollY <= 0) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
      hasVibratedRef.current = false;
    }
  };

  const handleTouchMove = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (!isPullingRef.current || disabled || isRefreshing) return;
    if (window.scrollY > 0) {
      if (pullDistance > 0) setPullDistance(0);
      isPullingRef.current = false;
      return;
    }

    const currentY = e.touches[0].clientY;
    const diffY = currentY - startYRef.current;

    if (diffY > 0) {
      // Resistance math: scale dampening logarithmically up to MAX_PULL
      const distance = Math.min(MAX_PULL, Math.pow(diffY, 0.82) * 1.8);
      setPullDistance(distance);

      // Trigger light haptic when crossing threshold
      if (distance >= THRESHOLD && !hasVibratedRef.current) {
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(12);
          } catch {
            // ignore vibrate errors
          }
        }
        hasVibratedRef.current = true;
      } else if (distance < THRESHOLD) {
        hasVibratedRef.current = false;
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isPullingRef.current || disabled || isRefreshing) return;
    isPullingRef.current = false;

    if (pullDistance >= THRESHOLD) {
      void triggerRefresh();
    } else {
      setPullDistance(0);
    }
  };

  // Keyboard accessibility & window scroll check
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'r' || e.key === 'R') && (e.ctrlKey || e.metaKey)) {
        // Allow default browser reload or intercepted soft sync if desired
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const progress = Math.min(1, pullDistance / THRESHOLD);
  const isPastThreshold = pullDistance >= THRESHOLD;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="relative w-full"
    >
      {/* Pull indicator bar */}
      <div
        style={{
          height: isRefreshing ? `${THRESHOLD}px` : `${pullDistance}px`,
          transition: isPullingRef.current ? 'none' : 'height 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="overflow-hidden flex items-center justify-center transition-all"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 py-2">
          {isRefreshing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin text-red-600 dark:text-red-400" />
              <span>Syncing live bout scores…</span>
            </>
          ) : justRefreshed ? (
            <>
              <Check className="h-4 w-4 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400">Live feed updated!</span>
            </>
          ) : (
            <div
              style={{
                opacity: Math.max(0.2, progress),
                transform: `scale(${0.7 + progress * 0.3})`,
              }}
              className="flex items-center gap-2 transition-transform"
            >
              <div
                style={{
                  transform: `rotate(${isPastThreshold ? 180 : progress * 180}deg)`,
                }}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-700 transition-transform dark:bg-slate-800 dark:text-slate-200"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </div>
              <span>
                {isPastThreshold ? 'Release to update feed' : 'Pull down to refresh'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Manual Sync Toast Bar / Quick Sync trigger for spectators on desktop/mobile */}
      <div className="mb-2 flex items-center justify-between px-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-red-500 animate-pulse" />
          {lastSyncedTime ? `Synced at ${lastSyncedTime}` : 'Live auto-sync enabled'}
        </span>
        <button
          type="button"
          onClick={() => void triggerRefresh()}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold transition touch-manipulation active:scale-95 disabled:opacity-50"
          title="Manual sync live bouts"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin text-red-600' : ''}`} />
          <span>{isRefreshing ? 'Syncing...' : 'Sync Now'}</span>
        </button>
      </div>

      {/* Main content layer */}
      <div>{children}</div>
    </div>
  );
}
