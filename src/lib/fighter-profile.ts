import type { Fighter } from '../types';

export function fighterSlug(fighter: Fighter): string {
  const source = fighter.nickname?.trim() || fighter.name?.trim() || String(fighter.id || 'fighter');
  return source
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function fighterProfileUrl(fighter: Fighter): string {
  return `/${fighterSlug(fighter)}`;
}

export function fighterPublicProfileUrl(fighter: Fighter): string {
  const origin = (import.meta.env.VITE_PUBLIC_APP_URL || 'https://gomo-club.ai.studio').replace(/\/+$/, '');
  return `${origin}${fighterProfileUrl(fighter)}`;
}

export function fighterWeightCategory(weight = 0): string {
  if (weight <= 25) return 'Atomweight (≤25kg)';
  if (weight <= 30) return 'Mini Flyweight (26–30kg)';
  if (weight <= 35) return 'Strawweight (31–35kg)';
  if (weight <= 42) return 'Flyweight (36–42kg)';
  if (weight <= 50) return 'Bantamweight (43–50kg)';
  if (weight <= 57) return 'Featherweight (51–57kg)';
  if (weight <= 65) return 'Lightweight (58–65kg)';
  if (weight <= 71) return 'Welterweight (66–71kg)';
  return 'Middleweight (>71kg)';
}
