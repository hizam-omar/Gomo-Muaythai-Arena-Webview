import React from 'react';
import { ArrowLeft, Moon, Sun } from 'lucide-react';
import logo from '../assets/images/gomo_logo_1785735883874.jpg';

interface SiteHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  onBack?: () => void;
  backLabel?: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  primaryAction?: {
    icon: React.ReactNode;
    onClick: () => void;
    label?: string;
    title?: string;
    testId?: string;
  };
  children?: React.ReactNode;
}

export function SiteHeader({
  title,
  subtitle,
  backHref,
  onBack,
  backLabel = 'Back',
  theme,
  onToggleTheme,
  primaryAction,
  children,
}: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 shadow-2xs pb-safe">
      <div className="mx-auto flex h-[66px] max-w-4xl items-center justify-between px-3 sm:px-4">
        {/* Left Section: Back button + Logo + Title Layout */}
        <div className="flex items-center gap-2.5 min-w-0">
          {backHref ? (
            <a
              href={backHref}
              aria-label={backLabel}
              title={backLabel}
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </a>
          ) : onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label={backLabel}
              title={backLabel}
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </button>
          ) : null}

          <img
            src={logo}
            alt="GOMO Logo"
            className="h-[42px] w-[42px] shrink-0 rounded-xl object-cover"
          />

          <div className="min-w-0">
            <h1 className="truncate text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="truncate text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {children}

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            className="flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-amber-300 dark:hover:bg-slate-700"
          >
            {theme === 'light' ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
          </button>

          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              data-testid={primaryAction.testId}
              aria-label={primaryAction.label || primaryAction.title}
              title={primaryAction.title || primaryAction.label}
              className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-red-600 text-white shadow-2xs transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            >
              {primaryAction.icon}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
