/** The two teams. `lichen` always fills first during setup, `braise` second. */
export type TeamKey = 'lichen' | 'braise';

/** Point value of a word — also its difficulty tier in the corpus. */
export type WordValue = 10 | 20 | 30;

/** Number of guessing attempts ("coups") a team commits to. */
export type Pari = 1 | 2 | 3;

export type AvatarId =
  | 'mousserot'
  | 'brumaille'
  | 'tibiane'
  | 'grognemousse'
  | 'chandelou'
  | 'vermoulette'
  | 'chouettombe'
  | 'pourrissou';

export interface Avatar {
  id: AvatarId;
  /** Display name. */
  n: string;
  /** Emoji. */
  e: string;
}

export interface Word {
  /** The word itself. */
  m: string;
  /** Its point value. */
  v: WordValue;
}

/** Index of the player whose turn it is to give clues, within a team's pair. */
export type RotIndex = 0 | 1;

export type Teams = Record<TeamKey, [AvatarId, AvatarId]>;

export type Screen =
  | 'grille'
  | 'confirm'
  | 'tirage'
  | 'tampon'
  | 'choix'
  | 'pari'
  | 'contre'
  | 'reveal'
  | 'arbitre'
  | 'banni'
  | 'resolution'
  | 'fin'
  | 'debug';

/** How a round ended. */
export type Issue = 'trouvé' | 'quota épuisé' | 'indice refusé';

/** Which of the two judging beats the arbiters are on. */
export type Phase = 'indice' | 'reponse';

/**
 * The round in flight. Fields land progressively as the round advances:
 * `opener`/`donneurOuv` at deal, `m`/`v` at word choice, `pariOuv`/`donneurAdv`
 * at the opening bid, and the rest once the steal is settled.
 */
export interface Round {
  /** Team that opened the bidding. */
  opener: TeamKey;
  /** Clue-giver for the opening team. */
  donneurOuv: AvatarId;
  /** Chosen word. */
  m?: string;
  /** Chosen word's value. */
  v?: WordValue;
  /** The opening team's bid. */
  pariOuv?: Pari;
  /** Clue-giver for the opposing team, who may steal. */
  donneurAdv?: AvatarId;
  /** Whether the opposing team stole the word. */
  steal?: boolean;
  /** The bid actually being played. */
  pari?: Pari;
  /** Team playing the round. */
  preneur?: TeamKey;
  /** Clue-giver for the playing team. */
  donneur?: AvatarId;
  /** Guesser for the playing team. */
  devineur?: AvatarId;
}

export interface RoundResult {
  issue: Issue;
  gagnant: TeamKey;
  /** Points awarded. */
  val: WordValue;
  /** Whether this was the final round. */
  over: boolean;
  /** Team that crossed the target score, if the threshold was just passed. */
  fp: TeamKey | null;
}

/** The "pass the phone" interstitial, with the screen to show once sworn in. */
export interface Tampon {
  team: TeamKey;
  /** Emoji of the player being handed the phone. */
  e: string;
  title: string;
  sub: string;
  /** The oath the holder confirms. */
  oath: string;
  after: Screen;
}

export interface LogEntry {
  n: number;
  ouvre: string;
  donneurOuv: string;
  mot: string;
  val: WordValue;
  pariOuv: Pari;
  /** 'o' | 'n' — whether the word was contested. */
  contre: 'o' | 'n';
  pariRetenu: Pari;
  preneur: string;
  donneurRetenu: string;
  issue: Issue;
  /** Attempt number the round ended on. */
  coup: number;
  /** Team the points went to. */
  points: string;
  /** 'o' | 'n' — whether the lead passed by a steal. */
  main: 'o' | 'n';
}

/** What the arbiters' last action was, so it can be taken back. */
export type Undoable = { t: 'valide' } | { t: 'rate' };

export interface GameState {
  screen: Screen;
  /** Avatars chosen during setup, in order: [lichen, lichen, braise, braise]. */
  picks: AvatarId[];
  /** True when the teams were restored from storage rather than just picked. */
  savedMode: boolean;
  teams: Teams | null;
  rot: Record<TeamKey, RotIndex>;
  scores: Record<TeamKey, number>;
  /** Remaining words per tier; a word is consumed once its round resolves. */
  pools: Record<WordValue, string[]> | null;
  /** Team that opens the next round. */
  opener: TeamKey | null;
  cur: Round | null;
  log: LogEntry[];
  /** Set once a team crosses the target — one last round is then played. */
  finalPending: TeamKey | null;
  gameOver: boolean;
  res: RoundResult | null;
  tp: Tampon | null;
  phase: Phase;
  /** Guesses left in the current round. */
  braises: number;
  /** Current attempt number. */
  coup: number;
  undoable: Undoable | null;
  /** The five words offered to the clue-giver. */
  propositions: Word[];
  /** True while the arbiters hold the peek button. */
  showWord: boolean;
  /** Transient "copied ✓" flag on the log screen. */
  copied: boolean;
  /** Screen to return to when the log is closed. */
  ret: Screen | null;
}

/** Tunable rules, surfaced as editor props in the source design. */
export interface Rules {
  /** Score that triggers the final round. */
  scoreCible: number;
  /** Whether the opposing team may steal the word with a shorter bid. */
  volAutorise: boolean;
}

/** Random source, injected so the engine stays pure and testable. */
export type Rng = () => number;
