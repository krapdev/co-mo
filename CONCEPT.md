# Kowo — concept et état du prototype

Document de référence pour un projet Claude. Il décrit le jeu, les règles telles
qu'elles sont **réellement implémentées**, la direction visuelle, et la structure
du prototype `index.html`. Il remplace la lecture du code pour comprendre le jeu.

État : prototype jouable, un seul fichier, aucune dépendance.
Spec de référence : « Kowo — sections révisées (v6) ».

---

## 1. Le jeu en une phrase

Deux équipes de deux. Un donneur choisit un mot et parie le nombre d'indices
qu'il lui faudra pour le faire deviner à son coéquipier ; l'équipe adverse peut
lui **voler** le mot en pariant moins. L'équipe qui ne joue pas arbitre.
Premier à 100 points.

## 2. Matériel

Un seul téléphone, qui circule. C'est la contrainte centrale : tout le design
découle du fait que le mot ne doit jamais être vu par le devineur, et que chaque
passage de téléphone coûte du temps et de l'attention.

- 2 équipes de 2 joueurs, chacune avec un nom et deux avatars emoji.
- Équipe 1 = **lichen** (vert). Équipe 2 = **braise** (orange brûlé).
- Une banque de mots répartie en trois paliers : **10 / 20 / 30 points**.

## 3. Les trois principes de la v6

Toute décision de design se tranche avec ces trois-là :

1. **Moins de taps.** 6 taps par tour sans vol, 7 avec vol.
2. **Moins de passages de téléphone.** 1 passage minimum par tour (le mot doit
   voyager en silence d'un donneur à l'autre), 2 seulement en cas de vol.
3. **Score toujours visible.** Un bandeau permanent, sauf trois exceptions.

## 4. Déroulé d'un tour

### 4.1 Choix du mot et pari — un seul écran

Le donneur de l'équipe qui ouvre voit **5 mots** tirés au hasard, mélangeant les
paliers, tirés **sans remise sur toute la partie**.

- Un tap sélectionne le mot (il s'illumine, les autres s'estompent).
- Les 3 boutons de pari `1` `2` `3` sont sur le **même** écran, désactivés tant
  qu'aucun mot n'est choisi.
- Le pari = le nombre d'indices que le donneur s'accorde, donc le nombre de
  **braises** de la manche.
- **2 taps, un seul écran.**

### 4.2 Tampon d'ouverture — le seul passage obligatoire

Passage du donneur d'ouverture au donneur adverse.

- Plein écran, couleur de l'équipe adverse, **pas de bandeau de score**.
- Avatar géant + « Passe le téléphone à X ».
- Un seul bouton : « Je suis X, je jure de ne rien avoir vu ».
- Le mot n'entre dans le DOM qu'**après** ce tap.

### 4.3 Contre — écran de mémorisation

C'est le **seul** moment où le donneur adverse voit le mot. S'il vole, il ne le
reverra plus : c'est un écran de mémorisation, pas de décision rapide.

- Le mot occupe la moitié haute ; le pari adverse passe **sous** le mot.
- Trois boutons de ~110px : `Laisser` · `Voler 2` · `Voler 1`.
- **Un seul tap pour voler.** Un pari égal ou supérieur est grisé : voler, c'est
  toujours s'accorder **strictement moins** d'indices. Une ouverture à 1 est
  donc involable.

### 4.4 Après le contre — deux branches

|                       | Sans vol              | Avec vol                        |
| --------------------- | --------------------- | ------------------------------- |
| Équipe preneuse       | l'équipe qui ouvre    | l'équipe qui a volé             |
| Qui arbitre           | l'équipe qui a contré | l'équipe volée                  |
| Passage de téléphone  | **0**                 | **1** (tampon de vol)           |
| Écran suivant         | écran arbitre         | tampon de vol → écran arbitre   |

**Aucun écran de révélation du mot dans les deux branches** : le donneur retenu
connaît toujours le mot (il l'a choisi, ou il l'a mémorisé au contre). Le mot ne
vit plus que derrière le bouton 👁 de l'écran arbitre.

Le **tampon de vol** est collectif et **sans serment** : chez les arbitres, tout
le monde a le droit de voir.

