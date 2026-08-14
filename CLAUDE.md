# Kowo — mémoire du projet

Ce fichier est lu au démarrage de chaque session. Il porte le vocabulaire, les
contraintes et les décisions déjà tranchées, pour qu'on ne les rediscute pas à
chaque fois. Le `README.md` décrit le jeu ; celui-ci décrit **comment on
travaille dessus**.

## La forme du dépôt

Une branche = un prototype = **un seul fichier jouable**. `index.html` est
autonome : aucun build, aucune dépendance, aucun appel réseau, jouable
hors-ligne et depuis le système de fichiers.

`outils/` échappe à cette règle : ce sont des scripts de vérification, jamais
livrés. La règle « aucune dépendance » vaut pour le **jeu**, pas pour le dépôt.

Publication : GitHub Pages, « Deploy from a branch », dossier racine. Rien à
construire. Le lien est `https://krapdev.github.io/co-mo/` et sert la branche
choisie dans les réglages — les autres branches du dépôt contiennent d'autres
prototypes, ne pas les confondre.

## Le vocabulaire des écrans

Onze écrans, nommés par leur identifiant dans le code (`s-<nom>`, et
`ecranCourant`). **Employer ces noms**, ne pas en inventer d'autres.

| id | ce que c'est |
| --- | --- |
| `grille` | mise en place, les 8 avatars, on en choisit 4 |
| `confirm` | les deux équipes constituées, avant le tirage |
| `tirage` | le sort désigne l'équipe qui ouvre — une fois par partie |
| `tampon` | passage de téléphone **nominatif**, avec serment |
| `choix` | les 5 mots **et** les 3 paris, sur un seul écran |
| `contre` | mémorisation du mot par le donneur adverse, et vol éventuel |
| `tamponVol` | passage **collectif** vers les arbitres, sans serment |
| `arbitre` | la manche : une seule question, `Trouvé` / `Raté` |
| `banni` | confirmation plein écran d'un indice banni |
| `resultat` | issue du tour, points, qui ouvre ensuite |
| `fin` | tableau final |

Les deux équipes s'appellent toujours `lichen` (les Fougères Furieuses, vert) et
`braise` (les Cendres Contrariées, orange) dans le code.

Rôles d'un tour : le **donneur** choisit le mot et donnera les indices, le
**devineur** est son coéquipier, le **preneur** est l'équipe qui joue le mot,
l'**arbitre** est l'autre.

## Contraintes non négociables

Elles viennent d'usages réels, pas de préférences. Une proposition qui les casse
ne peut pas entrer.

1. **Aucun webfont.** Le jeu est hors-ligne. Pile système imposée
   (`Arial Rounded MT Bold, Trebuchet MS, Verdana…`). Ne jamais réintroduire
   Google Fonts ni Baloo 2 — c'est la dérive la plus fréquente.
2. **Aucune animation, aucune transition.** Ni `@keyframes`, ni `transition`,
   ni respiration sur les emoji. Décision explicite, demandée deux fois.
3. **Aucun effet de relief en bas.** Ni socle, ni ombre portée, ni ombre
   incrustée, ni déplacement à l'appui. Seule exception : l'ombre du cadre
   d'appareil, décor de bureau absent du téléphone.
4. **Rien sous 44px** de zone tactile.
5. **Le secret d'abord.** Les mots n'entrent dans le DOM qu'après le serment ; à
   l'ouverture d'un tour on vide les porteurs de secret du tour précédent
   (`#ch-mots`, `#co-mot`, `#ar-mot`). Le bandeau n'affiche jamais les points en
   jeu du tour.
6. **Un verrou anti double-tap de 400 ms** à chaque changement d'écran. Sans lui
   un doigt pressé enchaîne deux écrans et brûle un secret.

## Décisions déjà tranchées

À ne pas reproposer sans raison neuve.

