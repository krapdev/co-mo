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

/* LE CORPUS — mille mots edites a la main : c'est la ou une coquille se
   glisse. On les relit avant de jouer quoi que ce soit. */
const corpus = await page.evaluate(() => {
  const RACINES = ['mousse','brum','tibia','grogne','chandel','vermoul','chouette','pourri',
                   'fougère','furie','cendre','contrari','lichen','braise'];
  const VOCABULAIRE = ['indice','arbitre','pari','coup','tampon','serment','donneur','devineur','preneur','manche','score'];
  const soucis = [], vus = new Map(), compte = {};
  for (const [v, liste] of Object.entries(CORPUS)) {
    compte[v] = liste.length;
    for (const m of liste) {
      if (/[\s'’-]/.test(m) || /\d/.test(m)) soucis.push(`${v} · pas un mot simple : ${m}`);
      if (m !== m.toLowerCase())             soucis.push(`${v} · majuscule : ${m}`);
      if (vus.has(m))                        soucis.push(`${v} · doublon (deja en ${vus.get(m)}) : ${m}`);
      else vus.set(m, v);
      const r = RACINES.find((x) => m.includes(x));
      if (r)                                 soucis.push(`${v} · racine d'avatar ou d'equipe « ${r} » : ${m}`);
      if (VOCABULAIRE.includes(m))           soucis.push(`${v} · vocabulaire du jeu : ${m}`);
    }
  }
  if (vus.size <= QUARANTAINE + 5)
    soucis.push(`corpus trop court (${vus.size}) pour une quarantaine de ${QUARANTAINE} : elle serait levee a chaque tirage`);

  /* Un palier ne doit jamais etre affame. La quarantaine retient, dans le
     palier v, la part que ce palier occupe dans une main : TIRAGE[v] sur 5.
     Ce qui reste eligible doit couvrir largement une main. */
  const parMain = Object.values(TIRAGE).reduce((a, n) => a + n, 0);
  const libres = {};
  for (const v of Object.keys(CORPUS)) {
    const retenus = Math.round(QUARANTAINE * (TIRAGE[v] / parMain));
    libres[v] = CORPUS[v].length - retenus;
    if (libres[v] < TIRAGE[v] * 4)
      soucis.push(`palier ${v} affame : ${libres[v]} mots eligibles pour ${TIRAGE[v]} par main`);
  }
  return { soucis, compte, libres, total: vus.size, quarantaine: QUARANTAINE };
});
console.log(`corpus ${corpus.total} mots · `
            + Object.entries(corpus.compte).map(([v, n]) => `${v} pts : ${n} (${corpus.libres[v]} eligibles)`).join(' · ')
            + `\nquarantaine ${corpus.quarantaine} mots`);
if (corpus.soucis.length) console.log(' - ' + corpus.soucis.join('\n - '));

const r = await page.evaluate((PARTIES) => {
  const echecs = [];
  let tours = 0, parties = 0, vols = 0, involables = 0, bans = 0, passagesVol = 0, passagesSansVol = 0;
  /* Tous les mots tires, dans l'ordre, PARTIES COMPRISES : c'est entre les
     parties que les repetitions se voyaient. On y mesurera l'ecart reel
     entre deux apparitions d'un meme mot. */
  const tirages = [];

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
    parties++;

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

      /* Les 5 mots du tour sont distincts, complets, et aucun n'est propose
         deux fois dans la partie. */
      const cinq = E.propositions.map((w) => w.m);
      if (cinq.length !== 5) echecs.push(`main incomplete : ${cinq.length} mots`);
      if (new Set(cinq).size !== 5) echecs.push('doublon dans les 5 mots proposes');
      cinq.forEach((m) => tirages.push(m));
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

  /* LA QUARANTAINE — l'ecart reel entre deux apparitions d'un meme mot, sur
     toute la suite des parties. C'est la mesure qui compte : elle traverse
     les parties, la ou l'ancienne pioche remise a zero les separait. */
  const derniere = new Map();
  let ecartMin = Infinity, motMin = null;
  tirages.forEach((m, i) => {
    if (derniere.has(m)) {
      const entre = i - derniere.get(m) - 1;   // mots tires entre les deux
      if (entre < ecartMin) { ecartMin = entre; motMin = m; }
    }
    derniere.set(m, i);
  });
  if (ecartMin < QUARANTAINE) echecs.push(`« ${motMin} » revenu apres ${ecartMin} mots, quarantaine ${QUARANTAINE}`);

  return { tours, parties, vols, involables, bans, passagesVol, passagesSansVol, echecs,
           tirages: tirages.length, distincts: derniere.size,
           ecartMin: ecartMin === Infinity ? null : ecartMin };
}, PARTIES);

console.log(`tours ${r.tours} · vols ${r.vols} · paris involables ${r.involables} · bannissements ${r.bans}`);
console.log(`passages — avec vol ${r.passagesVol} (attendu ${r.vols * 3}) · sans vol ${r.passagesSansVol} (attendu ${(r.tours - r.vols) * 2})`);
console.log(`mots tires ${r.tirages} · distincts ${r.distincts} · plus petit ecart entre deux apparitions ${r.ecartMin}`);

/* L'HORIZON — les deux nombres a regarder au moment d'elargir le corpus.
   Ils sont mesures, pas estimes : la longueur d'une partie depend des
   regles de fin autant que du hasard. */
const parPartie = r.tirages / r.parties;
console.log(`horizon — ${parPartie.toFixed(0)} mots par partie`
  + ` · un mot ne peut pas revenir avant ${(corpus.quarantaine / parPartie).toFixed(0)} parties`
  + ` · tour complet du catalogue en ${(corpus.total / parPartie).toFixed(0)} parties`);

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

/* L'OEIL — le mot s'affiche tant qu'on maintient, et disparait au
   relachement. Un doigt qui glisse ne doit rien refermer : c'est le bogue
   qu'on avait, et il ne se voit pas a la lecture du code. */
await page.evaluate(() => {
  E.choix = ['mousserot','brumaille','tibiane','grognemousse']; E.reprise = false; commence();
  ouvreLeTour(); confirmeTampon(); E.motChoisi = 0; annoncePari(3); confirmeTampon(); trancheLeContre(false, 0);
});
const lu = () => page.evaluate(() => ({ visible: E.motVisible, texte: document.getElementById('ar-oeil').textContent }));
await page.waitForTimeout(500);                    // le verrou anti double-tap
const boite = await page.locator('#b-oeil').boundingBox();
const cx = boite.x + boite.width / 2, cy = boite.y + boite.height / 2;
const oeil = [];
const jalon = (nom, ok) => oeil.push({ nom, ok });

jalon('ferme au depart', (await lu()).texte === '👁️');
await page.mouse.move(cx, cy);
await page.mouse.down();
jalon('ouvert a l\'appui', (await lu()).visible === true);
await page.mouse.move(cx + 40, cy + 40);           // le doigt glisse, sans lacher
jalon('reste ouvert si le doigt glisse', (await lu()).visible === true);
await page.mouse.move(cx, boite.y + boite.height + 60);  // il sort meme du bouton
jalon('reste ouvert hors du bouton', (await lu()).visible === true);
await page.mouse.up();
jalon('referme au relachement', (await lu()).visible === false);
jalon('le glyphe revient', (await lu()).texte === '👁️');
for (const j of oeil) console.log(`  oeil · ${j.nom.padEnd(28)} ${j.ok ? 'ok' : 'ECHEC'}`);
const oeilKo = oeil.filter((j) => !j.ok).length;

/* LA QUARANTAINE SURVIT AU RECHARGEMENT — sinon elle ne sert a rien : on
   enchaine les parties en relancant l'application, pas dans le meme onglet. */
const avant = await page.evaluate(() => ({ n: E.recents.length, fin: E.recents.slice(-5).join('|') }));
await page.reload();
await page.waitForTimeout(250);
const apres = await page.evaluate(() => ({ n: E.recents.length, fin: E.recents.slice(-5).join('|') }));
const survit = avant.n > 0 && apres.n === avant.n && apres.fin === avant.fin;
console.log(`  quarantaine · ${avant.n} mots retenus · ${survit ? 'retrouves apres rechargement' : `PERDUS (${apres.n} au retour)`}`);

const ko = r.echecs.length || finKo || oeilKo || corpus.soucis.length || !survit || plantages.length;
console.log(r.echecs.length ? `ECHECS :\n - ${r.echecs.join('\n - ')}` : 'toutes les invariantes tiennent');
if (plantages.length) console.log('erreurs page :', plantages.join('\n'));
await navigateur.close();
process.exit(ko ? 1 : 0);
