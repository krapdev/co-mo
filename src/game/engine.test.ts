import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RULES,
  canSteal,
  draw,
  formatLog,
  freshPools,
  initialState,
  reduce,
  type Action,
} from './engine';
import type { AvatarId, GameState, Pari, Rng, Rules, TeamKey, WordValue } from './types';

/** Deterministic LCG so every deal is reproducible. */
function seeded(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const LINEUP: AvatarId[] = ['mousserot', 'brumaille', 'tibiane', 'grognemousse'];

const run = (s: GameState, actions: Action[], rules = DEFAULT_RULES): GameState =>
  actions.reduce((acc, a) => reduce(acc, a, rules), s);

const pickAll = (): Action[] => LINEUP.map((id) => ({ type: 'pickAvatar', id }) as Action);

/** A fresh deal, drawn from the current pools. */
const deal = (s: GameState, seed = 1): Action => ({
  type: 'beginTurn',
  propositions: draw(s.pools ?? freshPools(), seeded(seed)),
});

/** Setup → confirm → start, with the opener chosen explicitly. */
function started(opener: TeamKey = 'lichen', rules = DEFAULT_RULES): GameState {
  return run(initialState, [...pickAll(), { type: 'start', opener }], rules);
}

/** Advance to the arbiters' screen with a known word and bidding outcome. */
function atArbitre(
  opts: {
    opener?: TeamKey;
    word?: [string, WordValue];
    pariOuv?: Pari;
    steal?: Pari | null;
    rules?: Rules;
  } = {},
): GameState {
  const {
    opener = 'lichen',
    word = ['chat', 10] as [string, WordValue],
    pariOuv = 2,
    steal = null,
    rules = DEFAULT_RULES,
  } = opts;
  const s = started(opener, rules);
  return run(
    s,
    [
      deal(s),
      { type: 'tamponOk' },
      { type: 'pickMot', m: word[0], v: word[1] },
      { type: 'setPari', n: pariOuv },
      { type: 'tamponOk' },
      steal ? { type: 'voler', n: steal } : { type: 'laisser' },
      { type: 'tamponOk' },
      { type: 'toArbitre' },
    ],
    rules,
  );
}

describe('setup', () => {
  it('assigns the first two picks to lichen and the last two to braise', () => {
    expect(started().teams).toEqual({
      lichen: ['mousserot', 'brumaille'],
      braise: ['tibiane', 'grognemousse'],
    });
  });

  it('moves to confirm on the fourth pick', () => {
    let s = initialState;
    for (const id of LINEUP.slice(0, 3)) s = reduce(s, { type: 'pickAvatar', id });
    expect(s.screen).toBe('grille');
    s = reduce(s, { type: 'pickAvatar', id: LINEUP[3] });
    expect(s.screen).toBe('confirm');
  });

  it('refuses duplicates and picks past four', () => {
    let s = reduce(initialState, { type: 'pickAvatar', id: 'mousserot' });
    s = reduce(s, { type: 'pickAvatar', id: 'mousserot' });
    expect(s.picks).toEqual(['mousserot']);

    const four = run(initialState, pickAll());
    expect(reduce(four, { type: 'pickAvatar', id: 'chandelou' }).picks).toHaveLength(4);
  });

  it('back pops one pick, change clears them all', () => {
    const four = run(initialState, pickAll());
    expect(reduce(four, { type: 'back' }).picks).toEqual(LINEUP.slice(0, 3));
    expect(reduce(four, { type: 'change' }).picks).toEqual([]);
    expect(reduce(initialState, { type: 'back' }).picks).toEqual([]);
  });

  it('restoring a saved line-up jumps straight to confirm in savedMode', () => {
    const s = reduce(initialState, { type: 'restore', picks: LINEUP });
    expect(s).toMatchObject({ screen: 'confirm', savedMode: true, picks: LINEUP });
  });

  it('start is inert without a full line-up', () => {
    const three = run(initialState, pickAll().slice(0, 3));
    expect(reduce(three, { type: 'start', opener: 'lichen' })).toBe(three);
  });
});

describe('the reducer is pure', () => {
  it('returns the same result for the same inputs', () => {
    const s = atArbitre({ pariOuv: 2 });
    const a: Action = { type: 'valide' };
    expect(reduce(s, a)).toEqual(reduce(s, a));
  });

  it('never mutates the state it is given', () => {
    const s = atArbitre({ opener: 'lichen', word: ['chat', 10], pariOuv: 2 });
    const before = structuredClone(s);
    run(s, [{ type: 'valide' }, { type: 'trouve' }]);
    expect(s).toEqual(before);
  });
});

describe('draw', () => {
  it('deals two 10s, two 20s and one 30, with no repeats', () => {
    const words = draw(freshPools(), seeded(7));
    expect(words).toHaveLength(5);
    expect(words.map((w) => w.v).sort((a, b) => a - b)).toEqual([10, 10, 20, 20, 30]);
    expect(new Set(words.map((w) => w.m)).size).toBe(5);
  });

  it('only ever deals words still in the pool', () => {
    const pools = { ...freshPools(), 30: ['exil'] };
    const words = draw(pools, seeded(3));
    expect(words.filter((w) => w.v === 30).map((w) => w.m)).toEqual(['exil']);
  });

  it('does not consume the pool it draws from', () => {
    const pools = freshPools();
    const before = pools[10].length;
    draw(pools, seeded(5));
    expect(pools[10]).toHaveLength(before);
  });
});

describe('bidding and stealing', () => {
  const bidding = (pariOuv: Pari): GameState => {
    const s = atArbitre({ pariOuv });
    return { ...s, cur: { ...s.cur!, pariOuv } };
  };

  it('allows a steal only with a strictly shorter bid', () => {
    const s = bidding(3);
    expect(canSteal(s, 1, DEFAULT_RULES)).toBe(true);
    expect(canSteal(s, 2, DEFAULT_RULES)).toBe(true);
    expect(canSteal(s, 3, DEFAULT_RULES)).toBe(false);
  });

  it('makes a 1-coup opening bid unstealable', () => {
    const s = bidding(1);
    for (const n of [1, 2, 3] as Pari[]) expect(canSteal(s, n, DEFAULT_RULES)).toBe(false);
  });

  it('honours the volAutorise rule', () => {
    expect(canSteal(bidding(3), 1, { ...DEFAULT_RULES, volAutorise: false })).toBe(false);
  });

  it('ignores an illegal steal rather than applying it', () => {
    const s = atArbitre({ pariOuv: 1 });
    // Re-run the bidding step and try to undercut an unstealable bid.
    const contested = run(started('lichen'), [
      deal(started('lichen')),
      { type: 'tamponOk' },
      { type: 'pickMot', m: 'chat', v: 10 },
      { type: 'setPari', n: 1 },
      { type: 'tamponOk' },
    ]);
    expect(reduce(contested, { type: 'voler', n: 1 })).toBe(contested);
    expect(s.cur!.preneur).toBe('lichen');
  });

  it('keeps the word with the opener when the steal is declined', () => {
    const s = atArbitre({ opener: 'lichen', pariOuv: 2, steal: null });
    expect(s.cur).toMatchObject({
      steal: false,
      preneur: 'lichen',
      pari: 2,
      donneur: 'mousserot',
      devineur: 'brumaille',
    });
    expect(s.braises).toBe(2);
  });

  it('hands the round to the stealer at the shorter bid', () => {
    const s = atArbitre({ opener: 'lichen', pariOuv: 3, steal: 1 });
    expect(s.cur).toMatchObject({
      steal: true,
      preneur: 'braise',
      pari: 1,
      donneur: 'tibiane',
      devineur: 'grognemousse',
    });
    expect(s.braises).toBe(1);
  });
});

describe('the judging loop', () => {
  it('a valid clue moves to the answer beat without spending a guess', () => {
    const s = reduce(atArbitre({ pariOuv: 2 }), { type: 'valide' });
    expect(s).toMatchObject({ phase: 'reponse', braises: 2, coup: 1 });
  });

  it('a missed answer spends a guess and returns to the clue beat', () => {
    const s = run(atArbitre({ pariOuv: 3 }), [{ type: 'valide' }, { type: 'rate' }]);
    expect(s).toMatchObject({ phase: 'indice', braises: 2, coup: 2, screen: 'arbitre' });
  });

  it('undo reverses a validation', () => {
    const s = run(atArbitre({ pariOuv: 2 }), [{ type: 'valide' }, { type: 'undo' }]);
    expect(s).toMatchObject({ phase: 'indice', undoable: null, braises: 2 });
  });

  it('undo reverses a miss, restoring the guess', () => {
    const s = run(atArbitre({ pariOuv: 3 }), [
      { type: 'valide' },
      { type: 'rate' },
      { type: 'undo' },
    ]);
    expect(s).toMatchObject({ phase: 'reponse', braises: 3, coup: 1, undoable: null });
  });

  it('undo is inert with nothing to take back', () => {
    const s = atArbitre();
    expect(reduce(s, { type: 'undo' })).toBe(s);
  });

  it('a three-coup round survives two misses before the third guess', () => {
    const s = run(atArbitre({ pariOuv: 3 }), [
      { type: 'valide' },
      { type: 'rate' },
      { type: 'valide' },
      { type: 'rate' },
    ]);
    expect(s).toMatchObject({ screen: 'arbitre', braises: 1, coup: 3 });
  });
});

describe('scoring', () => {
  it('awards the word to the playing team when it is found', () => {
    const s = run(atArbitre({ word: ['nostalgie', 30], pariOuv: 2 }), [
      { type: 'valide' },
      { type: 'trouve' },
    ]);
    expect(s.scores).toEqual({ lichen: 30, braise: 0 });
    expect(s.res).toMatchObject({ issue: 'trouvé', gagnant: 'lichen', val: 30 });
    expect(s.screen).toBe('resolution');
  });

  it('awards the word to the arbiters when the guesses run out', () => {
    const s = run(atArbitre({ word: ['chat', 10], pariOuv: 1 }), [
      { type: 'valide' },
      { type: 'rate' },
    ]);
    expect(s.scores).toEqual({ lichen: 0, braise: 10 });
    expect(s.res).toMatchObject({ issue: 'quota épuisé', gagnant: 'braise' });
  });

  it('awards the word to the arbiters when the clue is banned', () => {
    const s = run(atArbitre({ word: ['miroir', 20], pariOuv: 2 }), [
      { type: 'interdit' },
      { type: 'banniOk' },
    ]);
    expect(s.scores).toEqual({ lichen: 0, braise: 20 });
    expect(s.res).toMatchObject({ issue: 'indice refusé', gagnant: 'braise' });
  });

  it('sends the stolen word to the stealer, judged by the original opener', () => {
    const s = run(atArbitre({ opener: 'lichen', word: ['chat', 10], pariOuv: 3, steal: 1 }), [
      { type: 'valide' },
      { type: 'trouve' },
    ]);
    expect(s.scores).toEqual({ lichen: 0, braise: 10 });
  });

  it('burns the played word and rotates only the playing team', () => {
    const s = run(atArbitre({ word: ['chat', 10], pariOuv: 2 }), [
      { type: 'valide' },
      { type: 'trouve' },
    ]);
    expect(s.pools![10]).not.toContain('chat');
    expect(s.rot).toEqual({ lichen: 1, braise: 0 });
  });

  it('passes the opening to the other team after an unstolen round', () => {
    const s = run(atArbitre({ opener: 'lichen', pariOuv: 2 }), [
      { type: 'valide' },
      { type: 'trouve' },
    ]);
    expect(s.opener).toBe('braise');
  });

  it('leaves the opening with the stealer after a steal', () => {
    const s = run(atArbitre({ opener: 'lichen', pariOuv: 3, steal: 1 }), [
      { type: 'valide' },
      { type: 'trouve' },
    ]);
    expect(s.cur!.preneur).toBe('braise');
    expect(s.opener).toBe('braise');
  });

  it('rotates the clue-giver so the partner opens the next round', () => {
    const first = run(atArbitre({ opener: 'lichen', pariOuv: 2 }), [
      { type: 'valide' },
      { type: 'trouve' },
    ]);
    const next = run(first, [deal(first), { type: 'tamponOk' }]);
    // braise opens next, and has not played yet, so its first champion gives.
    expect(next.cur!.donneurOuv).toBe('tibiane');
    // lichen played, so its rotation advanced.
    expect(first.rot.lichen).toBe(1);
  });
});

describe('the final round', () => {
  const rules: Rules = { ...DEFAULT_RULES, scoreCible: 20 };

  const crossThreshold = () =>
    run(
      atArbitre({ opener: 'lichen', word: ['nostalgie', 30], pariOuv: 2, rules }),
      [{ type: 'valide' }, { type: 'trouve' }],
      rules,
    );

  it('crossing the target arms a last round instead of ending the game', () => {
    const s = crossThreshold();
    expect(s.scores.lichen).toBe(30);
    expect(s.finalPending).toBe('lichen');
    expect(s.gameOver).toBe(false);
    expect(s.opener).toBe('braise');
  });

  it('the round after the threshold ends the game', () => {
    const first = crossThreshold();
    const second = run(
      first,
      [
        { type: 'cont', propositions: draw(first.pools!, seeded(9)) },
        { type: 'tamponOk' },
        { type: 'pickMot', m: 'exil', v: 30 },
        { type: 'setPari', n: 2 },
        { type: 'tamponOk' },
        { type: 'laisser' },
        { type: 'tamponOk' },
        { type: 'toArbitre' },
        { type: 'valide' },
        { type: 'trouve' },
      ],
      rules,
    );
    expect(second.gameOver).toBe(true);
    expect(second.res!.over).toBe(true);
    expect(reduce(second, { type: 'cont', propositions: [] }, rules).screen).toBe('fin');
  });
});

describe('log', () => {
  it('records one row per resolved round', () => {
    const s = run(atArbitre({ opener: 'lichen', word: ['chat', 10], pariOuv: 3, steal: 1 }), [
      { type: 'valide' },
      { type: 'trouve' },
    ]);
    expect(s.log).toHaveLength(1);
    expect(s.log[0]).toMatchObject({
      n: 1,
      ouvre: 'les Fougères',
      mot: 'chat',
      val: 10,
      pariOuv: 3,
      contre: 'o',
      pariRetenu: 1,
      preneur: 'les Cendres',
      issue: 'trouvé',
      points: 'les Cendres',
      main: 'o',
    });
  });

  it('formats a header plus one line per round', () => {
    const s = run(atArbitre({ pariOuv: 2 }), [{ type: 'valide' }, { type: 'trouve' }]);
    const lines = formatLog(s.log).split('\n');
    expect(lines[0]).toMatch(/^tour\|ouvre\|/);
    expect(lines).toHaveLength(2);
  });
});

describe('the log overlay', () => {
  it('returns to the screen it was opened from', () => {
    const open = reduce(atArbitre(), { type: 'openDebug' });
    expect(open.screen).toBe('debug');
    expect(reduce(open, { type: 'closeDebug' }).screen).toBe('arbitre');
  });

  it('does not lose the return screen if opened twice', () => {
    const s = run(atArbitre(), [{ type: 'openDebug' }, { type: 'openDebug' }]);
    expect(reduce(s, { type: 'closeDebug' }).screen).toBe('arbitre');
  });
});
