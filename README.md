# Cowo

Prototype jouable d'un jeu de mots mobile. **Un seul fichier : `index.html`.**
Aucun build, aucune dépendance, aucun réseau — ouvre le fichier et joue, y compris hors-ligne.

4 joueurs, 2 équipes de 2, **un seul téléphone** qui passe de main en main. Portrait uniquement.

## Jouer

Ouvre `index.html` dans le navigateur du téléphone. Pour le plein écran sans barre
d'adresse : « Ajouter à l'écran d'accueil » (un manifest PWA est généré en mémoire).

## Éditer le corpus

Tout est en haut de `index.html`, dans un bloc `<script>` isolé :

- `MOTS` — les mots par palier de points (`10`, `20`, `30`).
- `TIRAGE` — la composition de la main de 5 mots (par défaut 2 faciles, 2 moyens, 1 dur).
- `CIBLE` — le score à atteindre (100).
- `AVATARS` — les 8 animaux proposés.

## Règles implémentées

1. **Choix du mot** — le donneur de l'équipe qui ouvre voit 5 mots mélangeant les paliers.
2. **Pari d'ouverture** — 1, 2 ou 3 coups.
3. **Contre** — le donneur adverse voit le mot et peut prendre la main avec un pari
   **inférieur ou égal** (l'égalité prend la main, les paris supérieurs sont grisés).
4. **Manche** — un cycle indice + réponse = un coup. Un indice refusé coûte un coup.
   Trois pastilles s'éteignent une par une, celles hors quota sont éteintes d'emblée.
5. **Résolution** — trouvé dans le quota : les points vont à l'équipe du preneur.
   Quota dépassé : ils vont à l'équipe adverse.
6. **Rotation** — le droit d'ouverture alterne, et le rôle de donneur tourne dans chaque équipe.
7. **Fin** — 100 points, mais le cycle se termine toujours : la comparaison n'a lieu
   qu'au retour de la première équipe qui a ouvert.

L'arbitrage est humain : rien n'est validé automatiquement.

## L'écran tampon

C'est la pièce critique — le devineur ne doit jamais apercevoir le mot.
À chaque affichage d'un écran tampon, tous les nœuds porteurs du mot sont vidés
(`purgeMot()`) : le mot n'existe nulle part dans le DOM tant que le bon joueur
n'a pas confirmé (« Je suis Loutrix, j'y vais »). L'écran tampon est au-dessus
de tout le reste et les écrans sont en `display:none`, donc rien ne transparaît
pendant la transition. Chaque changement d'écran gèle les taps 400 ms, pour
qu'un double-tap malencontreux ne saute pas un écran.

## Écran de debug

Bouton discret en haut à gauche (accueil, résolution, fin). Il log chaque tour :

```
tour | ouvre | mot | valeur | pari ouv | contre | pari retenu | preneur | reussi | points a
```

avec quelques compteurs (part des tours où l'ouvreur marque, taux de contre, pari
retenu moyen) et un bouton « copier le log » — de quoi vérifier après un playtest
si la fourchette 1–3 est bien centrée et si ouvrir donne un avantage.

## Hors périmètre

Pas de validation automatique des indices, pas de reconnaissance vocale, pas de
saisie clavier de la réponse, pas de multi-appareils, pas d'écran de règles.
