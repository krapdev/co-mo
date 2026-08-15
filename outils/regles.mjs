/* ============================================================
   REGLES — joue des milliers de tours dans un vrai navigateur et
   verifie, apres chaque tour, que rien d'impossible n'est arrive.

   C'est le filet le plus important du projet : toute modification des
   regles passe par ici avant d'etre poussee.

   node regles.mjs
   ============================================================ */
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

const JEU = 'file://' + fileURLToPath(new URL('../index.html', import.meta.url));
const PARTIES = Number(process.argv[2] || 300);

const navigateur = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const page = await navigateur.newPage();
const plantages = [];
page.on('pageerror', (e) => plantages.push(e.message));
await page.goto(JEU);
await page.waitForTimeout(300);

const r = await page.evaluate((PARTIES) => {
  const echecs = [];
  let tours = 0, vols = 0, involables = 0, bans = 0, passagesVol = 0, passagesSansVol = 0;

  const verifie = () => {
    /* Conservation : chaque tour attribue exactement sa valeur, a une equipe. */
    const somme = E.score.lichen + E.score.braise;
    const attendu = E.log.reduce((a, l) => a + l.val, 0);
    if (somme !== attendu) echecs.push(`score ${somme} != mots joues ${attendu}`);

    const mots = E.log.map((l) => l.mot);
    if (new Set(mots).size !== mots.length) echecs.push('un mot a ete joue deux fois');

    /* EQUITE — trois alternances qu'un vol ne doit jamais perturber. */
    for (const k of ['lichen', 'braise']) {
      const ouvertures = E.log.filter((l) => l.ouvre === EQUIPES[k].court).length;
      if (E.rot[k] !== ouvertures % 2) echecs.push(`rotation ${k} : ${E.rot[k]}, attendu ${ouvertures % 2}`);
    }
    /* L'ouverture alterne strictement, vol ou pas. Seule exception assumee :
       le dernier tour, volontairement donne a l'equipe menee - on l'exclut
       donc de la comparaison. */
    const jusqua = E.finie ? E.log.length - 1 : E.log.length;
    for (let i = 1; i < jusqua; i++) {
      if (E.log[i].ouvre === E.log[i - 1].ouvre) echecs.push('deux ouvertures de suite pour la meme equipe');
    }
    /* Chaque joueur ouvre a son tour dans son equipe. */
    for (const k of ['lichen', 'braise']) {
      const donneurs = E.log.filter((l) => l.ouvre === EQUIPES[k].court).map((l) => l.donneurOuv);
      for (let i = 1; i < donneurs.length; i++) {
        if (donneurs[i] === donneurs[i - 1]) echecs.push(`${k} : deux ouvertures de suite par ${donneurs[i]}`);
      }
    }

    const d = E.log[E.log.length - 1];
    if (d.contre === 'o' && d.pariRetenu >= d.pariOuv) echecs.push('vol non strictement plus court');
    if (d.issue === 'trouvé' && d.preneur !== d.points) echecs.push('mot trouve non credite au preneur');
    if (d.issue !== 'trouvé' && d.preneur === d.points) echecs.push(`${d.issue} credite au preneur`);
    if (d.issue === 'indice refusé' && d.bans !== 1) echecs.push('bannissement non trace');
    if (d.issue !== 'indice refusé' && d.bans !== 0) echecs.push('bannissement fantome');
  };

  for (let g = 0; g < PARTIES && echecs.length < 6; g++) {
    E.choix = ['mousserot', 'brumaille', 'tibiane', 'grognemousse'];
    E.reprise = false;
    commence();

    let garde = 0;
    const vus = new Set();          // tous les mots deja proposes cette partie
    const volsProposes = { lichen: [], braise: [] };
    while (!E.finie && garde++ < 400) {
      ouvreLeTour();
      /* Le tour s'ouvre sur un tampon nominatif : rien du secret n'est
         encore dans la page. */
      if (ecranCourant !== 's-tampon') echecs.push("le tour ne s'ouvre pas sur un tampon");
      if (document.getElementById('ch-mots').textContent.trim() !== '') echecs.push('mots dans le DOM avant le serment');
      if (document.getElementById('co-mot').textContent.trim() !== '') echecs.push('mot du contre remanent');
      if (document.getElementById('ar-oeil').textContent.trim() !== '👁️') echecs.push("mot de l'oeil remanent");

      let passages = 0;
      passages++; confirmeTampon();
      if (ecranCourant !== 's-choix') echecs.push("le serment d'ouverture ne mene pas au choix");

      /* Catalogue melange au depart : les 5 mots du tour sont distincts, et
         aucun mot n'est propose deux fois de toute la partie. */
      const cinq = E.propositions.map((w) => w.m);
      if (new Set(cinq).size !== 5) echecs.push('doublon dans les 5 mots proposes');
      const revus = cinq.filter((m) => vus.has(m));
      if (revus.length) echecs.push('mot deja propose cette partie : ' + revus[0]);
      cinq.forEach((m) => vus.add(m));

      E.motChoisi = (Math.random() * E.propositions.length) | 0;
      const p = 1 + ((Math.random() * 3) | 0);
      annoncePari(p);

      if (p === 1) {
        involables++;
        if (ecranCourant !== 's-tampon-vol') echecs.push("pari a 1 : on ne file pas a l'arbitrage");
        passages++; confirmeTampon();
      } else {
        if (ecranCourant !== 's-tampon') echecs.push("pas de tampon d'ouverture");
        passages++; confirmeTampon();
        if (ecranCourant !== 's-contre') echecs.push('le serment ne mene pas au contre');
        /* La proposition de vol alterne dans l'equipe qui la recoit. */
        const adv = autre(E.t.ouvreur);
        const recu = avatar(E.t.donneurAdv).nom;
        const hist = volsProposes[adv];
        if (hist.length && hist[hist.length - 1] === recu) echecs.push(`${adv} : deux propositions de vol de suite a ${recu}`);
        hist.push(recu);
        const vole = VOL_AUTORISE && Math.random() < 0.4;
        if (vole) { vols++; trancheLeContre(true, 1 + ((Math.random() * (p - 1)) | 0)); }
        else trancheLeContre(false, 0);
        if (vole) {
          if (ecranCourant !== 's-tampon-vol') echecs.push('vol sans tampon collectif');
          passages++; confirmeTampon();
        }
      }

      if (ecranCourant !== 's-arbitre') echecs.push("on n'atteint pas l'arbitrage");
      /* L'appareil doit toujours finir dans le camp qui arbitre. */
      if (E.telephoneChez !== E.t.arbitre) echecs.push("l'appareil n'est pas chez les arbitres");
      const attenduPassages = E.t.vol ? 3 : 2;
      if (passages !== attenduPassages) echecs.push(`passages ${passages}, attendu ${attenduPassages}`);
      passagesVol += E.t.vol ? passages : 0;
      passagesSansVol += E.t.vol ? 0 : passages;

      /* Une seule validation, a la fin de la manche. */
      const tirage = Math.random();
      if (tirage < 0.12) { E.t.bans += 1; bans++; conclut('indice refusé', E.t.arbitre); }
      else if (tirage < 0.56) conclut('trouvé', E.t.preneur);
      else conclut('quota épuisé', autre(E.t.preneur));
      if (ecranCourant !== 's-resultat') echecs.push('la validation ne conclut pas le tour');

      tours++;
      verifie();
      if (echecs.length >= 6) break;
    }
    if (garde >= 400) echecs.push('partie sans fin');
  }
  return { tours, vols, involables, bans, passagesVol, passagesSansVol, echecs };
}, PARTIES);

