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

Il reste visible **partout dès que la partie tourne**, tampons compris. Deux
exceptions seulement : la mise en place et la confirmation, où il n'y a pas
encore d'équipes ni de score, et la fin de partie, où les deux scores occupent
déjà tout l'écran.

## Le tour

### 1. Appel du donneur — le tour ne s'ouvre pas tout seul

En fin de tour l'appareil est chez les arbitres. Il doit rejoindre **nommément**
le donneur d'ouverture, parce que son coéquipier devinera : « Passe le téléphone
à Tibiane » / « Je suis Tibiane, Grognemousse ne regarde pas ».

Les cinq mots **n'entrent dans le DOM qu'après ce serment** — ils ne sont pas
seulement masqués, ils n'existent pas encore. Les porteurs de secret du tour
précédent sont vidés au passage : les quatre mots écartés n'ont jamais été
révélés et n'ont rien à faire dans la page.

### 2. Choix du mot et pari — un seul écran

Le donneur voit 5 mots pris dans le catalogue mélangé au départ. Un tap illumine un
mot et estompe les autres ; les trois boutons de pari (`1`, `2`, `3`), en bas du
**même** écran, s'activent alors. **Deux taps, aucun changement d'écran.** Un
pari à 1 coup est *involable*.

### 3. Tampon vers le donneur adverse

Individuel, avec serment : « Je suis Tibiane, je jure de ne rien avoir vu ».

**Sauf sur un pari à 1 coup.** Il est involable : le donneur adverse n'a aucune
décision à prendre, donc aucune raison de voir le mot. On saute le serment *et*
l'écran de contre — le téléphone file directement à la paire adverse, qui
arbitre, par le tampon collectif.

### 4. Contre — écran de mémorisation

C'est le **seul** moment où le donneur adverse voit le mot. S'il vole, il ne le
reverra plus. Le mot occupe la moitié haute ; le pari adverse passe *sous* lui,
jamais au-dessus.

**Voler, c'est annoncer strictement moins que le pari en cours.** Jamais à pari
égal. Un seul tap : les paris égaux ou supérieurs sont grisés et portent la
mention « impossible », et l'écran rappelle la règle sous le pari adverse. Une
ouverture à 1 ne peut donc jamais être reprise.

### 5. Après le contre

| | Pari à 1 | Sans vol | Avec vol |
| --- | --- | --- | --- |
| Qui arbitre | l'équipe adverse | l'équipe qui a contré | l'équipe volée |
| Passages sur le tour | **2** | **2** | **3** |
| Écrans sautés | serment adverse + contre | — | — |

Le premier passage est incompressible : l'appareil doit atterrir dans une main
précise, pas seulement dans un camp. Les suivants se déduisent de sa position
réelle — s'il est déjà chez les arbitres, il ne bouge pas.

Il n'y a **pas d'écran de révélation** : le donneur retenu connaît toujours le
mot, soit qu'il l'ait choisi, soit qu'il l'ait mémorisé au contre.

### 6. La manche — une seule validation, à la fin

Le téléphone reste chez les arbitres. La manche se joue **à voix haute** : le
donneur donne ses indices, le devineur propose. Les arbitres ne tranchent plus
indice par indice — ils tapent **une seule fois**, `Trouvé` ou `Raté`, quand
c'est fini. L'écran ne change pas de forme du début à la fin.

L'écran leur rappelle le contrat du tour et affiche en très gros la seule donnée
qu'ils doivent tenir en tête : **le nombre d'indices** auquel l'équipe s'est
engagée.

```
les Cendres ont volé en 2 coups
Tibiane donne · Grognemousse devine
              2
        INDICES AU PLUS
      [        👁        ]   <- au tap, le mot prend sa place
   ⛔ banni — le mot, sa famille…
      [ TROUVÉ ][ RATÉ ]
```

- Le bouton 👁 occupe le milieu de l'écran. Il n'est pas décoratif : après un
  vol, le coéquipier du voleur n'a jamais vu le mot et doit pourtant arbitrer.
- Le **rappel des interdits est le bouton de bannissement**, disponible en
  permanence, jamais une étape obligatoire. Il garde sa confirmation plein écran.
- Il n'y a plus d'`Annuler` : avec une validation unique, il n'y a plus d'état
  intermédiaire à reprendre.

### 7. Les points

