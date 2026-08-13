import { isAvatarId } from './data';
import type { AvatarId } from './types';

const KEY = 'kowo.teams';

/** Read the last line-up, or null if absent, malformed, or storage is blocked. */
export function loadTeams(): AvatarId[] | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 4 && parsed.every(isAvatarId)) {
      return parsed;
    }
  } catch {
    // Private mode, disabled storage, corrupt JSON — start fresh.
  }
  return null;
}

export function saveTeams(picks: AvatarId[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(picks));
  } catch {
    // Persistence is a convenience; never let it break a game.
  }
}