### 4.5 La manche

Le téléphone reste chez l'équipe arbitre. Un coup = un indice + une réponse.

- Le donneur dit **un** mot-indice à voix haute. Interdits : le mot cible, un mot
  de sa famille, plus d'un mot, tout geste.
- Le devineur répond à voix haute.
- Les arbitres tapent **une seule fois** : `TROUVÉ` ou `RATÉ`.
- `RATÉ` → une braise s'éteint, on enchaîne.

### 4.6 Résolution

| Issue                     | Points                  |
| ------------------------- | ----------------------- |
| Mot trouvé dans le quota  | à l'équipe **preneuse** |
| Quota de braises épuisé   | à l'équipe **arbitre**  |
| Indice banni              | à l'équipe **arbitre**, tour interrompu sur-le-champ |

Dans les trois cas, la **rotation du donneur de l'équipe preneuse est
consommée** : son coéquipier donnera la prochaine fois.

### 4.7 Rotation du droit d'ouverture

- Pas de vol → l'autre équipe ouvre.
- Vol → l'équipe qui a volé garde la main.
- Franchissement de 100 → l'autre équipe ouvre le tour suivant quoi qu'il arrive.

## 5. Le bandeau de score

Bande fixe en haut de **tous** les écrans de jeu, hors du flux (elle ne pousse
rien vers le bas).

```
┌───────────────────────────────┐
│  🍄🪱  40  ·  60  🐗🕯️        │
└───────────────────────────────┘
```

- Fond scindé : moitié lichen à gauche, moitié braise à droite.
- Chiffres blancs ~40px, avatars 32px de part et d'autre : le score reste
  attribuable sans lire les noms. Lisible à un mètre.
- Hauteur ~64px, **non tappable** — la règle des 44px tactiles ne s'y applique pas.
- L'équipe qui franchit 100 gagne une 🔥 discrète.
- **Jamais les points en jeu du tour en cours** : ce serait un indice sur la
  valeur du mot donné au devineur.

**Trois exceptions, écran pleine couleur sans bandeau :** le tampon (le
monochrome est le signal « ne regarde pas »), le tirage au sort, la fin de partie.

## 6. L'écran arbitre — une seule question

```
┌─────────────────────────────┐
│  🍄🪱  40  ·  60  🐗🕯️      │  score permanent
├─────────────────────────────┤
│ 🔥🔥🕯️      [annuler]  [👁] │  braises · annuler · voir le mot
├─────────────────────────────┤
│ ⛔ banni — le mot, sa        │  le rappel EST le bouton bannir
│    famille, plus d'un mot,   │
│    les gestes                │
├─────────────────────────────┤
│   La réponse de Tibiane ?   │  énorme
├──────────────┬──────────────┤
│   TROUVÉ     │    RATÉ      │  ~1/3 de hauteur
└──────────────┴──────────────┘
```

- **Une question, deux boutons.** L'écran est stable pendant toute la manche :
  pas de temps 1 / temps 2, pas de substitution de boutons.
- **Le rappel des interdits est le bouton de bannissement.** Cadre parchemin, pas
  un bouton coloré : on le lit quand on hésite, on le tape quand on tranche.
  Placé en haut, à l'opposé de `TROUVÉ` / `RATÉ`.
- Il conserve sa **confirmation plein écran** : « Indice banni — le tour s'arrête,
  +20 pour les Fougères », `Confirmer` / `Retour`.
- **Le bouton 👁 est structurel, pas optionnel** : il affiche le mot tant que
  l'appui est maintenu, jamais en persistant. Après un vol, le coéquipier du
  voleur n'a jamais vu le mot — c'est ce bouton qui rend possible la suppression
  du second tampon.
- **`Annuler` discret**, actif uniquement sur le dernier verdict rendu : un
  `RATÉ` mal tapé coûte une braise.

## 7. Direction visuelle

- Fond **parchemin** (`#F0E2C4`), encre brun foncé (`#2E2A22`).
- **Lichen** `#4C7A3F` / **braise** `#C4522A` — franc, jamais pastel.
- Typo grasse arrondie (`ui-rounded` puis repli système), poids 800 partout.
- Emoji 80px+ avec **respiration lente** (4,6s), désactivée si
  `prefers-reduced-motion`.