| Issue | Les points vont |
| --- | --- |
| `trouvé` — le mot est deviné dans le quota | à l'équipe preneuse |
| `quota épuisé` — les coups sont consommés | aux arbitres |
| `indice refusé` — un indice est banni | aux arbitres, tour interrompu |

### 8. Équité — trois alternances qu'un vol ne perturbe jamais

1. **Les équipes alternent l'ouverture**, vol ou pas. Le vol rapporte les points,
   il ne donne plus le tour suivant.
2. **Dans chaque équipe, le donneur alterne** à chaque ouverture de son équipe.
3. **La proposition de vol alterne** elle aussi dans l'équipe qui la reçoit —
   sinon le même joueur recevait toutes les propositions de la partie.

Sur quatre tours, chacun des quatre joueurs ouvre donc exactement une fois et se
voit proposer un vol exactement une fois. C'est vérifié par `outils/regles.mjs`.

### 9. La fin

Franchir `CIBLE` **n'arrête pas la partie** — cela déclenche un dernier tour,
ouvert par l'équipe menée. C'est la seule entorse assumée à l'alternance. Le
score après ce tour départage.

## Les touches

Aucun relief : ni socle, ni ombre, ni déplacement. Le faux volume ne tenait pas —
il mordait sur les gouttières, se mélangeait au fond, et lisait mal à bout de
bras.

Une touche est un **aplat cerné d'un trait franc**, dans l'esprit des tampons du
jeu. L'appui l'**encre** : la face prend la couleur du libellé et le libellé
celle de la face. Instantané, sans mouvement, et jamais ambigu — on voit du
premier coup d'œil quelle touche a répondu. Le mot retenu suit la même règle,
avec un trait doré épaissi.

La seule ombre qui subsiste dans le fichier est celle du cadre d'appareil, un
décor de bureau qui disparaît sur téléphone.

### Les emoji

Deux réglages distincts, souvent confondus. La **boîte** du glyphe est serrée à
l'interligne exact — c'est ce qui supprime le vide *invisible* hérité de la
police de texte, celui qui rend tout espacement imprévisible. L'**écart au
libellé**, lui, est posé explicitement en `em`, jamais laissé aux métriques :
c'est la seule façon d'obtenir le même air à 25px et à 132px.

Descendre l'interligne sous 1 ne resserre rien de plus — le dessin déborde sa
ligne et vient recouvrir le libellé.

## Le catalogue

Les 100 mots sont **mélangés une fois au début de la partie**, puis consommés
dans l'ordre : cinq par tour, deux à 10 points, deux à 20, un à 30. Un mot ne
peut donc jamais se représenter d'un tour à l'autre — auparavant les quatre mots
écartés retournaient dans la pioche et revenaient parfois au tour suivant.

**Un mot n'est jamais proposé deux fois dans une même partie**, joué ou non. Si
un palier s'épuise, il n'est pas recyclé : la main se complète depuis les autres
paliers.

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
le pari d'ouverture, le contre, l'issue, et une colonne qui compte les
**bannissements**.

Cette colonne n'est pas décorative : le bannissement est passé d'étape
obligatoire à bouton facultatif. Si le taux tombe près de zéro, l'arbitrage a
disparu du jeu et il faudra en reparler. Les colonnes « coup de fin » et « coup
du bannissement » ont disparu : avec une validation unique, il n'y a plus de coup
à numéroter. « Copier le log » met le tout dans le
presse-papier en colonnes séparées par des `|`, prêt pour un tableur.

## Vérifier

`index.html` reste autonome, mais le dépôt porte des scripts de vérification
dans `outils/` — jamais livrés, jamais chargés par le jeu.

```bash
cd outils && npm install
node regles.mjs        # ~3000 tours, invariantes de règles
node mise-en-page.mjs  # chevauchements, reliefs, écarts emoji
node rendu.mjs         # captures 390x844 de tous les écrans
```

Toute modification des règles passe par `regles.mjs` avant d'être poussée. Il
vérifie la conservation des points, le décompte de la réserve, l'unicité des mots
joués, le vol strictement plus court, le budget de passages de téléphone, la
traçabilité des bannissements, et qu'aucun mot ne traîne dans le DOM pendant un
tampon.

## Publier

Le fichier est autonome : GitHub Pages en mode « Deploy from a branch », dossier racine,
suffit. Rien à construire.