console.log(`tours ${r.tours} · vols ${r.vols} · paris involables ${r.involables} · bannissements ${r.bans}`);
console.log(`passages — avec vol ${r.passagesVol} (attendu ${r.vols * 3}) · sans vol ${r.passagesSansVol} (attendu ${(r.tours - r.vols) * 2})`);

/* La fin de partie : franchir la cible declenche UN dernier tour, ouvert
   par l'equipe menee. */
const fin = await page.evaluate(() => {
  const out = [];
  for (let g = 0; g < 200; g++) {
    E.choix = ['mousserot','brumaille','tibiane','grognemousse']; E.reprise = false; commence();
    let arme = null, apres = 0, ouvreurDernier = null, garde = 0;
    while (!E.finie && garde++ < 400) {
      ouvreLeTour(); confirmeTampon();
      E.motChoisi = (Math.random() * E.propositions.length) | 0;
      const p = 1 + ((Math.random() * 3) | 0);
      annoncePari(p);
      if (p === 1) confirmeTampon();
      else {
        confirmeTampon();
        const vole = VOL_AUTORISE && Math.random() < .4;
        if (vole) { trancheLeContre(true, 1 + ((Math.random() * (p - 1)) | 0)); confirmeTampon(); }
        else trancheLeContre(false, 0);
      }
      if (arme !== null) { apres++; if (ouvreurDernier === null) ouvreurDernier = E.t.ouvreur; }
      const d = Math.random();
      if (d < .12) { E.t.bans++; conclut('indice refusé', E.t.arbitre); }
      else if (d < .56) conclut('trouvé', E.t.preneur);
      else conclut('quota épuisé', autre(E.t.preneur));
      if (arme === null && E.finProgrammee) arme = E.finProgrammee;
    }
    out.push({ ok: E.finie && apres === 1 && ouvreurDernier === autre(arme) });
  }
  return out.filter((o) => !o.ok).length;
});
console.log(fin === 0
  ? 'dernier tour : toujours exactement 1, ouvert par l\'equipe menee'
  : `ECHEC : ${fin} parties avec un dernier tour incorrect`);

const ko = r.echecs.length || fin || plantages.length;
console.log(r.echecs.length ? `ECHECS :\n - ${r.echecs.join('\n - ')}` : 'toutes les invariantes tiennent');
if (plantages.length) console.log('erreurs page :', plantages.join('\n'));
await navigateur.close();
process.exit(ko ? 1 : 0);
