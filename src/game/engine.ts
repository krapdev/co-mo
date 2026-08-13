import { AV, CORPUS, EQUIPES, av, other } from './data';
import type {
  AvatarId,
  GameState,
  Issue,
  Pari,
  Rng,
  Rules,
  Screen,
  TeamKey,
  Teams,
  Word,
  WordValue,
} from './types';

export const DEFAULT_RULES: Rules = {
  scoreCible: 100,
  volAutorise: true,
};

/** Bounds the source design declared for the `scoreCible` editor prop. */
export const SCORE_CIBLE_BOUNDS = { min: 40, max: 200, step: 10 } as const;

export const initialState: GameState = {
  screen: 'grille',
  picks: [],
  savedMode: false,
  teams: null,
  rot: { lichen: 0, braise: 0 },
  scores: { lichen: 0, braise: 0 },
  pools: null,
  opener: null,
  cur: null,
  log: [],
  finalPending: null,
  gameOver: false,
  res: null,
  tp: null,
  phase: 'indice',
  braises: 0,
  coup: 1,
  undoable: null,
  propositions: [],
  showWord: false,
  copied: false,
  ret: null,
};

export function shuffle<T>(a: readonly T[], rng: Rng): T[] {
  const out = a.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const freshPools = (): Record<WordValue, string[]> => ({
  10: CORPUS[10].slice(),
  20: CORPUS[20].slice(),
  30: CORPUS[30].slice(),
});

/**
 * Deal the five candidate words: two cheap, two middling, one hard, shuffled so
 * the tiers are not laid out in a predictable order.
 */
export function draw(pools: Record<WordValue, string[]>, rng: Rng): Word[] {
  const out: Word[] = [];
  const take = (v: WordValue, n: number) => {
    const src = pools[v].slice();
    for (let i = 0; i < n && src.length; i++) {
      const j = Math.floor(rng() * src.length);
      out.push({ m: src.splice(j, 1)[0], v });
    }
  };
  take(10, 2);
  take(20, 2);
  take(30, 1);
  return shuffle(out, rng);
}

/** The team judging the round — always the one not playing it. */
export const arbitreOf = (s: GameState): TeamKey =>
  s.cur?.preneur ? other(s.cur.preneur) : 'lichen';

/**
 * A steal is only legal for a strictly shorter bid than the opener's, so a
 * 1-coup opening bid can never be taken away.
 */
export const canSteal = (s: GameState, n: Pari, rules: Rules): boolean =>
  rules.volAutorise && n < (s.cur?.pariOuv ?? 1);

/**
 * Engine actions. The three that would otherwise need a random source take it
 * as payload instead, which keeps `reduce` a pure function of its inputs —
 * required for React's reducer contract, and what makes the tests exhaustive.
 */
export type Action =
  | { type: 'restore'; picks: AvatarId[] }
  | { type: 'pickAvatar'; id: AvatarId }
  | { type: 'back' }
  | { type: 'change' }
  | { type: 'start'; opener: TeamKey }
  | { type: 'beginTurn'; propositions: Word[] }
  | { type: 'tamponOk' }
  | { type: 'pickMot'; m: string; v: WordValue }
  | { type: 'setPari'; n: Pari }
  /** Decline the steal — the opening team plays its own bid. */
  | { type: 'laisser' }
  /** Steal the word by committing to a strictly shorter bid. */
  | { type: 'voler'; n: Pari }
  | { type: 'toArbitre' }
  | { type: 'valide' }
  | { type: 'rate' }
  | { type: 'trouve' }
  | { type: 'undo' }
  | { type: 'interdit' }
  | { type: 'banniBack' }
  | { type: 'banniOk' }
  | { type: 'cont'; propositions: Word[] }
  | { type: 'again' }
  | { type: 'peek'; on: boolean }
  | { type: 'openDebug' }
  | { type: 'closeDebug' }
  | { type: 'copied'; on: boolean };

/** Build the "pass the phone" interstitial and route to it. */
function handOver(
  s: GameState,
  team: TeamKey,
  avId: AvatarId,
  title: string,
  sub: string,
  oath: string,
  after: Screen,
): GameState {
  return {
    ...s,
    screen: 'tampon',
    showWord: false,
    tp: { team, e: av(avId).e, title, sub, oath, after },
  };
}

/** Deal a new round and hand the phone to the opening team's clue-giver. */
function beginTurn(s: GameState, propositions: Word[]): GameState {
  const op = s.opener;
  if (!op || !s.teams || !s.pools) return s;
  const d = s.teams[op][s.rot[op]];
  const a = av(d);
  const next: GameState = {
    ...s,
    cur: { opener: op, donneurOuv: d },
    propositions,
    showWord: false,
  };
  return handOver(
    next,
    op,
    d,
    `Passe le téléphone à ${a.n}`,
    `${a.n} choisit le mot pour ${EQUIPES[op].court}.`,
    `Je suis ${a.n}, je jure de ne rien avoir vu`,
    'choix',
  );
}

/**
 * Settle the round: award the word's value, rotate the playing team's
 * clue-giver, burn the word, and decide who opens next.
 *
 * Crossing `scoreCible` does not end the game — it arms `finalPending` and
 * hands the opening to the trailing team for one last round.
 */
function finish(s: GameState, issue: Issue, gagnant: TeamKey, rules: Rules): GameState {
  const c = s.cur;
  if (!c || !c.preneur || !c.v || !c.m || !c.pari || !c.pariOuv || !c.donneur) return s;

  const scores = { ...s.scores };
  scores[gagnant] += c.v;

  const rot = { ...s.rot };
  rot[c.preneur] = rot[c.preneur] === 0 ? 1 : 0;

  const pools = { ...s.pools! };
  pools[c.v] = pools[c.v].filter((x) => x !== c.m);

  let nextOp: TeamKey = c.steal ? c.preneur : other(c.opener);
  let over = false;
  let fp = s.finalPending;

  if (fp) {
    over = true;
  } else if (scores.lichen >= rules.scoreCible || scores.braise >= rules.scoreCible) {
    const lead: TeamKey = scores.lichen >= scores.braise ? 'lichen' : 'braise';
    fp = lead;
    nextOp = other(lead);
  }

  const log = s.log.concat([
    {
      n: s.log.length + 1,
      ouvre: EQUIPES[c.opener].court,
      donneurOuv: av(c.donneurOuv).n,
      mot: c.m,
      val: c.v,
      pariOuv: c.pariOuv,
      contre: c.steal ? 'o' : 'n',
      pariRetenu: c.pari,
      preneur: EQUIPES[c.preneur].court,
      donneurRetenu: av(c.donneur).n,
      issue,
      coup: s.coup,
      points: EQUIPES[gagnant].court,
      main: c.steal ? 'o' : 'n',
    },
  ]);

  return {
    ...s,
    scores,
    rot,
    pools,
    opener: nextOp,
    finalPending: fp,
    gameOver: over,
    log,
    res: { issue, gagnant, val: c.v, over, fp },
    screen: 'resolution',
    showWord: false,
  };
}

export function reduce(s: GameState, action: Action, rules: Rules = DEFAULT_RULES): GameState {
  switch (action.type) {
    case 'restore':
      return { ...s, picks: action.picks, savedMode: true, screen: 'confirm' };

    case 'pickAvatar': {
      if (s.picks.length >= 4 || s.picks.includes(action.id)) return s;
      const picks = s.picks.concat([action.id]);
      return {
        ...s,
        picks,
        screen: picks.length === 4 ? 'confirm' : 'grille',
        savedMode: false,
      };
    }

    case 'back':
      if (!s.picks.length) return s;
      return { ...s, picks: s.picks.slice(0, -1), screen: 'grille', savedMode: false };

    case 'change':
      return { ...s, picks: [], screen: 'grille', savedMode: false };

    case 'start': {
      const p = s.picks;
      if (p.length !== 4) return s;
      const teams: Teams = { lichen: [p[0], p[1]], braise: [p[2], p[3]] };
      return {
        ...s,
        teams,
        rot: { lichen: 0, braise: 0 },
        scores: { lichen: 0, braise: 0 },
        pools: freshPools(),
        log: [],
        finalPending: null,
        gameOver: false,
        res: null,
        opener: action.opener,
        screen: 'tirage',
      };
    }

    case 'beginTurn':
      return beginTurn(s, action.propositions);

    case 'tamponOk':
      return s.tp ? { ...s, screen: s.tp.after, showWord: false } : s;

    case 'pickMot':
      return s.cur
        ? { ...s, cur: { ...s.cur, m: action.m, v: action.v }, screen: 'pari' }
        : s;

    case 'setPari': {
      const c = s.cur;
      if (!c || !s.teams) return s;
      const adv = other(c.opener);
      const d = s.teams[adv][s.rot[adv]];
      const a = av(d);
      const next: GameState = { ...s, cur: { ...c, pariOuv: action.n, donneurAdv: d } };
      return handOver(
        next,
        adv,
        d,
        `Passe le téléphone à ${a.n}`,
        `${a.n} peut voler le mot pour ${EQUIPES[adv].court}.`,
        `Je suis ${a.n}, je jure de ne rien avoir vu`,
        'contre',
      );
    }

    case 'laisser':
    case 'voler': {
      const c = s.cur;
      if (!c || !s.teams || !c.pariOuv) return s;
      const steal = action.type === 'voler';
      if (steal && !canSteal(s, action.n, rules)) return s;
      const preneur = steal ? other(c.opener) : c.opener;
      const pari: Pari = steal ? action.n : c.pariOuv;
      const donneur = steal ? c.donneurAdv! : c.donneurOuv;
      const devineur = s.teams[preneur].filter((x) => x !== donneur)[0];
      const arb = other(preneur);
      const next: GameState = {
        ...s,
        cur: { ...c, steal, pari, preneur, donneur, devineur },
        braises: pari,
        coup: 1,
        phase: 'indice',
        undoable: null,
      };
      return handOver(
        next,
        arb,
        s.teams[arb][0],
        `Passe le téléphone aux ${EQUIPES[arb].court.replace('les ', '')}`,
        `${av(donneur).n} regarde avec eux · ${av(devineur).n} ferme les yeux`,
        `Personne ici n’est ${av(devineur).n}`,
        'reveal',
      );
    }

    case 'toArbitre':
      return { ...s, screen: 'arbitre' };

    case 'valide':
      return { ...s, phase: 'reponse', undoable: { t: 'valide' } };

    case 'rate': {
      const b = s.braises - 1;
      if (b <= 0) {
        return finish(s, 'quota épuisé', other(s.cur!.preneur!), rules);
      }
      return { ...s, braises: b, coup: s.coup + 1, phase: 'indice', undoable: { t: 'rate' } };
    }

    case 'trouve':
      return finish(s, 'trouvé', s.cur!.preneur!, rules);

    case 'undo': {
      if (!s.undoable) return s;
      if (s.undoable.t === 'valide') return { ...s, phase: 'indice', undoable: null };
      return {
        ...s,
        braises: s.braises + 1,
        coup: Math.max(1, s.coup - 1),
        phase: 'reponse',
        undoable: null,
      };
    }

    case 'interdit':
      return { ...s, screen: 'banni' };

    case 'banniBack':
      return { ...s, screen: 'arbitre' };

    case 'banniOk':
      return finish(s, 'indice refusé', arbitreOf(s), rules);

    case 'cont':
      return s.gameOver ? { ...s, screen: 'fin' } : beginTurn(s, action.propositions);

    case 'again':
      return { ...s, screen: 'confirm', savedMode: true };

    case 'peek':
      return { ...s, showWord: action.on };

    case 'openDebug':
      return { ...s, ret: s.screen === 'debug' ? s.ret : s.screen, screen: 'debug' };

    case 'closeDebug':
      return { ...s, screen: s.ret ?? 'grille' };

    case 'copied':
      return { ...s, copied: action.on };

    default: {
      const never: never = action;
      return never;
    }
  }
}

/** Tab-separated log, matching the header the design's copy button produced. */
export function formatLog(log: GameState['log']): string {
  const head =
    'tour|ouvre|donneur|mot|valeur|pari ouv|contré|pari retenu|preneur|donneur retenu|issue|coup fin|points à|main par vol';
  const body = log
    .map((l) =>
      [
        l.n, l.ouvre, l.donneurOuv, l.mot, l.val, l.pariOuv, l.contre, l.pariRetenu,
        l.preneur, l.donneurRetenu, l.issue, l.coup, l.points, l.main,
      ].join('|'),
    )
    .join('\n');
  return `${head}\n${body}`;
}

export { AV, EQUIPES, av, other };