- **Aucun élément tactile sous 44px.** Les boutons de décision montent à 110px.
- **Le mot cible domine toujours les boutons.** Sur l'écran de choix comme sur
  celui de contre : le mot en haut, les boutons tassés en bas.
- Mobile-first, colonne de 480px max, `100dvh`, marges sûres iOS respectées.

## 8. Le log de debug

Une ligne par tour, exportable en TSV depuis l'écran `log`. Colonnes :

```
n° tour | équipe qui ouvre | donneur | mot | valeur | pari d'ouverture | contré (o/n) |
pari retenu | équipe preneuse | donneur retenu | issue | coup de fin |
points attribués à | main conservée par vol (o/n) | nb bannissements | coup du bannissement
```

Les deux dernières colonnes existent pour mesurer un risque précis, décrit
ci-dessous.

## 9. Le risque à surveiller

Dans les versions précédentes, un **gate obligatoire** forçait les arbitres à
juger chaque indice. En v6 le bannissement est un **bouton passif**, disponible
en permanence mais jamais imposé. Le pari est que les arbitres bannissent quand
il faut. S'ils laissent passer, les bannissements chutent, les donneurs se
relâchent, et l'équipe preneuse gagne mécaniquement.

**Si le log montre un taux de bannissement proche de zéro, l'arbitrage a disparu
du jeu et il faut rouvrir la question.** C'est la première chose à regarder après
une session de test.

## 10. Décisions prises faute de spec

Ces quatre points ne sont pas dans la v6 ; ils sont tranchés dans le prototype et
restent à valider.

1. **Banque de mots** : 24 mots par palier, soit 14 tours avant épuisement.
2. **Tirage sans remise** : les 5 mots affichés quittent la pioche, pas seulement
   celui choisi. Lecture littérale de « sans remise ».
3. **Fin de partie** : franchir 100 **arme** le dernier tour (l'autre équipe
   ouvre, comme le veut la règle de rotation), puis la partie s'arrête et le plus
   haut score l'emporte. Égalité au terme de ce tour → un tour de plus.
4. **Écran de résolution** : conservé après chaque tour (issue, points, « passe le
   téléphone à X »). Il sert de passage de téléphone **entre** les tours, que la
   v6 ne couvre pas, et coûte un tap de plus que le budget affiché.

## 11. Structure du prototype

`index.html` — un seul fichier, HTML + CSS + JS vanilla, aucune dépendance,
fonctionne hors ligne et depuis le système de fichiers.

Cinq sections commentées dans l'ordre :

1. **Données** — `BANQUE` (mots par palier), `AVATARS`, `OBJECTIF`, `DEFAUT`
   (équipes de départ).
2. **État** — un objet global `S` : équipes (score, index du prochain donneur),
   pioche, `ouvreur`, `numeroTour`, `finArmee`, `tour` (l'état du tour courant),
   `log`. `avantResolution` garde un instantané pour l'annulation d'après-coup.
3. **Déroulé** — `demarrerTour` → `choisirMot` → `parier` → `laisser` / `voler`
   → `verdict` → `resoudre` → `continuer`. Une fonction par transition, pas de
   framework.
4. **Rendu** — une fonction pure par écran qui renvoie du HTML, plus `bandeau()`
   monté partout sauf sur les trois écrans d'exception. `rendre()` réécrit
   `#app` en entier.
5. **Interactions** — un seul écouteur de clic délégué qui lit `data-act`. Le
   bouton 👁 passe par `pointerdown` / `pointerup` pour l'appui maintenu.

Écrans : `reglages`, `tirage`, `choix`, `tamponOuverture`, `contre`, `tamponVol`,
`arbitre`, `resolution`, `fin`, `journal`.

### Ce qui reste à faire

- Ouvrir le prototype sur un vrai téléphone et vérifier la mise en page (jamais
  vérifié visuellement à ce stade).
- Jouer des parties et lire le log, en particulier la colonne des bannissements.
- Étoffer la banque de mots et calibrer les paliers, qui sont une première
  proposition.
