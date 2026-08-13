import { useCallback, useEffect, useReducer, useRef } from 'react';
import { DEFAULT_RULES, draw, initialState, reduce, type Action } from './game/engine';
import { loadTeams, saveTeams } from './game/storage';
import type { GameState, Rng, Rules } from './game/types';

/** Actions whose payload is drawn at random rather than chosen by a player. */
type Randomised = 'start' | 'beginTurn' | 'cont';

/**
 * What the screens dispatch. Identical to the engine's `Action` except the
 * randomised ones, which arrive bare and get their payload here — the one place
 * in the app allowed to be non-deterministic.
 */
export type Intent =
  | Extract<Action, { type: Exclude<Action['type'], Randomised> }>
  | { type: 'start' }
  | { type: 'beginTurn' }
  | { type: 'cont' };

function hydrate(intent: Intent, s: GameState, rng: Rng): Action {
  switch (intent.type) {
    case 'start':
      return { type: 'start', opener: rng() < 0.5 ? 'lichen' : 'braise' };
    case 'beginTurn':
      return { type: 'beginTurn', propositions: s.pools ? draw(s.pools, rng) : [] };
    case 'cont':
      return { type: 'cont', propositions: s.pools ? draw(s.pools, rng) : [] };
    default:
      return intent;
  }
}

export function useKowo(
  rules: Rules = DEFAULT_RULES,
  rng: Rng = Math.random,
): [GameState, (intent: Intent) => void] {
  const [state, dispatch] = useReducer(
    (s: GameState, a: Action) => reduce(s, a, rules),
    initialState,
  );

  // `hydrate` needs the live state without making `send` change every render.
  const latest = useRef(state);
  latest.current = state;

  const send = useCallback(
    (intent: Intent) => dispatch(hydrate(intent, latest.current, rng)),
    [rng],
  );

  // Offer last night's line-up so a group can pick up where it left off.
  useEffect(() => {
    const saved = loadTeams();
    if (saved) dispatch({ type: 'restore', picks: saved });
  }, []);

  // `teams` is only rebuilt by `start`, so this persists exactly once per game.
  // `picks` is deliberately not a dependency — it is read, not watched.
  useEffect(() => {
    if (state.teams) saveTeams(state.picks);
  }, [state.teams]); // eslint-disable-line react-hooks/exhaustive-deps

  return [state, send];
}
