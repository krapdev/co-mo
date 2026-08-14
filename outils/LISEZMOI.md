# Outils

Scripts de vérification du prototype. **Jamais livrés** : `index.html` reste
autonome, sans build ni dépendance. La règle « aucune dépendance » vaut pour le
jeu, pas pour le dépôt.

```bash
npm install          # une fois — installe Playwright
node regles.mjs      # ~3000 tours, invariantes de règles  (sort 1 si ko)
node mise-en-page.mjs# chevauchements, reliefs, écarts emoji (sort 1 si ko)
node rendu.mjs       # captures 390x844 de tous les écrans -> captures/
node rendu.mjs choix # un seul écran
```

`regles.mjs` doit finir sur « toutes les invariantes tiennent ». Toute
modification des règles passe par lui **avant** d'être poussée.

Si Chromium est déjà présent sur la machine, pointer dessus évite un
téléchargement : `CHROMIUM=/chemin/vers/chromium node rendu.mjs`.
