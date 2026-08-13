import type { TeamKey, WordValue } from './types';

/** Team palettes. `bg`/`ink` tint whole screens; `deep` is the pressed-button ledge. */
export const COL: Record<TeamKey, { bg: string; ink: string; deep: string }> = {
  lichen: { bg: '#2f9c86', ink: '#f7f0da', deep: '#1b6555' },
  braise: { bg: '#d8511f', ink: '#fdf3de', deep: '#8f3410' },
};

/** Parchment — the neutral ground used by screens that belong to nobody. */
export const PARCH = '#f3e6c8';
export const DARK = '#3d2b16';

/** Warm off-white used for raised cards and buttons on tinted screens. */
export const CREAM = '#fffaea';
export const CREAM_SOFT = 'rgba(255,250,235,.94)';
export const GOLD = '#e8b93a';
export const MINT = '#7ec6b1';
/** Lit guess token. */
export const EMBER = '#e8641f';

/** Badge colours for a word's point value. */
export const VALUE_COLORS: Record<WordValue, { bg: string; fg: string }> = {
  10: { bg: MINT, fg: DARK },
  20: { bg: GOLD, fg: DARK },
  30: { bg: '#d8511f', fg: '#fdf3de' },
};
