import type { Avatar, AvatarId, TeamKey, WordValue } from './types';

export const AV: readonly Avatar[] = [
  { id: 'mousserot', n: 'Mousserot', e: '🍄' },
  { id: 'brumaille', n: 'Brumaille', e: '👻' },
  { id: 'tibiane', n: 'Tibiane', e: '🦴' },
  { id: 'grognemousse', n: 'Grognemousse', e: '🐗' },
  { id: 'chandelou', n: 'Chandelou', e: '🕯️' },
  { id: 'vermoulette', n: 'Vermoulette', e: '🪱' },
  { id: 'chouettombe', n: 'Chouettombe', e: '🦉' },
  { id: 'pourrissou', n: 'Pourrissou', e: '🧟' },
];

const UNKNOWN: Avatar = { n: '?', e: '❓', id: '' as AvatarId };

/** Look up an avatar, falling back to a placeholder rather than throwing. */
export const av = (id: AvatarId | undefined): Avatar =>
  AV.find((a) => a.id === id) ?? UNKNOWN;

export const isAvatarId = (v: unknown): v is AvatarId =>
  typeof v === 'string' && AV.some((a) => a.id === v);

/** Words by point value — higher tiers are more abstract and harder to clue. */
export const CORPUS: Record<WordValue, readonly string[]> = {
  10: [
    'chat', 'soleil', 'pain', 'voiture', 'mer', 'neige', 'football', 'café', 'lune', 'école',
    'chien', 'pizza', 'vélo', 'plage', 'feu', 'livre', 'dent', 'clé', 'pluie', 'montagne',
    'téléphone', 'chaussure', 'glace', 'guerre', 'arbre', 'bébé', 'musique', 'œuf', 'porte', 'argent',
    'nuit', 'poisson', 'fête', 'main', 'roi', 'sang', 'fleur', 'train', 'hiver', 'chanson',
  ],
  20: [
    'aéroport', 'miroir', 'orage', 'dentiste', 'guitare', 'valise', 'cirque', 'tunnel', 'récolte', 'cheminée',
    'ascenseur', 'boussole', 'momie', 'naufrage', 'jumeau', 'aimant', 'ruche', 'phare', 'désert', 'moustache',
    'labyrinthe', 'otage', 'épouvantail', 'bibliothèque', 'vaccin', 'marionnette', 'volcan', 'canapé', 'uniforme', 'échelle',
    'hôpital', 'casserole', 'carnaval', 'squelette', 'grenier',
  ],
  30: [
    'nostalgie', 'hasard', 'équilibre', 'rumeur', 'patience', 'frontière', 'vertige', 'compromis', 'héritage', 'silence',
    'jalousie', 'destin', 'routine', 'malaise', 'autorité', 'illusion', 'revanche', 'pudeur', 'hypocrisie', 'exil',
    'mérite', 'absence', 'trahison', 'ennui', 'réputation',
  ],
};

export const EQUIPES: Record<TeamKey, { long: string; court: string }> = {
  lichen: { long: 'les Fougères Furieuses', court: 'les Fougères' },
  braise: { long: 'les Cendres Contrariées', court: 'les Cendres' },
};

export const other = (k: TeamKey): TeamKey => (k === 'lichen' ? 'braise' : 'lichen');
