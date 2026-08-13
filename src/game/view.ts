import { other } from './data';
import { arbitreOf } from './engine';
import { COL, DARK, PARCH } from './theme';
import type { GameState, TeamKey } from './types';

export interface Tint {
  bg: string;
  ink: string;
}

const teamTint = (k: TeamKey): Tint => ({ bg: COL[k].bg, ink: COL[k].ink });

/**
 * Whose screen is this? Setup follows the team being filled, a round follows
 * whoever currently holds the phone, and the result screen flashes the winner's
 * colours. Everything else sits on neutral parchment.
 */
export function screenTint(s: GameState): Tint {
  switch (s.screen) {
    case 'grille':
      return teamTint(s.picks.length < 2 ? 'lichen' : 'braise');
    case 'tirage':
      return s.opener ? teamTint(s.opener) : { bg: PARCH, ink: DARK };
    case 'tampon':
      return s.tp ? teamTint(s.tp.team) : { bg: PARCH, ink: DARK };
    case 'contre':
      return s.cur ? teamTint(other(s.cur.opener)) : { bg: PARCH, ink: DARK };
    case 'reveal':
    case 'banni':
      return teamTint(arbitreOf(s));
    case 'resolution':
      return s.res ? teamTint(s.res.gagnant) : { bg: PARCH, ink: DARK };
    default:
      return { bg: PARCH, ink: DARK };
  }
}