- **Un seul fichier, pas de React.** Une implémentation React + Vite a existé
  (commit `368752b`, 37 tests) ; elle a été abandonnée volontairement pour la
  contrainte hors-ligne. Deux implémentations d'un même jeu divergent toujours.
- **Les touches** sont des aplats cernés d'un trait franc ; l'appui les *encre*
  (face et libellé s'inversent). Écartés : le faux relief avec socle — essayé en
  ombre portée puis en ombre incrustée, retiré les deux fois — le tampon encré
  (parchemin nu, trait épais) et l'aplat plein sans trait.
- **Les emoji** : boîte à l'interligne exact (`line-height:1`), écart au libellé
  posé explicitement en `em`. Descendre sous 1 fait déborder le dessin sur le
  libellé — constaté à `.82` et à `.95`.
- **Pas d'écran de révélation du mot.** Le donneur retenu le connaît toujours ;
  le bouton 👁 le rend au coéquipier du voleur.
- **Un pari à 1 coup saute le serment adverse et l'écran de contre** : involable,
  donc le donneur adverse n'a aucune raison de voir le mot.
- **Le bouton `log`** n'apparaît qu'entre les temps forts (`grille`, `confirm`,
  `tirage`, `resultat`, `fin`) : ailleurs il chevauchait une zone tactile
  décisive.
- **Le donneur tourne pour les deux équipes concernées** — celle qui a ouvert et
  celle qui a joué. Avant, seule l'équipe preneuse tournait : une équipe volée
  gardait le même donneur et son coéquipier ne donnait jamais.
- **Le catalogue est mélangé une fois au début de la partie**, puis consommé
  dans l'ordre. Avant, chaque tour tirait 5 mots au hasard et n'en consommait
  qu'un : les quatre écartés pouvaient revenir au tour suivant.
- **Le bandeau de score est visible partout dès que la partie tourne**, tampons
  compris. Le monochrome du tampon reste le signal « ne regarde pas », mais le
  score prime — demandé explicitement.
- **Clé de stockage `kowo.equipes.v2`.** Toutes les branches sont servies depuis
  la même origine et partagent donc le `localStorage` : ne pas réutiliser `v1`,
  qui appartient à l'ancien prototype.

## Passages de téléphone par tour

C'est le budget qui structure le parcours. Le premier passage est incompressible :
l'appareil doit atterrir dans **une main précise**, pas seulement dans un camp.

| | pari à 1 | sans vol | avec vol |
| --- | --- | --- | --- |
| passages | 2 | 2 | 3 |

Le nombre ne se déduit pas du vol mais de `E.telephoneChez` : si l'appareil est
déjà chez les arbitres, il ne bouge pas.

## Comment on travaille

L'auteur itère souvent **depuis un téléphone**. La boucle qui marche :

1. il décrit le défaut en une phrase, en nommant l'écran ;
2. on modifie, on rend l'écran concerné et **on lui envoie l'image** — captures
   en plein cadre `390×844`, jamais la vue de bureau avec le cadre d'appareil,
   illisible sur un petit écran ;
3. on ne pousse qu'une fois la chose validée.

En cas d'hésitation entre deux directions, monter une **comparaison côte à côte**
plutôt que d'argumenter : c'est le format qui tranche le plus vite.

Vérifier avant d'affirmer. Les bogues attrapés dans ce projet l'ont été par
mesure, pas à l'œil : les mots du tour précédent restés dans le DOM, l'emoji qui
recouvrait son libellé, le socle qui débordait du pied d'écran.

## Vérifier

```bash
cd outils && npm install     # une fois
node regles.mjs              # ~3000 tours, invariantes de règles
node mise-en-page.mjs        # chevauchements, reliefs, écarts emoji
node rendu.mjs               # captures 390x844 de tous les écrans
```

`regles.mjs` doit finir sur « toutes les invariantes tiennent ». Toute
modification des règles passe par lui **avant** d'être poussée.
