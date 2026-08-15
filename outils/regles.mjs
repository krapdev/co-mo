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
       la derniere chance, volontairement donnee a l'equipe menee - le log la
       marque, ce qui distingue l'entorse voulue d'un bogue d'alternance. */
    for (let i = 1; i < E.log.length; i++) {
      if (E.log[i].ouvre === E.log[i - 1].ouvre && E.log[i].derniere !== 'o')
        echecs.push('deux ouvertures de suite pour la meme equipe');
    }
    /* Et reciproquement : une derniere chance n'est accordee qu'a l'equipe menee. */
    for (let i = 1; i < E.log.length; i++) {
      if (E.log[i].derniere !== 'o') continue;
      const avant = E.log.slice(0, i);
      const pts = { lichen: 0, braise: 0 };
      avant.forEach((l) => { pts[l.points === EQUIPES.lichen.court ? 'lichen' : 'braise'] += l.val; });
      const menee = pts.lichen < pts.braise ? 'lichen' : 'braise';
      if (E.log[i].ouvre !== EQUIPES[menee].court) echecs.push('derniere chance donnee a l\'equipe en tete');
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

    /* LA FIN — une partie ne se termine jamais sur une egalite, ni avant
       que quelqu'un ait atteint la cible. */
    if (E.finie) {
      if (E.score.lichen === E.score.braise) echecs.push('partie terminee sur une egalite');
      if (Math.max(E.score.lichen, E.score.braise) < CIBLE) echecs.push('partie terminee sans atteindre la cible');
    }
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

/* LA FIN — trois cas de figure, joues explicitement. */
const fin = await page.evaluate(() => {
  const out = [];
  const prepare = (l, b) => {
    E.choix = ['mousserot','brumaille','tibiane','grognemousse']; E.reprise = false; commence();
    E.score.lichen = l; E.score.braise = b; E.dernierTour = false; E.ouvreur = 'lichen';
  };
  const unTour = (gagnant, valeur) => {
    ouvreLeTour(); confirmeTampon();
    E.motChoisi = E.propositions.findIndex((w) => w.v === valeur);
    if (E.motChoisi < 0) { out.push({ cas: 'valeur absente de la main', ok: false, score: [valeur, 0] }); E.motChoisi = 0; }
    annoncePari(2); confirmeTampon(); trancheLeContre(false, 0);
    if (gagnant === E.t.preneur) conclut('trouvé', E.t.preneur);
    else conclut('quota épuisé', autre(E.t.preneur));
  };

  /* 1. Le suiveur ne peut plus atteindre la cible : la partie s'arrete net. */
  prepare(90, 40);
  unTour('lichen', 10);                       // lichen passe a 100, braise reste a 40
  out.push({ cas: 'suiveur hors course', ok: E.finie === true, score: [E.score.lichen, E.score.braise] });

  /* 2. Le suiveur peut encore atteindre la cible ET passer devant : dernier tour. */
  prepare(90, 80);
  unTour('lichen', 10);                       // lichen 100, braise 80 -> 80+30 = 110 > 100
  const armee = !E.finie && E.dernierTour && E.ouvreur === 'braise';
  unTour('braise', 10);                       // braise joue sa derniere chance
  out.push({ cas: 'derniere chance', ok: armee && E.finie === true, score: [E.score.lichen, E.score.braise] });

  /* 3. Le suiveur atteindrait la cible, mais sans passer devant : inutile. */
  prepare(120, 100);
  unTour('lichen', 20);                       // lichen 140, braise 100 -> 100+30 = 130 < 140
  out.push({ cas: 'ecart insurmontable', ok: E.finie === true, score: [E.score.lichen, E.score.braise] });

  /* 4. Egalite au-dessus de la cible : on relance jusqu'a se departager. */
  prepare(100, 90);
  unTour('braise', 10);                       // 100 / 100 : egalite
  const relance = !E.finie && E.score.lichen === E.score.braise;
  let g = 0;
  while (!E.finie && g++ < 8) unTour('braise', 20);
  out.push({ cas: 'egalite relancee', ok: relance && E.finie === true && E.score.braise > E.score.lichen,
             score: [E.score.lichen, E.score.braise] });
  return out;
});
for (const c of fin) console.log(`  ${c.cas.padEnd(20)} ${c.ok ? 'ok' : 'ECHEC'}  score ${c.score.join(' / ')}`);
const finKo = fin.filter((c) => !c.ok).length;

const ko = r.echecs.length || finKo || plantages.length;
console.log(r.echecs.length ? `ECHECS :\n - ${r.echecs.join('\n - ')}` : 'toutes les invariantes tiennent');
if (plantages.length) console.log('erreurs page :', plantages.join('\n'));
await navigateur.close();
process.exit(ko ? 1 : 0);
