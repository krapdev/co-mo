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

    /* Reserve : un mot joue quitte son palier, les autres reviennent. */
    for (const v of [10, 20, 30]) {
      const joues = E.log.filter((l) => l.val === v).length;
      if (E.reserve[v].length !== CORPUS[v].length - joues) echecs.push(`reserve[${v}] incoherente`);
    }
    const mots = E.log.map((l) => l.mot);
    if (new Set(mots).size !== mots.length) echecs.push('un mot a ete joue deux fois');

    const d = E.log[E.log.length - 1];
    if (d.contre === 'o' && d.pariRetenu >= d.pariOuv) echecs.push('vol non strictement plus court');
    if (d.issue === 'trouvé' && d.preneur !== d.points) echecs.push('mot trouve non credite au preneur');
    if (d.issue !== 'trouvé' && d.preneur === d.points) echecs.push(`${d.issue} credite au preneur`);
    if (d.coup > d.pariRetenu) echecs.push(`coup ${d.coup} > pari retenu ${d.pariRetenu}`);
    if (d.issue === 'indice refusé' && (d.bans !== 1 || d.coupBan === null)) echecs.push('bannissement non trace');
    if (d.issue !== 'indice refusé' && (d.bans !== 0 || d.coupBan !== null)) echecs.push('bannissement fantome');
  };

  for (let g = 0; g < PARTIES && echecs.length < 6; g++) {
    E.choix = ['mousserot', 'brumaille', 'tibiane', 'grognemousse'];
    E.reprise = false;
    commence();

    let garde = 0;
    while (!E.finie && garde++ < 400) {
      ouvreLeTour();
      /* Le tour s'ouvre sur un tampon nominatif : rien du secret n'est
         encore dans la page. */
      if (ecranCourant !== 's-tampon') echecs.push("le tour ne s'ouvre pas sur un tampon");
      if (document.getElementById('ch-mots').textContent.trim() !== '') echecs.push('mots dans le DOM avant le serment');
      if (document.getElementById('co-mot').textContent.trim() !== '') echecs.push('mot du contre remanent');
      if (document.getElementById('ar-mot').textContent.trim() !== '') echecs.push("mot de l'oeil remanent");

      let passages = 0;
      passages++; confirmeTampon();
      if (ecranCourant !== 's-choix') echecs.push("le serment d'ouverture ne mene pas au choix");

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

      while (ecranCourant === 's-arbitre') {
        if (Math.random() < 0.12) { E.t.bans += 1; E.t.coupBan = E.coup; bans++; conclut('indice refusé', E.t.arbitre); break; }
        if (Math.random() < 0.5) { conclut('trouvé', E.t.preneur); break; }
        rateLaReponse();
      }

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
      while (ecranCourant === 's-arbitre') {
        if (Math.random() < .12) { E.t.bans++; E.t.coupBan = E.coup; conclut('indice refusé', E.t.arbitre); break; }
        if (Math.random() < .5) { conclut('trouvé', E.t.preneur); break; }
        rateLaReponse();
      }
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
