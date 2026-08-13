import type { GameState, Rules } from '../game/types';
import type { Intent } from '../useKowo';

export type Send = (a: Intent) => void;

export interface ScreenProps {
  s: GameState;
  send: Send;
  /** Foreground colour for the current screen's tint. */
  ink: string;
  rules: Rules;
}
