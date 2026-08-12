# Kowo

Prototype jouable d'un jeu de mots mobile. **Un seul fichier : `index.html`.**
Aucun build, aucune dépendance, aucun réseau — ouvre le fichier et joue, y compris hors-ligne.

4 joueurs, 2 équipes de 2, **un seul téléphone** qui passe de main en main. Portrait uniquement.

Les **Fougères Furieuses** (lichen) contre les **Cendres Contrariées** (braise).
Forme longue sur les écrans solennels (tirage au sort, constitution des équipes, fin de
partie), forme courte partout ailleurs.

## Jouer

Ouvre `index.html` dans le navigateur du téléphone. Pour le plein écran sans barre
d'adresse : « Ajouter à l'écran d'accueil » (un manifest PWA est généré en mémoire).

## Éditer le corpus

Tout est en haut de `index.html`, dans un bloc `<script>` isolé :

- `CORPUS` — les 100 mots par palier de points (`10`, `20`, `30`).
- `EQUIPES` — les deux noms d'équipe, forme longue et forme courte.
- `TIRAGE` — la composition de la main de 5 mots (par défaut 2 faciles, 2 moyens, 1 dur).
- `CIBLE` — le score à atteindre (100).
- `AVATARS` — les 8 créatures proposées.

Si tu élargis le corpus : un seul mot, au singulier, sans article ; aucune racine
partagée avec un avatar ou un nom d'équipe (pas de *mousse*, *brume*, *tombe*,
*chouette*, *ver*, *tibia*, *chandelle*, *fougère*, *cendre*), sinon le donneur dispose
d'un indice gratuit. Les ambiguïtés (*glace*, *sang*, *main*) sont voulues.

Le tirage est **sans remise sur toute la partie** : les 5 mots proposés à un donneur
sortent du sac et ne réapparaissent plus. Si un palier s'épuise, il est regarni.

## Mise en place

Une seule grille de 8 avatars, quatre étapes explicites. Le fond prend la couleur de
l'équipe en cours de constitution, le bandeau annonce « Fougères Furieuses — champion 1
sur 2 », et une bande de récapitulatif se remplit sous les yeux de tout le monde.
`Retour` annule le dernier choix.

**Le joueur choisi en premier dans une équipe est son premier donneur** — c'est la valeur
initiale du curseur de rotation, et c'est annoncé sur l'écran de confirmation.

Si une partie précédente existe en `localStorage`, l'ouverture propose directement cet
écran de confirmation pré-rempli : « Reprendre les mêmes équipes », ou `Changer`.

## Règles implémentées

1. **Choix du mot** — le donneur de l'équipe qui ouvre voit 5 mots mélangeant les paliers.
2. **Pari d'ouverture** — 1, 2 ou 3 coups.
3. **Contre** — le donneur adverse voit le mot et **vole en annonçant strictement moins**.
   Le pari égal et les paris supérieurs sont grisés : une ouverture à 1 est involable.
4. **Manche** — un coup = un indice + une réponse. Le téléphone reste chez l'équipe
   arbitre pendant toute la manche.
5. **Résolution** — trois issues : trouvé dans le quota (points à l'équipe preneuse),
   quota épuisé (points à l'équipe arbitre), indice refusé (points à l'équipe arbitre,
   tour interrompu sur-le-champ).
6. **Rotation** — le curseur de donneur est **par équipe**. Il est consommé par l'équipe
   preneuse dans les trois cas ; un donneur qui se fait voler le mot ne consomme pas sa
   rotation et rechoisira au prochain tour où son équipe donne.
   Sans vol, le droit d'ouverture passe à l'autre équipe ; **avec vol, le voleur garde la
   main**.
7. **Fin** — 100 points. Quand une équipe franchit la cible, **l'autre équipe ouvre le
   tour suivant quoi qu'il arrive** — cette exception l'emporte sur la conservation de
   main par vol. Comparaison des scores après ce tour.

L'arbitrage est humain : rien n'est validé automatiquement.

## L'écran tampon

C'est la pièce critique — le devineur ne doit jamais apercevoir le mot.
À chaque affichage d'un écran tampon, tous les nœuds porteurs du mot sont vidés
(`purgeMot()`) : le mot n'existe nulle part dans le DOM tant que le bon joueur n'a pas
confirmé (« Je suis Tibiane, je jure de ne rien avoir vu »). Le tampon est au-dessus de
tout le reste et les écrans sont en `display:none`, donc rien ne transparaît pendant la
transition. Chaque changement d'écran gèle les taps 400 ms, pour qu'un double-tap
malencontreux ne saute pas un écran.

Le nom affiché est celui que la rotation vient de désigner. Seule exception : après un
vol, le voleur tient déjà le téléphone — on ne lui demande pas de se le passer à
lui-même, on va droit à la révélation.

## L'écran arbitre

Structure fixe, deux temps qui alternent, jamais plus de deux boutons en bas :

- **Temps 1 — « L'indice de Mousserot ? »** → `Valide` / `Interdit`
- **Temps 2 — « La réponse de Tibiane ? »** → `Trouvé` / `Raté`

Bandeau inversé d'un temps à l'autre, boutons remplacés d'un coup. `Interdit` est à
l'opposé de `Valide` et passe par une confirmation plein écran. Le mot cible est masqué,
derrière un bouton qui ne l'affiche que tant qu'on appuie. Un `annuler` discret en haut
revient sur le dernier verdict rendu, une seule fois. Le rappel *banni — le mot, sa
famille, plus d'un mot, les gestes* est permanent, et les braises restantes sont visibles
en haut.

## Écran de debug

Bouton discret en haut à gauche (accueil, confirmation, résolution, fin). Il log chaque
tour :

```
tour | ouvre | donneur | mot | valeur | pari ouv | contré | pari retenu | preneuse | donneur retenu | issue | coup fin | points à | main par vol
```

avec des compteurs (part des tours où l'ouvreur marque, taux de vol, fréquence du verrou
à 1, **part des tours qui meurent sur un indice refusé**, paris moyens) et un bouton
« copier le log ». C'est ce qui permettra de savoir après un playtest si la fourchette
1–3 est bien centrée, si ouvrir donne un avantage, et si l'arbitrage est en train de
devenir la vraie mécanique du jeu.

## Hors périmètre

Pas de validation automatique des indices, pas de reconnaissance vocale, pas de saisie
clavier de la réponse, pas de multi-appareils, pas d'écran de règles.
