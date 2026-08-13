# Kowo

Prototype jouable d'un jeu de mots mobile. **Un seul fichier : `index.html`.**
Aucun build, aucune dépendance, aucun réseau — ouvre le fichier et joue, y compris hors-ligne.

4 joueurs, 2 équipes de 2, **un seul téléphone** qui passe de main en main. Portrait uniquement.

Les **Fougères Furieuses** (lichen) contre les **Cendres Contrariées** (braise).
Forme longue sur les écrans solennels (tirage au sort, constitution des équipes, fin de
partie), forme courte partout ailleurs.

Cette version reprend la maquette `Kowo.dc.html` : parchemin et grain de papier, écrans
teintés aux couleurs de l'équipe qui tient le téléphone, boutons posés sur un socle plein.

## Jouer

Ouvre `index.html` dans le navigateur du téléphone. Pour le plein écran sans barre
d'adresse : « Ajouter à l'écran d'accueil » (un manifest PWA est généré en mémoire).

Le cadre d'appareil visible sur grand écran est un confort de bureau : dès que la fenêtre
ne peut plus l'accueillir, l'app prend tout l'écran et respecte l'encoche.

## Le bandeau de score

Bande fixe en haut de **tous** les écrans de jeu, hors du flux : elle ne pousse
jamais le contenu et ne bouge pas d'un écran à l'autre. Moitié lichen à gauche,
moitié braise à droite, avatars de chaque équipe de part et d'autre, chiffres
énormes — lisible à un mètre. L'équipe qui franchit `CIBLE` gagne une 🔥.

Le bandeau n'affiche **que le score acquis**, jamais les points en jeu du tour :
sinon on donnerait au devineur un indice sur la valeur du mot.

Trois exceptions, écran pleine couleur sans bandeau : les **tampons** (le
monochrome est le signal « ne regarde pas »), le **tirage au sort** et la **fin
de partie**.

## Le tour

### 1. Choix du mot et pari — un seul écran

Le donneur de l'équipe qui ouvre voit 5 mots tirés sans remise sur toute la
partie. Un tap illumine un mot et estompe les autres ; les trois boutons de pari
(`1`, `2`, `3`), en bas du **même** écran, s'activent alors. **Deux taps, aucun
changement d'écran.** Un pari à 1 coup est *involable*.

### 2. Tampon d'ouverture — le seul passage obligatoire

Individuel, avec serment : « Je suis Tibiane, je jure de ne rien avoir vu ». Le
mot n'entre dans le DOM qu'**après** ce tap.

### 3. Contre — écran de mémorisation

C'est le **seul** moment où le donneur adverse voit le mot. S'il vole, il ne le
reverra plus. Le mot occupe la moitié haute ; le pari adverse passe *sous* lui,
jamais au-dessus. Un seul tap pour voler, les paris égaux ou supérieurs sont
grisés.

### 4. Après le contre

| | Sans vol | Avec vol |
| --- | --- | --- |
| Qui arbitre | l'équipe qui a contré | l'équipe volée |
| Passage de téléphone | **0** | **1** — tampon collectif, sans serment |
| Écran suivant | l'arbitrage, directement | tampon de vol → arbitrage |

Il n'y a **pas d'écran de révélation** : le donneur retenu connaît toujours le
mot, soit qu'il l'ait choisi, soit qu'il l'ait mémorisé au contre.

### 5. La manche — une seule question

Le téléphone reste chez les arbitres. Un coup = un indice dit à voix haute, une
réponse dite à voix haute, et **un seul tap** : `Trouvé` ou `Raté`. Un `Raté`
éteint une braise. L'écran ne change pas de forme de toute la manche.

- Le **rappel des interdits est le bouton de bannissement** : cadre parchemin,
  disponible en permanence, jamais une étape obligatoire. Il garde sa
  confirmation plein écran.
- Le bouton 👁 affiche le mot tant qu'on maintient l'appui. Il n'est pas
  décoratif : après un vol, le coéquipier du voleur n'a jamais vu le mot et doit
  pourtant arbitrer.
- `Annuler` reprend le dernier `Raté` — il coûte une braise.

### 6. Les points

| Issue | Les points vont |
| --- | --- |
| `trouvé` — le mot est deviné dans le quota | à l'équipe preneuse |
| `quota épuisé` — les coups sont consommés | aux arbitres |
| `indice refusé` — un indice est banni | aux arbitres, tour interrompu |

Dans les trois cas, la rotation du donneur de l'équipe preneuse est consommée.

### 7. Rotation et fin

Pas de vol : l'ouverture passe à l'autre équipe. Vol : le voleur garde la main.
Franchir `CIBLE` **n'arrête pas la partie** — cela déclenche un dernier tour,
ouvert par l'équipe menée. C'est le score après ce tour qui départage.

## Éditer le corpus

Tout est en haut de `index.html`, dans un bloc `<script>` isolé :

- `CORPUS` — les 100 mots par palier de points (`10`, `20`, `30`).
- `EQUIPES` — les deux noms d'équipe, forme longue et forme courte.
- `TIRAGE` — la composition de la main de 5 mots (par défaut 2 faciles, 2 moyens, 1 dur).
- `CIBLE` — le score qui déclenche le dernier tour (100).
- `VOL_AUTORISE` — mets `false` pour jouer sans contre.
- `AVATARS` — les 8 créatures proposées.

Si tu élargis le corpus : un seul mot, au singulier, sans article ; aucune racine partagée
avec un avatar ou un nom d'équipe ; les ambiguïtés sont voulues (glace, sang, main).

## Le log

Le bouton `log` n'apparaît qu'entre les temps forts — mise en place, tirage,
résultat, fin — jamais par-dessus un bouton qui tranche. Une ligne par tour, avec
le pari d'ouverture, le contre, l'issue et le coup final, plus deux colonnes qui
comptent les **bannissements** et le **coup où ils tombent**.

Ces deux colonnes ne sont pas décoratives : le bannissement est passé d'étape
obligatoire à bouton facultatif. Si le taux tombe près de zéro, l'arbitrage a
disparu du jeu et il faudra en reparler. « Copier le log » met le tout dans le
presse-papier en colonnes séparées par des `|`, prêt pour un tableur.

## Publier

Le fichier est autonome : GitHub Pages en mode « Deploy from a branch », dossier racine,
suffit. Rien à construire.
