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

## Le tour, en cinq temps

1. **Le tirage** — le sort désigne l'équipe qui ouvre.
2. **Le choix** — le donneur voit cinq mots (deux à 10 points, deux à 20, un à 30) et
   en retient un seul.
3. **Le pari** — il annonce en combien de coups son équipe trouvera : 1, 2 ou 3.
   Un pari à **1 coup est involable**.
4. **Le contre** — le donneur adverse peut **voler** le mot en annonçant strictement
   moins de coups, ou laisser la main.
5. **L'arbitrage** — l'équipe qui ne joue pas arbitre, en deux temps par coup :
   l'indice (**Valide** / **Interdit**), puis la réponse (**Trouvé** / **Raté**).

### Les points

| Issue | Les points vont |
| --- | --- |
| `trouvé` — le mot est deviné dans le pari | à l'équipe qui joue |
| `quota épuisé` — les coups sont consommés | aux arbitres |
| `indice refusé` — un indice est banni | aux arbitres |

Le mot vaut sa valeur dans tous les cas, puis quitte la réserve. Seule l'équipe qui a joué
fait tourner son donneur. Un tour non volé passe l'ouverture à l'autre équipe ; un tour
volé la laisse au voleur.

### La fin

Franchir `CIBLE` **n'arrête pas la partie** : cela déclenche un dernier tour, ouvert par
l'équipe menée. C'est le score après ce tour qui départage.

### Le tampon

Entre chaque passage de main, un écran de serment : celui qui reçoit le téléphone jure
n'avoir rien vu avant que quoi que ce soit ne s'affiche. Tout le jeu repose sur cet écran.
Un verrou de 400 ms empêche un doigt pressé d'enchaîner deux écrans et de brûler un secret.

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

Le bouton `log`, en bas à droite, ouvre le journal : une ligne par tour, avec le pari
d'ouverture, le contre, l'issue et le coup final. « Copier le log » met le tout dans le
presse-papier en colonnes séparées par des `|`, prêt pour un tableur.

## Publier

Le fichier est autonome : GitHub Pages en mode « Deploy from a branch », dossier racine,
suffit. Rien à construire.
